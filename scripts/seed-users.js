const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Seeding users with Rwanda credentials...');

    // Check if users already exist
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@rwanda.gov.rw' }
    });

    const staffUser = await prisma.user.findUnique({
      where: { email: 'staff@rwanda.gov.rw' }
    });

    if (!adminUser) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);

      await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: 'admin@rwanda.gov.rw',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        }
      });
      console.log('✅ Admin user created (admin@rwanda.gov.rw / admin123)');
    } else {
      console.log('✅ Admin user already exists');
    }

    if (!staffUser) {
      console.log('👥 Creating staff user...');
      const hashedPassword = await bcrypt.hash('staff123', 12);

      await prisma.user.create({
        data: {
          name: 'Network Staff',
          email: 'staff@rwanda.gov.rw',
          password: hashedPassword,
          role: 'STAFF',
          isActive: true,
        }
      });
      console.log('✅ Staff user created (staff@rwanda.gov.rw / staff123)');
    } else {
      console.log('✅ Staff user already exists');
    }

    console.log('🎉 User seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log('- Admin: admin@rwanda.gov.rw / admin123');
    console.log('- Staff: staff@rwanda.gov.rw / staff123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
