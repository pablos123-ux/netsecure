import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const towns = await prisma.town.findMany({
      include: {
        district: {
          include: {
            province: true
          }
        },
        _count: {
          select: {
            routers: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Successfully fetched ${towns.length} towns`);
    return NextResponse.json({ towns });
  } catch (error) {
    console.error('Error fetching towns:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch towns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { name, code, districtId } = await request.json();

    if (!name || !code || !districtId) {
      return NextResponse.json(
        { error: 'Name, code, and district are required' },
        { status: 400 }
      );
    }

    const town = await prisma.town.create({
      data: { name, code, districtId },
      include: {
        district: {
          include: {
            province: true
          }
        }
      }
    });

    await logActivity(user.id, 'CREATE_TOWN', `Created town: ${name}`);

    return NextResponse.json({ town });
  } catch (error) {
    console.error('Error creating town:', error);
    return NextResponse.json(
      { error: 'Failed to create town' },
      { status: 500 }
    );
  }
}