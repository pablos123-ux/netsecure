import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;
    const { name, code } = await request.json();

    const province = await prisma.province.update({
      where: { id },
      data: { name, code }
    });

    await logActivity(user.id, 'UPDATE_PROVINCE', `Updated province: ${name}`);

    return NextResponse.json({ province });
  } catch (error) {
    console.error('Error updating province:', error);
    return NextResponse.json(
      { error: 'Failed to update province' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;

    const province = await prisma.province.findUnique({
      where: { id }
    });

    if (!province) {
      return NextResponse.json(
        { error: 'Province not found' },
        { status: 404 }
      );
    }

    await prisma.province.delete({
      where: { id }
    });

    await logActivity(user.id, 'DELETE_PROVINCE', `Deleted province: ${province.name}`);

    return NextResponse.json({ message: 'Province deleted successfully' });
  } catch (error) {
    console.error('Error deleting province:', error);
    return NextResponse.json(
      { error: 'Failed to delete province' },
      { status: 500 }
    );
  }
}