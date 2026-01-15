#!/bin/bash

echo "🔍 快速检查 OAuth 审核状态"
echo "=========================================="
echo ""

DOMAIN="sora2aivideos.com"

echo "1. Verification Center 状态检查"
echo "----------------------------------------"
echo "请在浏览器中访问："
echo "   https://console.cloud.google.com/apis/credentials/consent"
echo ""
echo "   点击左侧菜单：'验证中心' 或 'Verification Center'"
echo "   查看'首页要求'状态："
echo "   - ✅ 绿色 = 已通过审核"
echo "   - ⏳ 黄色 = 正在审核中"
echo "   - ❌ 红色 = 仍有问题"
echo ""

echo "2. Publishing Status 检查"
echo "----------------------------------------"
echo "在同一页面查看 'Publishing status'："
echo "   - 'In production' = ✅ 已发布，所有用户可用"
echo "   - 'Testing' = ⚠️  测试模式，只有 Test users 可用"
echo ""

echo "3. 网站配置快速检查"
echo "----------------------------------------"
echo "检查网站可访问性："

HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://$DOMAIN/ 2>/dev/null)
PRIVACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://$DOMAIN/privacy 2>/dev/null)
TERMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://$DOMAIN/terms 2>/dev/null)

if [ "$HOME_STATUS" = "200" ]; then
    echo "   ✅ 首页: HTTP $HOME_STATUS"
else
    echo "   ❌ 首页: HTTP ${HOME_STATUS:-无法连接}"
fi

if [ "$PRIVACY_STATUS" = "200" ]; then
    echo "   ✅ Privacy Policy: HTTP $PRIVACY_STATUS"
else
    echo "   ❌ Privacy Policy: HTTP ${PRIVACY_STATUS:-无法连接}"
fi

if [ "$TERMS_STATUS" = "200" ]; then
    echo "   ✅ Terms of Service: HTTP $TERMS_STATUS"
else
    echo "   ❌ Terms of Service: HTTP ${TERMS_STATUS:-无法连接}"
fi
echo ""

echo "4. OAuth Consent Screen 配置检查"
echo "----------------------------------------"
echo "在同一页面 → '品牌塑造' (Branding) 检查："
echo "   - 应用隐私权政策链接应该是: https://$DOMAIN/privacy"
echo "   - 应用服务条款链接应该是: https://$DOMAIN/terms"
echo "   - 已获授权的网域应该包含: $DOMAIN"
echo ""

echo "5. 实际登录测试（推荐）"
echo "----------------------------------------"
echo "1. 打开浏览器无痕窗口"
echo "2. 访问: https://$DOMAIN/login"
echo "3. 尝试使用 Google 登录"
echo "4. 如果成功登录 → ✅ 审核已通过"
echo "   如果显示错误 → ⚠️  可能还在审核中"
echo ""

echo "=========================================="
echo "检查完成"
echo "=========================================="
echo ""
echo "📋 判断标准："
echo ""
echo "✅ 如果 Verification Center 显示绿色，且网站返回 200："
echo "   → 审核已通过或正在进行中"
echo ""
echo "⏳ 如果 Verification Center 显示黄色："
echo "   → 审核正在进行中，等待 24-48 小时"
echo ""
echo "❌ 如果 Verification Center 显示红色："
echo "   → 仍有问题，检查配置或等待系统更新"
echo ""
