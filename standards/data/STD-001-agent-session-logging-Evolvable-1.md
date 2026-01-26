# STD-001-Evolvable-1: 工具调用流优先的日志模型

> 作者: Boris Huai
> 起草日期: 2026-01-25
> 状态: 提案

---

## 触发信号

1. **实际执行与模型不符**：执行 `/report` 任务时，实际过程是"读取指令 → 并行发命令 → 格式化输出"，无法合理映射到五阶段。

2. **简单任务的阶段冗余**：对于明确的任务（如统计代码行数），强制记录"探索"和"规划"阶段是虚构而非记录。

3. **用户核心诉求**：
   > "我希望把你真正的执行过程复现出来，而不是你按照我定好的五步来执行。"

4. **哲学冲突**：当前模型让 Agent "表演"一个预设流程，而非记录真实行为。这违背了项目核心目标——**可解释性**。

---

## 被否决的方案

### 方案 A：放宽阶段定义

允许阶段合并（如 "understand+plan"），保持五阶段结构。

**否决原因**：
- 仍然是"套框架"而非"记录真实"
- 无法处理"根本没有某阶段"的情况
- 增加了标注的主观性

### 方案 B：增加更多阶段类型

添加 "direct_execute"、"simple_task" 等新阶段类型。

**否决原因**：
- 阶段类型膨胀，难以维护
- 没有解决根本问题：阶段是抽象而非实体

---

## 新方案：工具调用流优先模型

### 核心理念

```
原始真实数据（工具调用序列）是第一公民
阶段标注是可选的事后分析层
```

### 数据模型变化

```
原模型:
Session
  └── Phase[] (必须)
        └── ToolCall[]

新模型:
Session
  ├── ToolCall[] (核心，必须)
  └── PhaseAnnotation[] (可选，事后分析)
```

### 新增：Session 结构

```typescript
interface Session {
  // === 元数据 ===
  session_id: string;
  task_title: string;
  task_description?: string;
  user_prompt: string;                    // 用户原始输入
  created_at: string;
  completed_at: string;
  status: "success" | "failed" | "in_progress";

  agent: {
    model_id: string;
    capability_snapshot?: string;
  };

  // === 核心：工具调用序列 ===
  tool_calls: ToolCall[];                 // 按时间顺序的完整调用记录

  // === 可选：阶段标注 ===
  phase_annotations?: PhaseAnnotation[];  // 事后分析标注

  // === 摘要 ===
  summary: SessionSummary;
}
```

### 新增：PhaseAnnotation（替代原 Phase）

```typescript
/**
 * 阶段标注 - 对工具调用序列的事后分析
 *
 * 注意：这不是 Agent 执行的"阶段"，而是人类/系统对执行过程的解读。
 */
interface PhaseAnnotation {
  annotation_id: string;
  phase_type: PhaseType;

  // 标注覆盖的工具调用范围
  tool_call_range: {
    start_call_id: string;
    end_call_id: string;
  };

  // 标注元数据
  annotated_by: "agent" | "human" | "auto";  // 谁做的标注
  annotated_at: string;
  confidence: "high" | "medium" | "low";     // 标注置信度

  // 标注内容
  description?: string;                       // 这个阶段在做什么
  decisions?: Decision[];                     // 识别出的决策点
  context_used?: ContextReference[];          // 识别出的上下文使用
}

type PhaseType =
  | "understand"
  | "explore"
  | "plan"
  | "execute"
  | "verify"
  | "mixed"        // 新增：无法明确分类
  | "unclassified"; // 新增：未标注
```

### 保持不变：ToolCall

工具调用结构保持不变，但**不再依赖 phase_id**：

```typescript
interface ToolCall {
  call_id: string;
  // phase_id: string;  // 移除！不再必须

  tool_name: string;
  tool_category: ToolCategory;

  started_at: string;
  ended_at: string;
  duration_ms: number;

  input: { ... };
  output: { ... };

  context_contribution?: { ... };
  subagent_info?: SubagentInfo;
}
```

### 新增：简化 Session 格式

对于简单任务，允许极简格式：

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
      "duration_ms": 1000,
      "input": {
        "params": { "command": "find . -name '*.ts' ... | wc -l" },
        "description": "Count TypeScript lines"
      },
      "output": {
        "status": "success",
        "result": { "display": "1870" }
      }
    }
    // ... 更多并行调用
  ],

  // 无 phase_annotations - 任务太简单，不需要阶段分析

  "summary": {
    "total_duration_ms": 5000,
    "tool_calls_count": 11,
    "files_created": [],
    "files_modified": []
  }
}
```

---

## 迁移策略

### 向后兼容

现有日志（使用 `phases[]`）仍然有效：

```typescript
// 解析器伪代码
function parseSession(json) {
  if (json.phases) {
    // 旧格式：从 phases 提取 tool_calls
    return migrateLegacyFormat(json);
  } else {
    // 新格式：直接使用
    return json;
  }
}
```

### 记录建议

| 任务复杂度 | 建议格式 |
|-----------|---------|
| 简单（<5 工具调用） | 仅 tool_calls，无 phase_annotations |
| 中等（5-20 工具调用） | tool_calls + 可选 phase_annotations |
| 复杂（>20 工具调用） | tool_calls + 完整 phase_annotations |

---

## 对现有模块的影响

### 需要更新

| 模块 | 影响 | 工作量 |
|------|------|--------|
| Session 解析器 | 支持新格式 + 兼容旧格式 | 中 |
| 时序图组件 | 以 tool_calls 为主数据源 | 中 |
| 阶段节点组件 | 从必须渲染变为可选渲染 | 小 |

### 不受影响

- 工具调用详情组件
- 上下文引用可视化
- 知识标记组件

### 可视化语义变化

| 原语义 | 新语义 |
|--------|--------|
| 五个阶段节点是主结构 | 工具调用流是主结构 |
| 阶段之间有明确边界 | 阶段标注是叠加层（可隐藏） |
| 所有 Session 都有五阶段 | 简单 Session 可能无阶段标注 |

**破坏性**：中等。需要调整主可视化布局思路，但工具调用级别的展示不变。

---

## 收益

1. **真实性**：记录的是实际发生的事，而非预设框架

2. **灵活性**：简单任务无需"补全"缺失阶段

3. **可分析性**：原始数据完整，事后可用不同框架分析

4. **教学价值**：展示 Agent 真实的"思考"过程，而非理想化模型

5. **自举验证**：BorisAgentStudio 可以记录自己的真实执行过程

---

## 待讨论

1. **自动阶段标注**：是否实现基于启发式规则的自动标注？
   - 如：连续 Read/Glob/Grep 调用 → 标注为 "explore"

2. **可视化默认视图**：
   - 默认展示工具调用流（时间线）
   - 还是默认展示阶段视图（如果有标注）？

3. **标注工具**：是否提供 UI 让人类事后标注阶段？

---

## 相关文档

- 原标准：[STD-001-agent-session-logging.md](./STD-001-agent-session-logging.md)
- 执行模型：[SPEC-003-claude-code-execution-model.md](../../docs/specs/SPEC-003-claude-code-execution-model.md)
