import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;
    const { name, email, password, assignedProvinceId, assignedDistrictId } = await request.json();

    const updateData: any = {
      name,
      email,
      assignedProvinceId: assignedProvinceId || null,
      assignedDistrictId: assignedDistrictId || null,
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        assignedProvince: true,
        assignedDistrict: true,
      }
    });

    await logActivity(user.id, 'UPDATE_STAFF', `Updated staff member: ${name}`);

    return NextResponse.json({ staff: updatedStaff });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Failed to update staff' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { id } = params;

    const staffMember = await prisma.user.findUnique({
      where: { id }
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id }
    });

    await logActivity(user.id, 'DELETE_STAFF', `Deleted staff member: ${staffMember.name}`);

    return NextResponse.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff' },
      { status: 500 }
    );
  }
}