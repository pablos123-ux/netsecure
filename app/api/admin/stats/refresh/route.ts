import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, 'ADMIN');

    // Clear the cache by setting it to null
    // This will force the next request to fetch fresh data
    if (typeof global !== 'undefined' && global.statsCache) {
      global.statsCache = null;
      global.cacheTimestamp = 0;
    }

    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
