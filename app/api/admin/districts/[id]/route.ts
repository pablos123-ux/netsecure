import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;
    const { name, code, provinceId } = await request.json();

    const district = await prisma.district.update({
      where: { id },
      data: { name, code, provinceId },
      include: { province: true }
    });

    await logActivity(user.id, 'UPDATE_DISTRICT', `Updated district: ${name}`);

    return NextResponse.json({ district });
  } catch (error) {
    console.error('Error updating district:', error);
    return NextResponse.json(
      { error: 'Failed to update district' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;

    const district = await prisma.district.findUnique({
      where: { id }
    });

    if (!district) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      );
    }

    await prisma.district.delete({
      where: { id }
    });

    await logActivity(user.id, 'DELETE_DISTRICT', `Deleted district: ${district.name}`);

    return NextResponse.json({ message: 'District deleted successfully' });
  } catch (error) {
    console.error('Error deleting district:', error);
    return NextResponse.json(
      { error: 'Failed to delete district' },
      { status: 500 }
    );
  }
}