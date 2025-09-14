import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';
import pfsense from '@/lib/pfsense-api';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;

    const connectedUser = await prisma.connectedUser.findUnique({
      where: { id }
    });

    if (!connectedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Unblock user via pfSense API
    const unblockResult = await pfsense.unblockUser(connectedUser.macAddress);
    
    if (unblockResult.success) {
      // Update database
      await prisma.connectedUser.update({
        where: { id },
        data: {
          isBlocked: false,
          blockedAt: null,
          blockedBy: null,
          status: 'ACTIVE'
        }
      });

      await logActivity(user.id, 'UNBLOCK_USER', `Unblocked user: ${connectedUser.deviceName || connectedUser.ipAddress}`);

      return NextResponse.json({ 
        success: true, 
        message: 'User unblocked successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to unblock user via pfSense' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}