import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = mime.extension(file.type) || 'bin';
    const filename = `${uuidv4()}.${extension}`;
    
    // In a production environment, you would want to upload to a cloud storage service
    // For development, we'll save to the public/uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, filename);
    const relativePath = `/uploads/${filename}`;
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(bytes));

    // Update user's profile picture in the database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: relativePath },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    await logActivity(user.id, 'UPDATE_PROFILE_PICTURE', 'Updated profile picture');

    return NextResponse.json({
      success: true,
      imageUrl: updatedUser.image,
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}
