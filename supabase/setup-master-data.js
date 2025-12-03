#!/usr/bin/env node

/**
 * Master Data Setup Script for Officing (Node.js version)
 * This script sets up the master data for the Officing application
 * Requirements: 4.2, 6.1, 7.1, 9.5
 * 
 * Usage:
 *   node supabase/setup-master-data.js
 *   or
 *   npm run setup-data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎮 Officing Master Data Setup');
console.log('==============================');
console.log('');

// Check if Supabase CLI is installed
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if we're in a Supabase project
function checkSupabaseProject() {
  return fs.existsSync('supabase/config.toml');
}

// Execute SQL file
function executeSQLFile(filename) {
  try {
    const result = execSync(`supabase db execute --file ${filename}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

// Verify data
function verifyData() {
  const query = `
    SELECT 'Prizes' as table_name, COUNT(*) as count FROM prizes
    UNION ALL
    SELECT 'Quests' as table_name, COUNT(*) as count FROM quests
    UNION ALL
    SELECT 'Titles' as table_name, COUNT(*) as count FROM titles
    UNION ALL
    SELECT 'Shop Items' as table_name, COUNT(*) as count FROM shop_items
    UNION ALL
    SELECT 'System Config' as table_name, COUNT(*) as count FROM system_config;
  `;
  
  try {
    const result = execSync(`supabase db execute --query "${query}"`, {
      encoding: 'utf8'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main setup function
async function setup() {
  // Check prerequisites
  if (!checkSupabaseCLI()) {
    console.log('⚠️  Supabase CLI not found. Please install it first:');
    console.log('   npm install -g supabase');
    console.log('   or visit: https://supabase.com/docs/guides/cli');
    process.exit(1);
  }

  if (!checkSupabaseProject()) {
    console.log('⚠️  Not in a Supabase project directory');
    console.log('   Please run this script from your project root');
    process.exit(1);
  }

  console.log('📋 This script will:');
  console.log('   1. Create database schema (if not exists)');
  console.log('   2. Insert master data (prizes, quests, titles, shop items)');
  console.log('   3. Set default configuration values');
  console.log('');

  // Ask for confirmation
  rl.question('Continue? (y/n) ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled');
      rl.close();
      process.exit(0);
    }

    console.log('');
    console.log('🔧 Step 1: Creating database schema...');
    
    try {
      execSync('supabase db push', { stdio: 'inherit' });
      console.log('✅ Schema created successfully');
    } catch (error) {
      console.log('⚠️  Schema creation failed or already exists');
    }

    console.log('');
    console.log('📦 Step 2: Inserting master data...');
    
    const result = executeSQLFile('supabase/master-data.sql');
    
    if (result.success) {
      console.log('✅ Master data inserted successfully');
    } else {
      console.log('❌ Master data insertion failed');
      console.log('   This might be because data already exists');
      console.log('   Error:', result.error);
      rl.close();
      process.exit(1);
    }

    console.log('');
    console.log('🔍 Step 3: Verifying data...');
    
    const verifyResult = verifyData();
    if (verifyResult.success) {
      console.log(verifyResult.output);
    }

    console.log('');
    console.log('✨ Setup complete!');
    console.log('');
    console.log('📊 Data Summary:');
    console.log('   - Prizes: 12 items (S/A/B/C ranks)');
    console.log('   - Quests: 30 items (daily/weekly/flex)');
    console.log('   - Titles: 26 achievements');
    console.log('   - Shop Items: 14 items');
    console.log('   - System Config: 8 settings');
    console.log('');
    console.log('📚 Next steps:');
    console.log('   1. Review the data in Supabase Dashboard');
    console.log('   2. Customize prizes, quests, or titles as needed');
    console.log('   3. Deploy your Edge Functions: cd supabase/functions && ./deploy.sh');
    console.log('   4. Start your application!');
    console.log('');
    console.log('📖 For more information, see: supabase/DATA_SETUP.md');

    rl.close();
  });
}

// Run setup
setup().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

