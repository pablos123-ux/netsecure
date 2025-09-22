import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;

    // Build the where clause based on user assignments
    const whereClause: any = { isActive: true };

    if (user.role === 'ADMIN') {
      // Admin can see all towns
      // No additional filtering needed
    } else if (user.assignedProvinceId || user.assignedDistrictId) {
      // Staff can only see towns in their assigned areas
      whereClause.OR = [];

      if (user.assignedProvinceId) {
        whereClause.OR.push({ district: { provinceId: user.assignedProvinceId } });
      }

      if (user.assignedDistrictId) {
        whereClause.OR.push({ districtId: user.assignedDistrictId });
      }
    } else {
      // Staff with no assignments can see all towns (fallback)
      // This handles cases where staff might have broader access
    }

    // Get towns based on user permissions
    const towns = await prisma.town.findMany({
      where: whereClause,
      include: {
        district: true,
        _count: {
          select: {
            routers: true
          }
        }
      },
      orderBy: [
        { district: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ towns });
  } catch (error) {
    console.error('Error fetching assigned towns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned towns' },
      { status: 500 }
    );
  }
}
