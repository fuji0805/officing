#!/bin/bash

# Setup Test Users for Officing
# This script helps create test users and populate test data

set -e

echo "=========================================="
echo "Officing Test User Setup"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    echo "Please run this script from your project root"
    exit 1
fi

echo "📋 This script will:"
echo "   1. Create three test users in Supabase Auth"
echo "   2. Populate test data for each user"
echo "   3. Display login credentials"
echo ""
echo "Test users to be created:"
echo "   - test1@example.com (Active User - 30 days history)"
echo "   - test2@example.com (New User - just started)"
echo "   - test3@example.com (Power User - extensive history)"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🔧 Creating test users..."
echo ""

# Note: Supabase CLI doesn't have a direct command to create users
# Users need to be created via the dashboard or API
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "Please create the following users in your Supabase Dashboard:"
echo "   1. Go to: https://app.supabase.com/project/YOUR_PROJECT/auth/users"
echo "   2. Click 'Add User' for each:"
echo ""
echo "      Email: test1@example.com"
echo "      Password: TestUser123!"
echo ""
echo "      Email: test2@example.com"
echo "      Password: TestUser123!"
echo ""
echo "      Email: test3@example.com"
echo "      Password: TestUser123!"
echo ""
echo "   3. Copy the User IDs from the dashboard"
echo ""

read -p "Have you created the users? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create the users first, then run this script again."
    exit 0
fi

echo ""
echo "📝 Please enter the User IDs from Supabase Dashboard:"
echo ""

read -p "Test User 1 ID (test1@example.com): " USER1_ID
read -p "Test User 2 ID (test2@example.com): " USER2_ID
read -p "Test User 3 ID (test3@example.com): " USER3_ID

echo ""
echo "🔄 Updating seed script with User IDs..."

# Create a temporary SQL file with the actual user IDs
sed "s/00000000-0000-0000-0000-000000000001/$USER1_ID/g; \
     s/00000000-0000-0000-0000-000000000002/$USER2_ID/g; \
     s/00000000-0000-0000-0000-000000000003/$USER3_ID/g" \
    supabase/seed-test-data.sql > supabase/seed-test-data-temp.sql

echo "✅ User IDs updated"
echo ""
echo "📊 Running seed script..."
echo ""

# Execute the seed script
supabase db execute -f supabase/seed-test-data-temp.sql

# Clean up temp file
rm supabase/seed-test-data-temp.sql

echo ""
echo "=========================================="
echo "✅ Test data setup complete!"
echo "=========================================="
echo ""
echo "Test users are ready:"
echo ""
echo "1. Active User (30 days history):"
echo "   Email: test1@example.com"
echo "   Password: TestUser123!"
echo "   Level: 8, Streak: 7 days"
echo ""
echo "2. New User (just started):"
echo "   Email: test2@example.com"
echo "   Password: TestUser123!"
echo "   Level: 2, Streak: 2 days"
echo ""
echo "3. Power User (extensive history):"
echo "   Email: test3@example.com"
echo "   Password: TestUser123!"
echo "   Level: 15, Streak: 30 days"
echo ""
echo "You can now log in with these credentials!"
echo ""
