const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...');
    
    // Generate Prisma client and push schema
    const { execSync } = require('child_process');
    
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('🗄️  Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@netsecure.com' }
    });
    
    if (!adminUser) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: 'admin@netsecure.com',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        }
      });
      console.log('✅ Admin user created (admin@netsecure.com / admin123)');
    }
    
    // Create sample data if database is empty
    const provinceCount = await prisma.province.count();
    if (provinceCount === 0) {
      console.log('🌍 Creating sample data...');
      
      // Create sample provinces
      const province1 = await prisma.province.create({
        data: {
          name: 'Central Province',
          code: 'CP',
          isActive: true,
        }
      });
      
      const province2 = await prisma.province.create({
        data: {
          name: 'Western Province',
          code: 'WP',
          isActive: true,
        }
      });
      
      // Create districts
      const district1 = await prisma.district.create({
        data: {
          name: 'Colombo District',
          code: 'CLB',
          provinceId: province1.id,
          isActive: true,
        }
      });
      
      const district2 = await prisma.district.create({
        data: {
          name: 'Gampaha District',
          code: 'GAM',
          provinceId: province1.id,
          isActive: true,
        }
      });
      
      // Create towns
      const town1 = await prisma.town.create({
        data: {
          name: 'Colombo City',
          code: 'CC',
          districtId: district1.id,
          isActive: true,
        }
      });
      
      const town2 = await prisma.town.create({
        data: {
          name: 'Gampaha City',
          code: 'GC',
          districtId: district2.id,
          isActive: true,
        }
      });
      
      // Create sample routers
      await prisma.router.createMany({
        data: [
          {
            name: 'Router-001',
            model: 'Cisco ASR1001-X',
            ipAddress: '192.168.1.1',
            macAddress: '00:1B:44:11:3A:B7',
            status: 'ONLINE',
            uptime: 95,
            bandwidth: 45.5,
            capacity: 100,
            location: 'Main Office Building',
            townId: town1.id,
            createdById: adminUser?.id || (await prisma.user.findFirst()).id,
            isActive: true,
          },
          {
            name: 'Router-002',
            model: 'Juniper MX204',
            ipAddress: '192.168.2.1',
            macAddress: '00:1B:44:11:3A:B8',
            status: 'ONLINE',
            uptime: 98,
            bandwidth: 23.2,
            capacity: 100,
            location: 'Branch Office',
            townId: town2.id,
            createdById: adminUser?.id || (await prisma.user.findFirst()).id,
            isActive: true,
          },
          {
            name: 'Router-003',
            model: 'Huawei NE40E-X3',
            ipAddress: '192.168.3.1',
            macAddress: '00:1B:44:11:3A:B9',
            status: 'OFFLINE',
            uptime: 67,
            bandwidth: 0,
            capacity: 100,
            location: 'Remote Site',
            townId: town1.id,
            createdById: adminUser?.id || (await prisma.user.findFirst()).id,
            isActive: true,
          }
        ]
      });
      
      console.log('✅ Sample data created successfully');
    }
    
    console.log('🎉 Database setup completed!');
    console.log('\n📋 Quick Start:');
    console.log('- Admin Login: admin@netsecure.com / admin123');
    console.log('- Database: SQLite (./prisma/dev.db)');
    console.log('- Start server: npm run dev');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();

