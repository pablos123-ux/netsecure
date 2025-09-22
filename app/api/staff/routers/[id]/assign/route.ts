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

    // Get the router to verify it exists
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

    // Verify the town is within the user's assigned area (unless user is admin)
    const town = await prisma.town.findUnique({
      where: { id: townId },
      include: { district: true }
    });

    if (!town) {
      return NextResponse.json(
        { error: 'Town not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN') {
      // Check if staff is authorized to assign to this town
      if (
        town.district.provinceId !== user.assignedProvinceId &&
        town.districtId !== user.assignedDistrictId
      ) {
        return NextResponse.json(
          { error: 'You are not authorized to assign routers to this town' },
          { status: 403 }
        );
      }
    }

    // Update the router with the town assignment
    const updatedRouter = await prisma.router.update({
      where: { id: routerId },
      data: {
        townId: town.id,
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

    // Log the assignment
    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'ASSIGN_ROUTER',
        details: `Assigned router ${updatedRouter.name} to ${town.name}, ${town.district.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Router assigned successfully',
      router: updatedRouter
    });
  } catch (error) {
    console.error('Error assigning router:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign router',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
