#!/bin/bash

echo "=========================================="
echo "Google OAuth 修复状态验证脚本"
echo "=========================================="
echo ""

# 设置域名
DOMAIN="sora2aivideos.com"

echo "1. 检查 DNS TXT 记录（域名所有权验证）..."
echo "----------------------------------------"
TXT_RECORDS=$(dig TXT $DOMAIN +short 2>/dev/null)
if [ -z "$TXT_RECORDS" ]; then
    # 如果 dig 不可用，尝试 nslookup
    TXT_RECORDS=$(nslookup -type=TXT $DOMAIN 2>/dev/null | grep "google-site-verification" || echo "")
fi

if echo "$TXT_RECORDS" | grep -q "google-site-verification"; then
    echo "✅ 找到 Google Search Console 验证记录"
    echo "$TXT_RECORDS" | grep "google-site-verification" | head -1
else
    echo "❌ 未找到 Google Search Console 验证记录"
    echo "请检查 Cloudflare DNS 配置"
    echo "提示：运行 'nslookup -type=TXT $DOMAIN' 查看所有 TXT 记录"
fi
echo ""

echo "2. 检查网站可访问性..."
echo "----------------------------------------"
echo "检查首页..."
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN/ 2>/dev/null)
if [ "$HOME_STATUS" = "200" ]; then
    echo "✅ 首页可访问 (HTTP $HOME_STATUS)"
else
    echo "❌ 首页访问异常 (HTTP $HOME_STATUS)"
    if [ -z "$HOME_STATUS" ]; then
        echo "   无法连接到网站，请检查域名配置"
    fi
fi

echo "检查隐私政策页面..."
PRIVACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN/privacy 2>/dev/null)
if [ "$PRIVACY_STATUS" = "200" ]; then
    echo "✅ 隐私政策页面可访问 (HTTP $PRIVACY_STATUS)"
else
    echo "❌ 隐私政策页面访问异常 (HTTP $PRIVACY_STATUS)"
fi

echo "检查服务条款页面..."
TERMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN/terms 2>/dev/null)
if [ "$TERMS_STATUS" = "200" ]; then
    echo "✅ 服务条款页面可访问 (HTTP $TERMS_STATUS)"
else
    echo "❌ 服务条款页面访问异常 (HTTP $TERMS_STATUS)"
fi
echo ""

echo "3. 检查网站是否强制重定向到登录页..."
echo "----------------------------------------"
REDIRECT=$(curl -s -L -o /dev/null -w "%{url_effective}" --max-time 10 https://$DOMAIN/ 2>/dev/null)
if echo "$REDIRECT" | grep -q "/login"; then
    echo "⚠️  网站可能重定向到登录页: $REDIRECT"
    echo "   这不符合 Google 的要求（首页应公开可访问）"
else
    echo "✅ 首页未强制重定向到登录页"
    echo "   最终 URL: $REDIRECT"
fi
echo ""

echo "4. 检查 SSL 证书..."
echo "----------------------------------------"
SSL_INFO=$(echo | timeout 5 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ -n "$SSL_INFO" ]; then
    echo "✅ SSL 证书有效"
    echo "$SSL_INFO" | head -2
else
    echo "⚠️  SSL 证书检查失败或超时"
fi
echo ""

echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "📋 下一步操作："
echo "1. 访问 Google Cloud Console → Verification Center"
echo "   链接: https://console.cloud.google.com/apis/credentials/consent"
echo ""
echo "2. 确认所有项目都显示为已通过："
echo "   ✅ 隐私权政策要求"
echo "   ✅ 品牌推广指南"
echo "   ✅ 首页要求（应该不再是红色）"
echo ""
echo "3. 回复 Google Trust and Safety 团队的邮件"
echo "   邮件模板请参考: SUBMIT_FIX_STATUS_GUIDE.md"
echo ""
echo "4. 如果 Verification Center 仍显示问题，请等待几分钟后刷新页面"
echo "   系统更新可能需要一些时间"
echo ""
