#!/usr/bin/env bash
set -euo pipefail

# Health check script for Stock Dashboard production deployment
# Usage: ./scripts/health-check.sh [URL]
# Default: https://stock-info-ten.vercel.app

URL="${1:-https://stock-info-ten.vercel.app}"
FAILED=0

echo "=== Stock Dashboard Health Check ==="
echo "Target: $URL"
echo ""

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}

    echo -n "Checking $description... "
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$URL$endpoint")

    if [ "$http_status" -eq "$expected_status" ]; then
        echo "✅ OK (HTTP $http_status)"
    else
        echo "❌ FAIL (HTTP $http_status, expected $expected_status)"
        FAILED=$((FAILED + 1))
    fi
}

# Check main page
check_endpoint "/" "Main Page"

# Check API endpoints with proper parameters
check_endpoint "/api/prices?ticker=AAPL&range=1M" "Prices API"
check_endpoint "/api/overview?ticker=AAPL" "Overview API"
check_endpoint "/api/financials?ticker=AAPL&statement=income&period=annual" "Financials API"
check_endpoint "/api/news?ticker=AAPL&window=7d" "News API"

# Check static assets (pick a common chunk)
echo -n "Checking Static Assets... "
chunk_url=$(curl -s "$URL" | grep -o '/_next/static/chunks/[a-f0-9]*.js' | head -1)
if [ -n "$chunk_url" ]; then
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$URL$chunk_url")
    if [ "$http_status" -eq 200 ]; then
        echo "✅ OK (HTTP $http_status)"
    else
        echo "❌ FAIL (HTTP $http_status)"
        FAILED=$((FAILED + 1))
    fi
else
    echo "⚠️  WARN (could not find chunk URL)"
fi

echo ""
echo "=== Summary ==="
if [ $FAILED -eq 0 ]; then
    echo "✅ All checks passed"
    exit 0
else
    echo "❌ $FAILED check(s) failed"
    exit 1
fi
