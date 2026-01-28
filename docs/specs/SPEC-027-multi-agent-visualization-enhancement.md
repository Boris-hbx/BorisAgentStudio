# SPEC-027: 多 Agent 协作可视化增强

> 作者: Boris Huai
> 起草日期: 2026-01-27
> 状态: 实施中

---

## 问题陈述 (Why)

当前多 Agent 协作 Session 的可视化存在以下问题：

1. **红框1 - 团队标识无用**：顶部 "BORIS'S TEAM" 和角色图标仅作静态展示，没有交互价值
2. **红框2 - 角色不可见**：Timeline 工具调用流只展示工具名称，无法区分"谁在执行"
3. **红框3 - 数据利用不足**：详情面板只展示简单文本，日志中的结构化数据（goals, risks, decisions）未被利用

## 目标 (DoD)

1. **红框1**：将静态团队标识改为角色活跃度可视化条，支持点击高亮过滤
2. **红框2**：在工具调用节点上显示执行角色标识
3. **红框3**：详情面板智能渲染结构化数据（goals, risks, checklist 等）

## 非目标 (Out of Scope)

- 不修改日志格式（STD-001）
- 不实现后端
- 不支持实时协作

---

## 技术方案

### 1. 角色活跃度条（替换红框1）

**组件**：`RoleActivityBar`

**位置**：`Timeline.tsx` 的原团队徽章位置

**数据来源**：从 `tool_calls` 的 `call_id` 前缀解析角色统计

```typescript
interface RoleActivity {
  role: string       // 'product_owner' | 'architect' | ...
  icon: string       // '👔' | '🏛️' | ...
  callCount: number  // 该角色的工具调用数
  percentage: number // 占比
}
```

**交互**：
- 点击角色条 → 高亮该角色的所有节点
- 再次点击 → 取消高亮
- 支持多选

### 2. 角色增强的工具调用节点（红框2）

**组件**：`ToolCallChip` 增强

**角色解析规则**：

```typescript
const ROLE_PREFIXES: Record<string, string> = {
  'po': 'product_owner',
  'arch': 'architect',
  'architect': 'architect',
  'challenger': 'challenger',
  'da': 'design_authority',
  'design': 'design_authority',
  'dev': 'developer',
  'developer': 'developer',
  'reviewer': 'reviewer',
}

function parseRoleFromCallId(callId: string): string | null {
  const prefix = callId.split('-')[0]
  return ROLE_PREFIXES[prefix] || null
}
```

**视觉设计**：
```
┌──────────────────────────────────────┐
│ 👔 │ 1 │ 初始化 Spec │ 完成        │
└──────────────────────────────────────┘
 角色   序号   工具名      输出摘要
```

### 3. 结构化详情面板（红框3）

**组件**：`ToolDetailPanel` 重构

**数据映射规则**：

| result 字段 | 渲染组件 | 说明 |
|-------------|----------|------|
| `problem_statement` | 问题陈述卡片 | 紫色边框 |
| `goals` | 目标列表 | 绿色勾号 |
| `non_goals` | 非目标列表 | 灰色 |
| `risk_list` | 风险卡片 | 红/橙/黄 按级别 |
| `challenger_responses` | 风险响应表 | 接受/拒绝/降级 |
| `design_authority_responses` | 体验响应表 | 同上 |
| `spec_updates` | 更新列表 | 蓝色标签 |
| `state_machine` | 状态机图 | 表格展示 |
| `dimensions` / `colors` | 设计参数 | 键值对 |
| `checklist` | 审查清单 | 通过✓/未通过✗ |
| `dod_checklist` | DoD 验证 | 证据展示 |
| `files_created` / `files_modified` | 文件列表 | 带图标 |

**智能渲染逻辑**：

```typescript
function renderStructuredResult(result: Record<string, unknown>) {
  const renderers: Record<string, (data: unknown) => ReactNode> = {
    problem_statement: renderProblemStatement,
    goals: renderGoalsList,
    risk_list: renderRiskCards,
    checklist: renderChecklist,
    // ...
  }

  return Object.entries(result).map(([key, value]) => {
    if (key === 'display') return null // 已在头部显示
    const renderer = renderers[key]
    return renderer ? renderer(value) : renderGenericObject(key, value)
  })
}
```

---

## 文件变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `components/Timeline/Timeline.tsx` | 修改 | 替换团队徽章为 RoleActivityBar |
| `components/Timeline/RoleActivityBar.tsx` | 新增 | 角色活跃度条组件 |
| `components/Timeline/RoleActivityBar.css` | 新增 | 样式 |
| `components/PhaseGroup/PhaseNode.tsx` | 修改 | ToolCallChip 添加角色标识 |
| `components/ToolDetailPanel/ToolDetailPanel.tsx` | 重构 | 结构化数据渲染 |
| `components/ToolDetailPanel/ResultRenderers.tsx` | 新增 | 各类结构化数据渲染器 |
| `utils/roleUtils.ts` | 新增 | 角色解析和统计工具 |

---

## 决策记录

### D1: 角色解析方式

**决策**：从 `call_id` 前缀解析角色

**理由**：
- 现有日志已使用 `po-001`, `architect-001` 等命名
- 无需修改日志格式
- 实现简单

**替代方案**（被否决）：
- 在 ToolCall 中新增 `role` 字段 - 需修改 STD-001
- 从 `input.description` 解析 - 不可靠

### D2: 详情面板渲染策略

**决策**：使用 key-renderer 映射 + 泛型 fallback

**理由**：
- 支持已知结构的精美渲染
- 未知字段也能显示（JSON 格式）
- 可扩展

---

## 风险与缓解

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| call_id 前缀不一致 | 中 | 提供 fallback 默认角色 |
| 结构化数据字段不固定 | 中 | 泛型 JSON 渲染兜底 |
| 角色条过长（>6 角色） | 低 | 超过 6 个显示 "更多" |

---

## 验收标准

1. 单 Agent Session：不显示角色活跃度条
2. 多 Agent Session：
   - 角色活跃度条显示各角色调用占比
   - 点击角色可高亮对应节点
3. 工具调用节点显示角色图标
4. 详情面板正确渲染：goals, risks, checklist 等结构化数据
