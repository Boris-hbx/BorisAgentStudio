/**
 * PersonInsightCard - 人物言论卡片
 *
 * 展示技术领袖的重要观点
 */

import type { PersonInsight } from '../../types/insight'

interface PersonInsightCardProps {
  person: PersonInsight
}

/** 公司 Logo emoji 映射 */
const COMPANY_AVATARS: Record<string, string> = {
  'Anthropic': '🅰️',
  'OpenAI': '🤖',
  'Google': '🔵',
  'DeepMind': '🧠',
  'Microsoft': '🪟',
  'Meta': 'Ⓜ️',
  'NVIDIA': '🟢',
  'Hugging Face': '🤗',
}

export function PersonInsightCard({ person }: PersonInsightCardProps) {
  const avatar = person.avatar || COMPANY_AVATARS[person.company] || '👤'

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
    })
  }

  return (
    <div className="person-insight-card">
      {/* 头部 */}
      <div className="psc-header">
        <div className="psc-avatar">{avatar}</div>
        <div className="psc-info">
          <span className="psc-name">{person.name}</span>
          <span className="psc-title">{person.title}</span>
          <span className="psc-company">{person.company}</span>
        </div>
      </div>

      {/* 引用 */}
      <blockquote className="psc-quote">
        <p className="quote-text">"{person.quote.text}"</p>
        <footer className="quote-footer">
          <span className="quote-source">— {person.quote.source}</span>
          <span className="quote-date">{formatDate(person.quote.date)}</span>
          {person.quote.url && (
            <a
              href={person.quote.url}
              target="_blank"
              rel="noopener noreferrer"
              className="quote-link"
            >
              🔗
            </a>
          )}
        </footer>
      </blockquote>

      {/* 为什么重要 */}
      {person.why_matters && (
        <div className="psc-why-matters">
          <div className="why-header">
            <span className="why-icon">📌</span>
            <span className="why-title">为什么重要</span>
          </div>
          <p className="why-text">{person.why_matters}</p>
        </div>
      )}

      {/* 背景说明 */}
      {person.context && (
        <div className="psc-context">
          <p className="context-text">{person.context}</p>
        </div>
      )}

      {/* 标签 */}
      {person.tags && person.tags.length > 0 && (
        <div className="psc-tags">
          {person.tags.map((tag) => (
            <span key={tag} className="psc-tag">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}
