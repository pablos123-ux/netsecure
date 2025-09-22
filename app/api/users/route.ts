import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Ensure database connection is ready with timeout
    try {
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);
    } catch (connectionError) {
      console.warn('Users: Database connection timeout');
      return NextResponse.json({
        users: [],
        warning: 'Database connection timeout',
        cached: true
      });
    }

    const users = await prisma.user.findMany({
      include: {
        assignedProvince: true,
        assignedDistrict: true,
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        users: [],
        cached: true
      },
      { status: 500 }
    );
  }
}