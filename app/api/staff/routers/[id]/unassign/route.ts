import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as any;
    const routerId = params.id;

    // Get the current router with town information
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

    if (!router.town) {
      return NextResponse.json(
        { error: 'Router is not assigned to any town' },
        { status: 400 }
      );
    }

    // Verify the router is within the user's assigned area (unless user is admin)
    if (user.role !== 'ADMIN') {
      if (
        router.town.district.provinceId !== user.assignedProvinceId &&
        router.town.districtId !== user.assignedDistrictId
      ) {
        return NextResponse.json(
          { error: 'You are not authorized to unassign this router' },
          { status: 403 }
        );
      }
    }

    // Unassign the router by setting townId to null
    const updatedRouter = await prisma.router.update({
      where: { id: routerId },
      data: {
        townId: null as any,
        updatedAt: new Date()
      }
    });

    // Log the unassignment
    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'UNASSIGN_ROUTER',
        details: `Unassigned router ${router.name} from ${router.town.name}, ${router.town.district.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Router unassigned successfully',
      router: updatedRouter
    });
  } catch (error: any) {
    console.error('Error unassigning router:', error);
    return NextResponse.json(
      {
        error: 'Failed to unassign router',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
