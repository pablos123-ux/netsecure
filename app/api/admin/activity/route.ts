import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // TODO: Replace with real activity data
  return NextResponse.json({ data: [], message: 'Activity endpoint placeholder' });
}
