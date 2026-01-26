# BorisAgentStudio

> 用于观察、解释和演进 Code Agent 行为的工程级工作台。
>
> **作者**: Boris Huai

---

## 这是什么

BorisAgentStudio 是一个 Code Agent 全流程可视化 Web 应用。

它不是日志查看器，而是 **认知工具**：

- 将 Agent 的隐性决策过程 **显式化**
- 将"代码是怎么来的" **可追溯**
- 将"失败是因为什么" **可诊断**

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

## 核心概念

### 执行模型 (PRA 循环)

Claude Code 的真实执行是 **感知-推理-行动 (Perceive-Reason-Act)** 循环：

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  感知   │───▶│  推理   │───▶│  行动   │
│Perceive │    │ Reason  │    │   Act   │
└─────────┘    └─────────┘    └─────────┘
     ▲                              │
     └──────── 工具调用结果 ─────────┘
```

### 五阶段分析框架

用于事后分析 Agent 行为（非执行约束）：

> 理解 → 探索 → 规划 → 执行 → 验证

---

## 已实现功能

| 模块 | 组件 | 状态 |
|------|------|------|
| 时序可视化 | Timeline, ToolCallFlow, TimelineNode | 完成 |
| 循环展示 | LoopArrow | 完成 |
| 上下文标记 | ContextMarkers | 完成 |
| 详情面板 | DetailPanel, ToolDetailPanel | 完成 |
| 上下文流转 | ContextFlowChart | 完成 |
| 分层工作流 | PhaseGroupList, PhaseNode | 实施中 |
| 粒子系统 | HeaderParticles, particles engine | 完成 |
| Session 搜索 | SessionSearch | 实施中 |
| 代码差异 | CodeDiffSection | 草稿 |

---

## 快速开始

### 环境要求

- Rust 1.75+
- Node.js 18+
- pnpm (推荐)

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

---

## 端口配置

| 用途 | 端口 | 路径 |
|------|------|------|
| 后端 API | 8080 | /api/v1 |
| 前端开发 | 5173 | / |
| WebSocket | 8080 | /ws |

---

## 项目结构

```
BorisAgentStudio/
├── frontend/          # React + D3.js 前端 (8个组件模块)
├── backend/           # Rust Axum 后端 (4个模块)
├── docs/specs/        # 功能规格文档 (20个 SPEC)
├── rules/             # 工程规则 (5个 RULE)
├── standards/         # 标准规范 (7个 STD)
├── skills/            # Agent 技能 (7个 SKILL)
├── data/              # Session 日志与 Mock 数据
└── CLAUDE.md          # Agent 工程规范
```

---

## 工程资产统计

| 类型 | 数量 | 说明 |
|------|------|------|
| SPEC 文档 | 20 | 功能规格 (001-019，含执行模型) |
| 标准 (STD) | 7 | 日志/编码/API/测试/错误/无障碍/性能 |
| 规则 (RULE) | 5 | 能力审视/截图/Git/代码审查/命名 |
| 技能 (SKILL) | 7 | 粒子系统/搜索/对比/导出/监控/差异/仪表板 |

---

## 文档索引

### 核心规范

- [CLAUDE.md](./CLAUDE.md) - Agent 权限层级与工程规范

### 功能规格 (SPEC)

| 序号 | 文档 | 状态 |
|------|------|------|
| 001 | [项目总览](./docs/specs/SPEC-001-project-overview.md) | 已完成 |
| 002 | [可视化界面设计](./docs/specs/SPEC-002-visualization-design.md) | 已完成 |
| 003 | [执行模型与分析框架](./docs/specs/SPEC-003-claude-code-execution-model.md) | 已完成 |
| 003-data | [数据导入](./docs/specs/SPEC-003-data-import.md) | 已完成 |
| 004 | [项目约定](./docs/specs/SPEC-004-project-conventions.md) | 已完成 |
| 005 | [布局优化](./docs/specs/SPEC-005-layout-optimization.md) | 已完成 |
| 006 | [交互粒子系统](./docs/specs/SPEC-006-interactive-particles.md) | 已完成 |
| 007 | [响应式详情面板](./docs/specs/SPEC-007-responsive-detail-panel.md) | 已完成 |
| 008 | [循环可视化](./docs/specs/SPEC-008-loop-visualization.md) | 已完成 |
| 009 | [上下文类型分化](./docs/specs/SPEC-009-context-type-differentiation.md) | 已完成 |
| 010 | [项目统计命令](./docs/specs/SPEC-010-project-stats-command.md) | 已完成 |
| 011 | [分层工作流可视化](./docs/specs/SPEC-011-hierarchical-workflow-visualization.md) | 实施中 |
| 012 | [顶栏粒子效果](./docs/specs/SPEC-012-header-particles.md) | 已完成 |
| 013 | [项目增强路线图](./docs/specs/SPEC-013-project-enhancement-roadmap.md) | 已完成 |
| 014 | [Session 搜索过滤](./docs/specs/SPEC-014-session-search-filter.md) | 草稿 |
| 015 | [实时监控](./docs/specs/SPEC-015-realtime-monitoring.md) | 草稿 |
| 016 | [Session 对比](./docs/specs/SPEC-016-session-comparison.md) | 草稿 |
| 017 | [导出与分享](./docs/specs/SPEC-017-export-share.md) | 草稿 |
| 018 | [代码差异可视化](./docs/specs/SPEC-018-code-diff-visualization.md) | 草稿 |
| 019 | [插件系统](./docs/specs/SPEC-019-plugin-system.md) | 草稿 |

### 标准规范 (STD)

| 序号 | 文档 | 说明 |
|------|------|------|
| 001 | [Session 日志记录标准](./standards/data/STD-001-agent-session-logging.md) | v3.0，核心数据模型 |
| 002 | [编程规范](./standards/coding/STD-002-coding-standards.md) | TypeScript/Rust 编码标准 |
| 003 | [API 规范](./standards/api/STD-003-api-standards.md) | REST API 设计规范 |
| 004 | [测试规范](./standards/testing/STD-004-testing-standards.md) | 测试策略与覆盖率 |
| 005 | [错误处理](./standards/error/STD-005-error-handling.md) | 错误码与处理模式 |
| 006 | [无障碍设计](./standards/accessibility/STD-006-accessibility.md) | WCAG 2.1 AA |
| 007 | [性能标准](./standards/performance/STD-007-performance.md) | 性能指标与优化 |

### 工程规则 (RULE)

| 序号 | 文档 | 说明 |
|------|------|------|
| 001 | [能力审视机制](./rules/workflow/RULE-001-capability-audit.md) | 定期审视 Claude Code 能力变化 |
| 002 | [截图审查工作流](./rules/workflow/RULE-002-screenshot-review.md) | 用户截图处理流程 |
| 003 | [Git 提交规范](./rules/workflow/RULE-003-git-commit-standards.md) | 提交信息格式 |
| 004 | [代码审查规范](./rules/workflow/RULE-004-code-review.md) | PR 审查检查清单 |
| 005 | [命名约定](./rules/naming/RULE-005-naming-conventions.md) | 文件/变量/组件命名 |

---

## Claude Code 命令

| 命令 | 功能 |
|------|------|
| `/report` | 生成项目代码统计报告 |
| `/refresh` | 刷新 CLAUDE.md 和 README.md |

---

## License

Private - Boris Huai
