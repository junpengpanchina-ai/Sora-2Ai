# 环境变量配置修复

## 问题

`GRSAI_API_KEY` 环境变量未配置，导致 API 调用失败。

## 已修复

已更新 `.env.local` 文件，取消注释并设置了测试 API Key：

```env
GRSAI_API_KEY=sk-bd625bca604243989a7018a67614c889
GRSAI_HOST=https://grsai.dakka.com.cn
```

## 下一步

**重要**: 需要重启开发服务器才能加载新的环境变量！

1. **停止当前开发服务器**
   - 在终端按 `Ctrl+C`

2. **重新启动开发服务器**
   ```bash
   npm run dev
   ```

3. **等待服务器完全启动**
   - 看到 `✓ Ready` 消息后再访问页面

4. **测试功能**
   - 访问 `http://localhost:3000/video`
   - 尝试生成一个视频任务

## 验证

重启服务器后，检查终端输出应该没有错误，并且可以正常调用 API。

## 注意事项

- 当前使用的是**测试 API Key**: `sk-bd625bca604243989a7018a67614c889`
- 上线前需要替换为**生产环境的 API Key**
- `.env.local` 文件不会被提交到 Git（已在 `.gitignore` 中）

