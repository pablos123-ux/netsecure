import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;
    const { name, code, districtId } = await request.json();

    const town = await prisma.town.update({
      where: { id },
      data: { name, code, districtId },
      include: {
        district: {
          include: {
            province: true
          }
        }
      }
    });

    await logActivity(user.id, 'UPDATE_TOWN', `Updated town: ${name}`);

    return NextResponse.json({ town });
  } catch (error) {
    console.error('Error updating town:', error);
    return NextResponse.json(
      { error: 'Failed to update town' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;

    const town = await prisma.town.findUnique({
      where: { id }
    });

    if (!town) {
      return NextResponse.json(
        { error: 'Town not found' },
        { status: 404 }
      );
    }

    await prisma.town.delete({
      where: { id }
    });

    await logActivity(user.id, 'DELETE_TOWN', `Deleted town: ${town.name}`);

    return NextResponse.json({ message: 'Town deleted successfully' });
  } catch (error) {
    console.error('Error deleting town:', error);
    return NextResponse.json(
      { error: 'Failed to delete town' },
      { status: 500 }
    );
  }
}