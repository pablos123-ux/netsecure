import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { User } from '@/types';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as User;

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

    const [
      totalRouters,
      onlineRouters,
      offlineRouters,
      activeAlerts,
      totalTowns
    ] = await Promise.all([
      prisma.router.count({ where: whereClause }),
      prisma.router.count({ 
        where: { ...whereClause, status: 'ONLINE' } 
      }),
      prisma.router.count({ 
        where: { ...whereClause, status: 'OFFLINE' } 
      }),
      prisma.alert.count({ 
        where: { 
          status: 'ACTIVE',
          router: whereClause
        } 
      }),
      user.assignedDistrictId 
        ? prisma.town.count({ where: { districtId: user.assignedDistrictId } })
        : user.assignedProvinceId
        ? prisma.town.count({ 
            where: { 
              district: { provinceId: user.assignedProvinceId } 
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