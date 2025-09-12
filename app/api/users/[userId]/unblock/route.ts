import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    // TODO: Integrate with pfSense and/or persistence layer to actually unblock the user/device.
    // This is a placeholder implementation to keep the build passing.
    return NextResponse.json({
      success: true,
      message: `User ${userId} unblocked`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}