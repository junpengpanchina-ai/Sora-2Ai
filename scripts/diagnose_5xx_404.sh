#!/bin/bash
# diagnose_5xx_404.sh
# Quick diagnosis script for 5xx and 404 errors from GSC
#
# Usage:
#   1. Export URLs from GSC (Pages → Server errors (5xx) or Not found (404))
#   2. Save to 5xx_urls.txt or 404_urls.txt
#   3. Run: ./scripts/diagnose_5xx_404.sh 5xx_urls.txt
#   4. Or:  ./scripts/diagnose_5xx_404.sh 404_urls.txt

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo "Usage: $0 <url_file.txt>"
    echo "Example: $0 5xx_urls.txt"
    exit 1
fi

URL_FILE="$1"

if [ ! -f "$URL_FILE" ]; then
    echo -e "${RED}Error: File not found: $URL_FILE${NC}"
    exit 1
fi

echo "======================================"
echo "🔍 SEO Error Diagnosis"
echo "======================================"
echo "File: $URL_FILE"
echo "Date: $(date)"
echo ""

# Count total URLs
TOTAL=$(wc -l < "$URL_FILE" | tr -d ' ')
echo "Total URLs to check: $TOTAL"
echo ""

# Check each URL
echo "======================================"
echo "📋 URL Status Check"
echo "======================================"

declare -A STATUS_COUNTS
declare -A PATTERN_COUNTS

while IFS= read -r url || [ -n "$url" ]; do
    # Skip empty lines
    [ -z "$url" ] && continue
    
    # Get HTTP status
    status=$(curl -s -o /dev/null -w "%{http_code}" -I "$url" --max-time 10 2>/dev/null || echo "TIMEOUT")
    
    # Count by status
    ((STATUS_COUNTS[$status]++)) || STATUS_COUNTS[$status]=1
    
    # Extract path pattern (first 2 segments)
    path=$(echo "$url" | sed 's|https\?://[^/]*/||' | cut -d'/' -f1-2)
    ((PATTERN_COUNTS[$path]++)) || PATTERN_COUNTS[$path]=1
    
    # Color based on status
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}$status${NC} $url"
    elif [ "$status" = "301" ] || [ "$status" = "302" ]; then
        echo -e "${YELLOW}$status${NC} $url"
    else
        echo -e "${RED}$status${NC} $url"
    fi
    
done < "$URL_FILE"

echo ""
echo "======================================"
echo "📊 Summary by HTTP Status"
echo "======================================"

for status in "${!STATUS_COUNTS[@]}"; do
    count=${STATUS_COUNTS[$status]}
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}$status: $count${NC}"
    elif [ "$status" = "500" ] || [ "$status" = "502" ] || [ "$status" = "503" ] || [ "$status" = "504" ]; then
        echo -e "${RED}$status: $count${NC}"
    elif [ "$status" = "404" ] || [ "$status" = "410" ]; then
        echo -e "${RED}$status: $count${NC}"
    else
        echo -e "${YELLOW}$status: $count${NC}"
    fi
done

echo ""
echo "======================================"
echo "📁 Summary by URL Pattern"
echo "======================================"

for pattern in "${!PATTERN_COUNTS[@]}"; do
    count=${PATTERN_COUNTS[$pattern]}
    echo "$count  /$pattern"
done | sort -rn

echo ""
echo "======================================"
echo "🎯 Diagnosis"
echo "======================================"

# Check if still having 5xx
if [ "${STATUS_COUNTS[500]}" ] || [ "${STATUS_COUNTS[502]}" ] || [ "${STATUS_COUNTS[503]}" ] || [ "${STATUS_COUNTS[504]}" ]; then
    echo -e "${RED}⚠️  Still seeing 5xx errors - likely SSR/API issue${NC}"
    echo "   → Check Vercel logs for the failing routes"
    echo "   → Add timeout/fallback handling to SSR functions"
fi

# Check if 5xx now returning 200
if [ "${STATUS_COUNTS[200]}" ]; then
    echo -e "${GREEN}✅ Some URLs now returning 200 - may be intermittent 5xx${NC}"
    echo "   → Monitor for next 24h"
    echo "   → If 5xx was intermittent, it may be timeout/cold-start issue"
fi

# Check for 404s
if [ "${STATUS_COUNTS[404]}" ]; then
    echo -e "${RED}⚠️  404 errors detected${NC}"
    echo "   → Decide: 301 redirect or 410 Gone"
    echo "   → Remove from sitemap if intentionally deleted"
fi

# Check for redirects
if [ "${STATUS_COUNTS[301]}" ] || [ "${STATUS_COUNTS[302]}" ]; then
    echo -e "${YELLOW}⚠️  Redirects detected${NC}"
    echo "   → Ensure sitemap only contains final 200 URLs"
    echo "   → No redirect chains (301→301→200)"
fi

echo ""
echo "======================================"
echo "📝 Next Steps"
echo "======================================"
echo "1. If 5xx persists: Check Vercel Function logs"
echo "2. If 5xx is intermittent: Add timeout handling"
echo "3. If 404: Implement 301 or 410 response"
echo "4. Rerun this script after fixes"
echo "5. Target: 0 5xx, 0 404 in sitemap"
echo ""
