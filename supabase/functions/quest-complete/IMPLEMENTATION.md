# Quest Complete Edge Function Implementation

## Overview

This Edge Function handles quest completion processing, including reward calculation, XP/points distribution, level-up logic, and title unlocking.

## Requirements Addressed

- **7.2**: Quest reward calculation based on rank multipliers
- **7.3**: Quest completion logging with timestamp
- **8.1**: XP accumulation and points distribution
- **8.2**: Level-up logic with XP threshold checking
- **15.1**: Quest rank assignment (S/A/B/C)
- **15.2**: Rank S quest rewards (3.0x multiplier)
- **15.3**: Rank C quest rewards (1.0x multiplier)
- **15.4**: Rank-based reward multiplier calculation
- **15.5**: Quest rank display (handled by client)

## API Endpoint

```
POST /functions/v1/quest-complete
```

### Request Headers

```
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

### Request Body

```json
{
  "questLogId": "uuid-of-quest-log-entry"
}
```

### Response (Success)

```json
{
  "success": true,
  "rewards": {
    "xpEarned": 150,
    "pointsEarned": 300,
    "level": 5,
    "currentXP": 250,
    "xpForNextLevel": 559,
    "leveledUp": true
  },
  "newTitles": [
    {
      "id": "uuid",
      "name": "Quest Master",
      "description": "Complete 10 quests",
      "unlock_condition_type": "quest",
      "unlock_condition_value": { "count": 10 }
    }
  ]
}
```

### Response (Error)

```json
{
  "success": false,
  "error": "Quest already completed"
}
```

## Implementation Details

### 1. Quest Reward Calculation

Rewards are calculated using rank-specific multipliers:

```typescript
const RANK_MULTIPLIERS = {
  'S': 3.0,  // 300% rewards
  'A': 2.0,  // 200% rewards
  'B': 1.5,  // 150% rewards
  'C': 1.0,  // 100% rewards (base)
}

xpEarned = floor(base_xp * multiplier)
pointsEarned = floor(base_points * multiplier)
```

**Example:**
- Quest with base_xp=50, base_points=100, rank='A'
- XP earned: 50 * 2.0 = 100
- Points earned: 100 * 2.0 = 200

### 2. Quest Completion Recording

The function updates the `user_quest_logs` table:

```sql
UPDATE user_quest_logs
SET 
  completed_at = NOW(),
  xp_earned = <calculated_xp>,
  points_earned = <calculated_points>
WHERE id = <quest_log_id>
```

### 3. XP and Points Distribution

User progress is updated with earned rewards:

```sql
UPDATE user_progress
SET 
  current_xp = current_xp + <xp_earned>,
  total_points = total_points + <points_earned>,
  level = <new_level>
WHERE user_id = <user_id>
```

### 4. Level-Up Logic

The function uses an exponential XP curve:

```typescript
function calculateXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}
```

**XP Requirements by Level:**
- Level 1 → 2: 141 XP
- Level 2 → 3: 282 XP
- Level 3 → 4: 519 XP
- Level 4 → 5: 800 XP
- Level 5 → 6: 1118 XP

Level-up process:
1. Add earned XP to current XP
2. While current XP >= XP for next level:
   - Increment level
   - Subtract XP threshold from current XP
   - Calculate new threshold
3. Update user progress with new level and remaining XP

### 5. Title Unlocking

The function checks for title unlocks based on:

- **Level-based titles**: Unlocked when user reaches specific level
  ```json
  {
    "unlock_condition_type": "level",
    "unlock_condition_value": { "level": 10 }
  }
  ```

- **Quest completion titles**: Unlocked after completing N quests
  ```json
  {
    "unlock_condition_type": "quest",
    "unlock_condition_value": { "count": 50 }
  }
  ```

## Error Handling

The function handles the following error cases:

1. **Unauthorized**: No valid authentication token
   - Status: 401
   - Error: "Unauthorized"

2. **Missing quest log ID**: Request body missing questLogId
   - Status: 400
   - Error: "Quest log ID is required"

3. **Quest not found**: Quest log doesn't exist or doesn't belong to user
   - Status: 404
   - Error: "Quest not found"

4. **Already completed**: Quest has already been completed
   - Status: 400
   - Error: "Quest already completed"

5. **Database errors**: Any database operation failures
   - Status: 500
   - Error: Specific error message

## Testing

### Manual Testing Steps

1. **Setup**:
   ```bash
   # Set environment variables
   export SUPABASE_URL="your-project-url"
   export SUPABASE_ANON_KEY="your-anon-key"
   export ACCESS_TOKEN="user-access-token"
   ```

2. **Create test data**:
   ```sql
   -- Insert a test quest
   INSERT INTO quests (title, description, quest_type, rank, base_xp, base_points, is_active)
   VALUES ('Test Quest', 'Complete a test task', 'daily', 'A', 50, 100, true);
   
   -- Assign quest to user
   INSERT INTO user_quest_logs (user_id, quest_id, assigned_date)
   VALUES ('user-uuid', 'quest-uuid', CURRENT_DATE);
   ```

3. **Run test script**:
   ```bash
   ./supabase/functions/quest-complete/test.sh
   ```

### Test Cases

1. ✅ Complete a quest successfully
2. ✅ Verify rewards are calculated correctly based on rank
3. ✅ Verify XP and points are added to user progress
4. ✅ Verify level-up occurs when XP threshold is reached
5. ✅ Verify titles are unlocked when conditions are met
6. ✅ Reject duplicate completion attempts
7. ✅ Reject unauthorized requests
8. ✅ Reject missing quest log ID

## Integration with Client

Update the quest.js client to use the Edge Function:

```javascript
async completeQuest(logId) {
  const client = getSupabaseClient();
  const { data, error } = await client.functions.invoke('quest-complete', {
    body: { questLogId: logId }
  });
  
  if (error) throw error;
  
  // Display rewards
  this.showRewardAnimation(data.rewards);
  
  // Show new titles if any
  if (data.newTitles && data.newTitles.length > 0) {
    this.showTitleUnlockAnimation(data.newTitles);
  }
}
```

## Deployment

Deploy the function to Supabase:

```bash
supabase functions deploy quest-complete
```

Verify deployment:

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/quest-complete" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questLogId": "test-uuid"}'
```

## Performance Considerations

1. **Database queries**: Function makes 4-6 queries per request
   - Quest log fetch (1 query)
   - User progress update (1-2 queries)
   - Title checks (2-3 queries)

2. **Optimization opportunities**:
   - Cache title definitions
   - Batch title unlock checks
   - Use database transactions for atomicity

3. **Expected response time**: < 500ms for typical requests

## Security

1. **Authentication**: Required via Supabase Auth
2. **Authorization**: Users can only complete their own quests
3. **Validation**: Quest log ID and ownership verified
4. **Idempotency**: Duplicate completions are rejected

## Future Enhancements

1. Add quest completion streaks
2. Support for weekly and special quests
3. Quest chains and dependencies
4. Bonus rewards for completing all daily quests
5. Quest difficulty scaling based on user level
