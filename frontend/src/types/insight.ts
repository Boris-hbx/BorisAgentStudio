/**
 * Insight Module Types
 *
 * 基于 SPEC-032 + SPEC-033: AI 洞察模块增强版
 */

/** 洞察主题配置 */
export interface InsightTopic {
  id: string
  name: string
  icon: string
  enabled: boolean
  keywords: string[]
  github_query: string
}

/** 主题配置文件 */
export interface TopicsConfig {
  topics: InsightTopic[]
}

/** 洞察维度 */
export type InsightDimension = 'projects' | 'people' | 'organizations' | 'events'

/** 维度配置 */
export interface DimensionConfig {
  id: InsightDimension
  name: string
  icon: string
  enabled: boolean
}

/** 洞察数据（增强版） */
export interface InsightData {
  topic: string
  generated_at: string
  projects: ProjectInsight[]
  people: PersonInsight[]
  organizations: OrgInsight[]
  events: EventInsight[]

  // 兼容旧数据
  github_trending?: GitHubProject[]
  news?: NewsItem[]
}

/** 项目洞察（增强版） */
export interface ProjectInsight {
  name: string
  description: string
  url: string
  stars: number
  forks: number
  language: string
  topics: string[]

  // 趋势数据
  stars_history: number[]         // 7天 Star 历史
  stars_growth_7d: number
  growth_rate: string             // '+15%'

  // 推荐信息
  recommendation: {
    reason: string
    source: string                // 数据来源说明
    tags: string[]
    summary: string
  }

  // 业界评价（可选）
  community_feedback?: {
    positive: string[]
    concerns: string[]
    notable_users?: string[]
  }
}

/** 人物言论 */
export interface PersonInsight {
  name: string
  title: string                   // 'OpenAI CTO'
  company: string
  avatar?: string

  quote: {
    text: string
    source: string                // 'Twitter', 'Blog', 'Conference'
    url: string
    date: string
  }

  context: string                 // 背景说明
  why_matters: string             // 为什么重要
  tags: string[]
}

/** 组织动态 */
export interface OrgInsight {
  name: string
  type: string  // 'company' | 'foundation' | 'research_lab' | '标准组织' | '行业合作' 等
  logo?: string
  description: string
  url: string
  recent_activity: string
  why_matters: string
  tags: string[]
}

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

/** 事件 */
export interface EventInsight {
  name: string
  date: string
  location: string
  description: string
  url: string
  impact: string
  tags: string[]
}

/** GitHub 项目（旧版兼容） */
export interface GitHubProject {
  name: string
  description: string
  url: string
  stars: number
  stars_growth_7d: number
  forks: number
  language: string
  topics: string[]
  updated_at: string
}

/** 新闻条目（旧版兼容） */
export interface NewsItem {
  title: string
  source: string
  url: string
  published_at: string
  summary?: string
  is_trusted?: boolean
}

/** 权威来源域名列表 */
export const TRUSTED_SOURCES = [
  'anthropic.com',
  'openai.com',
  'google.com',
  'deepmind.com',
  'microsoft.com',
  'github.com',
  'arxiv.org',
  'owasp.org',
]

/** 判断是否为权威来源 */
export function isTrustedSource(source: string): boolean {
  return TRUSTED_SOURCES.some(domain => source.includes(domain))
}

/** 维度配置列表 */
export const DIMENSION_CONFIGS: DimensionConfig[] = [
  { id: 'projects', name: '项目', icon: '📦', enabled: true },
  { id: 'people', name: '人物', icon: '👤', enabled: true },
  { id: 'organizations', name: '组织', icon: '🏢', enabled: true },
  { id: 'events', name: '事件', icon: '📅', enabled: true },
]

/** 时间范围类型 */
export type TimeRange = 'today' | 'week' | 'month'

/** 时间范围配置 */
export const TIME_RANGE_CONFIGS: { id: TimeRange; name: string }[] = [
  { id: 'today', name: '今天' },
  { id: 'week', name: '一周内' },
  { id: 'month', name: '近一个月' },
]
