import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';
import pfsense from '@/lib/pfsense-api';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate and authorize the user
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user in the database
    const connectedUser = await prisma.connectedUser.findUnique({
      where: { id },
      include: { router: true }
    });

    if (!connectedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is not blocked
    if (!connectedUser.isBlocked) {
      return NextResponse.json(
        { error: 'User is not currently blocked' },
        { status: 400 }
      );
    }

    // Validate MAC address format
    const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macAddressRegex.test(connectedUser.macAddress)) {
      return NextResponse.json(
        { error: 'Invalid MAC address format' },
        { status: 400 }
      );
    }

    // Unblock user via pfSense API
    const unblockResult = await pfsense.unblockUser(connectedUser.macAddress);
    
    if (!unblockResult.success) {
      console.error('pfSense unblock user failed:', unblockResult.message);
      return NextResponse.json(
        { error: unblockResult.message || 'Failed to unblock user on the firewall' },
        { status: 500 }
      );
    }

    // Update database within a transaction
    await prisma.$transaction(async (tx) => {
      await tx.connectedUser.update({
        where: { id },
        data: {
          isBlocked: false,
          blockedAt: null,
          blockedBy: null,
          status: 'ACTIVE',
          lastSeen: new Date() // Update last seen time
        }
      });
      
      await logActivity(user.id, 'UNBLOCK_USER', `Unblocked user: ${connectedUser.deviceName || connectedUser.ipAddress} (${connectedUser.macAddress})`);
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully unblocked user ${connectedUser.deviceName || connectedUser.macAddress}`,
      data: {
        id: connectedUser.id,
        macAddress: connectedUser.macAddress,
        unblockedAt: new Date().toISOString(),
        unblockedBy: user.id
      }
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    
    // Handle specific error types
    if (error instanceof Error && 'name' in error && error.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json(
        { error: 'Database error occurred while unblocking user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while unblocking the user',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}