import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Get current session ID from headers
  const currentSessionId = request.headers.get('x-session-id');
  
  if (currentSessionId) {
    // Clear the session-specific auth token
    response.cookies.set(`auth-token-${currentSessionId}`, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });
  }

  return response;
}