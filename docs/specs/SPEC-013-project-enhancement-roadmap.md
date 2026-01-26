# SPEC-013: 项目增强路线图

> 作者: Boris Huai
> 起草日期: 2026-01-26
> 状态: 实施中

---

## 概述

本文档从软件工程最佳实践角度，系统性分析 BorisAgentStudio 项目可增强的模块和能力。基于业界 2025-2026 年的技术趋势和标准，提出需要补充的 Standards、Skills、Rules 和功能模块。

---

## 1. 当前状态分析

### 已有资产

| 类别 | 数量 | 内容 |
|------|------|------|
| Specs | 13 | 项目概览、可视化设计、执行模型、数据导入等 |
| Standards | 2 | STD-001 (Session日志), STD-002 (编码规范) |
| Rules | 2 | RULE-001 (能力审视), RULE-002 (截图审查) |
| Skills | 1 | SKILL-001 (交互粒子) |

### 空白区域

| 目录 | 状态 | 用途 |
|------|------|------|
| standards/api/ | 空 | API 规范 |
| standards/visual/ | 空 | 可视化规范 |
| rules/coding/ | 空 | 编码规则 |
| rules/naming/ | 空 | 命名规则 |
| skills/custom/ | 空 | 自定义技能 |
| frontend/src/visualizations/ | 空 | D3.js 可视化模块 |
| frontend/src/hooks/ | 空 | 自定义 Hooks |

---

## 2. 建议新增 Standards

### STD-003: API 规范 (优先级: 高)

**为什么需要**：当前 backend/frontend 通信缺乏正式契约，随着功能增长会导致接口混乱。

**内容范围**：
- REST API 设计原则 (RESTful conventions)
- 端点命名规范 (`/api/v1/sessions/{id}`)
- 请求/响应格式 (JSON Schema)
- 错误码定义 (4xx/5xx 语义)
- WebSocket 事件命名 (`session:update`, `tool:complete`)
- 版本控制策略

**参考**: OpenAPI 3.0 规范

---

### STD-004: 测试规范 (优先级: 高)

**为什么需要**：项目无测试策略，随着复杂度增长会导致回归问题。

**内容范围**：
- 单元测试覆盖率目标 (≥80%)
- 集成测试策略
- E2E 测试框架选型 (Playwright/Cypress)
- 组件测试 (React Testing Library)
- 可视化回归测试 (Visual regression)
- 测试命名约定 (`*.test.ts`, `*.spec.ts`)
- Mock 数据管理

**工具建议**: Vitest + Playwright + React Testing Library

---

### STD-005: 错误处理规范 (优先级: 中)

**为什么需要**：当前错误处理零散，用户看到的错误信息不一致。

**内容范围**：
- 错误分类体系 (用户错误/系统错误/网络错误)
- 前端错误边界 (Error Boundary)
- 用户友好的错误消息
- 错误日志格式
- 重试策略

---

### STD-006: 可访问性规范 (优先级: 中)

**为什么需要**：作为开发者工具，应支持键盘导航和屏幕阅读器。

**内容范围**：
- WCAG 2.1 AA 合规目标
- 键盘导航要求
- 颜色对比度标准
- ARIA 标签使用
- 焦点管理

---

### STD-007: 性能规范 (优先级: 中)

**为什么需要**：Session 数据量大时可能出现性能问题。

**内容范围**：
- 首屏加载时间目标 (<2s)
- Bundle 大小限制 (<500KB gzipped)
- 大数据量渲染策略 (虚拟滚动)
- 懒加载策略
- 缓存策略

---

## 3. 建议新增 Rules

### RULE-003: Git 提交规范 (优先级: 高)

**为什么需要**：统一提交信息格式，便于自动化 changelog 生成。

**内容范围**：
- Conventional Commits 格式 (`feat:`, `fix:`, `docs:`)
- 提交信息模板
- 分支命名 (`feature/`, `bugfix/`, `hotfix/`)
- PR 模板

---

### RULE-004: 代码审查规范 (优先级: 中)

**为什么需要**：确保代码质量和知识共享。

**内容范围**：
- 审查 Checklist
- 审查响应时间期望
- 审查范围 (功能/安全/性能)

---

### RULE-005: 命名约定 (优先级: 低)

**为什么需要**：统一文件和代码命名，降低认知负担。

**内容范围**：
- 文件命名 (kebab-case for files)
- 组件命名 (PascalCase)
- 变量/函数命名 (camelCase)
- 常量命名 (UPPER_SNAKE_CASE)
- CSS 类命名 (BEM 或项目约定)

---

## 4. 建议新增 Skills

### SKILL-002: Session 对比分析 (优先级: 高)

**为什么需要**：SPEC-001 提到"多 Session 对比"是 MVP 范围外，但这是理解 Agent 行为演进的关键能力。

**功能**：
- 两个 Session 的 diff 视图
- 工具调用序列对比
- 执行时间对比
- 成功/失败原因对比

---

### SKILL-003: Session 搜索与过滤 (优先级: 高)

**为什么需要**：随着 Session 数量增长，需要快速定位特定记录。

**功能**：
- 按工具名搜索
- 按时间范围过滤
- 按状态过滤 (成功/失败)
- 按关键词搜索 (user_prompt, output)

---

### SKILL-004: Session 导出与分享 (优先级: 中)

**为什么需要**：支持团队协作和问题报告。

**功能**：
- 导出为 JSON
- 导出为 Markdown 报告
- 导出为 PNG/SVG 图片
- 生成分享链接

---

### SKILL-005: 实时 Agent 监控 (优先级: 高)

**为什么需要**：当前只能回放历史 Session，无法实时观察正在执行的 Agent。

**功能**：
- WebSocket 实时推送
- 工具调用实时渲染
- 执行状态实时更新
- 进度指示器

---

### SKILL-006: 代码 Diff 可视化 (优先级: 中)

**为什么需要**：Agent 修改代码时，用户需要清晰看到变更内容。

**功能**：
- Side-by-side diff 视图
- Inline diff 视图
- 语法高亮
- 变更统计

---

### SKILL-007: 性能分析仪表板 (优先级: 低)

**为什么需要**：帮助优化 Agent 执行效率。

**功能**：
- 工具调用时间分布
- 瓶颈识别
- 并行度分析
- 资源消耗统计

---

## 5. 建议新增功能 Specs

### SPEC-014: Session 搜索与过滤

对应 SKILL-003，详细设计搜索 UI 和过滤逻辑。

### SPEC-015: 实时监控模式

对应 SKILL-005，详细设计 WebSocket 协议和实时 UI 更新。

### SPEC-016: Session 对比视图

对应 SKILL-002，详细设计对比 UI 布局和 diff 算法。

### SPEC-017: 导出与分享

对应 SKILL-004，详细设计导出格式和分享机制。

### SPEC-018: 代码变更可视化

对应 SKILL-006，详细设计 diff 视图组件。

### SPEC-019: 插件/扩展系统

**描述**：支持第三方扩展可视化能力。

**理由**：不同团队可能有不同的可视化需求，插件系统提供扩展点。

---

## 6. 基础设施改进

### CI/CD Pipeline (优先级: 高)

**当前状态**：无 CI/CD 配置

**建议**：
- GitHub Actions 配置
- 自动化测试运行
- 代码质量检查 (ESLint, TypeScript)
- 自动化构建和部署

### 开发工具链 (优先级: 中)

**建议**：
- Storybook 组件文档
- API 文档生成 (OpenAPI)
- Changeset/Changesets 版本管理

### 监控与可观测性 (优先级: 低)

**参考业界趋势**：OpenTelemetry 已成为遥测数据收集的事实标准。

**建议**：
- 错误追踪 (Sentry)
- 性能监控 (Web Vitals)
- 使用分析 (可选)

---

## 7. 优先级矩阵

| 优先级 | Standards | Rules | Skills | Specs |
|--------|-----------|-------|--------|-------|
| **高** | STD-003 (API), STD-004 (测试) | RULE-003 (Git) | SKILL-002 (对比), SKILL-003 (搜索), SKILL-005 (实时) | SPEC-014, 015, 016 |
| **中** | STD-005 (错误), STD-006 (可访问性), STD-007 (性能) | RULE-004 (审查) | SKILL-004 (导出), SKILL-006 (Diff) | SPEC-017, 018 |
| **低** | - | RULE-005 (命名) | SKILL-007 (性能分析) | SPEC-019 |

---

## 8. 实施路线图

### Phase 1: 基础规范 (2-3 周)

1. 创建 STD-003 API 规范
2. 创建 STD-004 测试规范
3. 创建 RULE-003 Git 提交规范
4. 配置 CI/CD Pipeline

### Phase 2: 核心功能 (4-6 周)

1. 实现 SKILL-003 搜索过滤 + SPEC-014
2. 实现 SKILL-005 实时监控 + SPEC-015
3. 创建 STD-005 错误处理规范

### Phase 3: 高级功能 (4-6 周)

1. 实现 SKILL-002 Session 对比 + SPEC-016
2. 实现 SKILL-004 导出分享 + SPEC-017
3. 创建 STD-006 可访问性规范

### Phase 4: 完善与优化 (持续)

1. 实现 SKILL-006 代码 Diff 可视化
2. 实现 SKILL-007 性能分析
3. 探索 SPEC-019 插件系统

---

## 9. 决策记录

### 为什么选择这些优先级？

1. **STD-003/004 最高优先**：没有 API 规范和测试，项目无法可靠扩展
2. **搜索/实时监控优先**：这是 Agent 可视化工具的核心使用场景
3. **Session 对比次之**：需要先有足够的 Session 数据积累
4. **插件系统最后**：需要核心功能稳定后才考虑扩展性

### 参考来源

- [Observability Best Practices 2026](https://spacelift.io/blog/observability-best-practices)
- [AI Agent Observability Platforms](https://o-mega.ai/articles/top-5-ai-agent-observability-platforms-the-ultimate-2026-guide)
- [React TypeScript Project Structure](https://medium.com/@tusharupadhyay691/effective-react-typescript-project-structure-best-practices-for-scalability-and-maintainability-bcbcf0e09bd5)
- [TypeScript Best Practices 2025](https://dev.to/mitu_mariam/typescript-best-practices-in-2025-57hb)

---

## 10. 相关文档

- [CLAUDE.md](../../CLAUDE.md) - 项目核心规范
- [STD-001](../../standards/data/STD-001-agent-session-logging.md) - Session 日志标准
- [STD-002](../../standards/coding/STD-002-coding-standards.md) - 编码规范
- [SPEC-001](./SPEC-001-project-overview.md) - 项目概览
