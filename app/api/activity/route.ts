import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const activities = await prisma.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const total = await prisma.log.count();

    return NextResponse.json({
      activities,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs', details: error.message },
      { status: 500 }
    );
  }
}