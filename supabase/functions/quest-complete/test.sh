#!/bin/bash

# Quest Complete Edge Function Test Script
# Requirements: 7.2, 7.3, 8.1, 8.2, 15.1, 15.2, 15.3, 15.4, 15.5

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Quest Complete Edge Function"
echo "========================================"

# Check if SUPABASE_URL and SUPABASE_ANON_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set${NC}"
  echo "Please set them in your environment or .env file"
  exit 1
fi

# Check if ACCESS_TOKEN is set
if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Warning: ACCESS_TOKEN not set${NC}"
  echo "You need to authenticate first to get an access token"
  echo "Run: supabase auth login"
  exit 1
fi

# Function URL (local or deployed)
FUNCTION_URL="${SUPABASE_URL}/functions/v1/quest-complete"

echo ""
echo "Testing with:"
echo "  URL: $FUNCTION_URL"
echo ""

# Test 1: Complete a quest (requires a valid quest log ID)
echo "Test 1: Complete a quest"
echo "------------------------"
echo -e "${YELLOW}Note: You need to replace QUEST_LOG_ID with an actual quest log ID from your database${NC}"
echo ""

# Example quest log ID (replace with actual ID)
QUEST_LOG_ID="00000000-0000-0000-0000-000000000000"

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"questLogId\": \"$QUEST_LOG_ID\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  if [ "$(echo "$RESPONSE" | jq -r '.success')" = "true" ]; then
    echo -e "${GREEN}✅ Quest completed successfully${NC}"
    
    # Display rewards
    XP=$(echo "$RESPONSE" | jq -r '.rewards.xpEarned')
    POINTS=$(echo "$RESPONSE" | jq -r '.rewards.pointsEarned')
    LEVEL=$(echo "$RESPONSE" | jq -r '.rewards.level')
    LEVELED_UP=$(echo "$RESPONSE" | jq -r '.rewards.leveledUp')
    
    echo "  XP Earned: $XP"
    echo "  Points Earned: $POINTS"
    echo "  Current Level: $LEVEL"
    echo "  Leveled Up: $LEVELED_UP"
    
    # Check for new titles
    NEW_TITLES=$(echo "$RESPONSE" | jq -r '.newTitles | length')
    if [ "$NEW_TITLES" -gt 0 ]; then
      echo -e "${GREEN}  🎉 Unlocked $NEW_TITLES new title(s)!${NC}"
    fi
  else
    echo -e "${RED}❌ Quest completion failed${NC}"
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    echo "  Error: $ERROR"
  fi
else
  echo -e "${RED}❌ Invalid response format${NC}"
fi

echo ""

# Test 2: Try to complete already completed quest
echo "Test 2: Try to complete already completed quest"
echo "-----------------------------------------------"

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"questLogId\": \"$QUEST_LOG_ID\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  if [ "$(echo "$RESPONSE" | jq -r '.success')" = "false" ]; then
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    if [[ "$ERROR" == *"already completed"* ]]; then
      echo -e "${GREEN}✅ Correctly rejected duplicate completion${NC}"
    else
      echo -e "${YELLOW}⚠️  Failed with different error: $ERROR${NC}"
    fi
  else
    echo -e "${RED}❌ Should have rejected duplicate completion${NC}"
  fi
fi

echo ""

# Test 3: Missing quest log ID
echo "Test 3: Missing quest log ID"
echo "----------------------------"

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  if [ "$(echo "$RESPONSE" | jq -r '.success')" = "false" ]; then
    echo -e "${GREEN}✅ Correctly rejected missing quest log ID${NC}"
  else
    echo -e "${RED}❌ Should have rejected missing quest log ID${NC}"
  fi
fi

echo ""

# Test 4: Unauthorized request
echo "Test 4: Unauthorized request"
echo "---------------------------"

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"questLogId\": \"$QUEST_LOG_ID\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  if [ "$(echo "$RESPONSE" | jq -r '.success')" = "false" ]; then
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    if [[ "$ERROR" == *"Unauthorized"* ]]; then
      echo -e "${GREEN}✅ Correctly rejected unauthorized request${NC}"
    else
      echo -e "${YELLOW}⚠️  Failed with different error: $ERROR${NC}"
    fi
  else
    echo -e "${RED}❌ Should have rejected unauthorized request${NC}"
  fi
fi

echo ""
echo "========================================"
echo "✅ Quest Complete Function Tests Complete"
echo ""
echo "Manual Testing Steps:"
echo "1. Create a test user and authenticate"
echo "2. Generate daily quests for the user"
echo "3. Get a quest log ID from user_quest_logs table"
echo "4. Replace QUEST_LOG_ID in this script with the actual ID"
echo "5. Run this script again to test quest completion"
echo ""
echo "Expected Behavior:"
echo "- Quest should be marked as completed"
echo "- XP and points should be calculated based on quest rank"
echo "- User progress should be updated with new XP and points"
echo "- Level up should occur if XP threshold is reached"
echo "- Titles should be unlocked if conditions are met"
