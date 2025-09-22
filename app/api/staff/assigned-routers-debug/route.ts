import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;

    console.log('=== ASSIGNED ROUTERS DEBUG ===');
    console.log('User:', {
      id: user.id,
      role: user.role,
      assignedProvinceId: user.assignedProvinceId,
      assignedDistrictId: user.assignedDistrictId
    });

    // Get all routers with their town assignments
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

    console.log(`Total routers in database: ${allRouters.length}`);

    // Get routers that are actually assigned (have townId)
    const assignedRouters = allRouters.filter(r => r.townId !== null);
    console.log(`Routers with towns assigned: ${assignedRouters.length}`);

    // Get routers assigned to towns in this user's area
    const userAssignedRouters = await prisma.router.findMany({
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

    console.log(`Routers in user's assigned area: ${userAssignedRouters.length}`);

    // Get towns in user's area
    const userTowns = await prisma.town.findMany({
      where: {
        OR: [
          ...(user.assignedProvinceId ? [{ district: { provinceId: user.assignedProvinceId } }] : []),
          ...(user.assignedDistrictId ? [{ districtId: user.assignedDistrictId }] : [])
        ]
      },
      include: {
        district: {
          include: {
            province: true
          }
        },
        _count: {
          select: {
            routers: true
          }
        }
      }
    });

    console.log(`Towns in user's area: ${userTowns.length}`);

    const debugInfo = {
      user: {
        id: user.id,
        role: user.role,
        assignedProvinceId: user.assignedProvinceId,
        assignedDistrictId: user.assignedDistrictId
      },
      databaseState: {
        totalRouters: allRouters.length,
        assignedRouters: assignedRouters.length,
        unassignedRouters: allRouters.length - assignedRouters.length,
        townsInUserArea: userTowns.length,
        routersInUserArea: userAssignedRouters.length
      },
      sampleData: {
        routers: allRouters.slice(0, 5).map(r => ({
          id: r.id,
          name: r.name,
          townId: r.townId,
          townName: r.town?.name || null,
          districtName: r.town?.district?.name || null,
          provinceName: r.town?.district?.province?.name || null
        })),
        towns: userTowns.slice(0, 5).map(t => ({
          id: t.id,
          name: t.name,
          districtName: t.district?.name,
          provinceName: t.district?.province?.name || null,
          routerCount: t._count?.routers || 0
        }))
      },
      recommendations: [] as string[]
    };

    // Generate recommendations based on the data
    if (allRouters.length === 0) {
      debugInfo.recommendations.push('No routers found in database. Create some routers first.');
    }

    if (assignedRouters.length === 0) {
      debugInfo.recommendations.push('No routers are assigned to towns. Assign routers to towns first.');
    }

    if (userTowns.length === 0) {
      debugInfo.recommendations.push('No towns found in your assigned area. Check your user permissions.');
    }

    if (userAssignedRouters.length === 0 && userTowns.length > 0) {
      debugInfo.recommendations.push('Towns exist in your area but no routers are assigned to them. Assign routers to towns.');
    }

    console.log('=== DEBUG COMPLETE ===');

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        message: 'Please check your authentication and database connection.'
      },
      { status: 500 }
    );
  }
}
