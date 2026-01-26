# SPEC-009: 上下文类型区分

> 作者: Boris Huai
> 起草日期: 2026-01-25
> 状态: 已完成

## 背景

当前系统中存在两个概念容易混淆：

| 字段 | 当前含义 | 问题 |
|------|----------|------|
| `exploration_record.files_considered` | 考虑过的文件，`used=true` 表示被修改 | 只在 explore 阶段存在 |
| `context_used` | 提供上下文的文件 | 与 files_considered 数量不一致 |

用户反馈：
- 在 explore 阶段，`files_considered` 显示 4 个文件 `used=true`
- 但 `context_used` 只有 2 个条目
- 这让用户困惑："到底哪些文件被使用了？"

## 设计目标

1. **概念清晰化**：明确区分"读取提供上下文"和"被修改"
2. **数据一致性**：`context_used` 应包含所有读取过的文件
3. **可视化完整**：在 UI 中同时展示两种使用方式

## 新的概念模型

### 文件使用类型

```
┌─────────────────────────────────────────────────────────────┐
│                      文件交互类型                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐       ┌─────────────────┐              │
│  │  context_read   │       │ context_modified │              │
│  │  (读取为上下文)  │       │   (被修改)       │              │
│  └────────┬────────┘       └────────┬────────┘              │
│           │                         │                       │
│           │    可能重叠             │                       │
│           └────────┬────────────────┘                       │
│                    ▼                                        │
│           ┌─────────────────┐                               │
│           │ 同一个文件可能  │                               │
│           │ 先被读取，后被  │                               │
│           │ 修改            │                               │
│           └─────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### 扩展 `context_used` 类型

在现有 `ContextType` 基础上增加区分：

```typescript
// 新增上下文使用方式
type ContextUsageMode = 'read' | 'modified' | 'read_then_modified'

interface ContextItem {
  type: ContextType           // 原有：file, domain_knowledge, etc.
  source: string              // 原有：来源标识
  relevance?: 'high' | 'medium' | 'low'  // 原有
  summary?: string            // 原有

  // 新增字段
  usage_mode?: ContextUsageMode  // 使用方式
}
```

### `usage_mode` 含义

| 值 | 含义 | 示例 |
|----|------|------|
| `read` | 仅读取，提供上下文理解 | 读取 `sessionStore.ts` 确认不需要修改 |
| `modified` | 被修改（通常也会先读取） | 编辑 `types/agent.ts` 添加新类型 |
| `read_then_modified` | 明确标识先读后改的情况 | 先读取理解结构，后添加新代码 |

## UI 设计

### 上下文标签页增强

```
┌─────────────────────────────────────────────────────────────┐
│  上下文 (5)                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ [文件] types/agent.ts ─────────── 读取并修改 ──── high ─┐│
│  │  确认 AgentSession 接口结构，添加新类型定义              ││
│  └──────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ [文件] DetailPanel.tsx ────────── 读取并修改 ──── high ─┐│
│  │  理解现有展示逻辑，添加新 UI 元素                        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ [文件] DetailPanel.css ────────── 读取并修改 ──── medium┐│
│  │  确认样式规范，添加新样式                                ││
│  └──────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ [文件] sessionStore.ts ────────── 仅读取 ────── low ────┐│
│  │  确认不需要修改状态管理逻辑                              ││
│  └──────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ [用户消息] 用户原始请求 ─────────────────────── high ───┐│
│  │  三个核心需求：文件选择透明化、决策过程可视化...         ││
│  └──────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 使用方式标签样式

```css
.usage-mode {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.usage-mode.read {
  background: #e0f2fe;  /* 浅蓝 */
  color: #0369a1;
}

.usage-mode.modified {
  background: #fef3c7;  /* 浅黄 */
  color: #92400e;
}

.usage-mode.read-then-modified {
  background: #dcfce7;  /* 浅绿 */
  color: #166534;
}
```

## 数据记录规范

### Session 日志中的 `context_used`

对于 explore 阶段，应记录所有读取过的文件：

```json
{
  "phase_type": "explore",
  "context_used": [
    {
      "type": "file",
      "source": "types/agent.ts",
      "relevance": "high",
      "summary": "确认数据结构，找到添加新字段的位置",
      "usage_mode": "read_then_modified"
    },
    {
      "type": "file",
      "source": "DetailPanel.tsx",
      "relevance": "high",
      "summary": "理解现有展示逻辑",
      "usage_mode": "read_then_modified"
    },
    {
      "type": "file",
      "source": "DetailPanel.css",
      "relevance": "medium",
      "summary": "确认样式规范",
      "usage_mode": "read_then_modified"
    },
    {
      "type": "file",
      "source": "sessionStore.ts",
      "relevance": "low",
      "summary": "确认不需要修改",
      "usage_mode": "read"
    }
  ]
}
```

### 与 `exploration_record` 的关系

`exploration_record.files_considered` 保留原有语义：
- 记录**考虑过是否需要修改**的文件
- `used: true` 表示**最终被修改**

`context_used` 记录：
- 所有**读取过**的文件
- 包括仅用于理解上下文但未修改的文件
- `usage_mode` 标识最终使用方式

## 实现步骤

1. **更新类型定义** (`types/agent.ts`)
   - 添加 `ContextUsageMode` 类型
   - 在 `ContextItem` 接口添加 `usage_mode` 字段

2. **更新 DetailPanel UI** (`DetailPanel.tsx`)
   - 在上下文卡片中显示 `usage_mode` 标签

3. **更新样式** (`DetailPanel.css`)
   - 添加 `.usage-mode` 相关样式

4. **更新 Session 数据** (`2026-01-25-009-decision-transparency.json`)
   - 补全 `context_used` 数据
   - 添加 `usage_mode` 字段

5. **更新日志标准** (`STD-001`)
   - 文档化 `usage_mode` 字段

## 验收标准

- [ ] 上下文标签页显示所有读取过的文件
- [ ] 每个文件显示使用方式标签（读取/修改/读取并修改）
- [ ] 数据一致：`context_used` 包含所有 `exploration_record` 中 `used=true` 的文件
- [ ] 样式区分明显：不同使用方式有不同颜色标识
