# Edge Function Integration Guide

This guide explains how to integrate the Supabase Edge Functions with the Officing PWA client.

## Check-in Function Integration

### Function URL

```
https://your-project-ref.supabase.co/functions/v1/checkin
```

### Client-Side Implementation

Update `js/checkin.js` to call the Edge Function instead of handling logic client-side:

```javascript
/**
 * Execute check-in via Edge Function
 * @param {string} tag - Location tag
 * @returns {Promise<Object>} - Check-in result
 */
async executeCheckin(tag) {
  if (this.isProcessing) {
    return { success: false, error: 'Check-in already in progress' };
  }

  this.isProcessing = true;

  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');

    // Get current user session
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Call Edge Function
    const { data, error } = await client.functions.invoke('checkin', {
      body: {
        tag: tag || this.getDefaultTag(),
        timestamp: new Date().toISOString()
      }
    });

    if (error) throw error;

    if (!data.success) {
      return {
        success: false,
        error: data.error,
        isDuplicate: data.isDuplicate
      };
    }

    console.log('✅ Check-in successful via Edge Function');
    return data;

  } catch (error) {
    console.error('❌ Check-in failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    this.isProcessing = false;
  }
}
```

### Response Handling

The Edge Function returns a comprehensive response:

```javascript
{
  success: true,
  attendance: {
    id: "uuid",
    check_in_date: "2024-12-02",
    check_in_time: "2024-12-02T10:30:00Z",
    tag: "officeA",
    month: 12,
    year: 2024
  },
  rewards: {
    ticketsEarned: 1,        // Number of lottery tickets earned
    monthlyCount: 4,         // Total check-ins this month
    streak: {
      current: 3,            // Current streak
      max: 5,                // Max streak ever
      isNewRecord: false     // Whether this is a new record
    }
  },
  newTitles: [               // Newly unlocked titles
    {
      id: "uuid",
      name: "3日坊主克服",
      description: "3日連続出社を達成"
    }
  ]
}
```

### UI Updates

Use the response to update the UI:

```javascript
async handleCheckinSuccess(result) {
  const { attendance, rewards, newTitles } = result;

  // Show success animation
  this.showSuccessAnimation();

  // Display stamp
  this.addStampToCollection(attendance.check_in_date);

  // Show monthly count and streak
  this.updateAttendanceMetrics(
    rewards.monthlyCount,
    rewards.streak.current
  );

  // Show lottery ticket countdown
  const nextTicketAt = this.calculateNextTicketMilestone(rewards.monthlyCount);
  this.displayTicketCountdown(nextTicketAt);

  // Show new titles with animation
  if (newTitles && newTitles.length > 0) {
    for (const title of newTitles) {
      await this.showTitleUnlockAnimation(title);
    }
  }

  // Show lottery ticket reward
  if (rewards.ticketsEarned > 0) {
    this.showTicketRewardAnimation(rewards.ticketsEarned);
  }

  // Show streak milestone
  if (rewards.streak.isNewRecord) {
    this.showStreakMilestoneAnimation(rewards.streak.current);
  }
}
```

## Benefits of Edge Function Approach

### 1. Centralized Business Logic

All check-in logic is in one place:
- ✅ Duplicate prevention
- ✅ Streak calculation
- ✅ Ticket rewards
- ✅ Title unlocking

### 2. Atomic Operations

The Edge Function ensures all operations succeed or fail together:
- Create attendance record
- Update streak
- Grant tickets
- Unlock titles

### 3. Security

- Server-side validation
- RLS policies enforced
- No client-side manipulation

### 4. Consistency

- Same logic for all clients (web, mobile, etc.)
- Easier to maintain and update
- Single source of truth

### 5. Performance

- Reduced client-side complexity
- Fewer round trips to database
- Optimized queries with indexes

## Migration from Client-Side Logic

### Before (Client-Side)

```javascript
// Multiple separate operations
const attendance = await this.createAttendanceRecord(...);
const monthlyCount = await this.updateMonthlyCount(...);
const streak = await this.updateStreak(...);
// Check tickets manually
// Check titles manually
```

### After (Edge Function)

```javascript
// Single function call
const result = await client.functions.invoke('checkin', {
  body: { tag, timestamp }
});
// Everything handled server-side
```

## Error Handling

```javascript
try {
  const { data, error } = await client.functions.invoke('checkin', {
    body: { tag, timestamp }
  });

  if (error) {
    // Network or function error
    console.error('Function error:', error);
    this.showError('チェックインに失敗しました');
    return;
  }

  if (!data.success) {
    // Business logic error (duplicate, etc.)
    if (data.isDuplicate) {
      this.showInfo('今日はすでにチェックイン済みです');
    } else {
      this.showError(data.error);
    }
    return;
  }

  // Success
  await this.handleCheckinSuccess(data);

} catch (error) {
  // Unexpected error
  console.error('Unexpected error:', error);
  this.showError('予期しないエラーが発生しました');
}
```

## Testing

### Local Testing

1. Start Supabase locally:
```bash
supabase start
```

2. Deploy function locally:
```bash
supabase functions serve
```

3. Test with client:
```javascript
// In browser console
const client = getSupabaseClient();
const { data } = await client.functions.invoke('checkin', {
  body: { tag: 'office' }
});
console.log(data);
```

### Production Testing

1. Deploy function:
```bash
supabase functions deploy checkin
```

2. Test with curl:
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/checkin' \
  -H 'Authorization: Bearer YOUR_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"tag":"office"}'
```

## Monitoring

### Supabase Dashboard

View function logs in the Supabase Dashboard:
1. Go to Edge Functions
2. Select `checkin` function
3. View Logs tab

### Client-Side Logging

```javascript
// Log all check-in attempts
console.log('Check-in attempt:', { tag, timestamp });

// Log results
if (data.success) {
  console.log('Check-in success:', {
    monthlyCount: data.rewards.monthlyCount,
    streak: data.rewards.streak.current,
    ticketsEarned: data.rewards.ticketsEarned,
    newTitles: data.newTitles.length
  });
} else {
  console.error('Check-in failed:', data.error);
}
```

## Next Steps

1. Update `js/checkin.js` to use Edge Function
2. Remove client-side business logic
3. Update UI to handle new response format
4. Test thoroughly with various scenarios
5. Deploy to production
