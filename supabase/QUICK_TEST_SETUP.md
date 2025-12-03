# Quick Test Setup

Fast guide to get test data running in 5 minutes.

## Quick Start (Recommended)

```bash
# 1. Install dependencies
cd supabase
npm install

# 2. Set environment variables (get these from Supabase Dashboard)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 3. Run seed script
npm run seed
```

Done! You now have 3 test users ready to use.

## Test Accounts

| Email | Password | Profile | Level | Streak |
|-------|----------|---------|-------|--------|
| test1@example.com | TestUser123! | Active User | 8 | 7 days |
| test2@example.com | TestUser123! | New User | 2 | 2 days |
| test3@example.com | TestUser123! | Power User | 15 | 30 days |

## What Gets Created

Each test user gets:
- ✅ User account in Supabase Auth
- ✅ User progress (level, XP, points, streak)
- ✅ Check-in history (attendances)
- ✅ Unlocked titles
- ✅ Completed quests
- ✅ Lottery ticket balance
- ✅ Lottery draw history

## Finding Your Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy:
   - **URL:** Project URL
   - **Service Role Key:** service_role (secret) - NOT the anon key!

⚠️ **Important:** Keep your service role key secret! Don't commit it to git.

## Alternative: Manual Setup

If the automated script doesn't work:

1. Create users manually in Supabase Dashboard (Authentication → Users)
2. Edit `seed-test-data.sql` with the user IDs
3. Run: `supabase db execute -f seed-test-data.sql`

See [TEST_DATA_SETUP.md](./TEST_DATA_SETUP.md) for detailed instructions.

## Troubleshooting

**"Module not found" error:**
```bash
cd supabase
npm install
```

**"Invalid API key" error:**
- Make sure you're using the **service_role** key, not anon key
- Check the key is correctly set in environment variables

**"User already exists" error:**
- Users are already created, script will use existing users
- Or delete existing test users and run again

**Data not showing:**
- Make sure master data is loaded first: `master-data.sql`
- Check you're logged in with the correct test account
- Clear browser cache and reload

## Reset Test Data

```bash
# Delete test users in Supabase Dashboard
# Then run seed script again
npm run seed
```

## Next Steps

1. Open your Officing app
2. Log in with test1@example.com / TestUser123!
3. Check the dashboard - you should see:
   - Level 8
   - 7-day streak
   - 3 lottery tickets
   - Recent check-ins
4. Try checking in with a QR code
5. Complete a quest
6. Draw a lottery ticket

## Need Help?

See the full documentation: [TEST_DATA_SETUP.md](./TEST_DATA_SETUP.md)
