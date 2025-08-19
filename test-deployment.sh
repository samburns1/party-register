#!/bin/bash

# Party Register Deployment Test Script
# Tests if REGISTRATION_MODE=EMAIL is working on Vercel

echo "🧪 Testing Party Register Deployment"
echo "======================================"

# Replace with your actual Vercel deployment URL
DEPLOYMENT_URL="https://party-register-beryl-tau.vercel.app"

echo "1️⃣  Testing /api/mode endpoint..."
MODE_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/mode" 2>/dev/null)
echo "Response: $MODE_RESPONSE"
echo "Expected: {\"mode\":\"EMAIL\"}"
echo

echo "2️⃣  Testing /api/start with USC email..."
START_RESPONSE=$(curl -s -X POST "$DEPLOYMENT_URL/api/start" \
  -H "Content-Type: application/json" \
  -d '{"contact":"test@usc.edu"}' 2>/dev/null)
echo "Response: $START_RESPONSE"
echo "Expected: {\"ok\":true,\"limit\":40,\"demo\":true,\"mode\":\"EMAIL\"}"
echo "❌ Bad: {\"error\":\"Invalid phone number format...\"}"
echo

echo "3️⃣  Testing /api/start with phone number (should fail in EMAIL mode)..."
PHONE_RESPONSE=$(curl -s -X POST "$DEPLOYMENT_URL/api/start" \
  -H "Content-Type: application/json" \
  -d '{"contact":"+15551234567"}' 2>/dev/null)
echo "Response: $PHONE_RESPONSE"
echo "Expected in EMAIL mode: {\"error\":\"Please use a valid USC email address (@usc.edu)\"}"
echo

echo "🔧 If mode shows 'SMS' instead of 'EMAIL':"
echo "   1. Check Vercel dashboard → Project Settings → Environment Variables"
echo "   2. Ensure REGISTRATION_MODE=EMAIL is set for all environments"
echo "   3. Redeploy from Vercel dashboard or push new commit"
echo "   4. Run this script again after 30 seconds"