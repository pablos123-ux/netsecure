import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

    // Fetch all users with their assigned locations
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedProvince: {
          select: {
            id: true,
            name: true
          }
        },
        assignedDistrict: {
          select: {
            id: true,
            name: true
          }
        },
        logs: {
          take: 1,
          orderBy: {
            timestamp: 'desc'
          },
          select: {
            action: true,
            timestamp: true
          }
        }
      },
      orderBy: { 
        name: 'asc' 
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching connected users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connected users' },
      { status: 500 }
    );
  }
}