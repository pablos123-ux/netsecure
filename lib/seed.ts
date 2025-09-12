import prisma from './prisma';
import { hashPassword } from './auth';

export async function seedDatabase() {
  try {
    // Create admin user
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@rwanda.gov.rw' }
    });

    if (!adminExists) {
      await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: 'admin@rwanda.gov.rw',
          password: await hashPassword('admin123'),
          role: 'ADMIN',
        },
      });
    }

    // Create provinces
    const provinces = [
      'Kigali City',
      'Northern Province',
      'Southern Province',
      'Eastern Province',
      'Western Province'
    ];

    for (const provinceName of provinces) {
      const existingProvince = await prisma.province.findUnique({
        where: { name: provinceName }
      });

      if (!existingProvince) {
        await prisma.province.create({
          data: { name: provinceName }
        });
      }
    }

    // Create sample districts for Kigali
    const kigaliProvince = await prisma.province.findUnique({
      where: { name: 'Kigali City' }
    });

    if (kigaliProvince) {
      const districts = ['Gasabo', 'Kicukiro', 'Nyarugenge'];
      
      for (const districtName of districts) {
        const existingDistrict = await prisma.district.findFirst({
          where: { 
            name: districtName,
            provinceId: kigaliProvince.id 
          }
        });

        if (!existingDistrict) {
          await prisma.district.create({
            data: {
              name: districtName,
              provinceId: kigaliProvince.id
            }
          });
        }
      }
    }

    // Create sample towns for Gasabo
    const gasaboDistrict = await prisma.district.findFirst({
      where: { name: 'Gasabo' }
    });

    if (gasaboDistrict) {
      const towns = ['Kimironko', 'Remera', 'Kacyiru', 'Kimisagara'];
      
      for (const townName of towns) {
        const existingTown = await prisma.town.findFirst({
          where: { 
            name: townName,
            districtId: gasaboDistrict.id 
          }
        });

        if (!existingTown) {
          await prisma.town.create({
            data: {
              name: townName,
              districtId: gasaboDistrict.id
            }
          });
        }
      }
    }

    // Create sample staff user
    const staffExists = await prisma.user.findUnique({
      where: { email: 'staff@rwanda.gov.rw' }
    });

    if (!staffExists && kigaliProvince && gasaboDistrict) {
      await prisma.user.create({
        data: {
          name: 'John Uwimana',
          email: 'staff@rwanda.gov.rw',
          password: await hashPassword('staff123'),
          role: 'STAFF',
          assignedProvinceId: kigaliProvince.id,
          assignedDistrictId: gasaboDistrict.id,
        },
      });
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}