import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

    // Get count of connected users by router
    const userCounts = await prisma.connectedUser.groupBy({
      by: ['routerId'],
      where: {
        status: 'ACTIVE',
        isBlocked: false,
        lastSeen: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      _count: {
        id: true
      }
    });

    // Format the response
    const result = userCounts.map(item => ({
      routerId: item.routerId,
      count: item._count.id
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching connected users count by router:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connected users count' },
      { status: 500 }
    );
  }
}
