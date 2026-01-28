# 洞察模块 (Insight Module)

> AI 行业动态追踪与可视化

## 功能概述

洞察模块帮助用户追踪 AI 行业最新动态，包括：
- **热门项目**：GitHub 上与关注领域相关的快速增长项目
- **人物言论**：技术领袖的重要观点和表态
- **组织动态**：行业组织、标准机构的最新活动
- **重要事件**：会议、发布、安全事件等

## 四大维度

| 维度 | 图标 | 内容 | 数据来源 |
|------|------|------|----------|
| 项目 | 📦 | GitHub 热门项目、Star 趋势、推荐理由、业界评价 | GitHub API + WebSearch |
| 人物 | 👤 | 技术领袖言论、观点背景、为什么重要 | WebSearch + 人工筛选 |
| 组织 | 🏢 | 公司/机构动态、标准发布、行业合作 | WebSearch |
| 事件 | 📅 | 会议、发布、事件、影响分析 | WebSearch |

## 数据源配置

洞察模块使用三层数据文件：

```
frontend/public/data/insights/
├── config.json                    # 全局配置
├── topics.json                    # 主题列表
└── {topic-id}/
    └── latest.json               # 洞察数据
```

### 1. config.json - 全局配置

定义跨主题共享的配置：

```json
{
  "trusted_sources": [           // 权威来源域名
    "anthropic.com",
    "openai.com",
    "arxiv.org"
  ],
  "key_companies": [             // 关键公司
    {
      "name": "Anthropic",
      "domain": "anthropic.com",
      "focus": ["AI Safety", "Claude"]
    }
  ],
  "tech_leaders": [              // 技术领袖
    {
      "name": "Dario Amodei",
      "company": "Anthropic",
      "title": "CEO",
      "twitter": "@DarioAmodei"
    }
  ]
}
```

**用途**：
- `trusted_sources`: /insight 搜索新闻时优先选择这些来源
- `key_companies`: 人物言论模块关联公司信息
- `tech_leaders`: 人物言论模块追踪这些人的公开发言

### 2. topics.json - 主题列表

定义可追踪的洞察主题：

```json
{
  "topics": [
    {
      "id": "agent-security",      // 唯一标识
      "name": "Agent 安全",         // 显示名称
      "icon": "🛡️",                // 图标
      "enabled": true,             // 是否启用
      "keywords": [                // 搜索关键词
        "agent security",
        "llm security",
        "ai safety"
      ],
      "github_query": "topic:agent-security stars:>50"  // GitHub 搜索语句
    }
  ]
}
```

**用途**：
- `keywords`: /insight 执行时用于 WebSearch 新闻搜索
- `github_query`: /insight 执行时用于 GitHub API 搜索项目

### 3. latest.json - 洞察数据

存储某个主题的最新洞察结果：

```json
{
  "topic": "agent-security",
  "generated_at": "2026-01-28T14:30:00Z",
  "projects": [...],           // 项目洞察
  "people": [...],             // 人物言论
  "organizations": [...],      // 组织动态
  "events": [...],             // 事件
  "news": [...]                // 新闻（可选）
}
```

## /insight 命令工作流程

执行 `/insight [topic]` 时的完整流程：

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 读取数据源配置                                               │
│     ├─ topics.json → 获取主题关键词和 GitHub 查询语句            │
│     └─ config.json → 获取权威来源、公司、领袖列表                │
├─────────────────────────────────────────────────────────────────┤
│  2. 搜索 GitHub 项目                                             │
│     ├─ 使用 github_query 搜索                                   │
│     ├─ 筛选 7 天内有更新的项目                                   │
│     └─ 按 Star 增长排序，取 Top 10                              │
├─────────────────────────────────────────────────────────────────┤
│  3. 搜索行业新闻                                                 │
│     ├─ 使用 keywords 构建搜索查询                                │
│     ├─ 优先 trusted_sources 来源                                │
│     └─ 搜索最近 7 天的新闻                                       │
├─────────────────────────────────────────────────────────────────┤
│  4. 搜索人物言论                                                 │
│     ├─ 遍历 tech_leaders 列表                                   │
│     ├─ 搜索每位领袖关于主题的最新发言                            │
│     └─ 提取言论、来源、背景                                      │
├─────────────────────────────────────────────────────────────────┤
│  5. 搜索组织动态和事件                                           │
│     ├─ 搜索 key_companies 的官方公告                            │
│     └─ 搜索行业会议、标准发布等事件                              │
├─────────────────────────────────────────────────────────────────┤
│  6. 生成洞察数据                                                 │
│     ├─ 整合项目、人物、组织、事件数据                            │
│     ├─ 添加推荐理由、为什么重要等分析                            │
│     └─ 写入 data/insights/{topic}/latest.json                  │
├─────────────────────────────────────────────────────────────────┤
│  7. 同步到前端                                                   │
│     └─ 复制到 frontend/public/data/insights/{topic}/           │
└─────────────────────────────────────────────────────────────────┘
```

### 数据源使用详解

| 配置项 | 使用阶段 | 作用 |
|--------|----------|------|
| `topics[].keywords` | 新闻搜索 | 构建 WebSearch 查询 |
| `topics[].github_query` | 项目搜索 | GitHub API 搜索参数 |
| `config.trusted_sources` | 新闻筛选 | 标记权威来源，优先展示 |
| `config.key_companies` | 组织动态 | 追踪这些公司的官方动态 |
| `config.tech_leaders` | 人物言论 | 追踪这些领袖的公开发言 |

## 配置变更流程

当你在 Web 配置面板中修改数据源后：

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 在配置面板中编辑                                             │
│     ├─ 添加/删除/修改主题                                        │
│     ├─ 添加/删除/修改公司                                        │
│     ├─ 添加/删除/修改技术领袖                                    │
│     └─ 修改权威来源列表                                          │
├─────────────────────────────────────────────────────────────────┤
│  2. 导出配置文件                                                 │
│     ├─ 点击 "导出 topics.json"                                  │
│     └─ 点击 "导出 config.json"                                  │
├─────────────────────────────────────────────────────────────────┤
│  3. 替换配置文件                                                 │
│     └─ 将下载的文件移动到 frontend/public/data/insights/        │
├─────────────────────────────────────────────────────────────────┤
│  4. 执行 /insight 刷新数据                                       │
│     └─ 运行 /insight {topic} 使用新配置获取最新数据              │
├─────────────────────────────────────────────────────────────────┤
│  5. 刷新页面查看结果                                             │
│     └─ 前端将加载更新后的洞察数据                                │
└─────────────────────────────────────────────────────────────────┘
```

## 文件结构

```
BorisAgentStudio/
├── .claude/commands/
│   └── insight.md                    # /insight 命令定义
├── frontend/
│   ├── public/data/insights/
│   │   ├── config.json               # 全局配置
│   │   ├── topics.json               # 主题列表
│   │   └── agent-security/
│   │       └── latest.json           # 洞察数据
│   └── src/components/Insight/
│       ├── InsightView.tsx           # 主视图
│       ├── InsightTabs.tsx           # 维度切换
│       ├── InsightConfigPanel.tsx    # 配置面板
│       ├── ProjectInsightCard.tsx    # 项目卡片
│       ├── PersonInsightCard.tsx     # 人物卡片
│       ├── OrgInsightCard.tsx        # 组织卡片
│       └── EventInsightCard.tsx      # 事件卡片
├── data/insights/
│   └── agent-security/
│       └── latest.json               # 源数据（同步到 frontend/public）
└── docs/
    ├── insight/
    │   └── README.md                 # 本文档
    └── specs/
        ├── SPEC-032-insight-module.md
        ├── SPEC-033-insight-enhancement.md
        └── SPEC-034-insight-full-dimensions.md
```

## 扩展指南

### 添加新主题

1. 编辑 `topics.json`，添加新主题配置
2. 创建 `data/insights/{new-topic-id}/` 目录
3. 执行 `/insight {new-topic-id}` 生成初始数据

### 添加新数据源

1. 编辑 `config.json`，添加新公司/领袖
2. 执行 `/insight` 重新获取数据

### 自定义搜索策略

修改 `.claude/commands/insight.md` 中的搜索逻辑。

## 相关文档

- [SPEC-032: 洞察模块](../specs/SPEC-032-insight-module.md)
- [SPEC-033: 洞察模块增强](../specs/SPEC-033-insight-enhancement.md)
- [SPEC-034: 多维度完善](../specs/SPEC-034-insight-full-dimensions.md)
