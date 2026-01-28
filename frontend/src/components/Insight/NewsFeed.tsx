/**
 * NewsFeed - 行业新闻动态列表
 */

import type { NewsItem } from '../../types/insight'
import { isTrustedSource } from '../../types/insight'

interface NewsFeedProps {
  news: NewsItem[]
}

export function NewsFeed({ news }: NewsFeedProps) {
  if (!news || news.length === 0) {
    return (
      <section className="insight-section">
        <h3 className="section-title">
          <span className="section-icon">📰</span>
          行业动态
        </h3>
        <div className="section-empty">暂无数据</div>
      </section>
    )
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
    })
  }

  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname
      return domain.replace(/^www\./, '')
    } catch {
      return url
    }
  }

  return (
    <section className="insight-section">
      <h3 className="section-title">
        <span className="section-icon">📰</span>
        行业动态
      </h3>
      <div className="news-list">
        {news.map((item, index) => {
          const domain = extractDomain(item.url)
          const trusted = item.is_trusted ?? isTrustedSource(domain)

          return (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
            >
              <div className="news-header">
                <span className="news-bullet">•</span>
                <span className="news-title">{item.title}</span>
              </div>
              <div className="news-meta">
                <span className="news-date">{formatDate(item.published_at)}</span>
                <span className="news-source">
                  {trusted && <span className="trusted-badge">✓</span>}
                  {item.source || domain}
                </span>
              </div>
              {item.summary && (
                <p className="news-summary">{item.summary}</p>
              )}
            </a>
          )
        })}
      </div>
    </section>
  )
}
