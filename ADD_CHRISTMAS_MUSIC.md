# 🎵 添加圣诞节背景音乐 - 快速指南

## 📍 文件位置

将音乐文件放置到：
```
public/sounds/christmas-bgm.mp3
```

## 🚀 快速步骤

### 方法 1: 使用命令行（如果已有音乐文件）

```bash
# 将你的音乐文件复制到指定位置
cp /path/to/your/christmas-music.mp3 public/sounds/christmas-bgm.mp3

# 或者移动文件
mv /path/to/your/christmas-music.mp3 public/sounds/christmas-bgm.mp3
```

### 方法 2: 使用文件管理器

1. 找到你的圣诞音乐文件
2. 重命名为 `christmas-bgm.mp3`
3. 复制或移动到 `public/sounds/` 目录下

### 方法 3: 下载免费音乐

#### 选项 A: Pixabay（推荐，无版权）

1. 访问：https://pixabay.com/music/search/christmas/
2. 选择一个免费的音乐
3. 下载 MP3 格式
4. 重命名为 `christmas-bgm.mp3`
5. 放置到 `public/sounds/` 目录

#### 选项 B: Freesound.org

1. 访问：https://freesound.org/search/?q=christmas+music
2. 筛选 "Attribution License" 或 "CC0"（免费商用）
3. 下载 MP3 文件
4. 重命名为 `christmas-bgm.mp3`
5. 放置到 `public/sounds/` 目录

## ✅ 验证文件已添加

运行以下命令检查文件是否存在：

```bash
ls -lh public/sounds/christmas-bgm.mp3
```

如果文件存在，你应该看到类似这样的输出：
```
-rw-r--r--  1 user  staff   2.5M Dec 11 13:45 public/sounds/christmas-bgm.mp3
```

## 🎨 文件要求

- **文件名**：必须精确为 `christmas-bgm.mp3`（区分大小写）
- **格式**：MP3（其他格式需要转换）
- **大小**：建议 1-5MB（过大会影响加载速度）
- **时长**：建议 2-5 分钟（会自动循环播放）
- **版权**：确保使用免费或已获授权的音乐

## 🧪 测试音乐播放

1. 启动开发服务器：`npm run dev`
2. 访问：`http://localhost:3000/video`
3. 在表单中选择 "Theme Style" → "Christmas 🎄"
4. 应该能听到背景音乐播放

## ⚠️ 浏览器自动播放限制

现代浏览器可能阻止自动播放音频。如果音乐没有自动播放：

1. **与页面交互**：点击页面任意位置或按任意键
2. **查看控制台**：打开开发者工具（F12），查看是否有错误信息
3. **检查文件路径**：确认文件路径正确，可以通过浏览器直接访问：
   ```
   http://localhost:3000/sounds/christmas-bgm.mp3
   ```

## 🔍 故障排除

### 音乐不播放？

1. **检查文件是否存在**：
   ```bash
   ls public/sounds/christmas-bgm.mp3
   ```

2. **检查文件路径**：在浏览器中访问：
   ```
   http://localhost:3000/sounds/christmas-bgm.mp3
   ```
   如果能够下载或播放，说明路径正确。

3. **检查浏览器控制台**：按 F12 打开开发者工具，查看 Console 标签是否有错误。

4. **检查文件格式**：确保是有效的 MP3 文件：
   ```bash
   file public/sounds/christmas-bgm.mp3
   ```

### 文件格式不对？

如果文件不是 MP3 格式，需要转换：

**使用 ffmpeg（如果已安装）**：
```bash
ffmpeg -i input-file.mp4 -vn -acodec libmp3lame -ab 192k public/sounds/christmas-bgm.mp3
```

**在线转换工具**：
- https://cloudconvert.com/
- https://convertio.co/zh/

## 📝 注意事项

- ⚠️ **版权问题**：确保使用的音乐是免费或已获得使用许可
- ✅ **Git 跟踪**：`public/sounds/.gitkeep` 文件确保目录被 Git 跟踪，但音乐文件本身建议添加到 `.gitignore`（如果文件较大）
- 🔊 **音量设置**：代码中默认音量设置为 30%，可以在 `VideoPageClient.tsx` 中调整

## 🎄 完成！

添加音乐文件后，圣诞节主题功能就完整了！

享受你的圣诞节主题视频生成页面吧！🎉





