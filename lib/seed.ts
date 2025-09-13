import prisma from './prisma';
import { hashPassword } from './auth';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

export async function seedDatabase() {
  try {
    // Create admin user
    const hashed = await hashPassword('admin123');
    await prisma.user.upsert({
      where: { email: 'admin@rwanda.gov.rw' },
      update: {
        name: 'System Administrator',
        password: hashed,
        role: 'ADMIN',
      },
      create: {
        name: 'System Administrator',
        email: 'admin@rwanda.gov.rw',
        password: hashed,
        role: 'ADMIN',
      },
    });
    console.log('Admin user ensured:', 'admin@rwanda.gov.rw / admin123');

    // Create provinces with codes
    const provinces = [
      { name: 'Kigali City', code: 'KGL' },
      { name: 'Northern Province', code: 'NTH' },
      { name: 'Southern Province', code: 'STH' },
      { name: 'Eastern Province', code: 'EST' },
      { name: 'Western Province', code: 'WST' }
    ];

    for (const province of provinces) {
      await prisma.province.upsert({
        where: { name: province.name },
        update: province,
        create: province,
      });
    }

    // Create sample districts for Kigali
    const kigaliProvince = await prisma.province.findUnique({
      where: { name: 'Kigali City' }
    });

    if (kigaliProvince) {
      const districts = [
        { name: 'Gasabo', code: 'GSB' },
        { name: 'Kicukiro', code: 'KCK' },
        { name: 'Nyarugenge', code: 'NYR' }
      ];
      
      for (const district of districts) {
        await prisma.district.upsert({
          where: { 
            name_provinceId: {
              name: district.name,
              provinceId: kigaliProvince.id 
            }
          },
          update: district,
          create: {
            ...district,
            provinceId: kigaliProvince.id
          }
        });
      }
    }

    // Create sample towns for Gasabo
    const gasaboDistrict = await prisma.district.findFirst({
      where: { name: 'Gasabo' }
    });

    if (gasaboDistrict) {
      const towns = [
        { name: 'Kimironko', code: 'KMR' },
        { name: 'Remera', code: 'RMR' },
        { name: 'Kacyiru', code: 'KCY' },
        { name: 'Kimisagara', code: 'KMS' }
      ];
      
      for (const town of towns) {
        await prisma.town.upsert({
          where: {
            name_districtId: {
              name: town.name,
              districtId: gasaboDistrict.id
            }
          },
          update: town,
          create: {
            ...town,
            districtId: gasaboDistrict.id
          }
        });
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

    // Create sample routers
    const kimironkoTown = await prisma.town.findFirst({
      where: { name: 'Kimironko' }
    });

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@rwanda.gov.rw' }
    });

    if (kimironkoTown && adminUser) {
      const sampleRouters = [
        {
          name: 'Kimironko-AP-01',
          model: 'TP-Link AC1750',
          ipAddress: '192.168.1.10',
          macAddress: '00:14:22:01:23:45',
          status: 'ONLINE' as const,
          uptime: 86400,
          bandwidth: 45.5,
          capacity: 100,
          location: 'Kimironko Market Area',
          townId: kimironkoTown.id,
          createdById: adminUser.id,
        },
        {
          name: 'Kimironko-AP-02',
          model: 'Ubiquiti UniFi AC Pro',
          ipAddress: '192.168.1.11',
          macAddress: '00:14:22:01:23:46',
          status: 'OFFLINE' as const,
          uptime: 0,
          bandwidth: 0,
          capacity: 150,
          location: 'Kimironko Bus Station',
          townId: kimironkoTown.id,
          createdById: adminUser.id,
        }
      ];

      for (const router of sampleRouters) {
        await prisma.router.upsert({
          where: { ipAddress: router.ipAddress },
          update: router,
          create: router,
        });
      }
    }

    // Create default settings
    const defaultSettings = [
      {
        key: 'system_name',
        value: 'Rwanda Network Management System',
        description: 'System display name',
        category: 'general'
      },
      {
        key: 'max_bandwidth_threshold',
        value: '80',
        description: 'Maximum bandwidth usage threshold (%)',
        category: 'monitoring'
      },
      {
        key: 'alert_email_enabled',
        value: 'true',
        description: 'Enable email alerts',
        category: 'notifications'
      },
      {
        key: 'session_timeout',
        value: '3600',
        description: 'User session timeout in seconds',
        category: 'security'
      }
    ];

    for (const setting of defaultSettings) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting,
      });
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});