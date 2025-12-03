#!/bin/bash

# Deployment script for Supabase Edge Functions
# Usage: ./deploy.sh [function-name]
# If no function name is provided, all functions will be deployed

set -e

echo "🚀 Deploying Supabase Edge Functions..."

if [ -z "$1" ]; then
  echo "📦 Deploying all functions..."
  supabase functions deploy
else
  echo "📦 Deploying function: $1"
  supabase functions deploy "$1"
fi

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test your function in the Supabase Dashboard"
echo "2. Update your client code to use the function URL"
echo "3. Monitor logs in the Supabase Dashboard"
