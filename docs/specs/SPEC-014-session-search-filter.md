# SPEC-014: Session 搜索与过滤

> 作者: Boris Huai
> 起草日期: 2026-01-26
> 状态: 草稿

---

## 1. 概述

本规格定义 Session 搜索与过滤功能的设计，使用户能快速定位特定的 Agent 执行记录。

---

## 2. 功能需求

### 2.1 搜索能力

| 搜索类型 | 描述 | 示例 |
|----------|------|------|
| 关键词搜索 | 搜索任务标题、用户 prompt | "particles" |
| 工具名搜索 | 搜索使用了特定工具的 Session | "tool:Read" |
| 文件路径搜索 | 搜索涉及特定文件的 Session | "file:PhaseNode" |

### 2.2 过滤能力

| 过滤维度 | 选项 |
|----------|------|
| 状态 | 全部、成功、失败、部分成功 |
| 时间范围 | 今天、本周、本月、自定义 |
| 工具数量 | 少量 (<10)、中等 (10-50)、大量 (>50) |
| 持续时间 | 快速 (<10s)、正常、较长 (>60s) |

### 2.3 排序能力

| 排序字段 | 方向 |
|----------|------|
| 创建时间 | 升序/降序 |
| 任务名称 | 字母序 |
| 工具调用数 | 升序/降序 |
| 执行时长 | 升序/降序 |

---

## 3. UI 设计

### 3.1 搜索栏

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 搜索 Sessions...                      [筛选 ▼] [排序 ▼] │
└─────────────────────────────────────────────────────────┘
```

### 3.2 筛选面板

```
┌─────────────────────────────────┐
│ 状态                            │
│ ○ 全部  ● 成功  ○ 失败          │
├─────────────────────────────────┤
│ 时间范围                        │
│ ○ 全部  ● 今天  ○ 本周  ○ 自定义 │
├─────────────────────────────────┤
│ 工具数量                        │
│ □ 少量  ☑ 中等  □ 大量          │
└─────────────────────────────────┘
```

### 3.3 搜索结果

```
┌─────────────────────────────────────────────────────────┐
│ 找到 5 个结果 (共 16 个 Sessions)                        │
├─────────────────────────────────────────────────────────┤
│ ✓ 项目增强路线图                     2026-01-26  7 calls │
│   软件工程最佳实践分析                                   │
├─────────────────────────────────────────────────────────┤
│ ✓ 实现顶栏粒子效果                   2026-01-25 12 calls │
│   粒子引擎、HeaderParticles 组件                        │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 组件设计

### 4.1 组件结构

```
SessionSearch/
├── SessionSearch.tsx         # 主搜索组件
├── SessionSearch.css
├── SearchInput.tsx           # 搜索输入框
├── FilterPanel.tsx           # 筛选面板
├── SortDropdown.tsx          # 排序下拉
├── SearchResults.tsx         # 搜索结果列表
└── index.ts
```

### 4.2 状态管理

```typescript
interface SearchState {
  // 搜索条件
  query: string
  filters: {
    status: 'all' | 'success' | 'failed' | 'partial'
    timeRange: 'all' | 'today' | 'week' | 'month' | 'custom'
    customDateRange?: { start: Date; end: Date }
    toolCountRange?: 'small' | 'medium' | 'large'
  }
  sort: {
    field: 'created_at' | 'name' | 'tool_count' | 'duration'
    direction: 'asc' | 'desc'
  }

  // 搜索结果
  results: SessionListItem[]
  totalCount: number
  isLoading: boolean
}
```

---

## 5. 搜索算法

### 5.1 关键词匹配

```typescript
function matchKeyword(session: AgentSession, query: string): boolean {
  const lowerQuery = query.toLowerCase()

  // 匹配任务标题
  if (session.task_title.toLowerCase().includes(lowerQuery)) {
    return true
  }

  // 匹配用户 prompt
  if (session.user_prompt?.toLowerCase().includes(lowerQuery)) {
    return true
  }

  // 匹配工具调用
  if (session.tool_calls.some(tc =>
    tc.tool_name.toLowerCase().includes(lowerQuery) ||
    tc.input.description?.toLowerCase().includes(lowerQuery)
  )) {
    return true
  }

  return false
}
```

### 5.2 高级搜索语法

| 语法 | 含义 | 示例 |
|------|------|------|
| `tool:X` | 工具名包含 X | `tool:Read` |
| `file:X` | 文件路径包含 X | `file:PhaseNode` |
| `status:X` | 状态为 X | `status:success` |
| `"phrase"` | 精确匹配短语 | `"header particles"` |

### 5.3 搜索解析

```typescript
interface ParsedQuery {
  keywords: string[]
  toolFilter?: string
  fileFilter?: string
  statusFilter?: string
  exactPhrases: string[]
}

function parseSearchQuery(query: string): ParsedQuery {
  const result: ParsedQuery = { keywords: [], exactPhrases: [] }

  // 提取精确短语 "..."
  const phraseRegex = /"([^"]+)"/g
  let match
  while ((match = phraseRegex.exec(query)) !== null) {
    result.exactPhrases.push(match[1])
  }
  query = query.replace(phraseRegex, '')

  // 提取特殊过滤器
  const toolMatch = query.match(/tool:(\S+)/)
  if (toolMatch) {
    result.toolFilter = toolMatch[1]
    query = query.replace(toolMatch[0], '')
  }

  const fileMatch = query.match(/file:(\S+)/)
  if (fileMatch) {
    result.fileFilter = fileMatch[1]
    query = query.replace(fileMatch[0], '')
  }

  const statusMatch = query.match(/status:(\S+)/)
  if (statusMatch) {
    result.statusFilter = statusMatch[1]
    query = query.replace(statusMatch[0], '')
  }

  // 剩余作为关键词
  result.keywords = query.trim().split(/\s+/).filter(Boolean)

  return result
}
```

---

## 6. 性能优化

### 6.1 防抖搜索

```typescript
const debouncedSearch = useDebouncedCallback(
  (query: string) => {
    performSearch(query)
  },
  300 // 300ms 延迟
)
```

### 6.2 虚拟滚动

对于大量结果，使用虚拟滚动：

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function SearchResults({ results }: { results: SessionListItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 每项估计高度
  })

  return (
    <div ref={parentRef} className="results-container">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <SessionItem
            key={results[virtualRow.index].session_id}
            session={results[virtualRow.index]}
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

### 6.3 搜索索引

对于大量 Session，可构建倒排索引：

```typescript
interface SearchIndex {
  // 词 -> Session ID 列表
  keywords: Map<string, Set<string>>
  // 工具名 -> Session ID 列表
  tools: Map<string, Set<string>>
  // 文件路径 -> Session ID 列表
  files: Map<string, Set<string>>
}

function buildSearchIndex(sessions: AgentSession[]): SearchIndex {
  const index: SearchIndex = {
    keywords: new Map(),
    tools: new Map(),
    files: new Map(),
  }

  for (const session of sessions) {
    // 索引标题关键词
    const words = session.task_title.toLowerCase().split(/\W+/)
    for (const word of words) {
      if (!index.keywords.has(word)) {
        index.keywords.set(word, new Set())
      }
      index.keywords.get(word)!.add(session.session_id)
    }

    // 索引工具名
    for (const tc of session.tool_calls) {
      const tool = tc.tool_name.toLowerCase()
      if (!index.tools.has(tool)) {
        index.tools.set(tool, new Set())
      }
      index.tools.get(tool)!.add(session.session_id)
    }

    // 索引文件路径
    // ...
  }

  return index
}
```

---

## 7. API 设计

### 7.1 搜索端点

```
GET /api/v1/sessions/search
```

### 7.2 请求参数

| 参数 | 类型 | 描述 |
|------|------|------|
| q | string | 搜索关键词 |
| status | string | 状态过滤 |
| from | string | 开始时间 (ISO 8601) |
| to | string | 结束时间 (ISO 8601) |
| sort | string | 排序字段 |
| order | string | 排序方向 (asc/desc) |
| page | number | 页码 |
| limit | number | 每页数量 |

### 7.3 响应格式

```json
{
  "data": [
    {
      "session_id": "2026-01-26-001",
      "task_title": "项目增强路线图",
      "status": "success",
      "tool_calls_count": 7,
      "created_at": "2026-01-26T22:45:00Z",
      "highlights": {
        "task_title": ["项目增强<em>路线图</em>"],
        "user_prompt": ["...软件工程<em>最佳实践</em>..."]
      }
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

## 8. 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `/` | 聚焦搜索框 |
| `Esc` | 清空搜索/关闭筛选 |
| `↑` `↓` | 在结果中导航 |
| `Enter` | 打开选中 Session |
| `Ctrl+F` | 打开高级筛选 |

---

## 9. 实现计划

### Phase 1: 基础搜索
- [ ] 搜索输入组件
- [ ] 关键词搜索
- [ ] 搜索结果列表

### Phase 2: 过滤功能
- [ ] 状态过滤
- [ ] 时间范围过滤
- [ ] 过滤面板 UI

### Phase 3: 高级功能
- [ ] 高级搜索语法
- [ ] 排序功能
- [ ] 搜索结果高亮

### Phase 4: 优化
- [ ] 防抖优化
- [ ] 虚拟滚动
- [ ] 键盘导航

---

## 10. 相关文档

- [SKILL-003](../../skills/builtin/SKILL-003-session-search.json) - Session 搜索技能
- [STD-003](../../standards/api/STD-003-api-standards.md) - API 规范
