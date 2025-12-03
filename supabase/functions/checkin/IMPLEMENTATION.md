# Check-in Edge Function Implementation

## Overview

The check-in Edge Function handles the complete check-in flow including validation, record creation, reward calculation, and title unlocking.

**Requirements**: 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 5.1, 5.2, 6.1

## Features

### 1. Duplicate Check-in Prevention (Requirement 1.4)

The function checks if the user has already checked in on the same calendar day:

```typescript
const { data: existingCheckin } = await supabaseClient
  .from('attendances')
  .select('id')
  .eq('user_id', user.id)
  .eq('check_in_date', checkInDate)
  .limit(1)
```

If a duplicate is found, returns:
```json
{
  "success": false,
  "error": "Already checked in today",
  "isDuplicate": true
}
```

### 2. Attendance Record Creation (Requirements 1.3, 14.4)

Creates a new attendance record with:
- User ID
- Check-in date (YYYY-MM-DD)
- Check-in time (ISO timestamp)
- Location tag
- Month and year (for efficient querying)

```typescript
const { data: attendance } = await supabaseClient
  .from('attendances')
  .insert({
    user_id: user.id,
    check_in_date: checkInDate,
    check_in_time: timestamp,
    tag: tag,
    month: month,
    year: year,
  })
```

### 3. Monthly Count Tracking (Requirement 1.5)

Calculates the total number of check-ins for the current month:

```typescript
const { data: monthlyAttendances } = await supabaseClient
  .from('attendances')
  .select('id')
  .eq('user_id', user.id)
  .eq('month', month)
  .eq('year', year)

const monthlyCount = monthlyAttendances?.length || 0
```

### 4. Streak Calculation (Requirements 5.1, 5.2)

The `updateStreak` function:

1. Gets current streak from `user_progress`
2. Checks if user checked in yesterday
3. If yes: increment streak
4. If no: reset streak to 1
5. Updates max streak if current exceeds it

```typescript
// Check yesterday's attendance
const yesterday = new Date(current)
yesterday.setDate(yesterday.getDate() - 1)

const { data: yesterdayCheckin } = await supabaseClient
  .from('attendances')
  .select('id')
  .eq('user_id', userId)
  .eq('check_in_date', yesterdayStr)

// Calculate new streak
let newStreak = yesterdayCheckin?.length > 0 
  ? currentStreak + 1  // Consecutive
  : 1                   // Reset
```

### 5. Lottery Ticket Rewards (Requirements 3.1, 3.2, 3.3)

The `checkAndGrantTickets` function awards tickets at milestones:

- **4 check-ins**: 1 ticket
- **8 check-ins**: 1 ticket  
- **12 check-ins**: 1 ticket

```typescript
const ticketMilestones = [4, 8, 12]
let ticketsToGrant = 0

for (const milestone of ticketMilestones) {
  if (monthlyCount === milestone) {
    ticketsToGrant++
  }
}
```

Tickets are added to the `lottery_tickets` table:

```typescript
await supabaseClient
  .from('lottery_tickets')
  .update({
    ticket_count: existingTickets.ticket_count + ticketsToGrant,
    earned_from: `${monthlyCount}_checkins`,
  })
```

### 6. Title Unlocking (Requirement 6.1)

The `checkAndUnlockTitles` function checks all title unlock conditions:

#### Streak-based Titles
```typescript
if (conditionValue.threshold && currentStreak >= conditionValue.threshold) {
  shouldUnlock = true
}
```

Example: "3日坊主克服" unlocks at 3-day streak

#### Attendance-based Titles
```typescript
if (conditionValue.count && totalAttendanceCount >= conditionValue.count) {
  shouldUnlock = true
}
```

Example: "出社ビギナー" unlocks at 10 total check-ins

#### Level-based Titles
```typescript
if (conditionValue.level && userLevel >= conditionValue.level) {
  shouldUnlock = true
}
```

Example: "レベル5達成" unlocks at level 5

#### Tag-based Titles
```typescript
if (conditionValue.tag === tag && 
    conditionValue.count && 
    tagAttendanceCount >= conditionValue.count) {
  shouldUnlock = true
}
```

Example: "オフィスの主" unlocks at 30 check-ins with tag "officeA"

## Response Format

### Success Response

```json
{
  "success": true,
  "attendance": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "check_in_date": "2024-12-02",
    "check_in_time": "2024-12-02T10:30:00Z",
    "tag": "officeA",
    "month": 12,
    "year": 2024,
    "created_at": "2024-12-02T10:30:00Z"
  },
  "rewards": {
    "ticketsEarned": 1,
    "monthlyCount": 4,
    "streak": {
      "current": 3,
      "max": 5,
      "isNewRecord": false
    }
  },
  "newTitles": [
    {
      "id": "title-uuid",
      "name": "3日坊主克服",
      "description": "3日連続出社を達成",
      "unlock_condition_type": "streak",
      "unlock_condition_value": {"threshold": 3}
    }
  ]
}
```

### Error Responses

**Unauthorized (401)**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Duplicate Check-in (400)**:
```json
{
  "success": false,
  "error": "Already checked in today",
  "isDuplicate": true
}
```

**Server Error (500)**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Database Operations

### Tables Modified

1. **attendances**: INSERT new record
2. **user_progress**: UPDATE streak values (or INSERT if not exists)
3. **lottery_tickets**: UPDATE ticket count (or INSERT if not exists)
4. **user_titles**: INSERT new unlocked titles

### Tables Read

1. **attendances**: Check duplicates, count monthly/total/tag-specific
2. **user_progress**: Get current streak, level
3. **titles**: Get all titles for unlock checking
4. **user_titles**: Get already unlocked titles

## Performance Considerations

### Indexes Used

- `idx_attendances_user_date` for duplicate checking
- `idx_attendances_user_year_month` for monthly counts
- `idx_user_titles_user` for unlocked title lookups

### Query Optimization

- Uses `limit(1)` for existence checks
- Batches title unlock checks
- Only queries necessary data with `select()`

## Error Handling

All database errors are caught and returned as 500 responses:

```typescript
try {
  // ... operations
} catch (error) {
  console.error('Check-in error:', error)
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }),
    { status: 500 }
  )
}
```

## Security

### Authentication

Uses Supabase Auth to verify the user:

```typescript
const {
  data: { user },
  error: userError,
} = await supabaseClient.auth.getUser()

if (userError || !user) {
  return new Response(
    JSON.stringify({ success: false, error: 'Unauthorized' }),
    { status: 401 }
  )
}
```

### Row Level Security (RLS)

All database operations respect RLS policies:
- Users can only insert/update their own records
- `user_id` is always set to the authenticated user's ID

### CORS

Includes CORS headers for cross-origin requests:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

## Testing

### Manual Testing

```bash
# Test with curl
curl -X POST 'https://your-project.supabase.co/functions/v1/checkin' \
  -H 'Authorization: Bearer YOUR_USER_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"tag":"office","timestamp":"2024-12-02T10:30:00Z"}'
```

### Test Cases

1. ✅ First check-in of the day
2. ✅ Duplicate check-in (same day)
3. ✅ Consecutive day check-in (streak increment)
4. ✅ Check-in after gap (streak reset)
5. ✅ Check-in at milestone (4, 8, 12) - ticket reward
6. ✅ Check-in that unlocks title
7. ✅ Unauthorized request
8. ✅ Invalid tag handling

## Future Enhancements

1. **Quest Progress**: Update quest completion status during check-in
2. **XP Rewards**: Grant XP for check-ins
3. **Notifications**: Trigger notifications for milestones
4. **Analytics**: Track check-in patterns
5. **Rate Limiting**: Prevent abuse
