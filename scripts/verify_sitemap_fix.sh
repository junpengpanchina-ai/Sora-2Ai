#!/bin/bash
# 部署后验证脚本 - Sitemap tier1 off-by-one 修复
# 用法: ./scripts/verify_sitemap_fix.sh

set -e

DOMAIN="https://sora2aivideos.com"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "🔍 Sitemap Off-by-One 修复验证"
echo "   Domain: $DOMAIN"
echo "   Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# A. 检查 index 是否指向 tier1-0
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "A. 检查 sitemap.xml 是否指向 tier1-0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sitemap_content=$(curl -s "$DOMAIN/sitemap.xml")
echo "$sitemap_content" | head -15
echo ""

if echo "$sitemap_content" | grep -q "tier1-0.xml"; then
    echo -e "${GREEN}✅ sitemap.xml 指向 tier1-0.xml${NC}"
else
    echo -e "${RED}❌ sitemap.xml 未指向 tier1-0.xml！检查是否已部署${NC}"
    if echo "$sitemap_content" | grep -q "tier1-1.xml"; then
        echo -e "${YELLOW}⚠️  仍然指向 tier1-1.xml（旧版本）${NC}"
    fi
fi
echo ""

# B. 检查 tier1-0 HTTP 头
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "B. 检查 tier1-0.xml HTTP 响应"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

http_status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/sitemaps/tier1-0.xml")
content_type=$(curl -sI "$DOMAIN/sitemaps/tier1-0.xml" | grep -i "content-type" | head -1)

echo "   HTTP Status: $http_status"
echo "   $content_type"

if [ "$http_status" == "200" ]; then
    echo -e "${GREEN}✅ HTTP 200${NC}"
else
    echo -e "${RED}❌ HTTP $http_status${NC}"
fi

if echo "$content_type" | grep -qi "xml"; then
    echo -e "${GREEN}✅ Content-Type 正确${NC}"
else
    echo -e "${RED}❌ Content-Type 异常${NC}"
fi
echo ""

# C. 统计 tier1-0 URL 数量
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "C. 统计 tier1-0.xml URL 数量"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

url_count=$(curl -s "$DOMAIN/sitemaps/tier1-0.xml" | grep -c "<url>" 2>/dev/null || echo "0")
loc_count=$(curl -s "$DOMAIN/sitemaps/tier1-0.xml" | grep -c "<loc>" 2>/dev/null || echo "0")

echo "   <url> 标签数: $url_count"
echo "   <loc> 标签数: $loc_count"

if [ "$url_count" -gt 0 ]; then
    echo -e "${GREEN}✅ tier1-0.xml 包含 $url_count 个 URL${NC}"
else
    echo -e "${RED}❌ tier1-0.xml 为空！${NC}"
fi
echo ""

# D. 抽查 1 个 URL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "D. 抽查 URL 可访问性"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sample_url=$(curl -s "$DOMAIN/sitemaps/tier1-0.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' | head -1)

if [ -n "$sample_url" ]; then
    echo "   抽样 URL: $sample_url"
    sample_status=$(curl -s -o /dev/null -w "%{http_code}" "$sample_url")
    echo "   HTTP Status: $sample_status"
    
    if [ "$sample_status" == "200" ]; then
        echo -e "${GREEN}✅ 抽样 URL 可访问${NC}"
        
        # 检查 canonical
        canonical=$(curl -s "$sample_url" | grep -i 'rel="canonical"' | head -1 | sed 's/.*href="\([^"]*\)".*/\1/')
        if [ -n "$canonical" ]; then
            echo "   Canonical: $canonical"
            if [ "$canonical" == "$sample_url" ]; then
                echo -e "${GREEN}✅ Canonical 指向自己${NC}"
            else
                echo -e "${YELLOW}⚠️  Canonical 指向其他 URL${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ 抽样 URL 返回 $sample_status${NC}"
    fi
else
    echo -e "${RED}❌ 无法提取抽样 URL${NC}"
fi
echo ""

# E. 检查 sitemap-index.xml
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "E. 检查 sitemap-index.xml"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

index_status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/sitemap-index.xml")
echo "   HTTP Status: $index_status"

if [ "$index_status" == "200" ]; then
    index_content=$(curl -s "$DOMAIN/sitemap-index.xml")
    echo "$index_content" | head -15
    echo ""
    
    if echo "$index_content" | grep -q "tier1-0.xml"; then
        echo -e "${GREEN}✅ sitemap-index.xml 指向 tier1-0.xml${NC}"
    else
        echo -e "${YELLOW}⚠️  sitemap-index.xml 可能未更新${NC}"
    fi
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 验证总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if echo "$sitemap_content" | grep -q "tier1-0.xml" && [ "$url_count" -gt 0 ]; then
    echo -e "${GREEN}✅ 修复已生效！${NC}"
    echo ""
    echo "下一步 GSC 操作："
    echo "1. 重新提交 /sitemap.xml"
    echo "2. 额外提交 /sitemaps/tier1-0.xml"
    echo "3. URL Inspection 抽查 2-3 个 tier1 URL → 请求编入索引"
else
    echo -e "${RED}❌ 修复未生效，请检查部署${NC}"
    echo ""
    echo "可能原因："
    echo "1. 部署尚未完成"
    echo "2. CDN 缓存未刷新"
    echo "3. 代码未正确合并"
fi
echo ""
echo "=========================================="
