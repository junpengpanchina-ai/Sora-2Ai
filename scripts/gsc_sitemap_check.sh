#!/bin/bash
# GSC Sitemap 健康检查脚本
# 用法: ./scripts/gsc_sitemap_check.sh

set -e

DOMAIN="https://sora2aivideos.com"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔍 GSC Sitemap 健康检查"
echo "   Domain: $DOMAIN"
echo "   Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 检查函数
check_sitemap() {
    local url=$1
    local expected_type=$2  # "index" or "urlset"
    local name=$3
    
    echo "📄 检查: $name"
    echo "   URL: $url"
    
    # 获取 HTTP 状态
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$http_status" == "200" ]; then
        echo -e "   HTTP: ${GREEN}✅ 200${NC}"
    else
        echo -e "   HTTP: ${RED}❌ $http_status${NC}"
        return 1
    fi
    
    # 获取 Content-Type
    content_type=$(curl -sI "$url" | grep -i "content-type" | head -1 | cut -d: -f2 | tr -d ' \r')
    if [[ "$content_type" == *"xml"* ]]; then
        echo -e "   Content-Type: ${GREEN}✅ $content_type${NC}"
    else
        echo -e "   Content-Type: ${YELLOW}⚠️ $content_type${NC}"
    fi
    
    # 检查 XML 类型
    xml_head=$(curl -s "$url" | head -5)
    if [ "$expected_type" == "index" ]; then
        if echo "$xml_head" | grep -q "sitemapindex"; then
            echo -e "   XML Type: ${GREEN}✅ sitemapindex${NC}"
        else
            echo -e "   XML Type: ${RED}❌ 期望 sitemapindex${NC}"
        fi
    else
        if echo "$xml_head" | grep -q "urlset"; then
            echo -e "   XML Type: ${GREEN}✅ urlset${NC}"
            # 统计 URL 数量
            url_count=$(curl -s "$url" | grep -c "<url>" 2>/dev/null || echo "0")
            url_count=$(echo "$url_count" | tr -d '\n\r')
            echo -e "   URL Count: ${GREEN}✅ $url_count${NC}"
        else
            echo -e "   XML Type: ${RED}❌ 期望 urlset${NC}"
        fi
    fi
    echo ""
}

# 抽查 URL 函数
spot_check_url() {
    local url=$1
    echo "🔗 抽查 URL: $url"
    
    # 检查 HTTP 状态
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$http_status" == "200" ]; then
        echo -e "   HTTP: ${GREEN}✅ 200${NC}"
    else
        echo -e "   HTTP: ${RED}❌ $http_status${NC}"
    fi
    
    # 检查 canonical
    canonical=$(curl -s "$url" | grep -i 'rel="canonical"' | head -1 | sed 's/.*href="\([^"]*\)".*/\1/')
    if [ -n "$canonical" ]; then
        if [ "$canonical" == "$url" ]; then
            echo -e "   Canonical: ${GREEN}✅ 指向自己${NC}"
        else
            echo -e "   Canonical: ${YELLOW}⚠️ $canonical${NC}"
        fi
    else
        echo -e "   Canonical: ${YELLOW}⚠️ 未找到${NC}"
    fi
    echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SITEMAP 检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 检查主 sitemap index
check_sitemap "$DOMAIN/sitemap.xml" "index" "主 Sitemap Index"

# 2. 检查 tier1-0 chunk
check_sitemap "$DOMAIN/sitemaps/tier1-0.xml" "urlset" "Tier1 Chunk 0"

# 3. 检查 sitemap-core
check_sitemap "$DOMAIN/sitemap-core.xml" "urlset" "Sitemap Core"

# 4. 检查其他 tier1 chunks (如果存在)
for i in 1 2 3 4; do
    chunk_url="$DOMAIN/sitemaps/tier1-$i.xml"
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$chunk_url")
    if [ "$http_status" == "200" ]; then
        check_sitemap "$chunk_url" "urlset" "Tier1 Chunk $i"
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 URL 抽查 (从 tier1-0 随机抽 3 个)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 从 tier1-0 抽取 3 个 URL 进行检查 (macOS 用 sort -R 代替 shuf)
sample_urls=$(curl -s "$DOMAIN/sitemaps/tier1-0.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' | sort -R 2>/dev/null | head -3)
# 如果 sort -R 不工作，用 awk 随机
if [ -z "$sample_urls" ]; then
    sample_urls=$(curl -s "$DOMAIN/sitemaps/tier1-0.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' | awk 'BEGIN{srand()} {print rand()"\t"$0}' | sort -n | cut -f2 | head -3)
fi

for url in $sample_urls; do
    spot_check_url "$url"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 摘要"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 统计总 URL 数
total_urls=0

core_count=$(curl -s "$DOMAIN/sitemap-core.xml" | grep -c "<url>" 2>/dev/null || echo "0")
core_count=$(echo "$core_count" | tr -d '\n\r' | sed 's/[^0-9]//g')
core_count=${core_count:-0}
total_urls=$((total_urls + core_count))
echo "   sitemap-core.xml: $core_count URLs"

tier1_0_count=$(curl -s "$DOMAIN/sitemaps/tier1-0.xml" | grep -c "<url>" 2>/dev/null || echo "0")
tier1_0_count=$(echo "$tier1_0_count" | tr -d '\n\r' | sed 's/[^0-9]//g')
tier1_0_count=${tier1_0_count:-0}
total_urls=$((total_urls + tier1_0_count))
echo "   tier1-0.xml: $tier1_0_count URLs"

# 检查其他 tier1 chunks (只统计有内容的)
for i in 1 2 3 4 5 6 7 8 9; do
    chunk_url="$DOMAIN/sitemaps/tier1-$i.xml"
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$chunk_url")
    if [ "$http_status" == "200" ]; then
        chunk_count=$(curl -s "$chunk_url" | grep -c "<url>" 2>/dev/null || echo "0")
        chunk_count=$(echo "$chunk_count" | tr -d '\n\r' | sed 's/[^0-9]//g')
        chunk_count=${chunk_count:-0}
        if [ "$chunk_count" -gt 0 ]; then
            total_urls=$((total_urls + chunk_count))
            echo "   tier1-$i.xml: $chunk_count URLs"
        fi
    fi
done

echo ""
echo -e "   ${GREEN}总计: $total_urls URLs${NC}"
echo ""
echo "=========================================="
echo "✅ 检查完成"
echo "=========================================="
