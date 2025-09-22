import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const provinces = await prisma.province.findMany({
      include: {
        _count: {
          select: {
            districts: true,
            users: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Successfully fetched ${provinces.length} provinces`);
    return NextResponse.json({ provinces });
  } catch (error) {
    console.error('Error fetching provinces:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch provinces' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { name, code } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    const province = await prisma.province.create({
      data: { name, code }
    });

    await logActivity(user.id, 'CREATE_PROVINCE', `Created province: ${name}`);

    return NextResponse.json({ province });
  } catch (error) {
    console.error('Error creating province:', error);
    return NextResponse.json(
      { error: 'Failed to create province' },
      { status: 500 }
    );
  }
}