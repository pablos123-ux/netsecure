import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

    const staff = await prisma.user.findMany({
      where: { role: 'STAFF' },
      include: {
        assignedProvince: true,
        assignedDistrict: true,
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { name, email, password, assignedProvinceId, assignedDistrictId } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newStaff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STAFF',
        assignedProvinceId: assignedProvinceId || null,
        assignedDistrictId: assignedDistrictId || null,
      },
      include: {
        assignedProvince: true,
        assignedDistrict: true,
      }
    });

    await logActivity(user.id, 'CREATE_STAFF', `Created staff member: ${name}`);

    return NextResponse.json({ staff: newStaff });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: 'Failed to create staff' },
      { status: 500 }
    );
  }
}