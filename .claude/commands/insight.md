# /insight - 执行每日洞察

获取 AI 行业最新动态，包括 GitHub 热门项目、人物言论、组织动态和重要事件。

## 语法

```
/insight [topic]
```

**参数**:
- `topic`: 洞察主题，可选值见 `topics.json`
  - 不指定时：执行**所有启用的主题**
  - 指定时：只执行指定主题

## 数据存储

每次执行时，数据按日期存储：

```
data/insights/{topic}/
├── latest.json           # 最新数据（始终是当天的副本）
├── 2026-01-28.json       # 当天快照
├── 2026-01-27.json       # 历史数据
└── ...                   # 保留最近 30 天
```

**命名规范**：`{YYYY-MM-DD}.json`

## 数据源

执行前，/insight 会读取以下配置文件：

### 1. topics.json - 主题配置

位置：`frontend/public/data/insights/topics.json`

```json
{
  "topics": [
    {
      "id": "agent-security",
      "name": "Agent 安全",
      "keywords": ["agent security", "llm security", "ai safety"],
      "github_query": "topic:agent-security stars:>50"
    }
  ]
}
```

**作用**：
- `keywords`: 用于 WebSearch 搜索新闻和人物言论
- `github_query`: 用于 GitHub API 搜索项目

### 2. config.json - 全局配置

位置：`frontend/public/data/insights/config.json`

```json
{
  "trusted_sources": ["anthropic.com", "openai.com", ...],
  "key_companies": [{"name": "Anthropic", "domain": "...", "focus": [...]}],
  "tech_leaders": [{"name": "Dario Amodei", "company": "Anthropic", ...}]
}
```

**作用**：
- `trusted_sources`: 新闻搜索时优先选择这些来源
- `key_companies`: 搜索这些公司的官方动态
- `tech_leaders`: 搜索这些领袖的最新言论

## 执行流程

### 1. 读取数据源配置

```
读取 topics.json → 获取主题关键词和 GitHub 查询语句
读取 config.json → 获取权威来源、公司、领袖列表
```

### 2. 搜索 GitHub 项目

使用主题的 `github_query` 搜索：
- 筛选最近 7 天有更新的项目
- 按 Stars 增长排序
- 取 Top 10
- 添加推荐理由和业界评价

### 3. 搜索人物言论

遍历 `tech_leaders` 列表：
- 搜索每位领袖关于主题的最新发言
- 提取言论内容、来源、日期
- 分析背景和为什么重要

### 4. 搜索组织动态

基于 `key_companies` 和主题关键词：
- 搜索公司/机构的官方公告
- 搜索标准组织的发布
- 搜索行业合作动态

### 5. 搜索重要事件

搜索与主题相关的：
- 会议和论坛
- 产品发布
- 安全事件
- 监管动态

### 6. 生成洞察数据

整合所有维度数据，写入：

```
data/insights/{topic}/latest.json
```

格式：
```json
{
  "topic": "agent-security",
  "generated_at": "2026-01-28T14:30:00Z",
  "projects": [
    {
      "name": "owner/repo",
      "description": "...",
      "stars": 5600,
      "stars_history": [5100, 5200, 5300, 5400, 5500, 5550, 5600],
      "growth_rate": "+10%",
      "recommendation": {
        "reason": "...",
        "tags": ["标签1", "标签2"]
      }
    }
  ],
  "people": [
    {
      "name": "Dario Amodei",
      "company": "Anthropic",
      "quote": {
        "text": "...",
        "source": "Twitter",
        "date": "2026-01-27"
      },
      "why_matters": "..."
    }
  ],
  "organizations": [
    {
      "name": "OWASP",
      "type": "标准组织",
      "description": "...",
      "why_matters": "..."
    }
  ],
  "events": [
    {
      "name": "Black Hat Europe",
      "date": "2026-01",
      "description": "...",
      "impact": "..."
    }
  ],
  "news": [...]
}
```

### 7. 同步到前端

```bash
cp data/insights/{topic}/latest.json frontend/public/data/insights/{topic}/
```

## 示例

```
/insight                    # 默认 agent-security 主题
/insight agent-security     # 明确指定主题
/insight ai-coding          # 其他主题
```

## 配置变更后

当你在 Web 配置面板中修改数据源后：

1. 导出配置文件（topics.json / config.json）
2. 将文件移动到 `frontend/public/data/insights/` 目录
3. **执行 `/insight` 使用新配置刷新数据**
4. 刷新页面查看结果

## 注意事项

- 同一天重复执行会覆盖之前的数据
- GitHub API 有速率限制，请勿频繁执行
- 新闻和人物言论结果建议人工筛选确保质量
- 首次添加新主题后，需要执行 `/insight {topic}` 生成初始数据

## 相关文档

- [洞察模块 README](../../docs/insight/README.md) - 完整功能说明
- [SPEC-032](../../docs/specs/SPEC-032-insight-module.md) - 初始设计
- [SPEC-033](../../docs/specs/SPEC-033-insight-enhancement.md) - 增强设计
- [SPEC-034](../../docs/specs/SPEC-034-insight-full-dimensions.md) - 多维度完善

ARGUMENTS: $ARGUMENTS
