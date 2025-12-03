#!/bin/bash

# Test script for check-in Edge Function
# Usage: ./test.sh [local|production]

set -e

MODE=${1:-local}

if [ "$MODE" = "local" ]; then
  BASE_URL="http://localhost:54321/functions/v1"
  echo "🧪 Testing locally at $BASE_URL"
else
  if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ Error: SUPABASE_PROJECT_REF environment variable not set"
    echo "Usage: SUPABASE_PROJECT_REF=your-ref ./test.sh production"
    exit 1
  fi
  BASE_URL="https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1"
  echo "🧪 Testing production at $BASE_URL"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: SUPABASE_ANON_KEY environment variable not set"
  echo "Set it with: export SUPABASE_ANON_KEY=your-anon-key"
  exit 1
fi

if [ -z "$USER_JWT" ]; then
  echo "⚠️  Warning: USER_JWT not set, using anon key only"
  echo "For authenticated tests, set: export USER_JWT=your-user-jwt"
  AUTH_HEADER="Authorization: Bearer $SUPABASE_ANON_KEY"
else
  AUTH_HEADER="Authorization: Bearer $USER_JWT"
fi

echo ""
echo "📋 Test 1: Check-in with default tag"
echo "-----------------------------------"
curl -i -X POST "$BASE_URL/checkin" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"tag":"office"}'

echo ""
echo ""
echo "📋 Test 2: Check-in with custom tag"
echo "-----------------------------------"
curl -i -X POST "$BASE_URL/checkin" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"tag":"officeA","timestamp":"2024-12-02T10:30:00Z"}'

echo ""
echo ""
echo "📋 Test 3: Duplicate check-in (should fail)"
echo "-----------------------------------"
curl -i -X POST "$BASE_URL/checkin" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"tag":"office"}'

echo ""
echo ""
echo "✅ Tests complete!"
