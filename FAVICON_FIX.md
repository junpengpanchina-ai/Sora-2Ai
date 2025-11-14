# Favicon 修复说明

## ✅ 已完成的修复

1. **创建了 SVG 图标** - `app/icon.svg`
   - 使用渐变色背景（蓝紫色）
   - 显示字母 "S"（代表 Sora）

2. **更新了 layout.tsx** - 添加了图标配置
   - Next.js 会自动识别 `app/icon.svg`
   - 配置了 metadata.icons

3. **复制到 public 目录** - `public/icon.svg`
   - 确保可以通过 `/icon.svg` 访问

## 🔧 关于 favicon.ico

浏览器默认会请求 `/favicon.ico`，但 Next.js 13+ 使用 `app/icon.svg` 作为图标。

### 当前状态

- ✅ `app/icon.svg` - Next.js 自动识别
- ✅ `public/icon.svg` - 可通过 URL 访问
- ⚠️ `public/favicon.ico` - 目前是占位符文件

### 如果需要真正的 .ico 文件

1. **在线转换工具**
   - 访问 [favicon.io](https://favicon.io/) 或 [realfavicongenerator.net](https://realfavicongenerator.net/)
   - 上传 `app/icon.svg`
   - 下载生成的 `favicon.ico`
   - 替换 `public/favicon.ico`

2. **使用 ImageMagick**（如果已安装）
   ```bash
   convert app/icon.svg -resize 32x32 public/favicon.ico
   ```

3. **忽略警告**（推荐）
   - favicon.ico 的 404 错误不影响功能
   - 现代浏览器会使用 SVG 图标
   - 可以忽略这个警告

## 📝 验证

刷新浏览器后：
- ✅ 浏览器标签页应该显示图标
- ✅ 控制台不再有 favicon.ico 404 错误（或错误减少）
- ✅ 图标显示为蓝紫色渐变背景的 "S"

## 💡 提示

如果仍然看到 favicon.ico 404 错误：
1. 清除浏览器缓存
2. 硬刷新页面（Cmd+Shift+R 或 Ctrl+Shift+R）
3. 或者忽略这个警告（不影响功能）





