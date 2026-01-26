# SPEC-016: Session 对比视图

> 作者: Boris Huai
> 起草日期: 2026-01-26
> 状态: 草稿

---

## 1. 概述

本规格定义 Session 对比功能的设计，使用户能够比较两个 Agent 执行会话的差异。

---

## 2. 功能需求

### 2.1 对比维度

| 维度 | 描述 |
|------|------|
| 工具调用序列 | 对比两个 Session 的工具调用顺序和内容 |
| 执行时间 | 对比各阶段和工具调用的耗时 |
| 成功/失败 | 对比执行结果和错误信息 |
| 文件变更 | 对比修改的文件列表 |
| 阶段分布 | 对比阶段划分和耗时占比 |

### 2.2 对比模式

| 模式 | 描述 |
|------|------|
| 并排对比 | 左右两栏显示两个 Session |
| 合并对比 | 统一视图，高亮差异 |
| 统计对比 | 数字指标对比 |

---

## 3. UI 设计

### 3.1 Session 选择

```
┌─────────────────────────────────────────────────────────┐
│ Session 对比                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  基准 Session (A)          对比 Session (B)             │
│  ┌─────────────────┐       ┌─────────────────┐          │
│  │ 选择 Session... │       │ 选择 Session... │          │
│  └─────────────────┘       └─────────────────┘          │
│                                                         │
│                    [开始对比]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 对比概览

```
┌─────────────────────────────────────────────────────────┐
│ 对比概览                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  指标              Session A        Session B    差异   │
│  ─────────────────────────────────────────────────────  │
│  执行时间          2m 35s           3m 12s      +37s   │
│  工具调用数        12               15          +3     │
│  成功率            100%             93%         -7%    │
│  文件修改          5                7           +2     │
│                                                         │
│  阶段分布                                               │
│  探索  ████████░░░░ 35%    ██████████░░ 45%     +10%  │
│  执行  ██████████░░ 50%    ████████░░░░ 40%     -10%  │
│  验证  ████░░░░░░░░ 15%    ████░░░░░░░░ 15%      0%   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 工具调用对比

```
┌────────────────────────┬────────────────────────┐
│ Session A              │ Session B              │
├────────────────────────┼────────────────────────┤
│ 1. Read                │ 1. Read                │
│    Header.tsx          │    Header.tsx          │
│    1.2s ✓              │    1.5s ✓              │
├────────────────────────┼────────────────────────┤
│ 2. Read                │ 2. Glob                │
│    App.tsx             │    **/*.tsx       NEW  │
│    0.8s ✓              │    0.5s ✓              │
├────────────────────────┼────────────────────────┤
│ 3. Write               │ 3. Read                │
│    Particles.tsx       │    App.tsx             │
│    2.1s ✓              │    0.9s ✓              │
├────────────────────────┼────────────────────────┤
│                        │ 4. Write          NEW  │
│                        │    Particles.tsx       │
│                        │    2.5s ✓              │
└────────────────────────┴────────────────────────┘
```

---

## 4. Diff 算法

### 4.1 工具调用序列对比

```typescript
interface DiffResult {
  type: 'same' | 'modified' | 'added' | 'removed'
  indexA?: number
  indexB?: number
  toolCallA?: ToolCall
  toolCallB?: ToolCall
}

function diffToolCalls(
  callsA: ToolCall[],
  callsB: ToolCall[]
): DiffResult[] {
  // 使用 LCS (最长公共子序列) 算法
  const lcs = computeLCS(callsA, callsB, compareToolCalls)

  const results: DiffResult[] = []
  let i = 0, j = 0, k = 0

  while (i < callsA.length || j < callsB.length) {
    if (k < lcs.length && i < callsA.length && j < callsB.length) {
      const lcsItem = lcs[k]

      if (compareToolCalls(callsA[i], lcsItem)) {
        if (compareToolCalls(callsB[j], lcsItem)) {
          // 相同项
          results.push({
            type: 'same',
            indexA: i,
            indexB: j,
            toolCallA: callsA[i],
            toolCallB: callsB[j],
          })
          i++; j++; k++
        } else {
          // B 中新增
          results.push({
            type: 'added',
            indexB: j,
            toolCallB: callsB[j],
          })
          j++
        }
      } else {
        // A 中删除
        results.push({
          type: 'removed',
          indexA: i,
          toolCallA: callsA[i],
        })
        i++
      }
    } else if (i < callsA.length) {
      results.push({
        type: 'removed',
        indexA: i,
        toolCallA: callsA[i],
      })
      i++
    } else if (j < callsB.length) {
      results.push({
        type: 'added',
        indexB: j,
        toolCallB: callsB[j],
      })
      j++
    }
  }

  return results
}

function compareToolCalls(a: ToolCall, b: ToolCall): boolean {
  // 基于工具名和关键参数判断是否为"相同"操作
  if (a.tool_name !== b.tool_name) return false

  // 对于文件操作，比较文件路径
  if (['Read', 'Write', 'Edit'].includes(a.tool_name)) {
    return a.input.params?.file_path === b.input.params?.file_path
  }

  // 其他工具比较输入描述
  return a.input.description === b.input.description
}
```

### 4.2 统计对比

```typescript
interface SessionStats {
  totalDuration: number
  toolCallsCount: number
  successCount: number
  failedCount: number
  filesModified: string[]
  phaseDistribution: Record<PhaseType, number>
}

function computeStats(session: AgentSession): SessionStats {
  const stats: SessionStats = {
    totalDuration: session.summary.total_duration_ms,
    toolCallsCount: session.tool_calls.length,
    successCount: 0,
    failedCount: 0,
    filesModified: [],
    phaseDistribution: {
      understand: 0,
      explore: 0,
      plan: 0,
      execute: 0,
      verify: 0,
      mixed: 0,
    },
  }

  for (const tc of session.tool_calls) {
    if (tc.output.status === 'success') {
      stats.successCount++
    } else if (tc.output.status === 'error') {
      stats.failedCount++
    }

    // 统计修改的文件
    if (['Write', 'Edit'].includes(tc.tool_name)) {
      const filePath = tc.input.params?.file_path
      if (filePath && !stats.filesModified.includes(filePath)) {
        stats.filesModified.push(filePath)
      }
    }
  }

  // 阶段分布
  for (const annotation of session.phase_annotations || []) {
    const range = annotation.tool_call_range
    // 计算该阶段包含的工具调用数
    // ...
  }

  return stats
}

interface StatsComparison {
  metric: string
  valueA: number | string
  valueB: number | string
  diff: number | string
  diffPercent?: number
}

function compareStats(
  statsA: SessionStats,
  statsB: SessionStats
): StatsComparison[] {
  return [
    {
      metric: '执行时间',
      valueA: formatDuration(statsA.totalDuration),
      valueB: formatDuration(statsB.totalDuration),
      diff: formatDuration(statsB.totalDuration - statsA.totalDuration),
      diffPercent: ((statsB.totalDuration - statsA.totalDuration) / statsA.totalDuration) * 100,
    },
    {
      metric: '工具调用数',
      valueA: statsA.toolCallsCount,
      valueB: statsB.toolCallsCount,
      diff: statsB.toolCallsCount - statsA.toolCallsCount,
    },
    {
      metric: '成功率',
      valueA: `${Math.round(statsA.successCount / statsA.toolCallsCount * 100)}%`,
      valueB: `${Math.round(statsB.successCount / statsB.toolCallsCount * 100)}%`,
      diff: `${Math.round((statsB.successCount / statsB.toolCallsCount - statsA.successCount / statsA.toolCallsCount) * 100)}%`,
    },
    {
      metric: '文件修改',
      valueA: statsA.filesModified.length,
      valueB: statsB.filesModified.length,
      diff: statsB.filesModified.length - statsA.filesModified.length,
    },
  ]
}
```

---

## 5. 组件设计

### 5.1 组件结构

```
SessionComparison/
├── SessionComparison.tsx     # 主对比组件
├── SessionComparison.css
├── SessionSelector.tsx       # Session 选择器
├── ComparisonOverview.tsx    # 对比概览
├── ToolCallDiff.tsx          # 工具调用对比
├── StatsDiff.tsx             # 统计对比
├── PhaseDiff.tsx             # 阶段对比
└── index.ts
```

### 5.2 状态管理

```typescript
interface ComparisonState {
  sessionA: AgentSession | null
  sessionB: AgentSession | null
  isComparing: boolean
  diffResult: DiffResult[] | null
  statsComparison: StatsComparison[] | null
  viewMode: 'side-by-side' | 'unified' | 'stats'
}
```

---

## 6. 实现计划

### Phase 1: 基础对比
- [ ] Session 选择器
- [ ] 统计对比视图
- [ ] 基本差异计算

### Phase 2: 详细对比
- [ ] 工具调用序列对比
- [ ] LCS 算法实现
- [ ] 并排视图

### Phase 3: 高级功能
- [ ] 阶段分布对比
- [ ] 文件变更对比
- [ ] 导出对比报告

---

## 7. 相关文档

- [SKILL-002](../../skills/builtin/SKILL-002-session-comparison.json) - Session 对比技能
- [SPEC-014](./SPEC-014-session-search-filter.md) - Session 搜索
