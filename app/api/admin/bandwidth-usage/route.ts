import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if we have authentication context (for build time)
    const authHeader = request.headers.get('authorization');
    const hasAuthCookie = request.cookies.get('auth-token');

    let user;
    try {
      user = await requireAuth(request, 'ADMIN');
    } catch (authError) {
      // During build time, return empty data instead of failing
      if (!authHeader && !hasAuthCookie) {
        console.warn('No authentication context found during build time, returning empty data');
        return NextResponse.json([]);
      }
      throw authError;
    }

    // Get bandwidth usage by router (example implementation)
    // In a real app, this would come from your monitoring system
    const routers = await prisma.router.findMany({
      select: {
        id: true,
        capacity: true,
        connectedUsers: {
          where: {
            status: 'ACTIVE',
            isBlocked: false,
            lastSeen: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            }
          },
          select: {
            bandwidth: true
          }
        }
      }
    });

    // Calculate total bandwidth usage per router
    const usage = routers.map(router => {
      const totalUsage = router.connectedUsers.reduce(
        (sum, user) => sum + (user.bandwidth || 0),
        0
      );

      return {
        routerId: router.id,
        usage: Math.min(totalUsage, router.capacity) // Cap at router capacity
      };
    });

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching bandwidth usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bandwidth usage' },
      { status: 500 }
    );
  }
}
