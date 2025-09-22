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
      console.warn('Bandwidth: Database connection timeout');
      return NextResponse.json({
        total: 0,
        unit: 'MB',
        lastUpdated: new Date().toISOString(),
        warning: 'Database connection timeout',
        cached: true
      });
    }

    // Calculate total bandwidth usage from all routers
    const bandwidthAgg = await prisma.router.aggregate({
      _sum: { bandwidth: true }
    });

    const totalBandwidth = bandwidthAgg._sum.bandwidth || 0;

    return NextResponse.json({
      total: totalBandwidth,
      unit: 'MB',
      lastUpdated: new Date().toISOString(),
      cached: false
    });
  } catch (error: any) {
    console.error('Error fetching bandwidth:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bandwidth',
        total: 0,
        unit: 'MB',
        lastUpdated: new Date().toISOString(),
        cached: true
      },
      { status: 500 }
    );
  }
}