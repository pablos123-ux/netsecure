import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Placeholder bandwidth endpoint. Replace with real aggregation if/when bandwidth logs exist.
    return NextResponse.json({
      total: 0,
      unit: 'MB',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch bandwidth' },
      { status: 500 }
    );
  }
}