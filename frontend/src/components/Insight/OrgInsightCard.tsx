/**
 * OrgInsightCard - 组织动态卡片
 *
 * 基于 SPEC-034
 */

import type { OrgInsight } from '../../types/insight'

interface OrgInsightCardProps {
  org: OrgInsight
}

/** 组织类型图标映射 */
const TYPE_ICONS: Record<string, string> = {
  'company': '🏢',
  'foundation': '🏛️',
  'research_lab': '🔬',
  '标准组织': '📋',
  '行业合作': '🤝',
}

export function OrgInsightCard({ org }: OrgInsightCardProps) {
  const typeIcon = TYPE_ICONS[org.type] || '🏢'

  return (
    <div className="org-insight-card">
      {/* 头部 */}
      <div className="oic-header">
        <div className="oic-name">
          <span className="oic-icon">{typeIcon}</span>
          <a href={org.url} target="_blank" rel="noopener noreferrer">
            {org.name}
          </a>
        </div>
        <span className="oic-type">{org.type}</span>
      </div>

      {/* 描述 */}
      <p className="oic-description">{org.description}</p>

      {/* 为什么重要 */}
      <div className="oic-why-matters">
        <div className="why-header">
          <span className="why-icon">💡</span>
          <span className="why-title">为什么重要</span>
        </div>
        <p className="why-text">{org.why_matters}</p>
      </div>

      {/* 最新动态 */}
      {org.recent_activity && (
        <div className="oic-activity">
          <span className="activity-icon">🔗</span>
          <span className="activity-text">最新动态：{org.recent_activity}</span>
        </div>
      )}

      {/* 标签 */}
      {org.tags && org.tags.length > 0 && (
        <div className="oic-tags">
          {org.tags.map((tag, index) => (
            <span key={index} className="oic-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}
