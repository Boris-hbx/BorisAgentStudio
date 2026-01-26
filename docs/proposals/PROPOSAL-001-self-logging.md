# PROPOSAL-001: Claude Code 执行模型与自记录机制

> 提案人: Claude Code
> 日期: 2026-01-25
> 版本: 3.0
> 状态: **已批准** (2026-01-25)
> 批准人: Boris Huai

---

## 提案摘要

1. **删除七步骤模型**，采用五阶段模型描述 Claude Code 执行逻辑
2. **调整审批层级**：执行模型从"不可变"改为"需人工批准可变"
3. **新增自记录机制**：开发时记录 Agent 日志
4. **新增能力审视机制**：追踪 Claude Code 能力变化

---

## 提议的 CLAUDE.md 修改

### 修改一：调整审批层级

将"核心流程语义"从 `Immutable Core` 移到 `Human Approval Required`。

在 `## Human Approval Required` 中新增：

```markdown
* **执行模型变更**

  * Claude Code 执行模型（五阶段）的修改
  * 阶段定义、工具分类的调整
  * 触发条件：Claude Code 能力更新、发现模型不准确
```

### 修改二：替换"核心流程语义"

删除原来的七步骤，改为五阶段模型：

```markdown
### Claude Code 执行模型

Claude Code 的执行遵循五阶段模型：

> 理解 (Understand) → 探索 (Explore) → 规划 (Plan) → 执行 (Execute) → 验证 (Verify)

```
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│  理解  │──▶│  探索  │──▶│  规划  │──▶│  执行  │──▶│  验证  │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘
                              ▲            │
                              └────────────┘
                                失败重试
```

| 阶段 | 核心行为 | 典型工具 |
|------|----------|----------|
| 理解 | 解析用户意图、识别任务类型 | - |
| 探索 | 构建上下文、搜索和读取文件 | Glob, Grep, Read, LSP |
| 规划 | 分解任务、选择工具、评估风险 | - |
| 执行 | 调用工具、修改文件、运行命令 | Write, Edit, Bash |
| 验证 | 检查结果、运行测试 | Bash, Read |

**可变性说明**：

此模型基于当前 Claude Code 能力分析（见 SPEC-003）。当 Claude Code 更新导致模型不准确时，Claude 可提议修改，需人工批准。

详见：
- SPEC-003: Claude Code 执行模型分析
- STD-001: Agent Session 日志记录标准
- RULE-001: 能力审视机制
```

### 修改三：更新"核心数据字段"

替换为五阶段模型的数据结构：

```markdown
### 核心数据字段

#### Session 级别

* session_id
* task_title
* status
* phases[]
* tool_calls[]
* summary

#### Phase 级别

* phase_id
* phase_type (understand | explore | plan | execute | verify)
* status
* input / output
* tool_call_ids[]
* context_used[]
* decisions[]
* error? / next_phase?

#### ToolCall 级别

* call_id
* tool_name
* tool_category (perception | action | interaction)
* input.params
* output.result
* context_contribution?

详见 STD-001。

#### 知识来源类型（ContextReference.type）

记录 Claude 参考了哪些知识：

| type | 来源 | 可视化颜色 |
|------|------|------------|
| `claude_md` | CLAUDE.md | 金色 |
| `rule` | rules/ 目录 | 蓝色 |
| `standard` | standards/ 目录 | 绿色 |
| `skill` | skills/ 目录 | 橙色 |
| `spec` | docs/specs/ 目录 | 紫色 |
| `file` | 代码/配置文件 | 灰色 |
| `capability` | 能力快照 | 青色 |

每个阶段的 `context_used[]` 会记录引用的知识来源，包括：
- 来源文件路径
- 相关度（high/medium/low）
- 使用摘要
- 引用的具体内容（可选）
```

### 修改四：新增"Agent 日志记录"章节

在 `## Advisory Guidelines` 之前新增：

```markdown
---

## Agent 日志记录（Self-Logging）

Claude 在执行开发任务时，**应当**记录 Agent Session 日志。

### 触发条件

需要记录：
- 实现新功能
- 修复 bug
- 重构代码
- 涉及多文件修改的任务

可不记录：
- 纯对话/问答
- 单文件小修改
- 用户要求不记录

### 规范

遵循 STD-001：
- 位置：`data/sessions/`
- 命名：`{日期}-{序号}-{任务简述}.json`
- 格式：五阶段 + 工具调用详情

### 目的

1. 产生可视化回放的真实数据
2. 自举验证系统
3. 积累 Agent 行为样本

---
```

### 修改五：新增"能力审视"章节

```markdown
## 能力审视（Capability Audit）

Claude Code 能力会随 Anthropic 更新变化，需定期审视。

### 规则

遵循 RULE-001：
- 每周一例行审视
- 版本更新时详细审视
- 发现异常时即时审视

### 产出

- 快照：`data/capability-snapshots/{日期}-capability-snapshot.json`
- 日志：`data/capability-changelog.md`

### 联动

能力变化时需评估更新：SPEC-003、STD-001、可视化组件

---
```

---

## 影响评估

### 需删除/修改的内容

| 位置 | 原内容 | 改为 |
|------|--------|------|
| Immutable Core | 七步骤流程 | 删除 |
| Immutable Core | "不可变"约束 | 移到 Human Approval Required |
| 核心数据字段 | step_id, step_name 等 | phase_id, phase_type, tool_calls 等 |

### 向后兼容

现有 Mock 数据 (`demo-001.json`, `demo-002-failed.json`) 需要迁移到新格式，或标记为"旧格式示例"。

---

## 待批准项

- [ ] 修改一：执行模型移到"需人工批准"层级
- [ ] 修改二：删除七步骤，采用五阶段模型
- [ ] 修改三：更新核心数据字段
- [ ] 修改四：新增 Self-Logging 章节
- [ ] 修改五：新增 Capability Audit 章节

---

## 批准后行动

1. 更新 CLAUDE.md
2. 更新前端类型定义
3. 迁移或标记旧 Mock 数据
4. 开始开发并记录真实日志
