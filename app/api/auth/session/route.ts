import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    // Get the updated user data from the request
    const { name, email, image } = await req.json();

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(image && { image })
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      }
    });

    // Create a new token with the updated user data
    const newToken = jwt.sign(
      {
        userId: updatedUser.id,
        role: updatedUser.role,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set the new token in the cookie
    cookieStore.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
