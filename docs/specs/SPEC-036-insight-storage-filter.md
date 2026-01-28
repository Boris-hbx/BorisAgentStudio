# SPEC-036: 洞察数据存储与多维筛选

> 作者: Boris Huai
> 起草日期: 2026-01-28
> 状态: 实施中

## 问题陈述 (Why)

1. **数据丢失风险**：当前每次 /insight 覆盖 latest.json，历史数据丢失
2. **主题切换繁琐**：只能查看单个主题，无法对比或合并
3. **时效性不明确**：无法区分今天的新内容和一周前的内容

## 目标与成功标准 (DoD)

| # | 验收标准 | 优先级 |
|---|----------|--------|
| 1 | 洞察数据按日期存储（历史可追溯） | P0 |
| 2 | /insight 执行所有启用的主题 | P0 |
| 3 | 顶部主题多选框实现（支持单选/多选） | P0 |
| 4 | 时间筛选器实现（今天/一周内/近一个月） | P0 |
| 5 | 筛选结果正确合并显示 | P0 |

## 非目标 (Out of Scope)

- 后端数据库（保持文件方案）
- 跨设备同步
- 数据分析报表
- 无限历史（只保留 30 天）

## 技术方案 (How)

### 1. 数据存储结构

```
data/insights/{topic}/
├── latest.json           # 最新数据
├── 2026-01-28.json       # 当天快照
├── 2026-01-27.json       # 历史数据
└── ...

frontend/public/data/insights/{topic}/
├── latest.json           # 同步
├── 2026-01-28.json
└── ...
```

**命名规范**：`{YYYY-MM-DD}.json`

### 2. /insight 命令更新

执行 `/insight` 时：

```
1. 读取 topics.json，获取所有 enabled: true 的主题
2. 对每个主题：
   a. 执行搜索（项目、人物、组织、事件）
   b. 保存为 data/insights/{topic}/{日期}.json
   c. 复制为 data/insights/{topic}/latest.json
   d. 同步到 frontend/public/data/insights/{topic}/
3. 输出执行摘要
```

### 3. 前端数据加载

```typescript
// insightService.ts 新增

/** 时间范围类型 */
type TimeRange = 'today' | 'week' | 'month'

/** 获取日期范围内的数据文件列表 */
function getDateRange(range: TimeRange): string[] {
  const dates: string[] = []
  const today = new Date()
  const days = range === 'today' ? 1 : range === 'week' ? 7 : 30

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

/** 加载多主题多日期的数据并合并 */
async function getFilteredInsightData(
  topicIds: string[],
  timeRange: TimeRange
): Promise<InsightData>
```

### 4. 数据合并策略

多个数据源合并时：
- **项目**：按 `name` 去重，保留最新的
- **人物**：按 `name + quote.date` 去重
- **组织**：按 `name` 去重
- **事件**：按 `name + date` 去重
- **排序**：按相关日期倒序

## 交互设计 (UX)

### 筛选栏

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔭 AI 洞察                                              ⚙️ 配置 │
├─────────────────────────────────────────────────────────────────┤
│ 主题：[✓]🛡️Agent安全  [✓]💻AI编程  [ ]🤖Code Agent  [全选]     │
│ 时间：● 今天  ○ 一周内  ○ 近一个月                               │
├─────────────────────────────────────────────────────────────────┤
│ 📦项目(12) │ 👤人物(5) │ 🏢组织(3) │ 📅事件(4)                  │
└─────────────────────────────────────────────────────────────────┘
```

### 组件结构

```
InsightView
├── InsightHeader
│   ├── Title
│   ├── TopicFilter      # 主题多选框
│   ├── TimeFilter       # 时间筛选器
│   └── ConfigButton
├── InsightTabs
└── InsightContent
```

### 主题选择器行为

- 默认选中所有启用的主题
- 点击复选框切换单个主题
- 点击"全选"切换全部
- 至少选中一个主题

### 时间筛选器行为

- 默认"今天"
- 单选切换
- 切换后立即刷新数据

## 风险清单与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 历史文件过多 | 存储占用 | 保留最近 30 天，定期清理 |
| 多文件加载慢 | 用户等待 | 显示加载进度，缓存已加载数据 |
| 数据合并冲突 | 显示重复 | 明确去重规则 |

## 决策记录 (Decision Log)

| 日期 | 决策 | 理由 | 替代方案 |
|------|------|------|----------|
| 2026-01-28 | 按日期文件名存储 | 简单直观、无需索引 | 数据库、单文件追加 |
| 2026-01-28 | 主题多选框在顶部 | 与标题同行，节省空间 | 下拉菜单、侧边栏 |
| 2026-01-28 | 时间默认"今天" | 关注最新内容 | 默认"一周内" |
