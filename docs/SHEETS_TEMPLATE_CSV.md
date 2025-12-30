# Index Health Dashboard 表格模板（CSV 格式）

> 可以直接导入 Google Sheets / Excel / 飞书表格

---

## Sheet 1：INDEX_DASHBOARD

```csv
指标,公式/来源,当前值,阈值,状态,行动
Discovered,GSC → Pages → Discovered,,,,
Crawled,GSC → Crawled,,,,
Indexed,GSC → Indexed,,,,
Index Health,=D2/(B2+C2),,≥60%,,
Avg GEO Score,内容系统,,≥80,,
```

**公式列（在 Google Sheets 中设置）**：
- E2: `=IF(D2/(B2+C2)=0,0,D2/(B2+C2))`
- F2: `=IF(E2>=0.6,"健康期",IF(E2>=0.4,"限速期","风险期"))`
- G2: `=IF(E2>=0.6,"✅ 放量",IF(E2>=0.4,"⚠️ 限速","⛔ 暂停"))`

---

## Sheet 2：INDEX_ACTION_MAP

```csv
Index Health,阶段,每日发布量,允许趋势,禁止事项
≥60%,慢吃期,40–80,趋势映射 ≤2,❌ 热搜
40–59%,限速期,20–40,解释型趋势,❌ 专题
<40%,风险期,≤10,不允许,❌ 一切趋势
```

---

## Sheet 3：TREND_PRESSURE_TABLE

```csv
内容类型,Pressure,说明
Evergreen 解释页,0,无趋势压力
行业 × 场景,1,轻微趋势
趋势映射词（非热搜）,2,中等趋势
热搜 / 时效词,4,高风险
```

---

## Sheet 4：DAILY_PUBLISH_PLAN

```csv
日期,行业,场景,内容类型,GEO 分,Pressure,Index Health,是否可发,备注
2025-12-30,Dental,Patient education,Evergreen,85,0,50%,✅,
2025-12-30,E-commerce,Product demo,Trend-mapped,82,2,50%,⚠️,
2025-12-30,Fitness,Short video,Hot topic,78,4,50%,⛔,
```

**公式列（在 Google Sheets 中设置）**：
- H2: `=IF(AND(F2>=80,G2<=2,INDEX_DASHBOARD!E2>=0.4),"✅","⛔")`

---

## Sheet 5：GEO_LAYER

```csv
GEO 分数,等级,是否可发布,说明
≥80,G-A,✅,AI 可引用
60–79,G-B,⚠️,可收录，但少引用
<60,G-C,⛔,填充层
```

---

## Sheet 6：SUPPLIER_CHECK

```csv
供应商建议,对照表,结论,你的回复
"必须追热点",Index Health <60%,❌,"Index Health 过 60% 再说"
"量越大越好",Crawled 未消化,❌,"等 Crawled 消化完"
"Gemini 能抓热搜",Pressure = 4,❌,"Pressure 4 禁止"
"现在不追就晚了",Index Health <60%,❌,"Index Health 过 60% 再说"
```

---

## 📥 导入步骤

### Google Sheets

1. 创建新表格
2. 创建 6 个 Sheet（重命名）
3. 复制对应的 CSV 内容
4. 粘贴到对应 Sheet
5. 设置公式列

### Excel

1. 创建新工作簿
2. 创建 6 个工作表（重命名）
3. 复制对应的 CSV 内容
4. 粘贴到对应工作表
5. 设置公式列

### 飞书表格

1. 创建新表格
2. 创建 6 个 Sheet（重命名）
3. 复制对应的 CSV 内容
4. 粘贴到对应 Sheet
5. 设置公式列

---

## 🔧 公式设置说明

### INDEX_DASHBOARD 表

**E2（Index Health）**：
```
=IF(B2+C2=0,0,D2/(B2+C2))
```

**F2（状态）**：
```
=IF(E2>=0.6,"健康期",IF(E2>=0.4,"限速期","风险期"))
```

**G2（行动）**：
```
=IF(E2>=0.6,"✅ 放量",IF(E2>=0.4,"⚠️ 限速","⛔ 暂停"))
```

### DAILY_PUBLISH_PLAN 表

**H2（是否可发）**：
```
=IF(AND(F2>=80,G2<=2,INDEX_DASHBOARD!E2>=0.4),"✅","⛔")
```

**说明**：
- F2 = GEO 分（必须 ≥80）
- G2 = Pressure（必须 ≤2）
- INDEX_DASHBOARD!E2 = Index Health（必须 ≥40%）

---

## 📋 使用检查清单

- [ ] 已创建 6 个 Sheet
- [ ] 已导入 CSV 数据
- [ ] 已设置公式列
- [ ] 已测试公式是否正确
- [ ] 已设置条件格式（可选）

---

## 💡 提示

- **每天固定时间更新**（建议：早上 9 点）
- **只保留 ✅ 的行**
- **删除 ⛔ 的行，不讨论**
- **Index Health 是刹车，GEO 是发动机**

