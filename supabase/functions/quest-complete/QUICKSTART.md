# Quest Complete Function - Quick Start Guide

## Deploy

```bash
# Deploy the function
supabase functions deploy quest-complete

# Verify deployment
supabase functions list
```

## Test Locally

```bash
# Start Supabase locally
supabase start

# Serve the function locally
supabase functions serve quest-complete

# In another terminal, test the function
curl -X POST "http://localhost:54321/functions/v1/quest-complete" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questLogId": "your-quest-log-id"}'
```

## Test in Production

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export ACCESS_TOKEN="user-access-token"

# Run test script
./supabase/functions/quest-complete/test.sh
```

## Usage from Client

```javascript
// Complete a quest
const { data, error } = await supabaseClient.functions.invoke('quest-complete', {
  body: { questLogId: 'quest-log-uuid' }
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('Quest completed!');
  console.log('XP earned:', data.rewards.xpEarned);
  console.log('Points earned:', data.rewards.pointsEarned);
  console.log('Level:', data.rewards.level);
  console.log('Leveled up:', data.rewards.leveledUp);
  
  if (data.newTitles.length > 0) {
    console.log('New titles unlocked:', data.newTitles);
  }
}
```

## Common Issues

### 1. "Quest not found"
- Verify the quest log ID exists in user_quest_logs table
- Ensure the quest log belongs to the authenticated user

### 2. "Quest already completed"
- The quest has already been completed
- Check completed_at field in user_quest_logs

### 3. "Unauthorized"
- Ensure you're passing a valid access token
- Token must be from an authenticated user

### 4. Missing user_progress
- The function will automatically create user_progress if it doesn't exist
- Initial values: level=1, current_xp=0, total_points=0

## Database Setup

Ensure these tables exist:

```sql
-- user_quest_logs: Quest assignments and completions
-- quests: Quest definitions with rank and base rewards
-- user_progress: User level, XP, and points
-- titles: Title definitions
-- user_titles: Unlocked titles per user
```

## Monitoring

Check function logs:

```bash
# View recent logs
supabase functions logs quest-complete

# Follow logs in real-time
supabase functions logs quest-complete --follow
```

## Performance

- Expected response time: < 500ms
- Database queries: 4-6 per request
- Handles multiple level-ups in single request
- Atomic operations ensure data consistency
