import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const { id } = params;
    const { name, model, ipAddress, macAddress, capacity, location, townId, status } = await request.json();

    const router = await prisma.router.update({
      where: { id },
      data: {
        name,
        model,
        ipAddress,
        macAddress: macAddress || null,
        capacity: parseFloat(capacity),
        location: location || null,
        townId,
        status: status || 'OFFLINE',
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

    await logActivity(user.id, 'UPDATE_ROUTER', `Updated router: ${name} (${ipAddress})`);

    return NextResponse.json({ router });
  } catch (error) {
    console.error('Error updating router:', error);
    return NextResponse.json(
      { error: 'Failed to update router' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const { id } = params;

    const router = await prisma.router.findUnique({
      where: { id }
    });

    if (!router) {
      return NextResponse.json(
        { error: 'Router not found' },
        { status: 404 }
      );
    }

    await prisma.router.delete({
      where: { id }
    });

    await logActivity(user.id, 'DELETE_ROUTER', `Deleted router: ${router.name} (${router.ipAddress})`);

    return NextResponse.json({ message: 'Router deleted successfully' });
  } catch (error) {
    console.error('Error deleting router:', error);
    return NextResponse.json(
      { error: 'Failed to delete router' },
      { status: 500 }
    );
  }
}