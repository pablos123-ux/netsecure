#!/usr/bin/env node

/**
 * Supabase Setup Script
 * 
 * This script helps set up your Supabase database with the correct schema
 * and initial configuration for the NetSecure application.
 * 
 * Usage:
 * 1. Set SUPABASE_DATABASE_URL environment variable
 * 2. Run: node scripts/setup-supabase.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Database client
let supabaseClient;

async function initializeClient() {
  logStep('INIT', 'Initializing Supabase client...');
  
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_DATABASE_URL environment variable is required');
  }
  
  supabaseClient = new PrismaClient({
    datasources: {
      db: { url: supabaseUrl }
    }
  });
  
  await supabaseClient.$connect();
  logSuccess('Connected to Supabase database');
}

async function runMigrations() {
  logStep('MIGRATE', 'Running Prisma migrations...');
  
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Run Prisma migrations
    await execAsync('npx prisma migrate deploy');
    logSuccess('Prisma migrations completed');
    
    // Generate Prisma client
    await execAsync('npx prisma generate');
    logSuccess('Prisma client generated');
    
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    throw error;
  }
}

async function createInitialData() {
  logStep('SEED', 'Creating initial data...');
  
  try {
    // Check if data already exists
    const userCount = await supabaseClient.user.count();
    if (userCount > 0) {
      logWarning('Database already contains data, skipping initial seed');
      return;
    }
    
    // Create default provinces
    const provinces = [
      { name: 'Western Province', code: 'WP' },
      { name: 'Central Province', code: 'CP' },
      { name: 'Southern Province', code: 'SP' },
      { name: 'Northern Province', code: 'NP' },
      { name: 'Eastern Province', code: 'EP' }
    ];
    
    for (const province of provinces) {
      await supabaseClient.province.create({ data: province });
    }
    logSuccess('Created default provinces');
    
    // Create default districts for Western Province
    const wp = await supabaseClient.province.findFirst({ where: { code: 'WP' } });
    if (wp) {
      const districts = [
        { name: 'Colombo', code: 'COL', provinceId: wp.id },
        { name: 'Gampaha', code: 'GAM', provinceId: wp.id },
        { name: 'Kalutara', code: 'KAL', provinceId: wp.id }
      ];
      
      for (const district of districts) {
        await supabaseClient.district.create({ data: district });
      }
      logSuccess('Created default districts');
    }
    
    // Create default admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await supabaseClient.user.create({
      data: {
        name: 'System Administrator',
        email: 'admin@netsecure.com',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true
      }
    });
    logSuccess('Created default admin user (admin@netsecure.com / admin123)');
    
    // Create default settings
    const settings = [
      {
        key: 'system_name',
        value: 'NetSecure Network Management',
        description: 'System name displayed in the application',
        category: 'general'
      },
      {
        key: 'max_bandwidth_per_user',
        value: '10',
        description: 'Maximum bandwidth per user in Mbps',
        category: 'network'
      },
      {
        key: 'alert_retention_days',
        value: '30',
        description: 'Number of days to retain alerts',
        category: 'alerts'
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable/disable maintenance mode',
        category: 'system'
      }
    ];
    
    for (const setting of settings) {
      await supabaseClient.settings.create({ data: setting });
    }
    logSuccess('Created default settings');
    
  } catch (error) {
    logError(`Failed to create initial data: ${error.message}`);
    throw error;
  }
}

async function verifySetup() {
  logStep('VERIFY', 'Verifying Supabase setup...');
  
  try {
    // Check tables exist
    const tables = [
      'provinces', 'districts', 'towns', 'users', 
      'routers', 'connected_users', 'logs', 'alerts', 'settings'
    ];
    
    for (const table of tables) {
      const count = await supabaseClient[table].count();
      logSuccess(`  ${table}: ${count} records`);
    }
    
    // Test basic operations
    const testUser = await supabaseClient.user.findFirst();
    if (testUser) {
      logSuccess('Database operations working correctly');
    } else {
      logWarning('No users found - initial data may not have been created');
    }
    
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    throw error;
  }
}

async function generateConnectionInfo() {
  logStep('INFO', 'Generating connection information...');
  
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  const url = new URL(supabaseUrl);
  
  const connectionInfo = {
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1),
    username: url.username,
    ssl: url.searchParams.get('sslmode') === 'require',
    timestamp: new Date().toISOString()
  };
  
  const infoFile = path.join(__dirname, '..', 'supabase-connection-info.json');
  fs.writeFileSync(infoFile, JSON.stringify(connectionInfo, null, 2));
  
  logSuccess('Connection information saved');
  
  // Display connection info
  log('\n=== SUPABASE CONNECTION INFO ===', 'bright');
  log(`Host: ${connectionInfo.host}`, 'blue');
  log(`Port: ${connectionInfo.port}`, 'blue');
  log(`Database: ${connectionInfo.database}`, 'blue');
  log(`Username: ${connectionInfo.username}`, 'blue');
  log(`SSL: ${connectionInfo.ssl ? 'Required' : 'Not Required'}`, 'blue');
}

async function main() {
  try {
    log('🚀 Setting up Supabase Database', 'bright');
    log('===============================', 'bright');
    
    await initializeClient();
    await runMigrations();
    await createInitialData();
    await verifySetup();
    await generateConnectionInfo();
    
    log('\n🎉 Supabase setup completed successfully!', 'green');
    log('Your database is ready for the NetSecure application.', 'yellow');
    log('\nNext steps:', 'bright');
    log('1. Update your .env file with SUPABASE_DATABASE_URL', 'blue');
    log('2. Run the migration script to move data from Neon', 'blue');
    log('3. Test your application with the new database', 'blue');
    
  } catch (error) {
    logError(`\n💥 Setup failed: ${error.message}`);
    logError('Stack trace:', 'red');
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (supabaseClient) {
      await supabaseClient.$disconnect();
      logSuccess('Disconnected from Supabase database');
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\n\n⚠️  Setup interrupted by user', 'yellow');
  if (supabaseClient) {
    await supabaseClient.$disconnect();
  }
  process.exit(0);
});

// Run the setup
if (require.main === module) {
  main().catch(async (error) => {
    logError(`\n💥 Fatal error: ${error.message}`);
    if (supabaseClient) {
      await supabaseClient.$disconnect();
    }
    process.exit(1);
  });
}

module.exports = {
  main
};
