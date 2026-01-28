/**
 * ProjectInsightCard - 增强版项目洞察卡片
 *
 * 包含：趋势图、推荐理由、业界评价
 */

import { useState } from 'react'
import type { ProjectInsight } from '../../types/insight'
import { MiniTrendChart } from './MiniTrendChart'

interface ProjectInsightCardProps {
  project: ProjectInsight
}

/** 语言颜色映射 */
const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  Markdown: '#083fa1',
}

export function ProjectInsightCard({ project }: ProjectInsightCardProps) {
  const [showFeedback, setShowFeedback] = useState(false)

  const languageColor = LANGUAGE_COLORS[project.language] || '#8b949e'
  const hasFeedback = project.community_feedback &&
    (project.community_feedback.positive?.length > 0 || project.community_feedback.concerns?.length > 0)

  const formatStars = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  // 从 name 中提取组织名
  const orgName = project.name.split('/')[0]

  return (
    <div className="project-insight-card">
      {/* 头部 */}
      <div className="pic-header">
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="pic-name"
        >
          <span className="pic-icon">📦</span>
          {project.name}
        </a>
        <span className="pic-org">{orgName}</span>
      </div>

      {/* 描述 */}
      <p className="pic-description">{project.description}</p>

      {/* 指标行 */}
      <div className="pic-metrics">
        <div className="pic-stars">
          <span className="stars-icon">⭐</span>
          <span className="stars-count">{formatStars(project.stars)}</span>
          <span className="stars-growth">
            (+{project.stars_growth_7d} / {project.growth_rate})
          </span>
        </div>
        {project.stars_history && project.stars_history.length > 0 && (
          <MiniTrendChart data={project.stars_history} />
        )}
      </div>

      {/* 语言和 forks */}
      <div className="pic-meta">
        {project.language && (
          <span className="pic-language">
            <span className="language-dot" style={{ backgroundColor: languageColor }} />
            {project.language}
          </span>
        )}
        {project.forks > 0 && (
          <span className="pic-forks">
            <span className="fork-icon">🍴</span>
            {formatStars(project.forks)}
          </span>
        )}
      </div>

      {/* 推荐理由 */}
      {project.recommendation && (
        <div className="pic-recommendation">
          <div className="rec-header">
            <span className="rec-icon">💡</span>
            <span className="rec-title">推荐理由</span>
            {project.recommendation.source && (
              <span className="rec-source">({project.recommendation.source})</span>
            )}
          </div>
          <p className="rec-reason">{project.recommendation.reason}</p>
          {project.recommendation.tags && project.recommendation.tags.length > 0 && (
            <div className="rec-tags">
              {project.recommendation.tags.map((tag) => (
                <span key={tag} className="rec-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 业界评价（可折叠） */}
      {hasFeedback && (
        <div className="pic-feedback">
          <button
            className={`feedback-toggle ${showFeedback ? 'expanded' : ''}`}
            onClick={() => setShowFeedback(!showFeedback)}
          >
            <span className="toggle-icon">{showFeedback ? '▼' : '▶'}</span>
            <span className="toggle-text">
              {showFeedback ? '收起业界评价' : '查看业界评价'}
            </span>
          </button>

          {showFeedback && (
            <div className="feedback-content">
              {project.community_feedback!.positive?.map((item, i) => (
                <div key={`pos-${i}`} className="feedback-item positive">
                  <span className="feedback-icon">✓</span>
                  <span className="feedback-text">{item}</span>
                </div>
              ))}
              {project.community_feedback!.concerns?.map((item, i) => (
                <div key={`con-${i}`} className="feedback-item concern">
                  <span className="feedback-icon">⚠</span>
                  <span className="feedback-text">{item}</span>
                </div>
              ))}
              {project.community_feedback!.notable_users && project.community_feedback!.notable_users.length > 0 && (
                <div className="feedback-users">
                  <span className="users-label">知名用户：</span>
                  {project.community_feedback!.notable_users.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
