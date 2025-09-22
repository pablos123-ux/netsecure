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
        return NextResponse.json({ users: [] });
      }
      throw authError;
    }

    // Build the where clause based on user permissions
    const whereClause: any = {};

    if (user.role === 'ADMIN') {
      // Admin can see all users
      // No additional filtering needed
    } else if (user.assignedProvinceId || user.assignedDistrictId) {
      // Staff can see users in their assigned areas or users connected to routers they manage
      whereClause.OR = [
        // Users in the same province/district
        ...(user.assignedProvinceId ? [{ assignedProvinceId: user.assignedProvinceId }] : []),
        ...(user.assignedDistrictId ? [{ assignedDistrictId: user.assignedDistrictId }] : []),
        // Users connected to routers in staff's area
        {
          connectedUsers: {
            some: {
              router: {
                town: {
                  OR: [
                    ...(user.assignedProvinceId ? [{ district: { provinceId: user.assignedProvinceId } }] : []),
                    ...(user.assignedDistrictId ? [{ districtId: user.assignedDistrictId }] : [])
                  ]
                }
              }
            }
          }
        }
      ];
    } else {
      // Staff with no assignments can see all users (fallback)
      // This handles cases where staff might have broader access
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        assignedProvince: true,
        assignedDistrict: true,
        _count: {
          select: {
            logs: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching staff users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
