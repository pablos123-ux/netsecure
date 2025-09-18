import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { User } from '@/types';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF', { includeRelations: true }) as User;

    // Build filter based on staff assignment
    const whereClause: any = {
      status: 'ACTIVE'
    };
    
    if (user.assignedDistrictId) {
      whereClause.router = {
        town: {
          districtId: user.assignedDistrictId
        }
      };
    } else if (user.assignedProvinceId) {
      whereClause.router = {
        town: {
          district: {
            provinceId: user.assignedProvinceId
          }
        }
      };
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      include: {
        router: {
          include: {
            town: {
              include: {
                district: {
                  include: {
                    province: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching staff alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}