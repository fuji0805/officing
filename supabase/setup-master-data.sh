#!/bin/bash

# Master Data Setup Script for Officing
# This script sets up the master data for the Officing application
# Requirements: 4.2, 6.1, 7.1, 9.5

set -e  # Exit on error

echo "🎮 Officing Master Data Setup"
echo "=============================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  Not in a Supabase project directory"
    echo "   Please run this script from your project root"
    exit 1
fi

echo "📋 This script will:"
echo "   1. Create database schema (if not exists)"
echo "   2. Insert master data (prizes, quests, titles, shop items)"
echo "   3. Set default configuration values"
echo ""

# Ask for confirmation
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 0
fi

echo ""
echo "🔧 Step 1: Creating database schema..."
if supabase db push; then
    echo "✅ Schema created successfully"
else
    echo "⚠️  Schema creation failed or already exists"
fi

echo ""
echo "📦 Step 2: Inserting master data..."
if supabase db execute --file supabase/master-data.sql; then
    echo "✅ Master data inserted successfully"
else
    echo "❌ Master data insertion failed"
    echo "   This might be because data already exists"
    echo "   Check the error message above"
    exit 1
fi

echo ""
echo "🔍 Step 3: Verifying data..."
supabase db execute --query "
SELECT 'Prizes' as table_name, COUNT(*) as count FROM prizes
UNION ALL
SELECT 'Quests' as table_name, COUNT(*) as count FROM quests
UNION ALL
SELECT 'Titles' as table_name, COUNT(*) as count FROM titles
UNION ALL
SELECT 'Shop Items' as table_name, COUNT(*) as count FROM shop_items
UNION ALL
SELECT 'System Config' as table_name, COUNT(*) as count FROM system_config;
"

echo ""
echo "✨ Setup complete!"
echo ""
echo "📊 Data Summary:"
echo "   - Prizes: 12 items (S/A/B/C ranks)"
echo "   - Quests: 30 items (daily/weekly/flex)"
echo "   - Titles: 26 achievements"
echo "   - Shop Items: 14 items"
echo "   - System Config: 8 settings"
echo ""
echo "📚 Next steps:"
echo "   1. Review the data in Supabase Dashboard"
echo "   2. Customize prizes, quests, or titles as needed"
echo "   3. Deploy your Edge Functions: cd supabase/functions && ./deploy.sh"
echo "   4. Start your application!"
echo ""
echo "📖 For more information, see: supabase/DATA_SETUP.md"

