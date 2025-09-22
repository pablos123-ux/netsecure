import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Ensure database connection is ready with timeout
    try {
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);
    } catch (connectionError) {
      console.warn('Stats: Database connection timeout');
      return NextResponse.json({
        totalRouters: 0,
        onlineRouters: 0,
        offlineRouters: 0,
        totalStaff: 0,
        activeAlerts: 0,
        totalProvinces: 0,
        totalDistricts: 0,
        totalTowns: 0,
        averageUptime: 0,
        totalBandwidth: 0,
        warning: 'Database connection timeout',
        cached: true
      });
    }

    const [
      totalRouters,
      onlineRouters,
      offlineRouters,
      totalStaff,
      activeAlerts,
      totalProvinces,
      totalDistricts,
      totalTowns
    ] = await Promise.all([
      prisma.router.count(),
      prisma.router.count({ where: { status: 'ONLINE' } }),
      prisma.router.count({ where: { status: 'OFFLINE' } }),
      prisma.user.count({ where: { role: 'STAFF' } }),
      prisma.alert.count({ where: { status: 'ACTIVE' } }),
      prisma.province.count(),
      prisma.district.count(),
      prisma.town.count()
    ]);

    const routers = await prisma.router.findMany({
      select: { uptime: true }
    });

    const averageUptime =
      routers.length > 0
        ? Math.round(routers.reduce((sum, r) => sum + r.uptime, 0) / routers.length)
        : 0;

    const bandwidthAgg = await prisma.router.aggregate({
      _sum: { bandwidth: true }
    });

    const totalBandwidth = bandwidthAgg._sum.bandwidth || 0;

    const stats = {
      totalRouters,
      onlineRouters,
      offlineRouters,
      totalStaff,
      activeAlerts,
      totalProvinces,
      totalDistricts,
      totalTowns,
      averageUptime,
      totalBandwidth,
      cached: false
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        totalRouters: 0,
        onlineRouters: 0,
        offlineRouters: 0,
        totalStaff: 0,
        activeAlerts: 0,
        totalProvinces: 0,
        totalDistricts: 0,
        totalTowns: 0,
        averageUptime: 0,
        totalBandwidth: 0,
        cached: true
      },
      { status: 500 }
    );
  }
}