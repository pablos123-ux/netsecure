import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Local retry helper for transient Prisma errors (timeouts, server closed connection)
async function withPrismaRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const message = (err?.message as string | undefined) || '';
      const isTransient = code === 'P2024' || code === 'P1017' || message.includes('Server has closed the connection') || message.includes('Timed out fetching a new connection') || message.includes('ConnectionReset');
      if (!isTransient || attempt === retries - 1) {
        throw err;
      }
      const backoffMs = [100, 250, 500][attempt] ?? 500;
      console.warn(`[profile/update] Transient Prisma error (attempt ${attempt + 1}/${retries}): ${code ?? ''} ${message}. Retrying in ${backoffMs}ms...`);
      await new Promise((res) => setTimeout(res, backoffMs));
      lastError = err;
      attempt++;
    }
  }
  throw lastError ?? new Error('Unknown Prisma error');
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { name, email } = await request.json();

    // Input validation
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if email is being changed
    if (email !== user.email) {
      // Verify if new email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Email is already in use by another account' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    let updatedUser;
    try {
      updatedUser = await withPrismaRetry(() =>
        prisma.user.update({
          where: { id: user.id },
          data: { 
            name: name.trim(),
            email: email.trim() 
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            assignedProvince: {
              select: { name: true }
            },
            assignedDistrict: {
              select: { name: true }
            },
          }
        })
      );
    } catch (err: any) {
      console.error('Database error updating profile:', err);
      if (err?.code === 'P2002' && Array.isArray(err?.meta?.target) && err.meta.target.includes('email')) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }
      throw new Error('Failed to update profile due to a database error');
    }

    // Log the profile update activity
    await logActivity(user.id, 'UPDATE_PROFILE', 'Updated profile information');

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update profile',
        success: false
      },
      { status: 500 }
    );
  }
}