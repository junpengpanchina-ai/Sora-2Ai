# npm run build 报告

**状态：** 通过  
**Next.js：** 14.2.35  
**环境：** .env.local  

---

## 编译与静态生成

- 编译成功
- Lint 与类型检查通过（有若干 Warning，未阻断构建）
- 静态页生成：202 页
- 中间件：73.3 kB

---

## 构建修复

- **`app/sitemaps/[name]/route.ts`**：删除未使用的 `getBaseUrl` 导入，消除 `@typescript-eslint/no-unused-vars` 错误。

---

## ESLint 警告（未阻断构建）

| 文件 | 规则 | 说明 |
|------|------|------|
| `AdminChatManager.tsx`（2 处） | `react-hooks/exhaustive-deps` | useCallback 缺依赖 `loadSessions` |
| `AdminChatManager.tsx`（2 处） | `@next/next/no-img-element` | 建议用 `next/image` 替代 `<img>` |
| `AdminClient.tsx` | `react-hooks/exhaustive-deps` | useEffect 缺依赖 `OLD_KEY_TO_NEW_URL` |
| `AdminSEOChatManager.tsx`（2 处） | `react-hooks/exhaustive-deps` | useCallback 缺依赖 `loadSessions` |
| `AdminSEOChatManager.tsx`（2 处） | `@next/next/no-img-element` | 建议用 `next/image` 替代 `<img>` |
| `admin/tools/chat/manager/AdminChatManager.tsx` | 同上 | 同上 |
| `admin/tools/seo/chat/AdminSEOChatManager.tsx` | 同上 | 同上 |
| `VideoPageClient.tsx` | `react-hooks/exhaustive-deps` | useEffect 缺依赖 `model` |
| `VeoUpgradeNudge.tsx` | `react-hooks/exhaustive-deps` | useMemo 缺依赖 `props` |

---

## 路由概览

### 页面

| 类型 | 数量 | 说明 |
|------|------|------|
| ○ Static | 若干 | 预渲染静态 |
| ● SSG | 若干 | getStaticProps 预渲染 |
| ƒ Dynamic | 若干 | 按需服务端渲染 |

### 主要路由（节选）

- `/` — 14 kB
- `/sitemap.xml` — 0 B（动态）
- `/sitemaps/[name]` — 0 B（tier1-N.xml 分片）
- `/sitemaps/tier1/[id].xml` — 0 B
- `/sitemaps/tier1-[...n]` — 0 B
- `/use-cases` — 3.59 kB
- `/use-cases/[slug]` — 4.97 kB（SSG，约 10 条预生成）
- `/blog/[slug]` — 20 条
- `/industries/[slug]` — 100 条
- `/keywords/[slug]` — 4.39 kB
- `/compare/[slug]` — 20 条
- `/prompts/[slug]` — 12 条
- `/video` — 16.4 kB
- `/admin/*` — 若干管理端路由

### First Load JS

- 共享：87.5 kB  
  - `chunks/2117-*.js` 31.7 kB  
  - `chunks/fd9d1056-*.js` 53.7 kB  
  - 其余约 2.09 kB  

---

## 小结

- 构建成功，可部署。
- 建议后续处理：`react-hooks/exhaustive-deps`、`@next/next/no-img-element` 等警告，以提升可维护性与性能。
