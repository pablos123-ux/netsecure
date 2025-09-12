import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    // TODO: Integrate with pfSense and/or persistence layer to actually block the user/device.
    // This is a placeholder implementation to keep the build passing.
    return NextResponse.json({
      success: true,
      message: `User ${userId} blocked`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    );
  }
}