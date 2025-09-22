import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;

    // Build filter based on user permissions for assigned routers only
    const whereClause: any = {};

    if (user.role === 'ADMIN') {
      // Admin can see all assigned routers - no additional filtering needed
      // The town include will handle showing only routers with towns
    } else if (user.assignedDistrictId) {
      // Staff can see routers assigned to towns in their district
      whereClause.town = {
        districtId: user.assignedDistrictId
      };
    } else if (user.assignedProvinceId) {
      // Staff can see routers assigned to towns in their province
      whereClause.town = {
        district: {
          provinceId: user.assignedProvinceId
        }
      };
    } else {
      // Staff with no assignments - show all assigned routers as fallback
      // No additional filtering needed
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
  } catch (error: any) {
    console.error('Error fetching staff routers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch routers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}