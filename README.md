# BorisAgentStudio

> **Code Agent 全流程可视化工作台** — 让 AI 编程的每一步都可观测、可解释、可追溯
>
> **作者**: Boris Huai

---

## 核心理念

BorisAgentStudio 不是日志查看器，而是 **理解 AI+软件工程协作的认知工具**：

| 能力 | 说明 |
|------|------|
| 🔍 **可观测** | 将 Agent 的隐性决策过程显式化 |
| 📖 **可解释** | 理解"代码是怎么来的"、"为什么这么做" |
| 🔬 **可追溯** | 定位"失败是因为什么"、"哪个环节出了问题" |

---

## 功能模块

### 🎼 HarmonyStudio - 工作流可视化

核心可视化引擎，展示 Agent 执行的完整生命周期：

- **Timeline** - 工具调用时序图，展示 PRA (感知-推理-行动) 循环
- **ContextFlow** - 上下文流转可视化
- **PhaseGroup** - 五阶段分析框架 (理解→探索→规划→执行→验证)
- **DetailPanel** - 响应式详情面板
- **LoopArrow** - 循环依赖可视化

### 🔮 AI 洞察 (Insight Module)

追踪 AI 行业最新动态，支持 5 大主题：

| 主题 | 图标 | 说明 |
|------|------|------|
| Agent 安全 | 🛡️ | LLM/Agent 安全防护、红队测试、漏洞研究 |
| 代码大模型 | 🧠 | 代码生成模型、基座能力、评测基准 |
| Code Agent | 🤖 | 自主编程 Agent、多 Agent 协作、SWE-bench |
| MCP 生态 | 🔌 | Model Context Protocol、工具调用、Agent 集成 |
| AI 开发工具 | 🛠️ | AI 编程助手、IDE 插件、开发体验 |

**特性**：
- 多维度数据展示：项目、人物、组织、事件、新闻
- 主题多选筛选 + 时间维度筛选 (今天/一周内/近一个月)
- 按日期存储历史数据，支持时间回溯

### ⚔️ 运动员评估 (Athlete Evaluation)

击剑运动员数据可视化与评估模块 (Demo)。

---

## 自定义命令系统

BorisAgentStudio 提供强大的自定义命令扩展能力：

| 命令 | 功能 | 说明 |
|------|------|------|
| `/insight` | 执行每日洞察 | 自动采集 5 大主题的最新数据 |
| `/team` | 多 Agent 协作 | 启动团队协作模式完成复杂任务 |
| `/report` | 项目统计报告 | 生成代码行数、文件分布等统计 |
| `/refresh` | 刷新核心文档 | 更新 CLAUDE.md 和 README.md |
| `/cardtransfer` | UI 卡片转换 | 转换 UI 卡片格式 |

命令定义位置：`.claude/commands/`

---

## 多 Agent 协作模式

使用 `/team` 命令启动多 Agent 团队协作，支持复杂任务的结构化执行：

```
/team boris <任务描述>
```

### Boris's Team 角色配置

| 角色 | 图标 | 职责 |
|------|------|------|
| Product Owner | 👔 | 定义目标、DoD、取舍决策 |
| Architect | 🏛️ | 设计方案、维护 Spec |
| Challenger | 🛡️ | 质疑技术风险 |
| Design Authority | 🎨 | 质疑体验风险 |
| Developer | 👨‍💻 | 按 Spec 实现 |
| Reviewer | 🔍 | 审查质量、验证 DoD |

### 执行流程

```
👔 PO 初始化 → 🏛️ Architect 设计 → 🛡️🎨 并行质疑 → 🏛️ 回应更新 → 👨‍💻 实现 → 🔍 审查 → 👔 确认完成
```

**强制产出**：
- SPEC 文档 (`docs/specs/`)
- Agent 协作日志 (`data/sessions/`)
- 决策 Rationale 记录

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端 | Rust (Axum) | 0.7 |
| 前端 | React + D3.js + TypeScript | React 18.2, D3 7.8.5 |
| 状态管理 | Zustand | 4.4.7 |
| 构建工具 | Vite | 5.0.8 |
| 通信 | REST + WebSocket | - |

---

## 快速开始

### 环境要求

- Rust 1.75+
- Node.js 18+
- pnpm (推荐)

### 启动服务

```bash
# 后端
cd backend && cargo run
# 服务运行在 http://localhost:8080

# 前端
cd frontend && pnpm install && pnpm dev
# 服务运行在 http://localhost:5173
```

### 端口配置

| 用途 | 端口 | 路径 |
|------|------|------|
| 后端 API | 8080 | /api/v1 |
| 前端开发 | 5173 | / |
| WebSocket | 8080 | /ws |

---

## 项目结构

```
BorisAgentStudio/
├── frontend/                 # React + D3.js 前端
│   └── src/components/       # 12 个功能模块
│       ├── HarmonyStudio/    # 核心可视化引擎
│       ├── Insight/          # AI 洞察模块
│       ├── Timeline/         # 时序可视化
│       ├── ContextFlow/      # 上下文流转
│       ├── PhaseGroup/       # 阶段分组
│       └── ...
├── backend/                  # Rust Axum 后端
├── .claude/commands/         # 自定义命令 (5 个)
├── teams/                    # 多 Agent 团队配置 (3 个)
├── docs/specs/               # 功能规格文档
├── standards/                # 标准规范
├── rules/                    # 工程规则
├── skills/                   # Agent 技能定义
├── data/
│   ├── sessions/             # Agent 协作日志
│   └── insights/             # 洞察数据存储
└── CLAUDE.md                 # Agent 工程规范
```

---

## 工程资产统计

| 类型 | 数量 | 说明 |
|------|------|------|
| 前端组件 | 12 模块 | HarmonyStudio, Insight, Timeline, etc. |
| SPEC 文档 | 37 | 功能规格 (SPEC-001 ~ SPEC-036) |
| 标准 (STD) | 10 | 日志/编码/API/测试/协作等规范 |
| 规则 (RULE) | 7 | 能力审视/截图/Git/代码审查/命名等 |
| 技能 (SKILL) | 11 | 粒子系统/搜索/对比/导出/洞察等 |
| 团队配置 | 3 | balanced, risk-aware, boris-team |
| 自定义命令 | 5 | insight, team, report, refresh, cardtransfer |
| Session 日志 | 34+ | 真实 Agent 协作记录 |

---

## 设计亮点

### 1. PRA 执行模型

基于 Claude Code 真实行为抽象的 **感知-推理-行动 (Perceive-Reason-Act)** 循环模型：

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  感知   │───▶│  推理   │───▶│  行动   │
│Perceive │    │ Reason  │    │   Act   │
└─────────┘    └─────────┘    └─────────┘
     ▲                              │
     └──────── 工具调用结果 ─────────┘
```

### 2. 五阶段分析框架

事后分析 Agent 行为的认知框架：

> **理解** → **探索** → **规划** → **执行** → **验证**

### 3. 多 Agent 协作模式

将复杂任务分解为多角色协作，确保：
- 每个决策有明确的 rationale
- 每个方案经过质疑和验证
- 每次执行产出完整的 Spec 和日志

### 4. 自举系统

BorisAgentStudio 使用自身记录的 Session 日志作为可视化数据源，实现 **"用 Agent 开发 Agent 可视化工具"** 的自举。

---

## 核心规范

- [CLAUDE.md](./CLAUDE.md) - Agent 权限层级与工程规范
- [docs/insight/README.md](./docs/insight/README.md) - AI 洞察模块文档

---

## License

Private - Boris Huai
