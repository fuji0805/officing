# Quick Start Guide

Get your Officing database up and running in 5 minutes!

## Step 1: Execute Schema (2 minutes)

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the entire contents of `schema.sql`
5. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
6. Wait for success message ✅

## Step 2: Verify Schema (1 minute)

1. In SQL Editor, create another new query
2. Copy and paste the contents of `verify-schema.sql`
3. Run it
4. Check that all verification checks pass ✅

Expected results:
- ✅ All 10 tables exist
- ✅ All required indexes exist
- ✅ RLS enabled on all 10 tables
- ✅ Update triggers exist
- ✅ Foreign key constraints exist

## Step 3: Add Sample Data (2 minutes) - Optional

1. In SQL Editor, create another new query
2. Copy and paste the contents of `sample-data.sql`
3. Run it
4. Verify the counts:
   - Prizes: ~12 items
   - Quests: ~16 items
   - Titles: ~19 items
   - Shop Items: ~7 items

## Step 4: Test Access (1 minute)

1. Go to **Table Editor** (left sidebar)
2. Click on any table (e.g., `user_progress`)
3. You should see the table structure
4. Try to insert a test row (it will fail due to RLS - this is correct!)

## What You've Created

### Core Tables
- ✅ `user_progress` - User stats and progression
- ✅ `attendances` - Check-in records
- ✅ `lottery_tickets` - Ticket inventory
- ✅ `lottery_log` - Draw history

### Master Data Tables
- ✅ `prizes` - Lottery prizes
- ✅ `quests` - Available quests
- ✅ `titles` - Achievements
- ✅ `shop_items` - Purchasable items

### Junction Tables
- ✅ `user_quest_logs` - Quest progress
- ✅ `user_titles` - Unlocked titles

### Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Master data is read-only for users

## Next Steps

1. **Configure Frontend**: Update `js/config.js` with your Supabase credentials
2. **Enable Auth**: Set up Magic Link and/or Google OAuth in Supabase Auth settings
3. **Deploy Edge Functions**: Implement business logic for check-ins, lottery, and quests
4. **Test the App**: Start the frontend and test check-in flow

## Troubleshooting

### "Permission denied for table X"
This is normal! RLS is working. Users need to be authenticated to access data.

### "Relation already exists"
You've already run the schema. Either:
- Skip this step, or
- Drop tables first (⚠️ deletes all data): `DROP TABLE IF EXISTS table_name CASCADE;`

### "Foreign key violation"
Make sure you run `schema.sql` before `sample-data.sql`.

## Reference Documents

- `README.md` - Detailed setup instructions
- `SCHEMA_REFERENCE.md` - Complete schema documentation
- `verify-schema.sql` - Schema verification queries
- `sample-data.sql` - Sample master data

## Need Help?

Check the main documentation:
- `docs/SUPABASE_SETUP.md` - Complete Supabase setup guide
- `.kiro/specs/office-checkin-game/design.md` - System design document
