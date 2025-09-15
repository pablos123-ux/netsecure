import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedProvince: true,
        assignedDistrict: true,
      }
    });

    await logActivity(user.id, 'UPDATE_PROFILE', 'Updated profile information');

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}