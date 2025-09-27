#!/usr/bin/env node

/**
 * Migration Verification Script
 * 
 * This script verifies that the migration from Neon to Supabase was successful
 * by comparing data between the two databases.
 * 
 * Usage:
 * 1. Set both NEON_DATABASE_URL and SUPABASE_DATABASE_URL environment variables
 * 2. Run: node scripts/verify-migration.js
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

// Database clients
let neonClient;
let supabaseClient;

// Verification configuration
const config = {
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
  sampleSize: 10, // Number of records to sample for detailed comparison
  reportDir: path.join(__dirname, '..', 'migration-verification')
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

async function createReportDirectory() {
  logStep('REPORT', 'Creating report directory...');
  
  if (!fs.existsSync(config.reportDir)) {
    fs.mkdirSync(config.reportDir, { recursive: true });
    logSuccess('Report directory created');
  } else {
    logWarning('Report directory already exists');
  }
}

async function verifyTableCounts() {
  logStep('COUNT', 'Verifying record counts...');
  
  const counts = {};
  let allCountsMatch = true;
  
  for (const table of config.tables) {
    try {
      const neonCount = await neonClient[table].count();
      const supabaseCount = await supabaseClient[table].count();
      
      counts[table] = {
        neon: neonCount,
        supabase: supabaseCount,
        match: neonCount === supabaseCount
      };
      
      if (neonCount === supabaseCount) {
        logSuccess(`  ${table}: ${supabaseCount}/${neonCount} records match`);
      } else {
        logError(`  ${table}: ${supabaseCount}/${neonCount} records (MISMATCH!)`);
        allCountsMatch = false;
      }
    } catch (error) {
      logError(`  Failed to verify ${table}: ${error.message}`);
      counts[table] = {
        neon: -1,
        supabase: -1,
        match: false,
        error: error.message
      };
      allCountsMatch = false;
    }
  }
  
  return { counts, allCountsMatch };
}

async function verifyDataIntegrity() {
  logStep('INTEGRITY', 'Verifying data integrity...');
  
  const integrityResults = {};
  
  // Verify foreign key relationships
  try {
    // Check province-district relationships
    const neonDistricts = await neonClient.district.findMany({
      include: { province: true }
    });
    
    const supabaseDistricts = await supabaseClient.district.findMany({
      include: { province: true }
    });
    
    const districtIntegrity = neonDistricts.length === supabaseDistricts.length &&
      neonDistricts.every(nd => 
        supabaseDistricts.some(sd => 
          sd.id === nd.id && 
          sd.provinceId === nd.provinceId &&
          sd.province?.name === nd.province?.name
        )
      );
    
    integrityResults.districtProvince = {
      match: districtIntegrity,
      neonCount: neonDistricts.length,
      supabaseCount: supabaseDistricts.length
    };
    
    if (districtIntegrity) {
      logSuccess('  District-Province relationships verified');
    } else {
      logError('  District-Province relationships mismatch');
    }
    
  } catch (error) {
    logError(`  Failed to verify district-province relationships: ${error.message}`);
    integrityResults.districtProvince = { match: false, error: error.message };
  }
  
  // Check user-role relationships
  try {
    const neonUsers = await neonClient.user.findMany({
      select: { id: true, role: true, email: true }
    });
    
    const supabaseUsers = await supabaseClient.user.findMany({
      select: { id: true, role: true, email: true }
    });
    
    const userIntegrity = neonUsers.length === supabaseUsers.length &&
      neonUsers.every(nu => 
        supabaseUsers.some(su => 
          su.id === nu.id && 
          su.role === nu.role &&
          su.email === nu.email
        )
      );
    
    integrityResults.userRoles = {
      match: userIntegrity,
      neonCount: neonUsers.length,
      supabaseCount: supabaseUsers.length
    };
    
    if (userIntegrity) {
      logSuccess('  User roles verified');
    } else {
      logError('  User roles mismatch');
    }
    
  } catch (error) {
    logError(`  Failed to verify user roles: ${error.message}`);
    integrityResults.userRoles = { match: false, error: error.message };
  }
  
  return integrityResults;
}

async function sampleDataComparison() {
  logStep('SAMPLE', 'Performing sample data comparison...');
  
  const sampleResults = {};
  
  for (const table of config.tables) {
    try {
      // Get sample records from both databases
      const neonSamples = await neonClient[table].findMany({
        take: config.sampleSize,
        orderBy: { id: 'asc' }
      });
      
      const supabaseSamples = await supabaseClient[table].findMany({
        take: config.sampleSize,
        orderBy: { id: 'asc' }
      });
      
      // Compare samples
      const matches = neonSamples.filter(neonRecord => 
        supabaseSamples.some(supabaseRecord => 
          JSON.stringify(neonRecord) === JSON.stringify(supabaseRecord)
        )
      );
      
      sampleResults[table] = {
        neonSamples: neonSamples.length,
        supabaseSamples: supabaseSamples.length,
        matches: matches.length,
        matchRate: neonSamples.length > 0 ? (matches.length / neonSamples.length) * 100 : 0
      };
      
      if (matches.length === neonSamples.length && neonSamples.length === supabaseSamples.length) {
        logSuccess(`  ${table}: ${matches.length}/${neonSamples.length} samples match (100%)`);
      } else {
        logWarning(`  ${table}: ${matches.length}/${neonSamples.length} samples match (${sampleResults[table].matchRate.toFixed(1)}%)`);
      }
      
    } catch (error) {
      logError(`  Failed to sample ${table}: ${error.message}`);
      sampleResults[table] = { error: error.message };
    }
  }
  
  return sampleResults;
}

async function generateVerificationReport(counts, integrity, samples) {
  logStep('REPORT', 'Generating verification report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    source: 'Neon',
    destination: 'Supabase',
    verification: {
      counts,
      integrity,
      samples
    },
    summary: {
      totalTables: config.tables.length,
      countMatches: Object.values(counts).filter(c => c.match).length,
      integrityChecks: Object.keys(integrity).length,
      integrityPassed: Object.values(integrity).filter(i => i.match).length,
      overallSuccess: false
    }
  };
  
  // Calculate overall success
  const countSuccess = report.summary.countMatches === report.summary.totalTables;
  const integritySuccess = report.summary.integrityPassed === report.summary.integrityChecks;
  report.summary.overallSuccess = countSuccess && integritySuccess;
  
  const reportFile = path.join(config.reportDir, 'verification-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  logSuccess(`Verification report saved to: ${reportFile}`);
  
  // Display summary
  log('\n=== VERIFICATION SUMMARY ===', 'bright');
  log(`Timestamp: ${report.timestamp}`, 'blue');
  log(`Source: ${report.source}`, 'blue');
  log(`Destination: ${report.destination}`, 'blue');
  log(`Overall Status: ${report.summary.overallSuccess ? 'SUCCESS' : 'FAILED'}`, 
      report.summary.overallSuccess ? 'green' : 'red');
  
  log('\nCount Verification:', 'bright');
  log(`  Tables Verified: ${report.summary.countMatches}/${report.summary.totalTables}`, 
      report.summary.countMatches === report.summary.totalTables ? 'green' : 'red');
  
  log('\nIntegrity Verification:', 'bright');
  log(`  Checks Passed: ${report.summary.integrityPassed}/${report.summary.integrityChecks}`, 
      report.summary.integrityPassed === report.summary.integrityChecks ? 'green' : 'red');
  
  return report;
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
  let counts, integrity, samples, report;
  
  try {
    log('🔍 Starting Migration Verification', 'bright');
    log('==================================', 'bright');
    
    await initializeClients();
    await createReportDirectory();
    counts = await verifyTableCounts();
    integrity = await verifyDataIntegrity();
    samples = await sampleDataComparison();
    report = await generateVerificationReport(counts, integrity, samples);
    
    if (report.summary.overallSuccess) {
      log('\n🎉 Migration verification completed successfully!', 'green');
      log('Your data has been successfully migrated to Supabase.', 'yellow');
    } else {
      log('\n⚠️  Migration verification found issues.', 'yellow');
      log('Please review the verification report for details.', 'yellow');
    }
    
  } catch (error) {
    logError(`\n💥 Verification failed: ${error.message}`);
    logError('Stack trace:', 'red');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\n\n⚠️  Verification interrupted by user', 'yellow');
  await cleanup();
  process.exit(0);
});

// Run the verification
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
