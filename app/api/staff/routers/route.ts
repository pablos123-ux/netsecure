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

    const routers = await prisma.router.findMany({
      where: whereClause,
      include: {
        town: {
          include: {
            district: {
              include: {
                province: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ routers });
  } catch (error) {
    console.error('Error fetching staff routers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routers' },
      { status: 500 }
    );
  }
}