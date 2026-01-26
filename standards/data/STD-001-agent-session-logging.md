# STD-001: Agent Session 日志记录标准

> 作者: Boris Huai
> 起草日期: 2026-01-25
> 修订日期: 2026-01-25
> 版本: 3.0
> 状态: 实施中

---

## 修订历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-01-25 | 初版，基于七步骤模型 |
| 2.0 | 2026-01-25 | 重构为五阶段模型，增加工具调用粒度 |
| 2.1 | 2026-01-25 | 新增 SubagentInfo、LoopInfo、LoopSummary |
| 2.2 | 2026-01-25 | 新增 user_prompt、FileExplorationRecord |
| 2.3 | 2026-01-25 | 新增 ContextUsageMode |
| **3.0** | 2026-01-25 | **重大重构：工具调用流优先模型，阶段改为可选标注** |

---

## 目的

定义 Claude Code Agent 执行任务时的日志记录规范，使每次任务执行都能生成可用于 BorisAgentStudio 可视化回放的 session 数据。

**核心原则**：记录真实发生的事，而非预设框架。

---

## 数据模型

### 核心理念

```
原始真实数据（工具调用序列）是第一公民
阶段标注是可选的事后分析层
```

### 结构概览

```
Session
  ├── tool_calls[]        (核心，必须) - 按时间顺序的完整调用记录
  └── phase_annotations[] (可选)       - 事后分析标注
```

### 与五阶段模型的关系

SPEC-003 定义的五阶段模型（理解→探索→规划→执行→验证）是一个**分析框架**，不是执行约束：

- 复杂任务：可能完整经历五阶段，值得标注
- 简单任务：可能直接执行，无需标注
- 实际执行：阶段边界模糊，可能交织或跳过

---

## 日志文件规范

### 存储位置

```
data/sessions/
```

### 命名规范

```
{日期}-{序号}-{任务简述}.json
```

示例:
- `2026-01-25-001-knowledge-markers.json`
- `2026-01-25-013-report.json`

---

## 核心数据结构

### Session（会话）

```typescript
interface Session {
  // === 元数据 ===
  session_id: string;                     // "2026-01-25-001-knowledge-markers"
  task_title: string;                     // "实现 KnowledgeMarkers 组件"
  task_description?: string;              // 详细描述（可选）
  user_prompt: string;                    // 用户原始输入
  created_at: string;                     // ISO8601
  completed_at: string;                   // ISO8601
  status: "success" | "failed" | "in_progress";

  agent: {
    model_id: string;                     // "claude-opus-4-5-20251101"
    capability_snapshot?: string;         // 能力快照日期
  };

  // === 核心：工具调用序列 ===
  tool_calls: ToolCall[];                 // 按时间顺序，必须

  // === 可选：阶段标注 ===
  phase_annotations?: PhaseAnnotation[];  // 事后分析，可选

  // === 可选：旧格式兼容 ===
  phases?: Phase[];                       // v2.x 格式，向后兼容

  // === 摘要 ===
  summary: SessionSummary;
}

interface SessionSummary {
  total_duration_ms: number;
  tool_calls_count: number;
  files_created: string[];
  files_modified: string[];
  errors_encountered?: number;
}
```

### ToolCall（工具调用）

工具调用是可视化的原子单元，是日志的**核心数据**。

```typescript
interface ToolCall {
  call_id: string;                        // "tool-001"
  tool_name: string;                      // "Read" | "Edit" | "Bash" | ...
  tool_category: ToolCategory;            // 工具分类

  started_at: string;                     // ISO8601
  ended_at: string;                       // ISO8601
  duration_ms: number;

  input: {
    params: Record<string, unknown>;      // 工具参数
    description?: string;                 // 人类可读描述
    raw_command?: string;                 // Terminal 显示格式
  };

  output: {
    status: "success" | "failed";
    result?: {
      display?: string;                   // 简洁显示 "Read 736 lines"
      [key: string]: unknown;
    };
    error?: string;
    truncated?: boolean;
  };

  context_contribution?: {                // 对上下文的贡献
    type: "file_content" | "search_result" | "command_output" | "knowledge";
    summary: string;
    full_content?: string;
  };

  subagent_info?: SubagentInfo;           // Task 工具专用
}

type ToolCategory =
  | "perception"       // 感知：Read, Glob, Grep, LSP
  | "action"           // 行动：Write, Edit, Bash
  | "interaction"      // 交互：Task, AskUserQuestion
  | "planning"         // 规划：EnterPlanMode, ExitPlanMode
  | "task_management"; // 任务管理：TaskCreate, TaskUpdate
```

### SubagentInfo（子代理信息）

Task 工具调用的额外信息。

```typescript
interface SubagentInfo {
  subagent_type: string;                  // "Explore", "Plan", "Bash", etc.
  tool_uses: number;                      // 内部工具调用次数
  tokens_used?: number;                   // 消耗 token
  tools_breakdown?: Array<{               // 工具明细
    tool_name: string;
    count: number;
  }>;
}
```

### PhaseAnnotation（阶段标注）- 可选

对工具调用序列的**事后分析**，不是执行时的"阶段"。

```typescript
interface PhaseAnnotation {
  annotation_id: string;                  // "ann-001"
  phase_type: PhaseType;

  // 覆盖的工具调用范围
  tool_call_range: {
    start_call_id: string;                // 起始工具调用
    end_call_id: string;                  // 结束工具调用
  };

  // 标注元数据
  annotated_by: "agent" | "human" | "auto";
  annotated_at: string;
  confidence: "high" | "medium" | "low";

  // 标注内容
  description?: string;
  decisions?: Decision[];
  context_used?: ContextReference[];
}

type PhaseType =
  | "understand"      // 理解用户意图
  | "explore"         // 探索代码/上下文
  | "plan"            // 规划执行方案
  | "execute"         // 执行修改
  | "verify"          // 验证结果
  | "mixed"           // 混合，无法明确分类
  | "unclassified";   // 未标注
```

### ContextReference（上下文引用）

```typescript
interface ContextReference {
  type: ContextType;
  source: string;                         // 文件路径或来源
  relevance: "high" | "medium" | "low";
  summary?: string;
  quoted_content?: string;
  usage_mode?: "read" | "modified" | "read_then_modified";
}

type ContextType =
  | "claude_md"       // CLAUDE.md - 金色
  | "rule"            // rules/ - 蓝色
  | "standard"        // standards/ - 绿色
  | "skill"           // skills/ - 橙色
  | "spec"            // docs/specs/ - 紫色
  | "file"            // 代码/配置 - 灰色
  | "user_message"    // 用户消息
  | "tool_result"     // 工具结果
  | "capability";     // 能力快照 - 青色
```

### Decision（决策）

```typescript
interface Decision {
  decision_id: string;
  type: "tool_selection" | "approach" | "error_handling" | "skip" | "retry";
  description: string;
  reasoning?: string;
  alternatives_considered?: string[];
}
```

---

## 记录建议

根据任务复杂度选择记录详细程度：

| 复杂度 | 工具调用数 | 建议格式 |
|--------|-----------|---------|
| 简单 | < 5 | 仅 tool_calls |
| 中等 | 5-20 | tool_calls + 可选 phase_annotations |
| 复杂 | > 20 | tool_calls + 完整 phase_annotations |

---

## 示例

### 简单任务（无阶段标注）

```json
{
  "session_id": "2026-01-25-013-report",
  "task_title": "生成项目统计报告",
  "user_prompt": "/report",
  "created_at": "2026-01-25T15:00:00Z",
  "completed_at": "2026-01-25T15:00:05Z",
  "status": "success",

  "agent": {
    "model_id": "claude-opus-4-5-20251101"
  },

  "tool_calls": [
    {
      "call_id": "tool-001",
      "tool_name": "Bash",
      "tool_category": "perception",
      "started_at": "2026-01-25T15:00:01Z",
      "ended_at": "2026-01-25T15:00:02Z",
      "duration_ms": 800,
      "input": {
        "params": { "command": "find . -type f -name '*.ts' ... | wc -l" },
        "description": "Count TypeScript lines"
      },
      "output": {
        "status": "success",
        "result": { "display": "1870" }
      }
    },
    {
      "call_id": "tool-002",
      "tool_name": "Bash",
      "tool_category": "perception",
      "started_at": "2026-01-25T15:00:01Z",
      "ended_at": "2026-01-25T15:00:02Z",
      "duration_ms": 750,
      "input": {
        "params": { "command": "find . -type f -name '*.ts' ... | wc -l" },
        "description": "Count TypeScript files"
      },
      "output": {
        "status": "success",
        "result": { "display": "19" }
      }
    }
  ],

  "summary": {
    "total_duration_ms": 5000,
    "tool_calls_count": 11,
    "files_created": [],
    "files_modified": []
  }
}
```

### 复杂任务（带阶段标注）

```json
{
  "session_id": "2026-01-25-001-knowledge-markers",
  "task_title": "实现 KnowledgeMarkers 组件",
  "user_prompt": "在 TimelineNode 下面加上领域知识的圆点标识",
  "created_at": "2026-01-25T10:00:00Z",
  "completed_at": "2026-01-25T10:05:00Z",
  "status": "success",

  "agent": {
    "model_id": "claude-opus-4-5-20251101",
    "capability_snapshot": "2026-01-25"
  },

  "tool_calls": [
    {
      "call_id": "tool-001",
      "tool_name": "Glob",
      "tool_category": "perception",
      "started_at": "2026-01-25T10:00:05Z",
      "ended_at": "2026-01-25T10:00:06Z",
      "duration_ms": 500,
      "input": {
        "params": { "pattern": "**/Timeline*.tsx" },
        "description": "查找 Timeline 相关组件"
      },
      "output": {
        "status": "success",
        "result": { "files": ["TimelineNode.tsx", "TimelineView.tsx"] }
      }
    },
    {
      "call_id": "tool-002",
      "tool_name": "Read",
      "tool_category": "perception",
      "started_at": "2026-01-25T10:00:06Z",
      "ended_at": "2026-01-25T10:00:07Z",
      "duration_ms": 800,
      "input": {
        "params": { "file_path": "frontend/src/components/Timeline/TimelineNode.tsx" },
        "description": "读取 TimelineNode 组件"
      },
      "output": {
        "status": "success",
        "result": { "display": "Read 67 lines" }
      },
      "context_contribution": {
        "type": "file_content",
        "summary": "获取组件结构和 props 定义"
      }
    },
    {
      "call_id": "tool-003",
      "tool_name": "Write",
      "tool_category": "action",
      "started_at": "2026-01-25T10:01:00Z",
      "ended_at": "2026-01-25T10:01:05Z",
      "duration_ms": 5000,
      "input": {
        "params": {
          "file_path": "frontend/src/components/Timeline/KnowledgeMarkers.tsx",
          "content": "..."
        },
        "description": "创建 KnowledgeMarkers 组件"
      },
      "output": {
        "status": "success",
        "result": { "display": "Wrote 45 lines" }
      }
    }
  ],

  "phase_annotations": [
    {
      "annotation_id": "ann-001",
      "phase_type": "explore",
      "tool_call_range": {
        "start_call_id": "tool-001",
        "end_call_id": "tool-002"
      },
      "annotated_by": "agent",
      "annotated_at": "2026-01-25T10:05:00Z",
      "confidence": "high",
      "description": "搜索并理解现有 Timeline 组件结构",
      "context_used": [
        {
          "type": "file",
          "source": "TimelineNode.tsx",
          "relevance": "high",
          "usage_mode": "read_then_modified"
        }
      ]
    },
    {
      "annotation_id": "ann-002",
      "phase_type": "execute",
      "tool_call_range": {
        "start_call_id": "tool-003",
        "end_call_id": "tool-003"
      },
      "annotated_by": "agent",
      "annotated_at": "2026-01-25T10:05:00Z",
      "confidence": "high",
      "description": "创建新组件文件"
    }
  ],

  "summary": {
    "total_duration_ms": 300000,
    "tool_calls_count": 8,
    "files_created": ["KnowledgeMarkers.tsx", "KnowledgeMarkers.css"],
    "files_modified": ["TimelineNode.tsx", "index.ts"]
  }
}
```

---

## 向后兼容

### v2.x 格式支持

使用 `phases[]` 的旧格式日志仍然有效：

```typescript
// 解析器伪代码
function parseSession(json: any): Session {
  if (json.phases && !json.tool_calls) {
    // v2.x 格式：从 phases 提取 tool_calls
    return migrateLegacyFormat(json);
  }
  return json;
}

function migrateLegacyFormat(legacy: any): Session {
  const tool_calls = legacy.phases.flatMap(phase =>
    phase.tool_call_ids.map(id => legacy.tool_calls.find(t => t.call_id === id))
  );
  return { ...legacy, tool_calls };
}
```

---

## 与可视化的映射

| 日志结构 | 可视化元素 | 说明 |
|----------|------------|------|
| tool_calls | 时间线节点 | 主视图，按时间排列 |
| phase_annotations | 阶段区块 | 叠加层，可隐藏 |
| context_contribution | 上下文连接线 | 显示信息流 |
| subagent_info | 子代理展开视图 | 可展开查看内部调用 |

---

## 相关文档

- [SPEC-003: Claude Code 执行模型](../../docs/specs/SPEC-003-claude-code-execution-model.md)
- [STD-001-Evolvable-1: 演进说明](./STD-001-agent-session-logging-Evolvable-1.md)
- [RULE-001: 能力审视机制](../../rules/workflow/RULE-001-capability-audit.md)
