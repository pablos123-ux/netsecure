import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiPerformanceLogging } from '@/lib/performance';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

// Cache for stats data (in-memory cache)
let statsCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds cache for faster updates

// Fallback data when database is unavailable
const fallbackStats = {
  totalRouters: 0,
  onlineRouters: 0,
  offlineRouters: 0,
  totalStaff: 0,
  activeAlerts: 0,
  totalProvinces: 0,
  totalDistricts: 0,
  totalTowns: 0,
  locations: 0, // Add missing locations property
  averageUptime: 0,
  totalBandwidth: 0,
  activeUsers: 0, // Add active users property
  cached: true,
  lastUpdated: new Date().toISOString()
};

export const GET = withApiPerformanceLogging(async (request: NextRequest) => {
  try {
    await requireAuth(request, 'ADMIN');

    // Check if we have valid cached data
    const now = Date.now();
    if (statsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        ...statsCache,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000)
      });
    }

    // Ensure database connection is ready with a reasonable timeout
    const connectionPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 15000) // Increased to 15 seconds for slow connections
    );

    try {
      await Promise.race([connectionPromise, timeoutPromise]);
    } catch (connectionError) {
      console.warn('Database connection timeout, using fallback data');
      // Return cached data if available
      if (statsCache) {
        return NextResponse.json({
          ...statsCache,
          cached: true,
          warning: 'Database connection slow, showing cached data',
          cacheAge: Math.round((Date.now() - cacheTimestamp) / 1000)
        });
      }

      return NextResponse.json(
        {
          ...fallbackStats,
          warning: 'Database connection timeout. Please check your database configuration.',
          details: 'Database connection took longer than 15 seconds to respond.'
        },
        { status: 503 }
      );
    }

    // Optimized parallel queries - using single query with conditional counting
    const [
      routerStats,
      userStats,
      alertStats,
      locationStats,
      uptimeStats,
      bandwidthStats
    ] = await Promise.all([
      // Get router counts in a single query - optimized with select
      prisma.router.groupBy({
        by: ['status'],
        _count: { status: true }
      }),

      // Get staff count - optimized with select
      prisma.user.count({ where: { role: 'STAFF' } }),

      // Get active alerts count - optimized with select
      prisma.alert.count({ where: { status: 'ACTIVE' } }),

      // Get location counts in parallel - optimized with Promise.all
      Promise.all([
        prisma.province.count({ where: { isActive: true } }),
        prisma.district.count({ where: { isActive: true } }),
        prisma.town.count({ where: { isActive: true } })
      ]),

      // Get uptime aggregation - optimized with where clause
      prisma.router.aggregate({
        _avg: { uptime: true },
        _count: { uptime: true },
        where: { isActive: true }
      }),

      // Get bandwidth aggregation - optimized with where clause
      prisma.router.aggregate({
        _sum: { bandwidth: true },
        where: { isActive: true }
      })
    ]);

    // Process router stats
    const routerCounts = routerStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    const totalRouters = routerCounts.online + routerCounts.offline + (routerCounts.maintenance || 0) + (routerCounts.error || 0);
    const onlineRouters = routerCounts.online || 0;
    const offlineRouters = routerCounts.offline || 0;

    // Calculate average uptime
    const averageUptime = uptimeStats._avg.uptime ? Math.round(uptimeStats._avg.uptime) : 0;

    const stats = {
      totalRouters,
      onlineRouters,
      offlineRouters,
      totalStaff: userStats,
      activeAlerts: alertStats,
      totalProvinces: locationStats[0],
      totalDistricts: locationStats[1],
      totalTowns: locationStats[2],
      locations: locationStats[0] + locationStats[1] + locationStats[2], // Total locations
      averageUptime,
      totalBandwidth: bandwidthStats._sum.bandwidth || 0,
      activeUsers: 0, // Add active users count - can be calculated from connected users if needed
      cached: false,
      lastUpdated: new Date().toISOString()
    };

    // Update cache
    statsCache = stats;
    cacheTimestamp = now;

    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    
    // Handle specific database connection errors
    if (error instanceof Error) {
      if (error.message.includes('Can\'t reach database server') || 
          error.message.includes('P1001') ||
          error.message.includes('connection') ||
          error.message.includes('timeout')) {
        
        // Return cached data if available, otherwise fallback
        if (statsCache) {
          return NextResponse.json({
            ...statsCache,
            cached: true,
            warning: 'Database unavailable, showing cached data',
            cacheAge: Math.round((Date.now() - cacheTimestamp) / 1000)
          });
        }
        
        return NextResponse.json(
          { 
            ...fallbackStats,
            warning: 'Database connection failed. Please check your database configuration.',
            details: 'Make sure your DATABASE_URL environment variable is correctly set in your .env file.'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}, 'admin-stats');