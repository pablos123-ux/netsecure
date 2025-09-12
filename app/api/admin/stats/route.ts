import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

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

    // Calculate average uptime
    const routers = await prisma.router.findMany({
      select: { uptime: true }
    });
    
    const averageUptime = routers.length > 0 
      ? routers.reduce((sum, router) => sum + router.uptime, 0) / routers.length
      : 0;

    // Calculate total bandwidth
    const totalBandwidth = await prisma.router.aggregate({
      _sum: { bandwidth: true }
    });

    const stats = {
      totalRouters,
      onlineRouters,
      offlineRouters,
      totalStaff,
      activeAlerts,
      totalProvinces,
      totalDistricts,
      totalTowns,
      averageUptime: Math.round(averageUptime),
      totalBandwidth: totalBandwidth._sum.bandwidth || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}