## Sora2Ai 首屏视觉 PRD（V2 · 系统感 × 社交感 × 视觉盛宴）

> **一句话定位**：Sora2Ai =「已经被很多人用」的 AI 视频系统。  
> 首屏只做一件事：**让用户 3 秒内相信「这里能产出我想要的视频」并开始生成。**

---

## 1. 全局层（产品气质 & 版式）

### 1.1 设计目标（全局）

- **与时俱进但不过前**：2026 年的 Quiet Modern，而不是 2023 SaaS。  
- **系统感优先**：像控制台，而不是 Landing Page。  
- **社交感点缀**：显然有真实使用痕迹，但不变成“社区”。

### 1.2 全局视觉原则

- **用色**：80–90% 深色中性（`--bg`, `--surface`），10–20% 品牌蓝/渐变，仅用于动作点（按钮、焦点）。  
- **排版**：  
  - 页面：`SELL → SHOW → EXPLAIN` 三段式：  
    - SELL：首屏 Hero（价值 + 输入 + Examples）。  
    - SHOW：结果 / 案例 / 模板。  
    - EXPLAIN：Pricing / FAQ / 合规。  
- **动效**：只用于入场 & 状态，不负责“炫”。

---

## 2. 首屏 Hero：结构与文案

### 2.1 信息结构

- 左列：**系统说明 & 操作入口**  
  - H1（支持 A/B）  
  - 副标题  
  - 证据条（3 点）  
  - 信任锚点一句话  
  - Prompt 输入 + 主按钮 + 次按钮  
- 右列：**Examples 结果墙（6 卡）**  
  - 标题：`Start with an example (recommended)`  
  - 副文案：一行操作说明  
  - 2×3 网格：6 张不同类型、可直接使用的结果卡

### 2.2 文案基调

- 像「系统状态」而非营销文案：  
  - 例：`Video generation is online.` / `Turn prompts into production-ready videos.`  
- 副标题说明方式：**成本模型 + 效率**（预付 credits / 无订阅 / from prompt to video in minutes）。  
- 信任锚点：**简短、定性**，例如：  
  `Used by creators, marketers, and indie teams worldwide.`

---

## 3. Examples：全局规范

### 3.1 角色与配比（始终保持）

首屏 6 卡永远包含 6 种“使用场景”，对应 6 种用户：

1. **Social**：玩梗 / 短视频 / 社交内容  
2. **E-commerce**：卖货 / 广告 / 电商素材  
3. **Business**：讲解 / 教程 / 企业宣传  
4. **Real estate**：房产 / 空间 / 场地展示  
5. **Food**：美食 / 生活方式 / 小红书风格  
6. **Creative**：风格化作品 / 上限展示

> 这 6 种 = **功能面** × **人群面** 的最小闭环。  
> 任一更新批次，配比不能被打破（例如不能 3 张都只是“电影感风景”）。

### 3.2 横竖比例（内容心智）

| 类型       | 比例    | 用户心智                    |
|------------|---------|-----------------------------|
| Social     | 9:16    | 明显像 TikTok / Reels      |
| E-commerce | 4:5/9:16| 像电商 feed / 信息流广告    |
| Business   | 9:16    | 讲解视频主流                |
| Real estate| 16:9    | 房产带看的“横屏走动视角”    |
| Food       | 9:16    | 短视频美食传播场景是竖屏    |
| Creative   | 16:9    | 像电影 / 作品级画面         |

当前 6 卡布局（行从上到下，列从左到右）：

- 第一行：`Social` | `E-commerce`  
- 第二行：`Business` | `Real estate`  
- 第三行：`Food` | `Creative`

---

## 4. Examples：局部渲染规范（卡片级）

### 4.1 数据结构（实现）

文件：`lib/examples.ts`

```ts
export type ExampleRatio = '9:16' | '4:5' | '16:9'

export type ExampleTag =
  | 'Social'
  | 'E-commerce'
  | 'Business'
  | 'Real estate'
  | 'Food'
  | 'Creative'

export type HeroExample = {
  id: string
  title: string
  tag: ExampleTag         // 场景分类
  prompt: string          // 真实可用 prompt
  ratio: ExampleRatio     // 用于渲染容器比例
  thumbnail: string       // 静态缩略图路径
}

export const HERO_EXAMPLES: HeroExample[] = [
  // 6 条已实现：POV meme sign / Skincare demo ad / Friendly explainer /
  // Apartment walkthrough / Ramen steam close-up / Rainy umbrella scene
]
```

### 4.2 选图硬标准（适用于任何新版）

**每张封面必须同时满足：**

1. **单帧成立**：截成 JPG 发给别人，不解释也看得懂。  
2. **主体 ≥ 60%**：人 / 商品 / 空间 / 梗点明显压住画面。  
3. **有人类信号**：至少一个——脸、手、房间、桌面、包装、手机 UI 等。  
4. **灰度可读**：转成灰度仍有层次，不是一团灰。  
5. **不像演示图**：  
   - 不以纯渐变、抽象图形、emoji / icon 作为主体。  
   - 不只是「模型很强」而是「这帧已经能拿去用」。

> 若有 ≥2 条不满足：**不能上首页，只能放在下游页面或废弃。**

---

## 5. Examples：前端渲染细节

### 5.1 样式规则（缩略图）

`app/globals.css` 中的规范：

```css
.example-thumb {
  width: 100%;
  border-radius: var(--r-md);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
}

.ratio-9x16 { aspect-ratio: 9 / 16; }
.ratio-4x5  { aspect-ratio: 4 / 5; }
.ratio-16x9 { aspect-ratio: 16 / 9; }

.example-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 35%;  /* 竖图主体偏上，避免裁掉脸 */
  transform: scale(1.01);    /* 解决 1px 边缘空隙 */
  transition: transform 200ms ease;
}

.card-hover:hover .example-thumb img {
  transform: scale(1.03);
}
```

### 5.2 组件级渲染（`HeroV2.tsx`）

- 使用 `HERO_EXAMPLES` 作为唯一真源。  
- 根据 `ratio` 选择 `.ratio-*` 类。  
- 使用 `<img>`（未来可迁移为 `next/image`）。

---

## 6. 埋点 & 反馈闭环

### 6.1 事件：`example_click`

**触发位置**：Hero 右侧 6 卡点击时。  
**行为**：

1. 将对应 `prompt` 写入左侧输入框。  
2. 发一个轻量埋点到 `/api/events`：

```json
{
  "event": "example_click",
  "source": "home_hero",
  "example_id": "<ex.id>",
  "ratio": "<ex.ratio>",
  "anon_id": "<可选，前端生成>"
}
```

### 6.2 服务端：`/api/events`

- 避免在没有 `SUPABASE_URL` 时导致构建失败：  
  - 使用惰性初始化 `createClient`，若 env 缺失则直接返回 `supabase_not_configured`，不抛异常。  
- 仅允许白名单事件：`example_click / hero_generate_click / generation_started`。  
- 将数据写入 `public.event_logs (event, source, user_id, properties)`。

### 6.3 分析视图

Supabase 视图（均已通过迁移创建）：

- `v_example_clicks_24h`：过去 24 小时  
- `v_example_clicks_today`：当天  
- `v_example_clicks_7d`：过去 7 天  
- `v_example_clicks_alltime`：全时期  

每个视图输出：

- `example_id`  
- `ratio`  
- `clicks_xx`（对应时间窗内点击数）  
- `unique_actors_xx`（按 `user_id` + `anon_id` 粗略去重）  
- `last_clicked_at`

> 运营 / 增长可以直接用这些视图做「哪张卡保留、哪张换掉」的决策。

---

## 7. Examples 更新 SOP（团队执行视角）

> 全局目标：**2–4 周更换 2 张卡，但整体气质不跑偏。**

### 7.1 周期与节奏

1. **每 2–4 周**：挑一个时间窗口看 `v_example_clicks_7d`。  
2. 找出点击和 unique 都显著较低的 **1–2 个 example_id**，列为「待替换」。  
3. 按对应类型（Social/E-com/...）生成新候选，完成一轮替换。

### 7.2 操作步骤

1. **选类型**：  
   - 不动配比，只替换其中 1–2 个表现差的类型。  
2. **生成候选**：  
   - 每个类型用规范 prompt 生成 6–10 条视频。  
3. **截帧 & 筛选**：  
   - 应用 5 条硬标准，初筛掉大部分。  
4. **最终挑选**：  
   - 在剩余帧中选择「最像平台真实内容」的 1 帧。  
5. **落地到代码**：  
   - 更新 `lib/examples.ts` 中对应条目的 `thumbnail + prompt`。  
   - 保持 `id / tag / ratio` 不变或仅小改（有迁移时需更新 Supabase 报表解读）。  
6. **观察回归**：  
   - 部署后，1–2 周内再次查看 24h / 7d 榜单，比较新旧版本表现。

### 7.3 命名规范

- 不允许：`Product hero shot`, `Anime close-up` 等**功能分类**式名字。  
- 建议：`Skincare demo ad`, `POV meme sign`, `Apartment tour clip` 等**内容标题**。  
- 标题长度：**控制在 2–4 个词**，优先动作和对象（`Ramen steam close-up`）。

---

## 8. 验收 Checklist（设计 & 实现）

- **视觉层**  
  - [ ] 首屏 6 卡中没有任何渐变 + emoji / icon 占位作为主体。  
  - [ ] 每张封面单帧成立、主体清晰、灰度可读。  
  - [ ] 至少 4 张卡中含有人物或生活场景。  

- **实现层**  
  - [ ] `HeroV2` 只依赖 `HERO_EXAMPLES`，不再有内联示例数组。  
  - [ ] `.example-thumb` + `ratio-*` 生效，竖屏不变形、主体不被裁没。  
  - [ ] `/api/events` 在本地无 Supabase env 时不会阻塞构建。  

- **数据层**  
  - [ ] `event_logs` 表存在，且能收到 `example_click` 事件。  
  - [ ] `v_example_clicks_7d` 能查询出最近一周的点击分布。  

