import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
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
      totalBandwidth
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}