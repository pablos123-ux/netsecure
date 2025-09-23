import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

    // Fetch system users with last login information
    const systemUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLogin: true,
        isActive: true,
        createdAt: true,
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
          take: 5,
          orderBy: {
            timestamp: 'desc'
          },
          select: {
            action: true,
            timestamp: true,
            details: true
          }
        }
      },
      orderBy: {
        lastLogin: 'desc'
      }
    });

    return NextResponse.json({ users: systemUsers });
  } catch (error) {
    console.error('Error fetching system users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system users' },
      { status: 500 }
    );
  }
}