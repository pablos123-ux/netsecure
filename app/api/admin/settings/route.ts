import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    // Ensure database connection is ready with timeout
    try {
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);
    } catch (connectionError) {
      console.warn('Admin settings: Database connection timeout');
      return NextResponse.json({
        settings: [],
        warning: 'Database connection timeout',
        cached: true
      });
    }

    const settings = await prisma.settings.findMany({
      orderBy: { category: 'asc' }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        settings: [],
        cached: true
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'ADMIN');
    const { settings } = await request.json();

    // Update each setting
    for (const setting of settings) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: setting.category
        }
      });
    }

    await logActivity(user.id, 'UPDATE_SETTINGS', 'Updated system settings');

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}