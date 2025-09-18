import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from './prisma';

let SECRET_KEY = process.env.JWT_SECRET;

// Do not throw at import time (breaks builds). Fall back to ephemeral secret
// and warn loudly. Ensure JWT_SECRET is configured in production runtime.
if (!SECRET_KEY) {
  SECRET_KEY = crypto.randomBytes(32).toString('hex');
  const envLabel = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  console.warn(`[auth] JWT_SECRET missing during ${envLabel}. Using ephemeral secret for build/runtime. Set JWT_SECRET in environment for stable sessions.`);
}

const JWT_SECRET_KEY = SECRET_KEY;


export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET_KEY,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET_KEY) as { userId: string; role: string };
  } catch {
    return null;
  }
}

type AuthOptions = { includeRelations?: boolean };

export async function getCurrentUser(request: NextRequest, options?: AuthOptions) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    const includeRelations = options?.includeRelations === true;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      ...(includeRelations
        ? { include: { assignedProvince: true, assignedDistrict: true } }
        : { select: { id: true, name: true, email: true, role: true } }
      ),
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest, requiredRole?: 'ADMIN' | 'STAFF', options?: AuthOptions) {
  const user = await getCurrentUser(request, options);
  
  if (!user) {
    throw new Error('Authentication required');
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    throw new Error('Insufficient permissions');
  }

  return user;
}

export async function logActivity(userId: string, action: string, details?: string) {
  try {
    await prisma.log.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}