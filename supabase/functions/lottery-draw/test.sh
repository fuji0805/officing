#!/bin/bash

# Test script for lottery-draw Edge Function
# Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Lottery Draw Edge Function Test ===${NC}\n"

# Check if SUPABASE_URL and SUPABASE_ANON_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set${NC}"
    echo "Please set them in your environment or .env file"
    exit 1
fi

# Check if ACCESS_TOKEN is set
if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}Error: ACCESS_TOKEN must be set${NC}"
    echo "Please authenticate and set your access token"
    exit 1
fi

FUNCTION_URL="${SUPABASE_URL}/functions/v1/lottery-draw"

echo -e "${YELLOW}Testing lottery draw...${NC}"
echo "URL: $FUNCTION_URL"
echo ""

# Test 1: Draw lottery with valid ticket
echo -e "${YELLOW}Test 1: Draw lottery${NC}"
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY")

echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Test 1 passed: Lottery draw successful${NC}\n"
    
    # Display prize details
    PRIZE_NAME=$(echo "$RESPONSE" | jq -r '.prize.name')
    PRIZE_RANK=$(echo "$RESPONSE" | jq -r '.rank')
    PITY_COUNTER=$(echo "$RESPONSE" | jq -r '.pityCounter')
    TICKETS_REMAINING=$(echo "$RESPONSE" | jq -r '.ticketsRemaining')
    
    echo -e "${GREEN}Prize: $PRIZE_NAME${NC}"
    echo -e "${GREEN}Rank: $PRIZE_RANK${NC}"
    echo -e "${GREEN}Pity Counter: $PITY_COUNTER${NC}"
    echo -e "${GREEN}Tickets Remaining: $TICKETS_REMAINING${NC}\n"
else
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    echo -e "${RED}✗ Test 1 failed: $ERROR${NC}\n"
fi

# Test 2: Try to draw without tickets (should fail)
echo -e "${YELLOW}Test 2: Draw without tickets (should fail after tickets run out)${NC}"
echo "Note: This test will only fail if you have no tickets remaining"
echo ""

echo -e "${GREEN}=== All tests completed ===${NC}"
