# Supabase Database Setup

This directory contains the database schema for the Officing application.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - Name: `officing` (or your preferred name)
   - Database Password: (choose a strong password)
   - Region: (select closest to your location)
5. Wait for the project to be created (~2 minutes)

### 2. Execute the Schema

1. In your Supabase project dashboard, navigate to the **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `schema.sql` from this directory
4. Paste it into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
6. Wait for the execution to complete
7. You should see a success message indicating all tables, indexes, and policies were created

### 3. Verify the Setup

1. Navigate to **Table Editor** in the left sidebar
2. You should see all the following tables:
   - `user_progress`
   - `attendances`
   - `lottery_tickets`
   - `prizes`
   - `lottery_log`
   - `quests`
   - `user_quest_logs`
   - `titles`
   - `user_titles`
   - `shop_items`

3. Click on any table to verify its structure matches the design document

### 4. Get Your API Credentials

1. Navigate to **Settings** → **API** in the left sidebar
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
3. You'll need these values for the frontend configuration

## What This Schema Includes

### Tables
- **user_progress**: User level, XP, points, streak tracking
- **attendances**: Check-in records with dates and tags
- **lottery_tickets**: Lottery ticket inventory per user
- **prizes**: Master data for lottery prizes
- **lottery_log**: History of all lottery draws
- **quests**: Master data for quests
- **user_quest_logs**: Quest assignments and completions
- **titles**: Master data for achievements/titles
- **user_titles**: User's unlocked titles
- **shop_items**: Master data for purchasable items

### Indexes
- Optimized queries for attendances by user and date
- Efficient monthly statistics queries
- Fast quest log lookups
- User title collection queries

### Row Level Security (RLS)
- Users can only access their own data
- Master data (prizes, quests, titles, shop_items) is read-only
- All policies use `auth.uid()` for user identification

### Triggers
- Automatic `updated_at` timestamp updates for:
  - `user_progress`
  - `lottery_tickets`

## Troubleshooting

### Error: "extension uuid-ossp does not exist"
This should not happen on Supabase, but if it does:
1. Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
2. Then run the rest of the schema

### Error: "relation already exists"
If you're re-running the schema:
1. Either drop the existing tables first (⚠️ this deletes all data)
2. Or modify the script to use `CREATE TABLE IF NOT EXISTS` (already included)

### RLS Policies Not Working
1. Verify you're authenticated when testing
2. Check that `auth.uid()` returns a valid UUID
3. Test with the Supabase client, not direct SQL queries

## Master Data Setup

After creating the schema, you need to populate the master data tables:

### Option 1: Using the Setup Script (Recommended)

```bash
# Using bash script
./supabase/setup-master-data.sh

# Or using Node.js script
node supabase/setup-master-data.js
```

### Option 2: Manual SQL Execution

1. In Supabase SQL Editor, open a new query
2. Copy the contents of `master-data.sql`
3. Paste and run the query
4. Verify the data was inserted correctly

### What Gets Installed

- **12 Prizes**: Lottery prizes with S/A/B/C ranks
- **30 Quests**: Daily, weekly, and flex quests
- **26 Titles**: Achievements based on streaks, attendance, levels, etc.
- **14 Shop Items**: Lottery tickets, stamps, titles, and boosts
- **8 System Config**: Default game settings

For detailed information about the master data, see:
- [DATA_SETUP.md](DATA_SETUP.md) - Setup guide and customization
- [MASTER_DATA_REFERENCE.md](MASTER_DATA_REFERENCE.md) - Complete data reference

## Test Data Setup (Development)

For development and testing, you can create test users with realistic data:

### Quick Setup (5 minutes)

```bash
cd supabase
npm install
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run seed
```

This creates 3 test users:
- **test1@example.com** - Active user (Level 8, 7-day streak, 30 days history)
- **test2@example.com** - New user (Level 2, just started, 3 days history)
- **test3@example.com** - Power user (Level 15, 30-day streak, 60 days history)

Password for all: `TestUser123!`

### Verify Setup

```bash
supabase db execute -f verify-test-data.sql
```

### Documentation

- [QUICK_TEST_SETUP.md](QUICK_TEST_SETUP.md) - 5-minute quick start
- [TEST_DATA_SETUP.md](TEST_DATA_SETUP.md) - Complete setup guide with all methods
- [../docs/TEST_DATA_GUIDE.md](../docs/TEST_DATA_GUIDE.md) - Developer guide with test scenarios

### Files

- `seed-test-data.sql` - SQL script (manual setup)
- `seed-test-users.js` - JavaScript script (automated)
- `setup-test-users.sh` - Shell script (interactive)
- `verify-test-data.sql` - Verification queries
- `package.json` - NPM configuration

## Next Steps

After setting up the database and master data:
1. Configure the frontend with your Supabase credentials
2. Set up Supabase Auth (Magic Link and/or Google OAuth)
3. Deploy Edge Functions for business logic (`cd supabase/functions && ./deploy.sh`)
4. (Optional) Set up test data for development
5. Start your application!
