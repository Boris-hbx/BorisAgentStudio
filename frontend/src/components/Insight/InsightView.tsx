/**
 * InsightView - AI 洞察主视图（增强版）
 *
 * 基于 SPEC-032 + SPEC-033 + SPEC-036
 */

import { useState, useEffect } from 'react'
import type { InsightData, InsightTopic, InsightDimension, TimeRange } from '../../types/insight'
import {
  getEnabledTopics,
  getFilteredInsightData,
  isDataExpired,
  formatUpdateTime,
} from '../../services/insightService'
import { InsightTabs } from './InsightTabs'
import { InsightFilters } from './InsightFilters'
import { ProjectInsightCard } from './ProjectInsightCard'
import { PersonInsightCard } from './PersonInsightCard'
import { OrgInsightCard } from './OrgInsightCard'
import { EventInsightCard } from './EventInsightCard'
import { InsightConfigPanel } from './InsightConfigPanel'
import { EmptyState } from './EmptyState'
import './InsightView.css'

export function InsightView() {
  const [enabledTopics, setEnabledTopics] = useState<InsightTopic[]>([])
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('today')
  const [activeDimension, setActiveDimension] = useState<InsightDimension>('projects')
  const [insightData, setInsightData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)

  // 加载主题配置
  useEffect(() => {
    async function loadTopics() {
      const topics = await getEnabledTopics()
      setEnabledTopics(topics)
      if (topics.length > 0 && selectedTopicIds.length === 0) {
        // 默认选中所有启用的主题
        setSelectedTopicIds(topics.map(t => t.id))
      }
      setLoading(false)
    }
    loadTopics()
  }, [])

  // 加载洞察数据
  useEffect(() => {
    if (selectedTopicIds.length === 0) return

    async function loadData() {
      setLoading(true)
      const data = await getFilteredInsightData(selectedTopicIds, timeRange)
      setInsightData(data)
      setLoading(false)
    }
    loadData()
  }, [selectedTopicIds, timeRange])

  const expired = insightData ? isDataExpired(insightData) : false

  // 渲染内容区
  const renderContent = () => {
    if (loading) {
      return <div className="insight-loading">加载中...</div>
    }

    if (!insightData || selectedTopicIds.length === 0) {
      return <EmptyState topicId={selectedTopicIds[0] || ''} />
    }

    switch (activeDimension) {
      case 'projects':
        // 优先使用新的 projects 格式，兼容旧的 github_trending
        const projects = insightData.projects || []
        const legacyProjects = insightData.github_trending || []

        if (projects.length === 0 && legacyProjects.length === 0) {
          return (
            <div className="dimension-empty">
              <span className="empty-icon">📦</span>
              <span className="empty-text">暂无项目数据</span>
            </div>
          )
        }

        return (
          <div className="projects-list">
            {projects.map((project) => (
              <ProjectInsightCard key={project.name} project={project} />
            ))}
            {/* 兼容旧数据：转换为新格式显示 */}
            {projects.length === 0 && legacyProjects.map((p) => (
              <ProjectInsightCard
                key={p.name}
                project={{
                  ...p,
                  stars_history: [],
                  growth_rate: `+${Math.round((p.stars_growth_7d / p.stars) * 100)}%`,
                  recommendation: {
                    reason: p.description,
                    source: 'GitHub',
                    tags: p.topics?.slice(0, 3) || [],
                    summary: p.description,
                  },
                }}
              />
            ))}
          </div>
        )

      case 'people':
        const people = insightData.people || []
        if (people.length === 0) {
          return (
            <div className="dimension-empty">
              <span className="empty-icon">👤</span>
              <span className="empty-text">暂无人物言论数据</span>
            </div>
          )
        }
        return (
          <div className="people-list">
            {people.map((person, index) => (
              <PersonInsightCard key={`${person.name}-${index}`} person={person} />
            ))}
          </div>
        )

      case 'organizations':
        const orgs = insightData.organizations || []
        if (orgs.length === 0) {
          return (
            <div className="dimension-empty">
              <span className="empty-icon">🏢</span>
              <span className="empty-text">暂无组织动态数据</span>
            </div>
          )
        }
        return (
          <div className="orgs-list">
            {orgs.map((org, index) => (
              <OrgInsightCard key={`${org.name}-${index}`} org={org} />
            ))}
          </div>
        )

      case 'events':
        const events = insightData.events || []
        if (events.length === 0) {
          return (
            <div className="dimension-empty">
              <span className="empty-icon">📅</span>
              <span className="empty-text">暂无事件数据</span>
            </div>
          )
        }
        return (
          <div className="events-list">
            {events.map((event, index) => (
              <EventInsightCard key={`${event.name}-${index}`} event={event} />
            ))}
          </div>
        )

      default:
        return null
    }
  }

  // 获取选中主题的显示名称
  const getSelectedTopicsLabel = () => {
    if (selectedTopicIds.length === 0) return ''
    if (selectedTopicIds.length === enabledTopics.length) return '全部主题'
    if (selectedTopicIds.length === 1) {
      return enabledTopics.find(t => t.id === selectedTopicIds[0])?.name || ''
    }
    return `${selectedTopicIds.length}个主题`
  }

  if (loading && enabledTopics.length === 0) {
    return (
      <div className="insight-view">
        <header className="insight-header">
          <div className="insight-title">
            <span className="insight-icon">🔭</span>
            <h2>AI 洞察</h2>
          </div>
        </header>
        <div className="insight-content">
          <div className="insight-loading">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="insight-view">
      {/* 头部 */}
      <header className="insight-header">
        <div className="insight-title">
          <span className="insight-icon">🔭</span>
          <h2>AI 洞察</h2>
          {selectedTopicIds.length > 0 && (
            <span className="insight-topic-badge">{getSelectedTopicsLabel()}</span>
          )}
        </div>
        <div className="insight-header-actions">
          {insightData && (
            <div className={`insight-update-time ${expired ? 'expired' : ''}`}>
              {expired && <span className="expired-icon">⚠️</span>}
              {formatUpdateTime(insightData.generated_at)}
            </div>
          )}
          <button
            className="config-btn"
            onClick={() => setConfigOpen(true)}
            title="配置数据源"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* 筛选器 */}
      <InsightFilters
        topics={enabledTopics}
        selectedTopicIds={selectedTopicIds}
        onTopicsChange={setSelectedTopicIds}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* 维度切换 Tab */}
      <InsightTabs
        activeDimension={activeDimension}
        onDimensionChange={setActiveDimension}
        data={insightData}
      />

      {/* 过期提醒 */}
      {expired && (
        <div className="insight-expired-banner">
          <span>⚠️ 数据已过期，执行 <code>/insight</code> 更新</span>
        </div>
      )}

      {/* 内容区 */}
      <div className="insight-content">
        {renderContent()}
      </div>

      {/* 配置面板 */}
      <InsightConfigPanel
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
      />
    </div>
  )
}
