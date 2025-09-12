import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'STAFF');

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