/**
 * Insight Service
 *
 * 加载和管理洞察数据
 * 使用 fetch 从 public/data/insights/ 目录加载
 */

import type {
  InsightData,
  InsightTopic,
  TopicsConfig,
  TimeRange,
  ProjectInsight,
  PersonInsight,
  OrgInsight,
  EventInsight,
} from '../types/insight'

// 缓存
let topicsCache: TopicsConfig | null = null
const insightDataCache: Record<string, InsightData> = {}

/** 获取主题配置 */
export async function getTopicsConfig(): Promise<TopicsConfig> {
  if (topicsCache) return topicsCache

  try {
    const response = await fetch('/data/insights/topics.json')
    if (response.ok) {
      topicsCache = await response.json()
      return topicsCache!
    }
  } catch (error) {
    console.error('Failed to load topics config:', error)
  }

  return { topics: [] }
}

/** 获取已启用的主题列表 */
export async function getEnabledTopics(): Promise<InsightTopic[]> {
  const config = await getTopicsConfig()
  return config.topics.filter(t => t.enabled)
}

/** 获取所有主题（包括未启用的） */
export async function getAllTopics(): Promise<InsightTopic[]> {
  const config = await getTopicsConfig()
  return config.topics
}

/** 根据主题 ID 获取洞察数据 */
export async function getInsightData(topicId: string): Promise<InsightData | null> {
  if (insightDataCache[topicId]) {
    return insightDataCache[topicId]
  }

  try {
    const response = await fetch(`/data/insights/${topicId}/latest.json`)
    if (response.ok) {
      const data = await response.json()
      insightDataCache[topicId] = data
      return data
    }
  } catch (error) {
    console.error(`Failed to load insight data for ${topicId}:`, error)
  }

  return null
}

/** 获取日期范围 */
function getDateRange(range: TimeRange): string[] {
  const dates: string[] = []
  const today = new Date()
  const days = range === 'today' ? 1 : range === 'week' ? 7 : 30

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

/** 尝试加载指定日期的数据 */
async function loadDateData(topicId: string, date: string): Promise<InsightData | null> {
  try {
    const response = await fetch(`/data/insights/${topicId}/${date}.json`)
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // 文件不存在，忽略
  }
  return null
}

/** 合并多个洞察数据 */
function mergeInsightData(dataList: InsightData[]): InsightData {
  if (dataList.length === 0) {
    return {
      topic: '',
      generated_at: new Date().toISOString(),
      projects: [],
      people: [],
      organizations: [],
      events: [],
    }
  }

  if (dataList.length === 1) {
    return dataList[0]
  }

  // 项目去重：按 name
  const projectMap = new Map<string, ProjectInsight>()
  // 人物去重：按 name + quote.date
  const personMap = new Map<string, PersonInsight>()
  // 组织去重：按 name
  const orgMap = new Map<string, OrgInsight>()
  // 事件去重：按 name + date
  const eventMap = new Map<string, EventInsight>()

  for (const data of dataList) {
    // 合并项目
    for (const project of data.projects || []) {
      const key = project.name
      if (!projectMap.has(key)) {
        projectMap.set(key, project)
      }
    }

    // 合并人物
    for (const person of data.people || []) {
      const key = `${person.name}-${person.quote?.date || ''}`
      if (!personMap.has(key)) {
        personMap.set(key, person)
      }
    }

    // 合并组织
    for (const org of data.organizations || []) {
      const key = org.name
      if (!orgMap.has(key)) {
        orgMap.set(key, org)
      }
    }

    // 合并事件
    for (const event of data.events || []) {
      const key = `${event.name}-${event.date}`
      if (!eventMap.has(key)) {
        eventMap.set(key, event)
      }
    }
  }

  // 找到最新的 generated_at
  const latestGeneratedAt = dataList
    .map(d => d.generated_at)
    .filter(Boolean)
    .sort()
    .reverse()[0] || new Date().toISOString()

  return {
    topic: 'merged',
    generated_at: latestGeneratedAt,
    projects: Array.from(projectMap.values()),
    people: Array.from(personMap.values()),
    organizations: Array.from(orgMap.values()),
    events: Array.from(eventMap.values()),
  }
}

/** 获取多主题多时间范围的数据 */
export async function getFilteredInsightData(
  topicIds: string[],
  timeRange: TimeRange
): Promise<InsightData> {
  const allData: InsightData[] = []

  if (timeRange === 'today') {
    // 今天：直接加载 latest.json
    for (const topicId of topicIds) {
      const data = await getInsightData(topicId)
      if (data) {
        allData.push(data)
      }
    }
  } else {
    // 一周内/近一个月：加载历史文件
    const dates = getDateRange(timeRange)

    for (const topicId of topicIds) {
      // 先加载 latest.json
      const latestData = await getInsightData(topicId)
      if (latestData) {
        allData.push(latestData)
      }

      // 再尝试加载历史文件
      for (const date of dates) {
        const dateData = await loadDateData(topicId, date)
        if (dateData) {
          allData.push(dateData)
        }
      }
    }
  }

  return mergeInsightData(allData)
}

/** 清除缓存（用于刷新数据） */
export function clearInsightCache(topicId?: string): void {
  if (topicId) {
    delete insightDataCache[topicId]
  } else {
    Object.keys(insightDataCache).forEach(key => delete insightDataCache[key])
    topicsCache = null
  }
}

/** 检查数据是否过期（超过 24 小时） */
export function isDataExpired(data: InsightData): boolean {
  if (!data.generated_at) return true

  const generatedAt = new Date(data.generated_at).getTime()
  const now = Date.now()
  const twentyFourHours = 24 * 60 * 60 * 1000

  return (now - generatedAt) > twentyFourHours
}

/** 格式化更新时间 */
export function formatUpdateTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return '刚刚更新'
  } else if (diffHours < 24) {
    return `${diffHours}小时前更新`
  } else if (diffDays < 7) {
    return `${diffDays}天前更新`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}
