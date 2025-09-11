import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatBytes } from '@/lib/utils/bandwidth';

export async function GET() {
  try {
    // Get user statistics
    const [totalUsers, activeUsers, blockedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isOnline: true } }),
      prisma.user.count({ where: { isBlocked: true } })
    ]);

    // Get total bandwidth usage (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const bandwidthLogs = await prisma.bandwidthLog.findMany({
      where: {
        timestamp: {
          gte: yesterday
        }
      },
      select: {
        totalBytes: true
      }
    });

    const totalBandwidth = bandwidthLogs.reduce(
      (sum, log) => sum + log.totalBytes, 
      0
    );

    // Get recent activity count
    const recentActivity = await prisma.activityLog.count({
      where: {
        timestamp: {
          gte: yesterday
        }
      }
    });

    const stats = {
      totalUsers,
      activeUsers,
      blockedUsers,
      totalBandwidth,
      totalBandwidthFormatted: formatBytes(totalBandwidth),
      recentActivity,
      uptime: process.uptime(),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error.message },
      { status: 500 }
    );
  }
}