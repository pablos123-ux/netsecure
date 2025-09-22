import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    // Ensure database connection is ready with timeout
    try {
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);
    } catch (connectionError) {
      console.warn('Admin routers: Database connection timeout');
      return NextResponse.json({
        routers: [],
        warning: 'Database connection timeout',
        cached: true
      });
    }

    const routers = await prisma.router.findMany({
      include: {
        town: {
          include: {
            district: {
              include: {
                province: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ routers });
  } catch (error) {
    console.error('Error fetching routers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch routers',
        routers: [],
        cached: true
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { name, model, ipAddress, macAddress, capacity, location, townId, status } = await request.json();

    if (!name || !model || !ipAddress || !capacity || !townId) {
      return NextResponse.json(
        { error: 'Name, model, IP address, capacity, and town are required' },
        { status: 400 }
      );
    }

    // Check if IP address already exists
    const existingRouter = await prisma.router.findUnique({
      where: { ipAddress }
    });

    if (existingRouter) {
      return NextResponse.json(
        { error: 'IP address already exists' },
        { status: 400 }
      );
    }

    const router = await prisma.router.create({
      data: {
        name,
        model,
        ipAddress,
        macAddress: macAddress || null,
        capacity: parseFloat(capacity),
        location: location || null,
        townId,
        status: status || 'OFFLINE',
        createdById: user.id,
      },
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
    });

    await logActivity(user.id, 'CREATE_ROUTER', `Created router: ${name} (${ipAddress})`);

    return NextResponse.json({ router });
  } catch (error) {
    console.error('Error creating router:', error);
    return NextResponse.json(
      { error: 'Failed to create router' },
      { status: 500 }
    );
  }
}