# Test Data Guide for Officing

Complete guide for working with test data during development.

## Overview

Test data is essential for development and testing. This guide covers:
- Setting up test users
- Understanding test user profiles
- Using test data effectively
- Resetting and managing test data

## Quick Start

```bash
# 1. Navigate to supabase directory
cd supabase

# 2. Install dependencies
npm install

# 3. Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 4. Run seed script
npm run seed

# 5. Verify setup
supabase db execute -f verify-test-data.sql
```

## Test User Profiles

### Test User 1: Active User (test1@example.com)

**Use Case:** Testing normal user flows and mid-game features

**Profile:**
- **Level:** 8
- **XP:** 450 / 600 (to next level)
- **Points:** 3,500
- **Current Streak:** 7 days
- **Max Streak:** 14 days
- **Lottery Tickets:** 3
- **Check-ins:** ~23 days (over 30 days with gaps)
- **Unlocked Titles:** 4
  - 3日坊主克服 (3-day streak)
  - 一週間の戦士 (7-day streak) - Active
  - 出社ビギナー (10 check-ins)
  - レベル5達成 (Level 5)
- **Completed Quests:** 12
- **Lottery Draws:** 3

**Test Scenarios:**
- ✅ Check-in flow with existing streak
- ✅ Quest completion and rewards
- ✅ Lottery draws with tickets
- ✅ Title unlocking at milestones
- ✅ Level-up progression
- ✅ Monthly ticket earning (4/8/12 check-ins)

### Test User 2: New User (test2@example.com)

**Use Case:** Testing onboarding and early game experience

**Profile:**
- **Level:** 2
- **XP:** 80 / 150 (to next level)
- **Points:** 250
- **Current Streak:** 2 days
- **Max Streak:** 3 days
- **Lottery Tickets:** 0
- **Check-ins:** 3 days
- **Unlocked Titles:** 1
  - 3日坊主克服 (3-day streak) - Active
- **Completed Quests:** 2
- **Lottery Draws:** 0

**Test Scenarios:**
- ✅ First-time user experience
- ✅ Early quest completion
- ✅ First title unlock
- ✅ Building initial streak
- ✅ Earning first lottery ticket (at 4 check-ins)
- ✅ Low-level progression

### Test User 3: Power User (test3@example.com)

**Use Case:** Testing advanced features and edge cases

**Profile:**
- **Level:** 15
- **XP:** 1,200 / 2,000 (to next level)
- **Points:** 8,500
- **Current Streak:** 30 days
- **Max Streak:** 45 days
- **Lottery Tickets:** 8
- **Check-ins:** 60 days (consistent)
- **Unlocked Titles:** 10+
  - Including high-level achievements
  - 出社アマチュア (30 check-ins) - Active
- **Completed Quests:** 30+
- **Lottery Draws:** 15

**Test Scenarios:**
- ✅ High-level gameplay
- ✅ Long streak maintenance
- ✅ Multiple lottery draws
- ✅ Advanced title collection
- ✅ Shop purchases with high points
- ✅ Monthly statistics with extensive history
- ✅ Edge cases (high values, long streaks)

## Common Test Scenarios

### 1. Check-in Flow Testing

**With Test User 1:**
```
1. Generate QR code with tag "officeA"
2. Scan QR code
3. Verify:
   - Success animation appears
   - Streak increments to 8
   - Monthly count updates
   - Stamp is added to collection
```

### 2. Quest Completion Testing

**With Test User 2:**
```
1. View dashboard
2. See 3 daily quests
3. Complete "今日の出社" quest
4. Verify:
   - XP increases
   - Points increase
   - Quest marked as complete
   - Progress bar updates
```

### 3. Lottery Draw Testing

**With Test User 3:**
```
1. Navigate to lottery screen
2. Verify 8 tickets available
3. Draw lottery
4. Verify:
   - Ticket count decreases to 7
   - Prize animation plays
   - Prize is awarded (points/item)
   - Lottery log updated
```

### 4. Title Unlocking Testing

**With Test User 1:**
```
1. Check in for 3 more days (to reach 10-day streak)
2. On 10th consecutive day:
3. Verify:
   - New title unlocked notification
   - Title appears in collection
   - Can set as active title
```

### 5. Level-up Testing

**With Test User 2:**
```
1. Complete quests to earn XP
2. When XP reaches 150:
3. Verify:
   - Level-up animation
   - Level increases to 3
   - XP resets with remainder
   - New XP threshold calculated
```

## Data Verification

### Manual Verification

After seeding, check in Supabase Dashboard:

1. **Authentication → Users**
   - Should see 3 test users
   - All emails should be confirmed

2. **Table Editor → user_progress**
   - 3 rows with different levels (2, 8, 15)
   - Streaks and points populated

3. **Table Editor → attendances**
   - ~93 total check-ins across all users
   - Dates should be recent (last 60 days)

4. **Table Editor → user_titles**
   - ~15 total unlocked titles
   - Each user has different titles

### Automated Verification

Run the verification script:

```bash
supabase db execute -f supabase/verify-test-data.sql
```

Expected output:
```
✅ PASS - Test Users: 3
✅ PASS - User Progress Levels
✅ PASS - Total Check-ins: 93
✅ PASS - Unlocked Titles: 15
✅ PASS - Completed Quests: 44
✅ PASS - Lottery Draws: 18
✅ PASS - Lottery Tickets: 11
```

## Resetting Test Data

### Full Reset

```bash
# 1. Delete test users in Supabase Dashboard
# Go to Authentication → Users
# Delete test1@example.com, test2@example.com, test3@example.com

# 2. Re-run seed script
cd supabase
npm run seed
```

### Partial Reset (Keep Users, Reset Data)

```sql
-- Delete all data for test users
DELETE FROM user_quest_logs WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test%@example.com'
);

DELETE FROM lottery_log WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test%@example.com'
);

DELETE FROM user_titles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test%@example.com'
);

DELETE FROM attendances WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test%@example.com'
);

DELETE FROM lottery_tickets WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test%@example.com'
);

DELETE FROM user_progress WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test%@example.com'
);

-- Then re-run seed script
```

## Customizing Test Data

### Modifying User Profiles

Edit `supabase/seed-test-users.js`:

```javascript
// Change Test User 1 level
await supabase.from('user_progress').upsert({
  user_id: userId,
  level: 10,  // Change this
  current_xp: 500,  // Change this
  // ... other fields
});
```

### Adding More Test Users

Add to `TEST_USERS` array in `seed-test-users.js`:

```javascript
const TEST_USERS = [
  // ... existing users
  {
    email: 'test4@example.com',
    password: 'TestUser123!',
    profile: 'custom',
    description: 'Custom Test User'
  }
];
```

Then implement `seedCustomUser()` function.

### Changing Check-in History

Modify the `generateCheckInDates()` function:

```javascript
// More check-ins
const checkInDates = generateCheckInDates(90);  // 90 days instead of 30

// Different skip pattern
const checkInDates = generateCheckInDates(30, (i) => {
  return i % 2 === 0;  // Skip every other day
});
```

## Troubleshooting

### Issue: "User already exists"

**Solution:** Users are already created. The script will use existing users. To start fresh, delete users in dashboard first.

### Issue: "Foreign key constraint violation"

**Solution:** Master data is missing. Run `master-data.sql` before seeding test data.

### Issue: Data not showing in app

**Possible causes:**
1. Not logged in with test account
2. RLS policies not set up correctly
3. Frontend not configured with correct Supabase URL/key

**Debug steps:**
```javascript
// In browser console
const { data, error } = await supabase.from('user_progress').select('*');
console.log(data, error);
```

### Issue: Verification script fails

**Solution:** Check which specific check failed and run troubleshooting queries in `verify-test-data.sql`.

## Best Practices

### During Development

1. **Use Test User 2** for testing new features (clean slate)
2. **Use Test User 1** for testing normal flows
3. **Use Test User 3** for testing edge cases and limits

### Before Committing

1. Don't commit actual user IDs or keys
2. Keep test passwords simple but documented
3. Document any custom test scenarios

### For Testing

1. Reset test data before major testing sessions
2. Verify data after seeding
3. Use different test users for different scenarios
4. Document any issues found with specific test data

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test with Seed Data

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: cd supabase && npm install
      - name: Seed test data
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: cd supabase && npm run seed
      - name: Run tests
        run: npm test
```

## Related Documentation

- [QUICK_TEST_SETUP.md](../supabase/QUICK_TEST_SETUP.md) - Quick start guide
- [TEST_DATA_SETUP.md](../supabase/TEST_DATA_SETUP.md) - Detailed setup instructions
- [MASTER_DATA_REFERENCE.md](../supabase/MASTER_DATA_REFERENCE.md) - Master data reference
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase configuration guide

## Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Run verification script
3. Review error messages
4. Check that prerequisites are met
5. Consult the detailed setup guide
