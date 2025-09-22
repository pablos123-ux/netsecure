import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;

    // Get routers assigned to the staff's district or province
    const routers = await prisma.router.findMany({
      where: {
        OR: [
          { town: { district: { provinceId: user.assignedProvinceId } } },
          { town: { districtId: user.assignedDistrictId } }
        ]
      },
      include: {
        town: {
          include: {
            district: true
          }
        }
      }
    });

    return NextResponse.json({ routers });
  } catch (error) {
    console.error('Error fetching assigned routers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned routers' },
      { status: 500 }
    );
  }
}
