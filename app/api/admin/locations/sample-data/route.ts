import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, logActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Sample data for Rwanda's administrative divisions
const rwandaProvinces = [
  { name: 'Kigali City', code: 'KC' },
  { name: 'Eastern Province', code: 'EP' },
  { name: 'Northern Province', code: 'NP' },
  { name: 'Southern Province', code: 'SP' },
  { name: 'Western Province', code: 'WP' }
];

const rwandaDistricts = [
  // Kigali City Districts
  { name: 'Gasabo', provinceName: 'Kigali City', code: 'GB' },
  { name: 'Kicukiro', provinceName: 'Kigali City', code: 'KC' },
  { name: 'Nyarugenge', provinceName: 'Kigali City', code: 'NY' },

  // Eastern Province Districts
  { name: 'Bugesera', provinceName: 'Eastern Province', code: 'BG' },
  { name: 'Gatsibo', provinceName: 'Eastern Province', code: 'GT' },
  { name: 'Kayonza', provinceName: 'Eastern Province', code: 'KY' },
  { name: 'Kirehe', provinceName: 'Eastern Province', code: 'KR' },
  { name: 'Ngoma', provinceName: 'Eastern Province', code: 'NG' },
  { name: 'Nyagatare', provinceName: 'Eastern Province', code: 'NYG' },
  { name: 'Rwamagana', provinceName: 'Eastern Province', code: 'RW' },

  // Northern Province Districts
  { name: 'Burera', provinceName: 'Northern Province', code: 'BR' },
  { name: 'Gakenke', provinceName: 'Northern Province', code: 'GK' },
  { name: 'Gicumbi', provinceName: 'Northern Province', code: 'GC' },
  { name: 'Musanze', provinceName: 'Northern Province', code: 'MS' },
  { name: 'Rulindo', provinceName: 'Northern Province', code: 'RL' },

  // Southern Province Districts
  { name: 'Gisagara', provinceName: 'Southern Province', code: 'GS' },
  { name: 'Huye', provinceName: 'Southern Province', code: 'HY' },
  { name: 'Kamonyi', provinceName: 'Southern Province', code: 'KM' },
  { name: 'Muhanga', provinceName: 'Southern Province', code: 'MH' },
  { name: 'Nyamagabe', provinceName: 'Southern Province', code: 'NYM' },
  { name: 'Nyanza', provinceName: 'Southern Province', code: 'NZ' },
  { name: 'Nyaruguru', provinceName: 'Southern Province', code: 'NR' },
  { name: 'Ruhango', provinceName: 'Southern Province', code: 'RH' },

  // Western Province Districts
  { name: 'Karongi', provinceName: 'Western Province', code: 'KR' },
  { name: 'Ngororero', provinceName: 'Western Province', code: 'NG' },
  { name: 'Nyabihu', provinceName: 'Western Province', code: 'NB' },
  { name: 'Nyamasheke', provinceName: 'Western Province', code: 'NMS' },
  { name: 'Rubavu', provinceName: 'Western Province', code: 'RB' },
  { name: 'Rusizi', provinceName: 'Western Province', code: 'RS' },
  { name: 'Rutsiro', provinceName: 'Western Province', code: 'RT' }
];

const rwandaTowns = [
  // Sample towns for Kigali districts
  { name: 'Remera', districtName: 'Gasabo', code: 'RM' },
  { name: 'Kimisagara', districtName: 'Nyarugenge', code: 'KM' },
  { name: 'Kagarama', districtName: 'Kicukiro', code: 'KG' },

  // Sample towns for Eastern Province
  { name: 'Nyamata', districtName: 'Bugesera', code: 'NY' },
  { name: 'Kabare', districtName: 'Gatsibo', code: 'KB' },
  { name: 'Mukarange', districtName: 'Kayonza', code: 'MK' },

  // Sample towns for Northern Province
  { name: 'Cyanika', districtName: 'Burera', code: 'CY' },
  { name: 'Muhondo', districtName: 'Gakenke', code: 'MH' },
  { name: 'Byumba', districtName: 'Gicumbi', code: 'BY' },

  // Sample towns for Southern Province
  { name: 'Save', districtName: 'Gisagara', code: 'SV' },
  { name: 'Ngoma', districtName: 'Huye', code: 'NG' },
  { name: 'Kamonyi', districtName: 'Kamonyi', code: 'KM' },

  // Sample towns for Western Province
  { name: 'Bwishyura', districtName: 'Karongi', code: 'BW' },
  { name: 'Sovu', districtName: 'Rusizi', code: 'SV' },
  { name: 'Gisenyi', districtName: 'Rubavu', code: 'GS' }
];

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, 'ADMIN');

    console.log('Creating sample location data for Rwanda...');

    // Check if data already exists
    const existingProvinces = await prisma.province.count();
    if (existingProvinces > 0) {
      return NextResponse.json(
        { error: 'Location data already exists. Please clear existing data first.' },
        { status: 400 }
      );
    }

    // Create provinces first
    const createdProvinces = [];
    for (const province of rwandaProvinces) {
      const createdProvince = await prisma.province.create({
        data: {
          name: province.name,
          code: province.code,
          isActive: true,
        }
      });
      createdProvinces.push(createdProvince);
    }

    console.log(`Created ${createdProvinces.length} provinces`);

    // Create districts with province references
    const createdDistricts = [];
    for (const district of rwandaDistricts) {
      const province = createdProvinces.find(p => p.name === district.provinceName);
      if (!province) {
        console.warn(`Province not found for district: ${district.name}`);
        continue;
      }

      const createdDistrict = await prisma.district.create({
        data: {
          name: district.name,
          code: district.code,
          provinceId: province.id,
          isActive: true,
        }
      });
      createdDistricts.push(createdDistrict);
    }

    console.log(`Created ${createdDistricts.length} districts`);

    // Create towns with district references
    const createdTowns = [];
    for (const town of rwandaTowns) {
      const district = createdDistricts.find(d => d.name === town.districtName);
      if (!district) {
        console.warn(`District not found for town: ${town.name}`);
        continue;
      }

      const createdTown = await prisma.town.create({
        data: {
          name: town.name,
          code: town.code,
          districtId: district.id,
          isActive: true,
        }
      });
      createdTowns.push(createdTown);
    }

    console.log(`Created ${createdTowns.length} towns`);

    // Log the activity
    await logActivity(
      user.id,
      'CREATE_SAMPLE_DATA',
      `Created sample location data: ${createdProvinces.length} provinces, ${createdDistricts.length} districts, ${createdTowns.length} towns`
    );

    return NextResponse.json({
      message: 'Sample location data created successfully',
      data: {
        provinces: createdProvinces.length,
        districts: createdDistricts.length,
        towns: createdTowns.length
      }
    });

  } catch (error) {
    console.error('Error creating sample location data:', error);
    return NextResponse.json(
      { error: 'Failed to create sample location data' },
      { status: 500 }
    );
  }
}
