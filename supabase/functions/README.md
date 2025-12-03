# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Officing application.

## Functions

### `/checkin`

Handles check-in processing with rewards and title unlocks.

**Requirements**: 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 5.1, 5.2, 6.1

### `/lottery-draw`

Handles lottery draw processing with weighted selection and pity system.

**Requirements**: 4.1, 4.2, 4.3, 4.4, 4.5

**Request**:
```json
{
  "tag": "officeA",
  "timestamp": "2024-12-02T10:30:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "attendance": {
    "id": "uuid",
    "user_id": "uuid",
    "check_in_date": "2024-12-02",
    "check_in_time": "2024-12-02T10:30:00Z",
    "tag": "officeA",
    "month": 12,
    "year": 2024
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
      "id": "uuid",
      "name": "3日連続出社",
      "description": "3日連続で出社しました"
    }
  ]
}
```

**Features**:
- ✅ Duplicate check-in prevention (same day)
- ✅ Attendance record creation
- ✅ Monthly count tracking
- ✅ Streak calculation and update
- ✅ Lottery ticket rewards (4, 8, 12 check-ins)
- ✅ Title unlock detection (streak, attendance, level, tag-based)

**Request**:
```json
{
  "tag": "officeA",
  "timestamp": "2024-12-02T10:30:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "prize": {
    "id": "uuid",
    "name": "ボーナスポイント",
    "description": "500ポイント獲得",
    "rank": "B",
    "reward_type": "points",
    "reward_value": {
      "amount": 500
    }
  },
  "rank": "B",
  "pityCounter": 3,
  "ticketsRemaining": 2
}
```

**Features**:
- ✅ Lottery ticket consumption
- ✅ Weighted random prize selection (S/A/B/C ranks)
- ✅ Prize inventory management
- ✅ Pity system (guaranteed A+ after 10 draws)
- ✅ Reward distribution (points, titles, items)
- ✅ Lottery draw logging

## Deployment

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref your-project-ref
```

### Deploy Functions

Deploy all functions:
```bash
supabase functions deploy
```

Deploy a specific function:
```bash
supabase functions deploy checkin
```

### Local Development

Run functions locally:
```bash
supabase start
supabase functions serve
```

Test locally:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/checkin' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"tag":"office","timestamp":"2024-12-02T10:30:00Z"}'
```

## Environment Variables

Edge Functions automatically have access to:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

No additional configuration needed.

## Testing

See the test files in each function directory for unit tests and property-based tests.

## Error Handling

All functions return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common error codes:
- `401`: Unauthorized (invalid or missing auth token)
- `400`: Bad request (duplicate check-in, invalid data)
- `500`: Internal server error

## CORS

All functions include CORS headers to allow requests from any origin. Adjust the `corsHeaders` in each function if you need to restrict access.
