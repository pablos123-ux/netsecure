import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if we have authentication context (for build time)
    const authHeader = request.headers.get('authorization');
    const hasAuthCookie = request.cookies.get('auth-token');

    let user;
    try {
      user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;
    } catch (authError) {
      // During build time, return empty data instead of failing
      if (!authHeader && !hasAuthCookie) {
        console.warn('No authentication context found during build time, returning empty data');
        return NextResponse.json({ routers: [] });
      }
      throw authError;
    }

    // Build the where clause based on user assignments
    const whereClause: any = {
      isActive: true
      // Show ALL routers in the staff's area, both assigned and unassigned
    };

    if (user.role === 'ADMIN') {
      // Admin can see all routers
      // No additional filtering needed
    } else if (user.assignedProvinceId || user.assignedDistrictId) {
      // Staff can only see routers in their assigned areas
      whereClause.town = {
        OR: []
      };

      if (user.assignedProvinceId) {
        whereClause.town.OR.push({ district: { provinceId: user.assignedProvinceId } });
      }

      if (user.assignedDistrictId) {
        whereClause.town.OR.push({ districtId: user.assignedDistrictId });
      }
    } else {
      // Staff with no assignments can see all routers (fallback)
      // This handles cases where staff might have broader access
    }

    // Get ALL routers based on user permissions (both assigned and unassigned)
    const routers = await prisma.router.findMany({
      where: whereClause,
      include: {
        town: {
          include: {
            district: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ routers });
  } catch (error) {
    console.error('Error fetching available routers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available routers' },
      { status: 500 }
    );
  }
}
