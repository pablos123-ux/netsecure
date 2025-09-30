import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'ADMIN', { includeRelations: true }) as any;

    // Admin can see all alerts - no filtering needed
    const whereClause: any = {};

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status');

    // Add status filter if provided
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      include: {
        router: {
          include: {
            town: {
              include: {
                district: true
              }
            }
          }
        },
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.alert.count({ where: whereClause });

    return NextResponse.json({
      alerts,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error('Error fetching admin alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'ADMIN', { includeRelations: true }) as any;
    const { alertId, action } = await request.json();

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'Alert ID and action are required' },
        { status: 400 }
      );
    }

    // Get the alert to verify it exists
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        router: {
          include: {
            town: {
              include: {
                district: true
              }
            }
          }
        }
      }
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update the alert
    const updateData: any = {
      updatedAt: new Date()
    };

    if (action === 'RESOLVE') {
      updateData.status = 'RESOLVED';
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = user.id;
    } else if (action === 'DISMISS') {
      updateData.status = 'DISMISSED';
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: updateData,
      include: {
        router: {
          include: {
            town: {
              include: {
                district: true
              }
            }
          }
        },
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      }
    });

    // Log the action
    await prisma.log.create({
      data: {
        userId: user.id,
        action: `${action}_ALERT`,
        details: `${action.toLowerCase()}d alert for router ${alert.router?.name || 'unknown'}: ${alert.message}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Alert ${action.toLowerCase()}d successfully`,
      alert: updatedAlert
    });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to update alert',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
