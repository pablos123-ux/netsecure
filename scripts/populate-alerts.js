import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleAlerts() {
  try {
    // Get some routers to create alerts for
    const routers = await prisma.router.findMany({
      include: {
        town: {
          include: {
            district: true
          }
        }
      },
      take: 10
    });

    if (routers.length === 0) {
      console.log('No routers found. Please create some routers first.');
      return;
    }

    const alerts = [
      {
        message: 'Router offline for more than 30 minutes',
        severity: 'HIGH',
        status: 'ACTIVE',
        routerId: routers[0].id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        message: 'High packet loss detected',
        severity: 'MEDIUM',
        status: 'ACTIVE',
        routerId: routers[1].id,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        message: 'Router CPU usage above 90%',
        severity: 'HIGH',
        status: 'ACTIVE',
        routerId: routers[2].id,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        message: 'Router restarted unexpectedly',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        routerId: routers[3].id,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        message: 'Low memory warning',
        severity: 'LOW',
        status: 'DISMISSED',
        routerId: routers[4].id,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
      {
        message: 'Scheduled maintenance completed',
        severity: 'LOW',
        status: 'RESOLVED',
        routerId: routers[5].id,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago
        resolvedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
      },
      {
        message: 'Router configuration changed',
        severity: 'LOW',
        status: 'ACTIVE',
        routerId: routers[6]?.id,
        createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      },
      {
        message: 'Network connectivity issues detected',
        severity: 'HIGH',
        status: 'ACTIVE',
        routerId: routers[7]?.id,
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        message: 'Router firmware update available',
        severity: 'MEDIUM',
        status: 'ACTIVE',
        routerId: routers[8]?.id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        message: 'Router performance degraded',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        routerId: routers[9]?.id,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    // Create the alerts
    for (const alertData of alerts) {
      await prisma.alert.create({
        data: alertData
      });
    }

    console.log(`✅ Created ${alerts.length} sample alerts successfully!`);
    console.log('📊 Alert types created:');
    console.log('   - Active: High severity (offline, connectivity issues)');
    console.log('   - Active: Medium severity (CPU usage, firmware updates)');
    console.log('   - Active: Low severity (configuration changes)');
    console.log('   - Resolved: Previously fixed issues');
    console.log('   - Dismissed: Minor issues that were dismissed');

  } catch (error) {
    console.error('❌ Error creating sample alerts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleAlerts();
