/**
 * EventInsightCard - 事件卡片
 *
 * 基于 SPEC-034
 */

import type { EventInsight } from '../../types/insight'

interface EventInsightCardProps {
  event: EventInsight
}

/** 根据标签推断事件类型图标 */
function getEventIcon(tags: string[]): string {
  const tagStr = tags.join(' ').toLowerCase()
  if (tagStr.includes('安全') || tagStr.includes('security')) return '🔒'
  if (tagStr.includes('发布') || tagStr.includes('release')) return '🚀'
  if (tagStr.includes('会议') || tagStr.includes('conference')) return '🎤'
  if (tagStr.includes('报告') || tagStr.includes('report')) return '📊'
  if (tagStr.includes('事件') || tagStr.includes('incident')) return '⚠️'
  return '📅'
}

export function EventInsightCard({ event }: EventInsightCardProps) {
  const eventIcon = getEventIcon(event.tags || [])

  return (
    <div className="event-insight-card">
      {/* 头部 */}
      <div className="eic-header">
        <div className="eic-title">
          <span className="eic-icon">{eventIcon}</span>
          <a href={event.url} target="_blank" rel="noopener noreferrer">
            {event.name}
          </a>
        </div>
        <div className="eic-meta">
          <span className="eic-date">{event.date}</span>
          {event.location && (
            <>
              <span className="eic-separator">·</span>
              <span className="eic-location">{event.location}</span>
            </>
          )}
        </div>
      </div>

      {/* 描述 */}
      <p className="eic-description">{event.description}</p>

      {/* 影响 */}
      {event.impact && (
        <div className="eic-impact">
          <div className="impact-header">
            <span className="impact-icon">📊</span>
            <span className="impact-title">影响</span>
          </div>
          <p className="impact-text">{event.impact}</p>
        </div>
      )}

      {/* 标签 */}
      {event.tags && event.tags.length > 0 && (
        <div className="eic-tags">
          {event.tags.map((tag, index) => (
            <span key={index} className="eic-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}
