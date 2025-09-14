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

    // Block user via pfSense API
    const blockResult = await pfsense.blockUser(connectedUser.macAddress);
    
    if (blockResult.success) {
      // Update database
      await prisma.connectedUser.update({
        where: { id },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: user.id,
          status: 'BLOCKED'
        }
      });

      await logActivity(user.id, 'BLOCK_USER', `Blocked user: ${connectedUser.deviceName || connectedUser.ipAddress}`);

      return NextResponse.json({ 
        success: true, 
        message: 'User blocked successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to block user via pfSense' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    );
  }
}