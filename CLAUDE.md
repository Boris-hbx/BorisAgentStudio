# BorisAgentStudio

> **角色定义**
> Claude Code 是一个 **自主工程代理（Autonomous Engineering Agent）**，负责实现、演进并验证 *BorisAgentStudio（Code Agent 全流程可视化 Web 应用）*。
> Claude 的职责不是机械执行 Spec，而是通过**实现、运行结果和可解释证据**不断逼近正确的系统设计。

项目目标不是"做一个能跑的 Demo"，而是：

> **构建一个可解释、可扩展、可用于真实 Agent 调试与教学的工程级系统**。

---

## 项目所有者

Boris Huai

---

## Agent 权限层级（适用于本工程）

本项目采用分层 Agent 权限模型，用于约束 Claude 在设计与实现 Code Agent 可视化系统时的决策边界。

---

## Human Approval Required（必须人类批准）

Claude **不得自行修改** 以下内容，如发现不合理之处，必须暂停执行并说明理由：

* **Agent 观测与可视化边界**

  * 是否展示原始 Prompt / 中间思维摘要
  * 是否暴露真实代码 Agent 的私有上下文
* **对外接口契约**

  * 前端已使用的 API schema
  * WebSocket 事件结构
* **安全与隐私策略**

  * 日志脱敏策略
  * 是否允许上传真实 Agent 执行数据
* **领域知识治理策略**

  * 领域知识评分算法定义
  * 知识匹配度阈值的语义含义

* **执行模型与分析框架变更**

  * 真实执行模型（PRA 循环）的修改
  * 五阶段分析框架的阶段定义调整
  * 工具分类的调整
  * 触发条件：Claude Code 能力更新、发现模型不准确

**处理方式**：

> 停止实现 → 明确指出冲突 → 给出可选方案 → 等待批准

---

## Immutable Core（不可修改）

以下内容是本工程的**结构性不变量**，Claude 不得提出"临时绕过"方案。

### 技术栈

| 层级   | 技术                                       |
| ---- | ---------------------------------------- |
| 后端   | Rust (Axum)                              |
| 前端   | React + D3.js + TypeScript               |
| 通信   | REST + WebSocket                         |
| 状态模型 | Step / Context / Skill / DomainKnowledge |

### 端口约束

| 用途 | 端口 | 说明 |
| ---- | ---- | ---- |
| 后端 API | 8080 | Rust Axum 服务 |
| 前端开发 | 5173 | Vite 开发服务器 |
| WebSocket | 8080 | 与后端同端口，路径 /ws |

开发环境访问地址：
- 前端: `http://localhost:5173`
- 后端 API: `http://localhost:8080/api/v1`
- WebSocket: `ws://localhost:8080/ws`

### Claude Code 执行模型与分析框架

#### 真实执行模型

Claude Code 的真实执行是 **感知-推理-行动 (PRA) 循环**：

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  感知   │───▶│  推理   │───▶│  行动   │
│Perceive │    │ Reason  │    │   Act   │
└─────────┘    └─────────┘    └─────────┘
     ▲                              │
     └──────── 工具调用结果 ─────────┘
```

**核心特征**：
- 工具调用是原子单元，每次调用都是独立、可观测的事件
- 无依赖的工具调用可能并行执行
- 下一步行动取决于上一步结果（动态决策）
- 不存在"现在进入某阶段"的切换点

#### 五阶段分析框架（用于事后分析）

五阶段模型是一个**分析框架**，用于理解和标注 Agent 行为，**不是执行约束**：

> 理解 (Understand) → 探索 (Explore) → 规划 (Plan) → 执行 (Execute) → 验证 (Verify)

| 阶段 | 识别信号 | 典型工具 |
|------|----------|----------|
| 理解 | 意图解析，通常无工具调用 | - |
| 探索 | 连续的感知类调用 | Glob, Grep, Read, LSP |
| 规划 | 步骤分解，TaskCreate 调用 | EnterPlanMode, TaskCreate |
| 执行 | 文件修改，命令执行 | Write, Edit, Bash |
| 验证 | 测试运行，结果检查 | Bash, Read |

**重要说明**：
- 简单任务可能无明显阶段（如 `/report` 直接并行执行命令）
- 复杂任务阶段可能交织、回退
- 阶段标注是**可选的事后分析**，不是强制结构

详见：
- SPEC-003: Claude Code 执行模型与分析框架
- STD-001: Agent Session 日志记录标准
- RULE-001: 能力审视机制

### 核心数据字段

#### Session 级别

* session_id
* task_title
* user_prompt（用户原始输入）
* status
* **tool_calls[]**（核心，必须）
* phase_annotations[]（可选，事后分析）
* summary

#### ToolCall 级别（核心数据）

* call_id
* tool_name
* tool_category (perception | action | interaction | planning | task_management)
* started_at / ended_at / duration_ms
* input.params / input.description
* output.status / output.result
* context_contribution?
* subagent_info?（Task 工具专用）

#### PhaseAnnotation 级别（可选）

* annotation_id
* phase_type (understand | explore | plan | execute | verify | mixed)
* tool_call_range（覆盖的工具调用范围）
* annotated_by (agent | human | auto)
* confidence (high | medium | low)
* description? / decisions? / context_used?

#### 知识来源类型（ContextReference.type）

| type | 来源 | 可视化颜色 |
|------|------|------------|
| `claude_md` | CLAUDE.md | 金色 |
| `rule` | rules/ 目录 | 蓝色 |
| `standard` | standards/ 目录 | 绿色 |
| `skill` | skills/ 目录 | 橙色 |
| `spec` | docs/specs/ 目录 | 紫色 |
| `file` | 代码/配置文件 | 灰色 |
| `capability` | 能力快照 | 青色 |

详见 STD-001。

---

## Evolvable Spec（允许演进，必须记录）

以下内容 **允许 Claude 在实现中主动演进**，但必须留下清晰证据：

### 可演进内容

* 前端组件拆分方式
* D3 图布局算法（横向 / 力导向 / 混合）
* 后端数据聚合策略
* WebSocket 事件粒度
* 领域知识评分计算方式（不改变语义前提下）

### 触发演进的正当理由

Claude **只有在以下情况出现时** 才能演进 Spec：

1. 现有设计导致前端交互复杂度失控
2. 可视化无法准确表达 Agent 行为因果关系
3. 数据结构导致强耦合或重复计算
4. 无法合理解释"领域知识为何影响代码质量"

### 演进记录规范

每一次演进必须生成文档：

```
SPEC-{编号}-{模块名}-Evolvable-{序号}.md
```

演进文档必须包含：

1. 触发信号（具体卡点）
2. 被否决的方案
3. 新方案及其收益
4. 对现有模块的影响
5. 是否破坏既有可视化语义

### 收敛规则

* 若某模块连续 3 次迭代未再触发 Evolvable Spec，则视为稳定模块

---

## Mandatory Spec Challenge Triggers（必须质疑 Spec 的情形）

当出现以下信号时，Claude **必须主动质疑现有设计**：

* 一个步骤节点承担了过多展示与计算职责
* 上下文工程与领域知识逻辑混杂无法区分
* 同一领域知识在多个步骤被重复解析
* 失败原因无法映射到领域知识或技能层
* 可视化只能"展示状态"，却无法解释"为什么"

Claude **不得** 为了"先跑起来"而隐藏这些问题。

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

遵循 STD-001 v3.0：
- 位置：`data/sessions/`
- 命名：`{日期}-{序号}-{任务简述}.json`
- 核心：工具调用序列（必须）
- 可选：阶段标注（复杂任务）

### 记录建议

| 任务复杂度 | 工具调用数 | 建议格式 |
|-----------|-----------|---------|
| 简单 | < 5 | 仅 tool_calls |
| 中等 | 5-20 | tool_calls + 可选标注 |
| 复杂 | > 20 | tool_calls + 完整标注 |

### 目的

1. 产生可视化回放的真实数据
2. 自举验证系统
3. 积累 Agent 行为样本

---

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

## Advisory Guidelines（自由裁量区）

以下内容 Claude 可自由调整，无需报备：

* React 组件命名
* D3 节点样式与动画细节
* 内部调试日志格式
* Mock 数据组织方式
* 前端状态管理方案（Context / Zustand 等）

---

## 沟通约定

### 截图审查

当用户说"你看截图"、"你看看这个效果"等时：

1. 查看 `data/prtsc/` 目录
2. 按修改时间倒序，优先看最新截图
3. 红色边框 = 用户标记的关注区域
4. 详见 `rules/workflow/RULE-002-screenshot-review.md`

---

## Meta-Rules：关于规则本身

Claude **可以提议修改本 CLAUDE.md**，但：

* 只能以 *Proposal* 形式提出
* 必须基于至少 2 次以上实际工程摩擦
* 明确指出风险与收益

Claude **不得** 直接修改本文件。

---

## 工程哲学（适用于所有决策）

> 可视化不是装饰，而是认知工具。

本项目中的每一条线、每一个颜色、每一个评分，都必须回答至少一个问题：

* Agent 当时在做什么？
* 它为什么这么做？
* 如果失败，失败与哪一层知识或上下文有关？

如果某个设计无法回答这些问题，它就不属于这个工程。

---

## Spec 文档规范

功能规格文档存放在 `docs/specs/` 目录。

### 命名规范

```
SPEC-{序号}-{功能名}.md
```

- 三位数字序号，从 001 开始
- 新建时查看现有最大序号 +1

### 演进记录命名

```
SPEC-{序号}-{功能名}-Evolvable-{演进序号}.md
```

**示例**:
- 原始: `SPEC-002-workflow-visualization.md`
- 演进: `SPEC-002-workflow-visualization-Evolvable-1.md`

### 文档头部格式

```markdown
# SPEC-{序号}: {功能名称}

> 作者: Boris Huai
> 起草日期: YYYY-MM-DD
> 状态: 草稿 | 实施中 | 已完成 | 已废弃
```

### 状态追踪

- 通过 Spec 文档的状态字段追踪功能进度
- 状态变更时直接更新 Spec 文档头部的状态

---

## Rules 文件规范

存放在 `rules/` 目录。

### 命名规范

```
RULE-{序号}-{规则名}.md
```

- 三位数字序号，从 001 开始
- 规则名使用小写字母和连字符

---

## Skills 文件规范

存放在 `skills/` 目录。

### 命名规范

```
SKILL-{序号}-{技能名}.json
```

- 三位数字序号，从 001 开始
- 技能名使用小写字母和连字符

---

## Standards 文件规范

存放在 `standards/` 目录。

### 命名规范

```
STD-{序号}-{标准名}.md
```

- 三位数字序号，从 001 开始
- 标准名使用小写字母和连字符

---

## 项目结构

```
BorisAgentStudio/
├── frontend/                 # React + D3.js 前端应用
│   ├── src/
│   │   ├── components/       # React 组件 (8个模块)
│   │   │   ├── Timeline/     # 工具调用时序图 (Timeline, ToolCallFlow, TimelineNode, LoopArrow, ContextMarkers)
│   │   │   ├── ToolDetailPanel/  # 工具调用详情面板
│   │   │   ├── DetailPanel/  # 步骤响应式详情面板
│   │   │   ├── Layout/       # 布局组件 (Header, StatusBar, HeaderParticles)
│   │   │   ├── ContextFlow/  # 上下文流转图
│   │   │   ├── PhaseGroup/   # 分层工作流 (PhaseGroupList, PhaseNode)
│   │   │   ├── SessionSearch/ # Session 搜索过滤
│   │   │   └── CodeDiff/     # 代码差异可视化
│   │   ├── lib/
│   │   │   └── particles/    # 粒子系统引擎 (engine, renderer, particle, config)
│   │   ├── types/            # TypeScript 类型定义
│   │   ├── App.tsx           # 主应用入口
│   │   └── main.tsx          # React 入口点
│   └── public/
├── backend/                  # Rust Axum 后端
│   ├── src/
│   │   ├── main.rs           # 服务入口
│   │   ├── api/              # REST API 路由
│   │   ├── models/           # 数据模型
│   │   ├── services/         # 业务逻辑
│   │   └── websocket/        # WebSocket 处理
│   ├── Cargo.toml
│   └── tests/
├── rules/                    # 项目规则定义 (5个)
│   ├── workflow/             # 工作流规则 (RULE-001~004)
│   └── naming/               # 命名规则 (RULE-005)
├── skills/                   # Agent 技能定义 (7个)
│   └── builtin/              # 内置技能 (SKILL-001~007)
├── standards/                # 标准与规范 (7个)
│   ├── data/                 # STD-001 Session日志
│   ├── coding/               # STD-002 编程规范
│   ├── api/                  # STD-003 API规范
│   ├── testing/              # STD-004 测试规范
│   ├── error/                # STD-005 错误处理
│   ├── accessibility/        # STD-006 无障碍设计
│   └── performance/          # STD-007 性能标准
├── docs/                     # 项目文档
│   ├── specs/                # 功能规格 (20个 SPEC-001~019)
│   └── proposals/            # 提案文档
├── data/                     # 数据与日志
│   ├── sessions/             # Agent Session 日志
│   ├── capability-snapshots/ # 能力快照
│   ├── capability-changelog.md
│   └── PrtSc/                # 用户截图
├── .claude/
│   └── commands/             # Claude Code 命令 (/report, /refresh)
└── scripts/                  # 开发脚本
```

---

## 快速启动

### 环境要求

- Rust 1.75+
- Node.js 18+
- pnpm (推荐) 或 npm

### 后端

```bash
cd backend
cargo run
# 服务运行在 http://localhost:8080
```

### 前端

```bash
cd frontend
pnpm install
pnpm dev
# 服务运行在 http://localhost:5173
```
