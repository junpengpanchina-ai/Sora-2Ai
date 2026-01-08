#!/bin/bash
# 快速添加圣诞节背景音乐的脚本

echo "🎵 圣诞节背景音乐添加工具"
echo "================================"
echo ""

# 检查目标目录是否存在
TARGET_DIR="public/sounds"
if [ ! -d "$TARGET_DIR" ]; then
    echo "创建目录: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
fi

# 检查文件是否已存在
if [ -f "$TARGET_DIR/christmas-bgm.mp3" ]; then
    echo "⚠️  文件已存在: $TARGET_DIR/christmas-bgm.mp3"
    read -p "是否覆盖? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消。"
        exit 1
    fi
fi

# 提示用户输入文件路径
echo "请提供音乐文件的完整路径："
echo "（例如：~/Downloads/christmas-song.mp3 或 /Users/yourname/Desktop/music.mp3）"
read -p "文件路径: " SOURCE_FILE

# 展开 ~ 路径
SOURCE_FILE="${SOURCE_FILE/#\~/$HOME}"

# 检查源文件是否存在
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ 错误: 文件不存在: $SOURCE_FILE"
    echo ""
    echo "💡 提示："
    echo "1. 确保路径正确（可以使用 Tab 键自动补全）"
    echo "2. 如果文件在 Finder 中，可以拖拽文件到终端"
    echo "3. 或者在 Finder 中右键点击文件 → 显示简介 → 复制路径"
    exit 1
fi

# 复制文件
echo "正在复制文件..."
cp "$SOURCE_FILE" "$TARGET_DIR/christmas-bgm.mp3"

if [ $? -eq 0 ]; then
    echo "✅ 成功！文件已复制到: $TARGET_DIR/christmas-bgm.mp3"
    
    # 显示文件信息
    FILE_SIZE=$(ls -lh "$TARGET_DIR/christmas-bgm.mp3" | awk '{print $5}')
    echo "📦 文件大小: $FILE_SIZE"
    
    echo ""
    echo "🎄 完成！现在可以测试圣诞节主题了："
    echo "   1. 运行: npm run dev"
    echo "   2. 访问: http://localhost:3000/video"
    echo "   3. 选择主题: Christmas 🎄"
else
    echo "❌ 复制失败！"
    exit 1
fi







