#!/bin/bash

# Deployment script for AI Chat Edge Function
# This script helps deploy the AI chat function to Supabase

echo "🚀 Deploying AI Chat Edge Function to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Login to Supabase (if not already logged in)
echo "🔐 Checking Supabase login status..."
supabase login

# Deploy the function
echo "📦 Deploying ai-chat function..."
supabase functions deploy ai-chat

# Set environment variables (prompt user)
echo ""
echo "📝 Please set the following environment variables in your Supabase dashboard:"
echo "   - SUPABASE_URL: Your Supabase project URL"
echo "   - SUPABASE_ANON_KEY: Your Supabase anonymous key"
echo "   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key"
echo ""
echo "🔗 Function URL will be: https://[your-project].supabase.co/functions/v1/ai-chat"
echo ""
echo "✅ Deployment complete! The AI chatbox is now available in your application."

# Test the deployment
echo ""
echo "🧪 Testing the deployment..."
echo "You can test the function with:"
echo "curl -X POST https://[your-project].supabase.co/functions/v1/ai-chat \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\": \"Hello\"}'"

echo ""
echo "🎉 AI Chat feature deployment script completed!"