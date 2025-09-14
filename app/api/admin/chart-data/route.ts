import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

    // Get router statistics by province
    const provinceStats = await prisma.province.findMany({
      include: {
        districts: {
          include: {
            towns: {
              include: {
                routers: true
              }
            }
          }
        }
      }
    });

    const chartData = provinceStats.map(province => {
      const allRouters = province.districts.flatMap(district => 
        district.towns.flatMap(town => town.routers)
      );
      
      return {
        name: province.name,
        total: allRouters.length,
        online: allRouters.filter(r => r.status === 'ONLINE').length,
        offline: allRouters.filter(r => r.status === 'OFFLINE').length,
        maintenance: allRouters.filter(r => r.status === 'MAINTENANCE').length,
      };
    });

    // Get overall status distribution
    const statusDistribution = await prisma.router.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const pieData = statusDistribution.map(item => ({
      name: item.status,
      value: item._count.status
    }));

    return NextResponse.json({
      provinceStats: chartData,
      statusDistribution: pieData
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}