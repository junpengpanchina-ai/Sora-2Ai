#!/bin/bash

# ============================================
# 使用 Docker 执行批量更新（无需安装 psql）
# ============================================
# 使用方法：
# 1. 确保已安装 Docker
# 2. 运行: bash scripts/run-batch-update-with-docker.sh
# ============================================

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 使用 Docker 执行批量更新（无需安装 psql）...${NC}\n"

# ============================================
# 步骤 1: 检查 Docker
# ============================================

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo ""
    echo "安装方法："
    echo "  macOS: https://www.docker.com/products/docker-desktop"
    echo "  Ubuntu: sudo apt-get install docker.io"
    exit 1
fi

echo -e "${GREEN}✅ Docker 已安装${NC}\n"

# ============================================
# 步骤 2: 获取连接信息
# ============================================

if [ -f .env.local ]; then
    source .env.local
fi

if [ -z "$SUPABASE_DB_HOST" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  请输入数据库连接信息：${NC}"
    echo ""
    echo "从 Supabase Dashboard 获取："
    echo "  Settings → Database → Connection string"
    echo ""
    read -p "数据库主机 (例如: db.xxx.supabase.co): " SUPABASE_DB_HOST
    read -p "数据库密码: " -s SUPABASE_DB_PASSWORD
    echo ""
    read -p "数据库用户 (默认: postgres): " SUPABASE_DB_USER
    SUPABASE_DB_USER=${SUPABASE_DB_USER:-postgres}
    read -p "数据库名称 (默认: postgres): " SUPABASE_DB_NAME
    SUPABASE_DB_NAME=${SUPABASE_DB_NAME:-postgres}
fi

SUPABASE_DB_USER=${SUPABASE_DB_USER:-postgres}
SUPABASE_DB_NAME=${SUPABASE_DB_NAME:-postgres}
SUPABASE_DB_PORT=${SUPABASE_DB_PORT:-5432}

CONNECTION_STRING="postgresql://${SUPABASE_DB_USER}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}"

echo -e "${GREEN}✅ 连接信息已设置${NC}"
echo "  主机: ${SUPABASE_DB_HOST}"
echo "  用户: ${SUPABASE_DB_USER}"
echo "  数据库: ${SUPABASE_DB_NAME}"
echo ""

# ============================================
# 步骤 3: 测试连接
# ============================================

echo -e "${YELLOW}🔍 测试数据库连接...${NC}"
if docker run -it --rm postgres psql "$CONNECTION_STRING" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 连接成功${NC}\n"
else
    echo -e "${RED}❌ 连接失败，请检查连接信息${NC}"
    exit 1
fi

# ============================================
# 步骤 4: 执行批量更新
# ============================================

SQL_FILE="database/migrations/batch_update_purchase_intent_ultra_safe.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ SQL 文件不存在: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}📝 执行 SQL 文件: $SQL_FILE${NC}"
echo -e "${YELLOW}⏳ 这可能需要 5-10 分钟，请耐心等待...${NC}\n"

# 获取当前目录的绝对路径
CURRENT_DIR=$(pwd)

# 使用 Docker 执行 SQL 文件
docker run -it --rm \
  -v "${CURRENT_DIR}:/workspace" \
  -w /workspace \
  postgres \
  psql "$CONNECTION_STRING" \
  -f "$SQL_FILE"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 批量更新完成！${NC}\n"
    
    # ============================================
    # 步骤 5: 验证结果
    # ============================================
    
    echo -e "${YELLOW}📊 验证更新结果...${NC}\n"
    
    docker run -it --rm \
      -v "${CURRENT_DIR}:/workspace" \
      -w /workspace \
      postgres \
      psql "$CONNECTION_STRING" <<EOF
-- 检查剩余数量
SELECT 
  COUNT(*) as remaining,
  ROUND(COUNT(*) / 1000.0) as estimated_batches_left
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent = 0;

-- 查看已更新的分布
SELECT 
  purchase_intent,
  layer,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM page_meta
WHERE page_type = 'use_case'
  AND status = 'published'
  AND purchase_intent > 0
GROUP BY purchase_intent, layer
ORDER BY purchase_intent DESC, layer;
EOF
    
    echo ""
    echo -e "${GREEN}🎉 完成！${NC}"
else
    echo ""
    echo -e "${RED}❌ 执行失败，退出代码: $EXIT_CODE${NC}"
    exit $EXIT_CODE
fi

