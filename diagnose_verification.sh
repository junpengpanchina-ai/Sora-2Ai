#!/bin/bash

echo "=========================================="
echo "Verification Center 无反应 - 完整诊断"
echo "=========================================="
echo ""

DOMAIN="sora2aivideos.com"

echo "1. DNS TXT 记录检查..."
echo "----------------------------------------"
TXT=$(dig TXT $DOMAIN +short 2>/dev/null | grep google-site-verification)
if [ -z "$TXT" ]; then
    # 尝试 nslookup
    TXT=$(nslookup -type=TXT $DOMAIN 2>/dev/null | grep "google-site-verification" | head -1)
fi

if [ -n "$TXT" ]; then
    echo "✅ DNS TXT 记录存在"
    echo "   记录: $TXT"
else
    echo "❌ DNS TXT 记录未找到"
    echo "   请检查 Cloudflare DNS 配置"
fi
echo ""

echo "2. 网站可访问性检查..."
echo "----------------------------------------"
for page in "/" "/privacy" "/terms"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN$page 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        echo "✅ $page: HTTP $STATUS"
    else
        echo "❌ $page: HTTP $STATUS"
        if [ -z "$STATUS" ]; then
            echo "   无法连接到网站"
        fi
    fi
done
echo ""

echo "3. 检查首页是否强制重定向到登录页..."
echo "----------------------------------------"
REDIRECT=$(curl -s -L -o /dev/null -w "%{url_effective}" --max-time 10 https://$DOMAIN/ 2>/dev/null)
if echo "$REDIRECT" | grep -q "/login"; then
    echo "⚠️  首页重定向到登录页: $REDIRECT"
    echo "   这不符合 Google 的要求"
else
    echo "✅ 首页未强制重定向到登录页"
    echo "   最终 URL: $REDIRECT"
fi
echo ""

echo "4. robots.txt 检查..."
echo "----------------------------------------"
ROBOTS=$(curl -s --max-time 10 https://$DOMAIN/robots.txt 2>/dev/null)
if [ -z "$ROBOTS" ]; then
    echo "⚠️  无法获取 robots.txt（可能不存在，这通常没问题）"
elif echo "$ROBOTS" | grep -qi "disallow.*/" && echo "$ROBOTS" | grep -qi "user-agent.*googlebot"; then
    echo "⚠️  robots.txt 可能阻止了 Googlebot"
    echo "   内容预览:"
    echo "$ROBOTS" | head -5
else
    echo "✅ robots.txt 未阻止 Googlebot"
    if [ -n "$ROBOTS" ]; then
        echo "   内容预览:"
        echo "$ROBOTS" | head -3
    fi
fi
echo ""

echo "5. SSL 证书检查..."
echo "----------------------------------------"
SSL_INFO=$(echo | timeout 5 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ -n "$SSL_INFO" ]; then
    echo "✅ SSL 证书有效"
    echo "$SSL_INFO" | head -2
else
    echo "⚠️  SSL 证书检查失败或超时"
fi
echo ""

echo "6. Google 索引检查..."
echo "----------------------------------------"
echo "请在浏览器中访问以下链接检查网站是否被 Google 索引："
echo "https://www.google.com/search?q=site:$DOMAIN"
echo ""

echo "7. Search Console 验证状态..."
echo "----------------------------------------"
echo "请在浏览器中访问："
echo "https://search.google.com/search-console"
echo ""
echo "确认以下信息："
echo "  - 属性类型是 'Domain'（不是 'URL prefix'）"
echo "  - 域名是 '$DOMAIN'（不是 'https://$DOMAIN'）"
echo "  - 验证状态显示为 '已验证' 或 'Verified'"
echo ""

echo "8. OAuth Consent Screen 配置检查..."
echo "----------------------------------------"
echo "请在浏览器中访问："
echo "https://console.cloud.google.com/apis/credentials/consent"
echo ""
echo "确认以下配置："
echo "  ✅ Authorized domains 包含: $DOMAIN"
echo "  ✅ Privacy policy URL: https://$DOMAIN/privacy"
echo "  ✅ Homepage URL: https://$DOMAIN"
echo "  ✅ Application homepage link 指向: https://$DOMAIN"
echo ""

echo "=========================================="
echo "诊断完成"
echo "=========================================="
echo ""
echo "📋 下一步操作："
echo ""
echo "如果所有检查都通过，但 Verification Center 仍无反应："
echo ""
echo "1. ⏰ 等待 24-48 小时"
echo "   - Google 的验证系统更新有延迟"
echo "   - 通常 24-48 小时内会自动更新"
echo ""
echo "2. 🔄 定期检查 Verification Center"
echo "   - 每 4-6 小时检查一次"
echo "   - 使用无痕模式或清除缓存后刷新"
echo ""
echo "3. 📧 如果 48 小时后仍无反应，回复邮件"
echo "   - 找到 Google Trust and Safety 团队的原始邮件"
echo "   - 使用 SUBMIT_FIX_STATUS_GUIDE.md 中的模板回复"
echo ""
echo "4. 📞 或通过 Google Cloud Console 提交支持请求"
echo "   - 访问: https://console.cloud.google.com/support"
echo "   - 选择项目: skilled-acolyte-476516-g8"
echo "   - 选择类别: APIs & Services → OAuth consent screen"
echo ""
echo "📖 详细故障排除指南请参考:"
echo "   VERIFICATION_NO_RESPONSE_TROUBLESHOOTING.md"
echo ""
