import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Cache for chart data
let chartCache: any = null;
let chartCacheTimestamp = 0;
const CHART_CACHE_DURATION = 30000; // 30 seconds cache

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

    // Check cache first
    const now = Date.now();
    if (chartCache && (now - chartCacheTimestamp) < CHART_CACHE_DURATION) {
      return NextResponse.json({
        ...chartCache,
        cached: true,
        cacheAge: Math.round((now - chartCacheTimestamp) / 1000)
      });
    }

    // Optimized queries - get data more efficiently
    const [provinces, routerStats] = await Promise.all([
      // Get provinces with router counts
      prisma.province.findMany({
        select: {
          id: true,
          name: true,
          districts: {
            select: {
              id: true,
              towns: {
                select: {
                  id: true,
                  routers: {
                    select: {
                      id: true,
                      status: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      
      // Get overall status distribution
      prisma.router.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ]);

    // Process chart data efficiently
    const chartData = provinces.map(province => {
      const allRouters = province.districts.flatMap(district => 
        district.towns.flatMap(town => town.routers)
      );
      
      const statusCounts = allRouters.reduce((acc, router) => {
        acc[router.status.toLowerCase()] = (acc[router.status.toLowerCase()] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        name: province.name,
        total: allRouters.length,
        online: statusCounts.online || 0,
        offline: statusCounts.offline || 0,
        maintenance: statusCounts.maintenance || 0,
        error: statusCounts.error || 0,
      };
    });

    const pieData = routerStats.map(item => ({
      name: item.status,
      value: item._count.status
    }));

    const result = {
      provinceStats: chartData,
      statusDistribution: pieData,
      cached: false,
      lastUpdated: new Date().toISOString()
    };

    // Update cache
    chartCache = result;
    chartCacheTimestamp = now;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    
    // Return cached data if available
    if (chartCache) {
      return NextResponse.json({
        ...chartCache,
        cached: true,
        warning: 'Database unavailable, showing cached data'
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}