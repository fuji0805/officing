# Test Data Setup Guide

This guide explains how to set up test users and seed data for the Officing application.

## Overview

The test data setup creates three test users with different profiles:

1. **Test User 1 (Active User)** - `test1@example.com`
   - Level 8, moderate progress
   - 30 days of attendance history with some gaps
   - Current 7-day streak
   - Several unlocked titles
   - Good for testing normal user flows

2. **Test User 2 (New User)** - `test2@example.com`
   - Level 2, just started
   - Only 3 days of attendance
   - Current 2-day streak
   - One unlocked title
   - Good for testing onboarding and early game

3. **Test User 3 (Power User)** - `test3@example.com`
   - Level 15, advanced progress
   - 60 days of consistent attendance
   - Current 30-day streak
   - Many unlocked titles
   - Good for testing advanced features and edge cases

All test users use the password: `TestUser123!`

## Prerequisites

Before setting up test data, ensure you have:

1. ✅ Supabase project created
2. ✅ Database schema created (`schema.sql`)
3. ✅ Master data populated (`master-data.sql`)

## Setup Methods

### Method 1: Using JavaScript Script (Recommended)

This method automatically creates users and seeds data.

**Requirements:**
- Node.js installed
- `@supabase/supabase-js` package

**Steps:**

1. Install dependencies:
```bash
npm install @supabase/supabase-js
```

2. Set environment variables:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

> ⚠️ **Important:** Use the **service role key**, not the anon key!
> Find it in: Supabase Dashboard → Settings → API → service_role key

3. Run the script:
```bash
node supabase/seed-test-users.js
```

The script will:
- Create three test users in Supabase Auth
- Populate attendance history
- Create quest logs
- Add lottery history
- Unlock titles

### Method 2: Using SQL Script (Manual)

This method requires manual user creation first.

**Steps:**

1. **Create users in Supabase Dashboard:**
   - Go to: Authentication → Users
   - Click "Add User" for each:
     - Email: `test1@example.com`, Password: `TestUser123!`
     - Email: `test2@example.com`, Password: `TestUser123!`
     - Email: `test3@example.com`, Password: `TestUser123!`

2. **Copy User IDs:**
   - After creating each user, copy their UUID from the dashboard

3. **Update SQL script:**
   - Open `supabase/seed-test-data.sql`
   - Replace the placeholder UUIDs at the top:
     ```sql
     test_user_1 UUID := 'YOUR_USER_1_ID_HERE';
     test_user_2 UUID := 'YOUR_USER_2_ID_HERE';
     test_user_3 UUID := 'YOUR_USER_3_ID_HERE';
     ```

4. **Run the SQL script:**
   ```bash
   supabase db execute -f supabase/seed-test-data.sql
   ```

   Or in the Supabase Dashboard SQL Editor:
   - Copy the contents of `seed-test-data.sql`
   - Paste and run in SQL Editor

### Method 3: Using Shell Script (Semi-Automated)

This method guides you through the process interactively.

**Requirements:**
- Bash shell
- Supabase CLI installed

**Steps:**

1. Make the script executable:
```bash
chmod +x supabase/setup-test-users.sh
```

2. Run the script:
```bash
./supabase/setup-test-users.sh
```

3. Follow the prompts:
   - The script will guide you to create users in the dashboard
   - Enter the User IDs when prompted
   - The script will automatically run the seed SQL

## Verification

After setup, verify the data was created correctly:

```sql
-- Check user progress
SELECT 
    user_id,
    level,
    current_xp,
    total_points,
    current_streak,
    max_streak
FROM user_progress
ORDER BY level DESC;

-- Check attendance counts
SELECT 
    user_id,
    COUNT(*) as total_checkins,
    COUNT(DISTINCT DATE_TRUNC('month', check_in_date)) as months_active
FROM attendances
GROUP BY user_id
ORDER BY total_checkins DESC;

-- Check unlocked titles
SELECT 
    up.user_id,
    up.level,
    COUNT(ut.id) as unlocked_titles
FROM user_progress up
LEFT JOIN user_titles ut ON ut.user_id = up.user_id
GROUP BY up.user_id, up.level
ORDER BY up.level DESC;
```

## Test User Details

### Test User 1: Active User
- **Email:** test1@example.com
- **Password:** TestUser123!
- **Profile:**
  - Level: 8
  - XP: 450
  - Points: 3,500
  - Current Streak: 7 days
  - Max Streak: 14 days
  - Lottery Tickets: 3
  - Check-ins: ~23 days (30 days with gaps)
  - Unlocked Titles: 4
  - Completed Quests: 12
  - Lottery Draws: 3

### Test User 2: New User
- **Email:** test2@example.com
- **Password:** TestUser123!
- **Profile:**
  - Level: 2
  - XP: 80
  - Points: 250
  - Current Streak: 2 days
  - Max Streak: 3 days
  - Lottery Tickets: 0
  - Check-ins: 3 days
  - Unlocked Titles: 1
  - Completed Quests: 2
  - Lottery Draws: 0

### Test User 3: Power User
- **Email:** test3@example.com
- **Password:** TestUser123!
- **Profile:**
  - Level: 15
  - XP: 1,200
  - Points: 8,500
  - Current Streak: 30 days
  - Max Streak: 45 days
  - Lottery Tickets: 8
  - Check-ins: 60 days
  - Unlocked Titles: 10
  - Completed Quests: 30
  - Lottery Draws: 15

## Resetting Test Data

To reset and recreate test data:

1. **Delete existing test users:**
   - Go to Supabase Dashboard → Authentication → Users
   - Delete test1@example.com, test2@example.com, test3@example.com
   - This will cascade delete all their data due to foreign key constraints

2. **Re-run the setup:**
   - Use any of the methods above to recreate the test users and data

## Troubleshooting

### "User already exists" error
- The user email is already registered
- Either delete the existing user or use a different email

### "Foreign key constraint violation"
- Master data (titles, quests, prizes) is missing
- Run `master-data.sql` first

### "Permission denied" error
- Using anon key instead of service role key
- Make sure to use the service_role key for the JavaScript script

### Data not showing in app
- Check RLS policies are correctly set up
- Verify user is authenticated
- Check browser console for errors

## Next Steps

After setting up test data:

1. Log in to the app with one of the test accounts
2. Test check-in functionality
3. Test quest completion
4. Test lottery draws
5. Test title unlocking
6. Test shop purchases

## Files

- `seed-test-data.sql` - SQL script with test data
- `seed-test-users.js` - JavaScript automated setup script
- `setup-test-users.sh` - Interactive shell script
- `TEST_DATA_SETUP.md` - This documentation

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify all prerequisites are met
3. Review the error messages carefully
4. Check that master data is populated first
