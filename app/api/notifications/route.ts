import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // Get notifications since this timestamp
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get recent activities as notifications
    const whereClause: any = {};
    if (since) {
      whereClause.timestamp = {
        gt: new Date(since)
      };
    }

    const [activities, alerts] = await Promise.all([
      // Get recent activities
      prisma.log.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),

      // Get active alerts
      prisma.alert.findMany({
        where: {
          status: 'ACTIVE',
          ...(since ? { createdAt: { gt: new Date(since) } } : {})
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          router: {
            select: {
              id: true,
              name: true,
              ipAddress: true,
            },
          },
        },
      })
    ]);

    // Transform activities into notifications
    const activityNotifications = activities.map(activity => ({
      id: `activity_${activity.id}`,
      type: 'activity' as const,
      title: activity.action?.replace(/_/g, ' ') || 'Activity',
      message: activity.details || 'No details',
      timestamp: activity.timestamp,
      read: false,
      userId: activity.userId,
      user: activity.user,
    }));

    // Transform alerts into notifications
    const alertNotifications = alerts.map(alert => ({
      id: `alert_${alert.id}`,
      type: 'alert' as const,
      title: `${alert.type} Alert`,
      message: `${alert.message} - Router: ${alert.router.name}`,
      timestamp: alert.createdAt,
      read: false,
      routerId: alert.routerId,
      alertId: alert.id,
      router: alert.router,
    }));

    // Combine and sort notifications
    const allNotifications = [...activityNotifications, ...alertNotifications]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount: allNotifications.filter(n => !n.read).length,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { action, notificationIds } = await request.json();

    if (action === 'markAsRead' && notificationIds) {
      // Mark specific notifications as read
      // This would typically update a read status in the database
      // For now, we'll just return success
      return NextResponse.json({ success: true });
    }

    if (action === 'markAllAsRead') {
      // Mark all notifications as read for this user
      // This would typically update read status in the database
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
