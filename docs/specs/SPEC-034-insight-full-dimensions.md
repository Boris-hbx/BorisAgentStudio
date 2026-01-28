# SPEC-034: 洞察模块多维度完善与数据源配置

> 作者: Boris Huai
> 起草日期: 2026-01-28
> 状态: 实施中

## 问题陈述 (Why)

当前洞察模块存在以下问题：

1. **维度不完整**：组织和事件 Tab 已预留但无对应卡片组件，用户无法查看这两个维度的数据
2. **数据管理不便**：修改数据源（关键字、公司、领袖等）需要直接编辑 JSON 文件
3. **扩展性隐忧**：缺乏统一的配置管理界面

## 目标与成功标准 (DoD)

| # | 验收标准 | 优先级 |
|---|----------|--------|
| 1 | 组织维度卡片可正常展示（含类型、描述、最新动态、为什么重要） | P0 |
| 2 | 事件维度卡片可正常展示（含日期、地点、影响、标签） | P0 |
| 3 | 数据源配置界面可编辑：主题、关键字、权威来源、公司、领袖 | P0 |
| 4 | 配置变更能导出为 JSON 文件，替换后生效 | P0 |
| 5 | 组织/事件维度 Tab 启用（有数据时显示数量） | P0 |

## 非目标 (Out of Scope)

- 后端 Rust 服务改造
- 数据库集成
- 自动化数据采集调度
- 用户认证和权限控制
- 配置的自动保存（需后端支持）

## 技术方案 (How)

### 1. 数据存储决策

**决策：保持 JSON 文件方案，新增配置文件**

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. SQLite 数据库 | 查询灵活、支持关系 | 需要后端改造、增加复杂度 |
| B. JSON + IndexedDB | 浏览器端持久化 | 跨设备不同步、容量受限 |
| C. JSON 文件分层 | 零后端改动、Git 可追踪、简单 | 多用户场景需额外考虑 |

**选择方案 C**

**Rationale**:
1. 当前是单用户本地工具场景
2. 数据量可控（每主题约 100KB）
3. 配置可 Git 追踪，便于版本管理
4. 前端编辑 + 下载 JSON，用户手动替换生效
5. 未来如需多用户/自动保存，可接后端 API

### 2. 数据文件结构

```
frontend/public/data/insights/
├── config.json                    # 全局配置（新增）
├── topics.json                    # 主题列表
└── {topic-id}/
    └── latest.json               # 洞察数据
```

**config.json 结构**:
```json
{
  "trusted_sources": [
    "anthropic.com",
    "openai.com",
    "google.com",
    "deepmind.com",
    "microsoft.com",
    "github.com",
    "arxiv.org",
    "owasp.org"
  ],
  "key_companies": [
    {
      "name": "Anthropic",
      "domain": "anthropic.com",
      "focus": ["AI Safety", "Claude"]
    },
    {
      "name": "OpenAI",
      "domain": "openai.com",
      "focus": ["GPT", "ChatGPT", "Agent"]
    }
  ],
  "tech_leaders": [
    {
      "name": "Dario Amodei",
      "company": "Anthropic",
      "title": "CEO",
      "twitter": "@DarioAmodei"
    },
    {
      "name": "Sam Altman",
      "company": "OpenAI",
      "title": "CEO",
      "twitter": "@sama"
    }
  ]
}
```

### 3. 新增组件

| 组件 | 职责 | 位置 |
|------|------|------|
| `OrgInsightCard.tsx` | 组织动态卡片 | `components/Insight/` |
| `EventInsightCard.tsx` | 事件卡片 | `components/Insight/` |
| `InsightConfigPanel.tsx` | 数据源配置面板 | `components/Insight/` |
| `TopicEditor.tsx` | 主题编辑组件 | `components/Insight/ConfigEditor/` |
| `CompanyEditor.tsx` | 公司编辑组件 | `components/Insight/ConfigEditor/` |
| `LeaderEditor.tsx` | 领袖编辑组件 | `components/Insight/ConfigEditor/` |
| `SourceEditor.tsx` | 权威来源编辑组件 | `components/Insight/ConfigEditor/` |

### 4. 类型定义更新

```typescript
// insight.ts 新增

/** 关键公司 */
export interface KeyCompany {
  name: string
  domain: string
  focus: string[]
  logo?: string
}

/** 技术领袖 */
export interface TechLeader {
  name: string
  company: string
  title: string
  twitter?: string
  avatar?: string
}

/** 全局配置 */
export interface InsightConfig {
  trusted_sources: string[]
  key_companies: KeyCompany[]
  tech_leaders: TechLeader[]
}
```

### 5. 配置保存机制

由于纯前端无法写本地文件，采用：

1. 用户在配置面板编辑
2. 点击"导出配置" → 下载 JSON 文件
3. 用户手动将文件移动到 `frontend/public/data/insights/` 目录
4. 刷新页面加载新配置

**替代方案（未来可选）**：
- 后端 API 写文件
- 使用 File System Access API（需用户授权）

## 交互设计 (UX)

### 主视图更新

```
┌─────────────────────────────────────────────────┐
│ 🔭 AI 洞察           Agent 安全      ⚙️ 配置    │
├─────────────────────────────────────────────────┤
│ 📦项目(6) │ 👤人物(3) │ 🏢组织(2) │ 📅事件(3) │
├─────────────────────────────────────────────────┤
│                                                 │
│  [内容区]                                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 组织卡片设计

```
┌─────────────────────────────────────────────────┐
│ 🏢 OWASP GenAI Security Project       [标准组织]│
├─────────────────────────────────────────────────┤
│ 发布 OWASP Top 10 for Agentic Applications     │
│ 2026，定义 ASI01-ASI10 十大 Agent 安全威胁      │
├─────────────────────────────────────────────────┤
│ 💡 为什么重要                                    │
│ 为 Agent 安全领域提供首个全球公认的威胁分类标准  │
├─────────────────────────────────────────────────┤
│ 🔗 最新动态：2025-12 Black Hat Europe 发布      │
├─────────────────────────────────────────────────┤
│ [安全标准] [ASI Top 10] [行业共识]               │
└─────────────────────────────────────────────────┘
```

### 事件卡片设计

```
┌─────────────────────────────────────────────────┐
│ 📅 VoidLink AI 恶意软件事件           [安全事件]│
│    2026-01 · 全球                               │
├─────────────────────────────────────────────────┤
│ 安全研究人员确认复杂 Linux 恶意软件 VoidLink    │
│ 完全由 AI 创建，原本需要 30 周的工作被压缩到     │
│ 6 天内完成 88,000 行代码                        │
├─────────────────────────────────────────────────┤
│ 📊 影响                                         │
│ 证明 AI Agent 已被用于实际恶意软件开发          │
├─────────────────────────────────────────────────┤
│ [安全事件] [恶意软件] [AI攻击]                   │
└─────────────────────────────────────────────────┘
```

### 配置面板设计

```
┌─────────────────────────────────────────────────┐
│ ⚙️ 配置数据源                          [✕ 关闭]│
├─────────────────────────────────────────────────┤
│ 📋 主题管理                                     │
│ ┌──────────────────────────────────────────────┐│
│ │ 🛡️ Agent 安全  [✓启用] [编辑] [删除]         ││
│ │ 💻 AI 编程     [○禁用] [编辑]                ││
│ │ 🤖 Code Agent  [○禁用] [编辑]                ││
│ │ [+ 添加主题]                                 ││
│ └──────────────────────────────────────────────┘│
│                                                 │
│ 🏢 关键公司                                     │
│ ┌──────────────────────────────────────────────┐│
│ │ Anthropic · OpenAI · Google · Microsoft      ││
│ │ [+ 添加]                                     ││
│ └──────────────────────────────────────────────┘│
│                                                 │
│ 👤 技术领袖                                     │
│ ┌──────────────────────────────────────────────┐│
│ │ Dario Amodei · Sam Altman · Ilya Sutskever  ││
│ │ [+ 添加]                                     ││
│ └──────────────────────────────────────────────┘│
│                                                 │
│ 🔗 权威来源                                     │
│ ┌──────────────────────────────────────────────┐│
│ │ anthropic.com, openai.com, arxiv.org, ...    ││
│ │ [编辑列表]                                   ││
│ └──────────────────────────────────────────────┘│
│                                                 │
│      [导出 config.json]  [导出 topics.json]     │
│                                                 │
│ 💡 提示：下载后请将文件移动到                    │
│    frontend/public/data/insights/ 目录          │
└─────────────────────────────────────────────────┘
```

## 风险清单与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 用户不知道如何替换文件 | 配置无法生效 | 提供清晰的操作提示和路径 |
| 编辑时误操作导致 JSON 格式错误 | 加载失败 | 前端校验 + 错误提示 |
| 配置文件过大 | 加载缓慢 | 限制单个配置项数量 |

## 决策记录 (Decision Log)

| 日期 | 决策 | 理由 | 替代方案 |
|------|------|------|----------|
| 2026-01-28 | 使用 JSON 文件而非数据库 | 零后端改动、Git 可追踪、当前场景足够 | SQLite、IndexedDB |
| 2026-01-28 | 配置采用下载+手动替换 | 纯前端无法写文件 | 后端 API、File System Access API |
| 2026-01-28 | 组织/事件维度 Tab 启用 | 已有数据支持，用户需求明确 | - |

## 实现计划

1. 更新类型定义 (`insight.ts`)
2. 创建 config.json 初始数据
3. 实现 OrgInsightCard 组件
4. 实现 EventInsightCard 组件
5. 更新 InsightView 渲染逻辑
6. 启用组织/事件维度 Tab
7. 实现 InsightConfigPanel 配置面板
8. 实现配置编辑器子组件
9. 添加配置导出功能
10. 更新样式
