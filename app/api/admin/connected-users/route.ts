import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

    const users = await prisma.connectedUser.findMany({
      include: {
        router: {
          include: {
            town: {
              include: {
                district: {
                  include: {
                    province: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { lastSeen: 'desc' }
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