import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;

    console.log('Debug request - User:', {
      id: user.id,
      role: user.role,
      assignedProvinceId: user.assignedProvinceId,
      assignedDistrictId: user.assignedDistrictId
    });

    // Get all routers with town info
    const allRouters = await prisma.router.findMany({
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
      orderBy: { name: 'asc' }
    });

    // Get routers assigned to towns in staff's area
    const assignedRouters = await prisma.router.findMany({
      where: {
        town: {
          OR: [
            ...(user.assignedProvinceId ? [{ district: { provinceId: user.assignedProvinceId } }] : []),
            ...(user.assignedDistrictId ? [{ districtId: user.assignedDistrictId }] : [])
          ]
        }
      },
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
      }
    });

    // Get towns in staff's area
    const towns = await prisma.town.findMany({
      where: {
        OR: [
          ...(user.assignedProvinceId ? [{ district: { provinceId: user.assignedProvinceId } }] : []),
          ...(user.assignedDistrictId ? [{ districtId: user.assignedDistrictId }] : [])
        ]
      },
      include: {
        district: true,
        _count: {
          select: {
            routers: true
          }
        }
      }
    });

    // Get all towns for comparison
    const allTowns = await prisma.town.findMany({
      include: {
        district: true,
        _count: {
          select: {
            routers: true
          }
        }
      }
    });

    console.log('Debug results:', {
      totalRouters: allRouters.length,
      assignedRouters: assignedRouters.length,
      towns: towns.length,
      allTowns: allTowns.length,
      userAssignments: {
        province: user.assignedProvinceId,
        district: user.assignedDistrictId
      },
      routersWithTowns: allRouters.filter(r => r.townId !== null).length,
      routersWithoutTowns: allRouters.filter(r => r.townId === null).length
    });

    return NextResponse.json({
      debug: {
        user: {
          id: user.id,
          role: user.role,
          assignedProvinceId: user.assignedProvinceId,
          assignedDistrictId: user.assignedDistrictId
        },
        stats: {
          totalRouters: allRouters.length,
          assignedRouters: assignedRouters.length,
          towns: towns.length,
          allTowns: allTowns.length,
          routersWithTowns: allRouters.filter(r => r.townId !== null).length,
          routersWithoutTowns: allRouters.filter(r => r.townId === null).length
        },
        sampleRouters: allRouters.slice(0, 3).map(r => ({
          id: r.id,
          name: r.name,
          townId: r.townId,
          townName: r.town?.name || null,
          districtName: r.town?.district?.name || null,
          provinceName: r.town?.district?.provinceId || null
        })),
        sampleTowns: towns.slice(0, 3).map(t => ({
          id: t.id,
          name: t.name,
          districtName: t.district?.name,
          provinceName: t.district?.provinceId,
          routerCount: t._count?.routers || 0
        })),
        allTownsSample: allTowns.slice(0, 5).map(t => ({
          id: t.id,
          name: t.name,
          districtName: t.district?.name,
          provinceName: t.district?.provinceId,
          routerCount: t._count?.routers || 0
        }))
      }
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
