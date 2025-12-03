# Lottery Draw Edge Function Implementation

## Overview

This Edge Function implements the lottery draw system for the Officing application. It handles ticket consumption, weighted random prize selection, inventory management, pity system, and reward distribution.

## Requirements Implemented

- **4.1**: Lottery ticket consumption and prize selection
- **4.2**: Weighted random selection algorithm (S/A/B/C ranks)
- **4.3**: Prize inventory management and availability tracking
- **4.4**: Pity system implementation (guaranteed A+ after threshold)
- **4.5**: Lottery draw logging

## API Specification

### Endpoint

```
POST /functions/v1/lottery-draw
```

### Authentication

Requires Supabase authentication token in the `Authorization` header.

### Request

No request body required. The function operates on the authenticated user's data.

### Response

#### Success Response (200)

```json
{
  "success": true,
  "prize": {
    "id": "uuid",
    "name": "Prize Name",
    "description": "Prize description",
    "rank": "A",
    "reward_type": "points",
    "reward_value": {
      "amount": 500
    }
  },
  "rank": "A",
  "pityCounter": 0,
  "ticketsRemaining": 2
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**400 Bad Request** (Insufficient tickets)
```json
{
  "success": false,
  "error": "Insufficient tickets"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "No available prizes"
}
```

## Implementation Details

### 1. Ticket Consumption (Requirement 4.1)

The function first checks if the user has available lottery tickets:

```typescript
async function consumeTicket(supabaseClient, userId)
```

- Fetches current ticket count from `lottery_tickets` table
- Validates that tickets > 0
- Decrements ticket count by 1
- Returns remaining ticket count

### 2. Weighted Random Selection (Requirement 4.2)

The lottery uses a weighted random algorithm based on prize ranks:

```typescript
async function executeLotteryDraw(supabaseClient, userId, pityCounter)
```

**Default Weight Distribution:**
- S Rank: ~5% (weight: 1-2 per prize)
- A Rank: ~15% (weight: 2-8 per prize)
- B Rank: ~30% (weight: 5-15 per prize)
- C Rank: ~50% (weight: 15-30 per prize)

**Algorithm:**
1. Fetch all available prizes
2. Filter out prizes with zero stock
3. Apply pity system filter if threshold reached
4. Calculate total weight
5. Generate random number in range [0, totalWeight)
6. Select prize by subtracting weights until random <= 0

### 3. Inventory Management (Requirement 4.3)

Prize inventory is tracked and updated:

```typescript
async function updatePrizeInventory(supabaseClient, prizeId, currentStock)
```

- Prizes with `stock: null` have unlimited availability
- Prizes with numeric stock are decremented on each draw
- When stock reaches 0, `is_available` is set to `false`
- Unavailable prizes are excluded from future draws

### 4. Pity System (Requirement 4.4)

The pity system guarantees better prizes after consecutive low-rank draws:

```typescript
const PITY_THRESHOLD = 10
```

**Behavior:**
- Counter increments by 1 for each B or C rank prize
- Counter resets to 0 when A or S rank is drawn
- When counter >= threshold, only A and S rank prizes are eligible
- If no A/S prizes available, falls back to all available prizes

**Pity Counter Update:**
```typescript
async function updatePityCounter(supabaseClient, userId, prizeRank, currentPityCounter)
```

### 5. Reward Distribution

Prizes can have different reward types:

```typescript
async function applyPrizeRewards(supabaseClient, userId, prize)
```

**Supported Reward Types:**

1. **Points** (`reward_type: "points"`)
   - Adds points to `user_progress.total_points`
   - Example: `{"amount": 500}`

2. **Title** (`reward_type: "title"`)
   - Unlocks a title by name
   - Adds entry to `user_titles` table
   - Example: `{"title_name": "Lucky Winner"}`

3. **Stamp** (`reward_type: "stamp"`)
   - Returns stamp data to client
   - No database update (handled by client)
   - Example: `{"stamp_id": "rare_gold"}`

4. **Item** (`reward_type: "item"`)
   - Returns item data to client
   - No database update (handled by client)
   - Example: `{"value": 5000, "type": "gift_card"}`

### 6. Lottery Logging (Requirement 4.5)

Every draw is logged for audit and analytics:

```typescript
async function logLotteryDraw(supabaseClient, userId, prizeId, rank, pityCounterAtDraw)
```

**Logged Data:**
- User ID
- Prize ID
- Prize rank
- Pity counter value at time of draw
- Timestamp (automatic)

## Database Tables Used

### Read Operations
- `lottery_tickets` - Check ticket availability
- `user_progress` - Get pity counter
- `prizes` - Fetch available prizes
- `titles` - Lookup title for reward

### Write Operations
- `lottery_tickets` - Decrement ticket count
- `user_progress` - Update pity counter and points
- `prizes` - Update stock and availability
- `user_titles` - Unlock titles
- `lottery_log` - Record draw result

## Error Handling

The function handles several error cases:

1. **Authentication Errors**: Returns 401 if user is not authenticated
2. **Insufficient Tickets**: Returns 400 if user has no tickets
3. **No Available Prizes**: Returns 500 if all prizes are unavailable
4. **Database Errors**: Returns 500 with error message

## Testing

### Manual Testing

1. **Setup**: Ensure user has lottery tickets
2. **Run**: Execute test script
   ```bash
   chmod +x supabase/functions/lottery-draw/test.sh
   ./supabase/functions/lottery-draw/test.sh
   ```

### Test Cases

1. ✓ Draw lottery with valid ticket
2. ✓ Verify ticket consumption
3. ✓ Check prize rank distribution
4. ✓ Test pity system activation
5. ✓ Verify inventory depletion
6. ✓ Test with no tickets (should fail)
7. ✓ Verify lottery log entry

## Deployment

Deploy the function using Supabase CLI:

```bash
supabase functions deploy lottery-draw
```

Or deploy all functions:

```bash
cd supabase/functions
./deploy.sh
```

## Integration with Frontend

The frontend should call this function when the user clicks the lottery draw button:

```javascript
async function drawLottery() {
  const { data, error } = await supabaseClient.functions.invoke('lottery-draw', {
    method: 'POST'
  });
  
  if (error) {
    console.error('Lottery draw failed:', error);
    return;
  }
  
  // Display prize result
  showPrizeAnimation(data.prize, data.rank);
  updateTicketCount(data.ticketsRemaining);
}
```

## Performance Considerations

- **Query Optimization**: Uses indexes on `user_id` for fast lookups
- **Transaction Safety**: Each draw is atomic (ticket consumption + prize selection)
- **Caching**: Prize data could be cached since it changes infrequently
- **Scalability**: Function is stateless and can handle concurrent requests

## Security

- **RLS Policies**: All database operations respect Row Level Security
- **Authentication**: User must be authenticated to draw
- **Validation**: Ticket count is validated before draw
- **Audit Trail**: All draws are logged for accountability

## Future Enhancements

1. **Batch Draws**: Allow drawing multiple tickets at once
2. **Prize Preview**: Show available prizes before drawing
3. **Draw History**: Endpoint to fetch user's lottery history
4. **Dynamic Weights**: Admin interface to adjust prize weights
5. **Special Events**: Temporary boost to certain prize rates
6. **Guaranteed Prizes**: Ensure certain prizes after X draws
