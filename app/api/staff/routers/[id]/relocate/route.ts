import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;
    const { townId } = await request.json();
    const routerId = params.id;

    if (!townId) {
      return NextResponse.json(
        { error: 'Town ID is required' },
        { status: 400 }
      );
    }

    // Get the current router
    const router = await prisma.router.findUnique({
      where: { id: routerId },
      include: {
        town: {
          include: {
            district: true
          }
        }
      }
    });

    if (!router) {
      return NextResponse.json(
        { error: 'Router not found' },
        { status: 404 }
      );
    }

    // Verify the router is within the user's assigned area (unless user is admin)
    if (user.role !== 'ADMIN' && router.town) {
      if (
        router.town.district.provinceId !== user.assignedProvinceId &&
        router.town.districtId !== user.assignedDistrictId
      ) {
        return NextResponse.json(
          { error: 'You are not authorized to relocate this router' },
          { status: 403 }
        );
      }
    }

    // Verify the destination town is within the user's assigned area (unless user is admin)
    const destinationTown = await prisma.town.findUnique({
      where: { id: townId },
      include: { district: true }
    });

    if (!destinationTown) {
      return NextResponse.json(
        { error: 'Destination town not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN') {
      if (
        destinationTown.district.provinceId !== user.assignedProvinceId &&
        destinationTown.districtId !== user.assignedDistrictId
      ) {
        return NextResponse.json(
          { error: 'You are not authorized to relocate routers to this town' },
          { status: 403 }
        );
      }
    }

    // Update the router with the new town assignment
    const updatedRouter = await prisma.router.update({
      where: { id: routerId },
      data: {
        townId: townId,
        updatedAt: new Date()
      },
      include: {
        town: {
          include: {
            district: true
          }
        }
      }
    });

    // Log the relocation
    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'RELOCATE_ROUTER',
        details: `Relocated router ${router.name} from ${router.town?.name || 'unassigned'} to ${destinationTown.name}, ${destinationTown.district.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Router relocated successfully',
      router: updatedRouter
    });
  } catch (error: any) {
    console.error('Error relocating router:', error);
    return NextResponse.json(
      {
        error: 'Failed to relocate router',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
