import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if there's a token in cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        message: 'No auth token found',
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
      });
    }

    // Try to verify the token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({
        authenticated: false,
        message: 'Invalid token',
        token: token.substring(0, 20) + '...'
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: 'User not found in database',
        decodedUserId: decoded.userId
      });
    }

    if (!user.isActive) {
      return NextResponse.json({
        authenticated: false,
        message: 'User account is inactive',
        user: user
      });
    }

    return NextResponse.json({
      authenticated: true,
      message: 'Authentication successful',
      user: user,
      tokenValid: true
    });

  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      authenticated: false,
      message: 'Error during authentication check',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
