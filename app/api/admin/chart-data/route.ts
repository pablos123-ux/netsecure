import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // TODO: Replace with real chart data
  return NextResponse.json({ data: [], message: 'Chart data endpoint placeholder' });
}
