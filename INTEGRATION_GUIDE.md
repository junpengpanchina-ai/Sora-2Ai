# Veo 智能提示集成指南

## 📋 已创建的文件

### 核心逻辑
- ✅ `lib/growth/ab.ts` - A/B 测试分桶
- ✅ `lib/growth/frequency.ts` - 频控逻辑
- ✅ `lib/growth/track.ts` - 埋点追踪
- ✅ `lib/growth/veoIntent.ts` - 触发点评分

### 组件
- ✅ `components/growth/VeoNudgeInline.tsx` - Veo 提示组件
- ✅ `components/growth/veoNudgeCopy.ts` - A/B 文案

### API
- ✅ `app/api/track/route.ts` - 追踪 API

## 🔧 集成步骤

### Step 1: 在 VideoPageClient.tsx 中添加状态

在组件顶部添加：

```typescript
const [timeOnResultSec, setTimeOnResultSec] = useState(0)
const [didDownloadOrShare, setDidDownloadOrShare] = useState(false)
const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
const [soraGenerationsSession, setSoraGenerationsSession] = useState(0)
const [userId, setUserId] = useState<string | undefined>(undefined)
```

### Step 2: 获取用户 ID

在 `useEffect` 中：

```typescript
useEffect(() => {
  if (typeof window === 'undefined') return
  const client = createClient()
  setSupabase(client)
  
  // Get user ID for tracking
  client.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      setUserId(user.id)
    }
  }).catch(() => {})
}, [])
```

### Step 3: 追踪时间

在成功结果显示时：

```typescript
{currentResult.status === 'succeeded' && currentResult.video_url && (
  <>
    {useEffect(() => {
      if (currentResult.status === 'succeeded') {
        const startTime = Date.now()
        const interval = setInterval(() => {
          setTimeOnResultSec(Math.floor((Date.now() - startTime) / 1000))
        }, 1000)
        return () => clearInterval(interval)
      }
    }, [currentResult.status])}
    
    {/* 视频显示 */}
  </>
)}
```

### Step 4: 追踪下载/分享

在下载按钮的 `onClick` 中：

```typescript
onClick={async (e) => {
  e.preventDefault()
  setDidDownloadOrShare(true) // 添加这行
  // ... 原有下载逻辑
}}
```

### Step 5: 在成功结果后添加组件

在 `SoraToVeoGuide` 后面添加：

```typescript
{model === 'sora-2' && (
  <>
    <SoraToVeoGuide ... />
    
    <VeoNudgeInline
      userId={userId}
      sessionId={sessionId}
      input={{
        userPlan: hasRechargeRecords ? 'pro' : (credits !== null && credits <= 30 ? 'starter' : 'free'),
        hasVeoAccess: false, // TODO: 从 API 获取
        soraGenerations7d: 0, // TODO: 从 API 获取
        soraGenerationsSession: soraGenerationsSession,
        lastGenSucceeded: true,
        queueOrSlow: false,
        timeOnResultSec: timeOnResultSec,
        didDownloadOrShare: didDownloadOrShare,
        contentHints: {
          wantsHighFidelity: true,
        },
        starterQuota7d: 15,
      }}
      payload={{
        prompt: currentResult.prompt,
        aspect: aspectRatio,
      }}
    />
  </>
)}
```

### Step 6: 在提交时更新统计

在 `handleSubmit` 中：

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setTimeOnResultSec(0)
  setDidDownloadOrShare(false)
  
  if (model === 'sora-2') {
    setSoraGenerationsSession(prev => prev + 1)
  }
  
  // ... 原有逻辑
}
```

## 📊 待完善的数据

以下数据需要从 API 获取：

1. **hasVeoAccess**: 从用户状态 API 获取
2. **soraGenerations7d**: 从使用统计 API 获取
3. **queueOrSlow**: 从生成时间判断（> 30 秒 = slow）

## 🎯 验收指标

监控以下埋点：

1. `veo_nudge_shown` - 展示量
2. `veo_nudge_click` - 点击率（目标：3%–8%）
3. `veo_nudge_dismiss` - 关闭率（< 70% 为正常）
4. `veo_generate` - Veo 使用占比（目标：≥ 20%）

## 💡 关键提示

- 组件会自动处理频控（每天最多 2 次）
- A/B 测试会自动分配变体
- 所有事件都会自动追踪
- 组件只在满足触发条件时显示

