import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('provinceId');

    const whereClause = provinceId ? { provinceId } : {};

    const districts = await prisma.district.findMany({
      where: whereClause,
      include: {
        province: true,
        _count: {
          select: {
            towns: true,
            users: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Successfully fetched ${districts.length} districts`);
    return NextResponse.json({ districts });
  } catch (error) {
    console.error('Error fetching districts:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { name, code, provinceId } = await request.json();

    if (!name || !code || !provinceId) {
      return NextResponse.json(
        { error: 'Name, code, and province are required' },
        { status: 400 }
      );
    }

    const district = await prisma.district.create({
      data: { name, code, provinceId },
      include: { province: true }
    });

    await logActivity(user.id, 'CREATE_DISTRICT', `Created district: ${name}`);

    return NextResponse.json({ district });
  } catch (error) {
    console.error('Error creating district:', error);
    return NextResponse.json(
      { error: 'Failed to create district' },
      { status: 500 }
    );
  }
}