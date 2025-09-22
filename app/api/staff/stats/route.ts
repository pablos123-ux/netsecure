import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { User } from '@/types';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;

    // Build filter based on staff assignment
    const whereClause: any = {};
    
    if (user.assignedDistrictId) {
      whereClause.town = {
        districtId: user.assignedDistrictId
      };
    } else if (user.assignedProvinceId) {
      whereClause.town = {
        district: {
          provinceId: user.assignedProvinceId
        }
      };
    }

    // Ensure database connection is ready with timeout
    try {
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);
    } catch (connectionError) {
      console.warn('Staff stats: Database connection timeout');
      return NextResponse.json({
        totalRouters: 0,
        onlineRouters: 0,
        offlineRouters: 0,
        activeAlerts: 0,
        totalTowns: 0,
        totalProvinces: 0,
        totalDistricts: 0,
        totalStaff: 0,
        averageUptime: 0,
        totalBandwidth: 0,
        error: 'Database connection timeout',
        cached: true
      });
    }

    const [
      totalRouters,
      onlineRouters,
      offlineRouters,
      activeAlerts,
      totalTowns
    ] = await Promise.all([
      prisma.router.count({ where: { ...whereClause, isActive: true } }),
      prisma.router.count({
        where: { ...whereClause, status: 'ONLINE', isActive: true }
      }),
      prisma.router.count({
        where: { ...whereClause, status: 'OFFLINE', isActive: true }
      }),
      prisma.alert.count({
        where: {
          status: 'ACTIVE',
          router: { ...whereClause, isActive: true }
        }
      }),
      user.assignedDistrictId
        ? prisma.town.count({ where: { districtId: user.assignedDistrictId, isActive: true } })
        : user.assignedProvinceId
        ? prisma.town.count({
            where: {
              district: { provinceId: user.assignedProvinceId },
              isActive: true
            }
          })
        : 0
    ]);

    const stats = {
      totalRouters,
      onlineRouters,
      offlineRouters,
      activeAlerts,
      totalTowns,
      totalProvinces: 0,
      totalDistricts: 0,
      totalStaff: 0,
      averageUptime: 0,
      totalBandwidth: 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}