import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Type assertion since we've checked for existence above
const SECRET_KEY = JWT_SECRET as string;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, SECRET_KEY) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        assignedProvince: true,
        assignedDistrict: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest, requiredRole?: 'ADMIN' | 'STAFF') {
  const user = await getCurrentUser(request);
  
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