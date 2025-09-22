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

    // Check if user is already blocked
    if (connectedUser.isBlocked) {
      return NextResponse.json(
        { error: 'User is already blocked' },
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

    // Block user via pfSense API
    const blockResult = await pfsense.blockUser(connectedUser.macAddress);
    
    if (!blockResult.success) {
      console.error('pfSense block user failed:', blockResult.message);
      return NextResponse.json(
        { error: blockResult.message || 'Failed to block user on the firewall' },
        { status: 500 }
      );
    }

    // Update database within a transaction
    await prisma.$transaction(async (tx) => {
      await tx.connectedUser.update({
        where: { id },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: user.id,
          status: 'BLOCKED',
          lastSeen: new Date() // Update last seen time
        }
      });
      
      await logActivity(user.id, 'BLOCK_USER', `Blocked user: ${connectedUser.deviceName || connectedUser.ipAddress} (${connectedUser.macAddress})`);
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully blocked user ${connectedUser.deviceName || connectedUser.macAddress}`,
      data: {
        id: connectedUser.id,
        macAddress: connectedUser.macAddress,
        blockedAt: new Date().toISOString(),
        blockedBy: user.id
      }
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    
    // Handle specific error types
    if (error instanceof Error && 'name' in error && error.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json(
        { error: 'Database error occurred while blocking user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while blocking the user',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}