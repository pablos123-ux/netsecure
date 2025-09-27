#!/usr/bin/env node

/**
 * Backup Script for Neon Database
 * 
 * This script creates a complete backup of your Neon database
 * before migration to ensure data safety.
 * 
 * Usage:
 * 1. Set NEON_DATABASE_URL environment variable
 * 2. Run: node scripts/backup-neon.js
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
let neonClient;

// Backup configuration
const config = {
  backupDir: path.join(__dirname, '..', 'neon-backup'),
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
  ]
};

async function initializeClient() {
  logStep('INIT', 'Initializing Neon client...');
  
  const neonUrl = process.env.NEON_DATABASE_URL;
  
  if (!neonUrl) {
    throw new Error('NEON_DATABASE_URL environment variable is required');
  }
  
  neonClient = new PrismaClient({
    datasources: {
      db: { url: neonUrl }
    }
  });
  
  await neonClient.$connect();
  logSuccess('Connected to Neon database');
}

async function createBackupDirectory() {
  logStep('BACKUP', 'Creating backup directory...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(config.backupDir, `backup-${timestamp}`);
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
    logSuccess(`Backup directory created: ${backupPath}`);
  }
  
  return backupPath;
}

async function backupTable(tableName, backupPath) {
  try {
    log(`  Backing up ${tableName}...`, 'blue');
    
    const data = await neonClient[tableName].findMany({
      orderBy: { id: 'asc' }
    });
    
    const backupFile = path.join(backupPath, `${tableName}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    
    logSuccess(`  ${tableName}: ${data.length} records backed up`);
    return data;
  } catch (error) {
    logError(`  Failed to backup ${tableName}: ${error.message}`);
    throw error;
  }
}

async function backupSchema(backupPath) {
  logStep('SCHEMA', 'Backing up database schema...');
  
  try {
    // Get table schemas
    const tables = await neonClient.$queryRaw`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const schemaFile = path.join(backupPath, 'schema.json');
    fs.writeFileSync(schemaFile, JSON.stringify(tables, null, 2));
    
    logSuccess('Database schema backed up');
  } catch (error) {
    logWarning(`Could not backup schema: ${error.message}`);
  }
}

async function createBackupManifest(backupPath, backupData) {
  logStep('MANIFEST', 'Creating backup manifest...');
  
  const manifest = {
    timestamp: new Date().toISOString(),
    source: 'Neon Database',
    version: '1.0.0',
    tables: {}
  };
  
  for (const [table, data] of Object.entries(backupData)) {
    manifest.tables[table] = {
      recordCount: data.length,
      backupFile: `${table}.json`
    };
  }
  
  const manifestFile = path.join(backupPath, 'manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  
  logSuccess('Backup manifest created');
  return manifest;
}

async function compressBackup(backupPath) {
  logStep('COMPRESS', 'Compressing backup...');
  
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const backupName = path.basename(backupPath);
    const parentDir = path.dirname(backupPath);
    const zipPath = path.join(parentDir, `${backupName}.zip`);
    
    // Use PowerShell on Windows, tar on Unix
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? `powershell Compress-Archive -Path "${backupPath}" -DestinationPath "${zipPath}"`
      : `tar -czf "${zipPath}" -C "${parentDir}" "${backupName}"`;
    
    await execAsync(command);
    
    // Remove original directory after compression
    fs.rmSync(backupPath, { recursive: true, force: true });
    
    logSuccess(`Backup compressed: ${zipPath}`);
    return zipPath;
  } catch (error) {
    logWarning(`Could not compress backup: ${error.message}`);
    return backupPath;
  }
}

async function main() {
  let backupPath = null;
  
  try {
    log('💾 Starting Neon Database Backup', 'bright');
    log('================================', 'bright');
    
    await initializeClient();
    backupPath = await createBackupDirectory();
    
    const backupData = {};
    
    // Backup all tables
    for (const table of config.tables) {
      backupData[table] = await backupTable(table, backupPath);
    }
    
    // Backup schema
    await backupSchema(backupPath);
    
    // Create manifest
    const manifest = await createBackupManifest(backupPath, backupData);
    
    // Compress backup
    const finalPath = await compressBackup(backupPath);
    
    // Display summary
    log('\n=== BACKUP SUMMARY ===', 'bright');
    log(`Timestamp: ${manifest.timestamp}`, 'blue');
    log(`Source: ${manifest.source}`, 'blue');
    log(`Backup Location: ${finalPath}`, 'blue');
    
    log('\nTable Details:', 'bright');
    for (const [table, info] of Object.entries(manifest.tables)) {
      log(`  ✓ ${table}: ${info.recordCount} records`, 'green');
    }
    
    log('\n🎉 Backup completed successfully!', 'green');
    log(`Backup saved to: ${finalPath}`, 'yellow');
    
  } catch (error) {
    logError(`\n💥 Backup failed: ${error.message}`);
    logError('Stack trace:', 'red');
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (neonClient) {
      await neonClient.$disconnect();
      logSuccess('Disconnected from Neon database');
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\n\n⚠️  Backup interrupted by user', 'yellow');
  if (neonClient) {
    await neonClient.$disconnect();
  }
  process.exit(0);
});

// Run the backup
if (require.main === module) {
  main().catch(async (error) => {
    logError(`\n💥 Fatal error: ${error.message}`);
    if (neonClient) {
      await neonClient.$disconnect();
    }
    process.exit(1);
  });
}

module.exports = {
  main,
  config
};
