#!/usr/bin/env node

/**
 * Migration Script: Neon to Supabase
 * 
 * This script migrates your database from Neon to Supabase.
 * It handles data export, schema creation, and data import.
 * 
 * Prerequisites:
 * 1. Set up your Supabase project
 * 2. Get your Supabase connection string
 * 3. Ensure your Neon database is accessible
 * 
 * Usage:
 * 1. Set environment variables:
 *    - NEON_DATABASE_URL (your current Neon connection string)
 *    - SUPABASE_DATABASE_URL (your new Supabase connection string)
 * 2. Run: node scripts/migrate-to-supabase.js
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
  magenta: '\x1b[35m',
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

// Database clients
let neonClient;
let supabaseClient;

// Migration configuration
const config = {
  backupDir: path.join(__dirname, '..', 'migration-backup'),
  batchSize: 1000, // Process records in batches
  tables: [
    'provinces',
    'districts', 
    'towns',
    'users',
    'routers',
    'connected_users',
    'logs',
    'alerts',
    'settings'
  ],
  // Tables that should be migrated in order (due to foreign key constraints)
  migrationOrder: [
    'provinces',
    'districts',
    'towns', 
    'users',
    'routers',
    'connected_users',
    'logs',
    'alerts',
    'settings'
  ]
};

async function initializeClients() {
  logStep('INIT', 'Initializing database clients...');
  
  const neonUrl = process.env.NEON_DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  
  if (!neonUrl) {
    throw new Error('NEON_DATABASE_URL environment variable is required');
  }
  
  if (!supabaseUrl) {
    throw new Error('SUPABASE_DATABASE_URL environment variable is required');
  }
  
  // Initialize Neon client
  neonClient = new PrismaClient({
    datasources: {
      db: { url: neonUrl }
    }
  });
  
  // Initialize Supabase client
  supabaseClient = new PrismaClient({
    datasources: {
      db: { url: supabaseUrl }
    }
  });
  
  // Test connections
  await neonClient.$connect();
  logSuccess('Connected to Neon database');
  
  await supabaseClient.$connect();
  logSuccess('Connected to Supabase database');
}

async function createBackupDirectory() {
  logStep('BACKUP', 'Creating backup directory...');
  
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    logSuccess('Backup directory created');
  } else {
    logWarning('Backup directory already exists');
  }
}

async function backupData() {
  logStep('BACKUP', 'Backing up data from Neon...');
  
  const backupData = {};
  
  for (const table of config.tables) {
    try {
      log(`  Backing up ${table}...`, 'blue');
      
      const data = await neonClient[table].findMany({
        orderBy: { id: 'asc' }
      });
      
      backupData[table] = data;
      
      const backupFile = path.join(config.backupDir, `${table}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      
      logSuccess(`  ${table}: ${data.length} records backed up`);
    } catch (error) {
      logError(`  Failed to backup ${table}: ${error.message}`);
      throw error;
    }
  }
  
  // Save complete backup
  const completeBackupFile = path.join(config.backupDir, 'complete-backup.json');
  fs.writeFileSync(completeBackupFile, JSON.stringify(backupData, null, 2));
  
  logSuccess('Complete backup saved');
  return backupData;
}

async function resetSupabaseDatabase() {
  logStep('RESET', 'Resetting Supabase database...');
  
  try {
    // Disable foreign key checks temporarily
    await supabaseClient.$executeRaw`SET session_replication_role = replica;`;
    
    // Clear all tables in reverse order to handle foreign keys
    const reverseOrder = [...config.migrationOrder].reverse();
    
    for (const table of reverseOrder) {
      try {
        await supabaseClient.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        logSuccess(`  Cleared ${table}`);
      } catch (error) {
        logWarning(`  Could not clear ${table}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await supabaseClient.$executeRaw`SET session_replication_role = DEFAULT;`;
    
    logSuccess('Supabase database reset complete');
  } catch (error) {
    logError(`Failed to reset Supabase database: ${error.message}`);
    throw error;
  }
}

async function migrateData(backupData) {
  logStep('MIGRATE', 'Migrating data to Supabase...');
  
  for (const table of config.migrationOrder) {
    if (!backupData[table] || backupData[table].length === 0) {
      logWarning(`  Skipping ${table} (no data)`);
      continue;
    }
    
    try {
      log(`  Migrating ${table}...`, 'blue');
      
      const records = backupData[table];
      const totalRecords = records.length;
      
      // Process in batches
      for (let i = 0; i < totalRecords; i += config.batchSize) {
        const batch = records.slice(i, i + config.batchSize);
        
        try {
          await supabaseClient[table].createMany({
            data: batch,
            skipDuplicates: true
          });
          
          const progress = Math.min(i + config.batchSize, totalRecords);
          log(`    Progress: ${progress}/${totalRecords} records`, 'yellow');
        } catch (batchError) {
          logError(`    Batch error for ${table}: ${batchError.message}`);
          
          // Try individual inserts for this batch
          for (const record of batch) {
            try {
              await supabaseClient[table].create({ data: record });
            } catch (recordError) {
              logError(`      Failed to insert record ${record.id}: ${recordError.message}`);
            }
          }
        }
      }
      
      logSuccess(`  ${table}: ${totalRecords} records migrated`);
    } catch (error) {
      logError(`  Failed to migrate ${table}: ${error.message}`);
      throw error;
    }
  }
}

async function verifyMigration(backupData) {
  logStep('VERIFY', 'Verifying migration...');
  
  let allVerified = true;
  
  for (const table of config.tables) {
    try {
      const originalCount = backupData[table]?.length || 0;
      const migratedCount = await supabaseClient[table].count();
      
      if (originalCount === migratedCount) {
        logSuccess(`  ${table}: ${migratedCount}/${originalCount} records verified`);
      } else {
        logError(`  ${table}: ${migratedCount}/${originalCount} records (MISMATCH!)`);
        allVerified = false;
      }
    } catch (error) {
      logError(`  Failed to verify ${table}: ${error.message}`);
      allVerified = false;
    }
  }
  
  if (allVerified) {
    logSuccess('Migration verification completed successfully');
  } else {
    logError('Migration verification failed - some data may be missing');
  }
  
  return allVerified;
}

async function generateMigrationReport(backupData, verified) {
  logStep('REPORT', 'Generating migration report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    source: 'Neon',
    destination: 'Supabase',
    verified,
    tables: {}
  };
  
  for (const table of config.tables) {
    const originalCount = backupData[table]?.length || 0;
    let migratedCount = 0;
    
    try {
      migratedCount = await supabaseClient[table].count();
    } catch (error) {
      migratedCount = -1; // Error indicator
    }
    
    report.tables[table] = {
      original: originalCount,
      migrated: migratedCount,
      success: originalCount === migratedCount
    };
  }
  
  const reportFile = path.join(config.backupDir, 'migration-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  logSuccess(`Migration report saved to: ${reportFile}`);
  
  // Display summary
  log('\n=== MIGRATION SUMMARY ===', 'bright');
  log(`Timestamp: ${report.timestamp}`, 'blue');
  log(`Source: ${report.source}`, 'blue');
  log(`Destination: ${report.destination}`, 'blue');
  log(`Overall Status: ${verified ? 'SUCCESS' : 'FAILED'}`, verified ? 'green' : 'red');
  
  log('\nTable Details:', 'bright');
  for (const [table, data] of Object.entries(report.tables)) {
    const status = data.success ? '✓' : '✗';
    const color = data.success ? 'green' : 'red';
    log(`  ${status} ${table}: ${data.migrated}/${data.original}`, color);
  }
}

async function cleanup() {
  logStep('CLEANUP', 'Cleaning up...');
  
  try {
    if (neonClient) {
      await neonClient.$disconnect();
      logSuccess('Disconnected from Neon');
    }
    
    if (supabaseClient) {
      await supabaseClient.$disconnect();
      logSuccess('Disconnected from Supabase');
    }
  } catch (error) {
    logError(`Cleanup error: ${error.message}`);
  }
}

async function main() {
  let backupData = null;
  let verified = false;
  
  try {
    log('🚀 Starting Neon to Supabase Migration', 'bright');
    log('=====================================', 'bright');
    
    await initializeClients();
    await createBackupDirectory();
    backupData = await backupData();
    await resetSupabaseDatabase();
    await migrateData(backupData);
    verified = await verifyMigration(backupData);
    await generateMigrationReport(backupData, verified);
    
    if (verified) {
      log('\n🎉 Migration completed successfully!', 'green');
      log('You can now update your DATABASE_URL to point to Supabase.', 'yellow');
    } else {
      log('\n⚠️  Migration completed with issues.', 'yellow');
      log('Please review the migration report and verify your data.', 'yellow');
    }
    
  } catch (error) {
    logError(`\n💥 Migration failed: ${error.message}`);
    logError('Stack trace:', 'red');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\n\n⚠️  Migration interrupted by user', 'yellow');
  await cleanup();
  process.exit(0);
});

process.on('unhandledRejection', async (reason, promise) => {
  logError(`\n💥 Unhandled rejection at: ${promise}, reason: ${reason}`);
  await cleanup();
  process.exit(1);
});

// Run the migration
if (require.main === module) {
  main().catch(async (error) => {
    logError(`\n💥 Fatal error: ${error.message}`);
    await cleanup();
    process.exit(1);
  });
}

module.exports = {
  main,
  config
};
