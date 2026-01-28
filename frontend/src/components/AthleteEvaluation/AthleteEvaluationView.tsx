/**
 * AthleteEvaluationView - 运动员评测主视图
 *
 * 功能：
 * - 展示 2009 年出生击剑运动员数据
 * - 排名列表与搜索过滤
 * - 统计可视化（国家分布、趋势分析）
 * - 运动员详情查看
 */

import { useState, useEffect, useMemo } from 'react'
import './AthleteEvaluationView.css'

interface Athlete {
  rank: number
  name: string
  firstName: string
  lastName: string
  profileId: string
  profileUrl: string
  country: string
  strength: number
  conservativeEstimate: number
  trend180Days: number | null
  trendDirection: 'up' | 'down' | 'neutral'
  rating: string
}

interface AthleteData {
  metadata: {
    source: string
    category: string
    categoryName: string
    format: string
    formatName: string
    birthYear: number
    fetchedAt: string
    totalAthletes: number
  }
  athletes: Athlete[]
}

// 国家代码到中文名的映射
const countryNames: Record<string, string> = {
  USA: '美国',
  CAN: '加拿大',
  CHN: '中国',
  KOR: '韩国',
  UKR: '乌克兰',
  CYP: '塞浦路斯',
  PHI: '菲律宾',
}

// 国家代码到国旗emoji的映射
const countryFlags: Record<string, string> = {
  USA: '🇺🇸',
  CAN: '🇨🇦',
  CHN: '🇨🇳',
  KOR: '🇰🇷',
  UKR: '🇺🇦',
  CYP: '🇨🇾',
  PHI: '🇵🇭',
}

export function AthleteEvaluationView() {
  const [data, setData] = useState<AthleteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [sortBy, setSortBy] = useState<'rank' | 'strength' | 'trend'>('rank')

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 从本地加载 JSON 数据
        const response = await fetch('/data/fencing-athletes/2009-wf-athletes.json')
        const jsonData = await response.json()
        setData(jsonData)
      } catch (error) {
        console.error('Failed to load athlete data:', error)
        // 如果 fetch 失败，尝试使用内嵌数据
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 计算统计数据
  const stats = useMemo(() => {
    if (!data) return null

    const athletes = data.athletes
    const countryStats: Record<string, number> = {}
    let upTrend = 0
    let downTrend = 0
    let neutralTrend = 0

    athletes.forEach((a) => {
      countryStats[a.country] = (countryStats[a.country] || 0) + 1
      if (a.trendDirection === 'up') upTrend++
      else if (a.trendDirection === 'down') downTrend++
      else neutralTrend++
    })

    const avgStrength = Math.round(
      athletes.reduce((sum, a) => sum + a.strength, 0) / athletes.length
    )

    return {
      total: athletes.length,
      countries: Object.entries(countryStats)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count),
      trends: { up: upTrend, down: downTrend, neutral: neutralTrend },
      avgStrength,
    }
  }, [data])

  // 过滤和排序运动员
  const filteredAthletes = useMemo(() => {
    if (!data) return []

    let athletes = [...data.athletes]

    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      athletes = athletes.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.firstName.toLowerCase().includes(term) ||
          a.lastName.toLowerCase().includes(term)
      )
    }

    // 国家过滤
    if (selectedCountry !== 'all') {
      athletes = athletes.filter((a) => a.country === selectedCountry)
    }

    // 排序
    if (sortBy === 'strength') {
      athletes.sort((a, b) => b.strength - a.strength)
    } else if (sortBy === 'trend') {
      athletes.sort((a, b) => {
        const trendA = a.trend180Days ?? 0
        const trendB = b.trend180Days ?? 0
        return trendB - trendA
      })
    }
    // rank 默认已排序

    return athletes
  }, [data, searchTerm, selectedCountry, sortBy])

  if (loading) {
    return (
      <div className="athlete-evaluation loading">
        <div className="loading-spinner">
          <span className="loading-icon">🏃</span>
          <span>加载运动员数据...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="athlete-evaluation error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <h3>数据加载失败</h3>
          <p>请确保数据文件存在于 data/fencing-athletes/ 目录</p>
        </div>
      </div>
    )
  }

  return (
    <div className="athlete-evaluation">
      {/* 头部 */}
      <div className="ae-header">
        <div className="ae-title">
          <span className="ae-icon">🤺</span>
          <h2>运动员评测</h2>
        </div>
        <p className="ae-subtitle">
          {data.metadata.categoryName} | {data.metadata.birthYear} 年出生
        </p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="ae-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">运动员总数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.countries.length}</div>
            <div className="stat-label">国家/地区</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avgStrength}</div>
            <div className="stat-label">平均强度</div>
          </div>
          <div className="stat-card trends">
            <div className="stat-value">
              <span className="trend-up">↑{stats.trends.up}</span>
              <span className="trend-down">↓{stats.trends.down}</span>
            </div>
            <div className="stat-label">180天趋势</div>
          </div>
        </div>
      )}

      {/* 国家分布 */}
      {stats && (
        <div className="ae-section">
          <h3 className="ae-section-title">国家分布</h3>
          <div className="country-bars">
            {stats.countries.map(({ code, count }) => (
              <div
                key={code}
                className={`country-bar ${selectedCountry === code ? 'selected' : ''}`}
                onClick={() => setSelectedCountry(selectedCountry === code ? 'all' : code)}
              >
                <div className="country-info">
                  <span className="country-flag">{countryFlags[code] || '🏳️'}</span>
                  <span className="country-name">{countryNames[code] || code}</span>
                </div>
                <div className="country-bar-track">
                  <div
                    className="country-bar-fill"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
                <span className="country-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 筛选控制 */}
      <div className="ae-controls">
        <div className="ae-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索运动员..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="ae-sort">
          <span>排序：</span>
          <button
            className={sortBy === 'rank' ? 'active' : ''}
            onClick={() => setSortBy('rank')}
          >
            排名
          </button>
          <button
            className={sortBy === 'strength' ? 'active' : ''}
            onClick={() => setSortBy('strength')}
          >
            强度
          </button>
          <button
            className={sortBy === 'trend' ? 'active' : ''}
            onClick={() => setSortBy('trend')}
          >
            趋势
          </button>
        </div>
      </div>

      {/* 运动员列表 */}
      <div className="ae-list">
        <div className="ae-list-header">
          <span className="col-rank">排名</span>
          <span className="col-name">姓名</span>
          <span className="col-country">国家</span>
          <span className="col-strength">强度</span>
          <span className="col-trend">趋势</span>
          <span className="col-rating">等级</span>
        </div>
        <div className="ae-list-body">
          {filteredAthletes.map((athlete) => (
            <div
              key={athlete.profileId}
              className={`ae-list-row ${selectedAthlete?.profileId === athlete.profileId ? 'selected' : ''}`}
              onClick={() => setSelectedAthlete(athlete)}
            >
              <span className="col-rank">
                {athlete.rank <= 3 ? (
                  <span className={`rank-medal rank-${athlete.rank}`}>
                    {athlete.rank === 1 ? '🥇' : athlete.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  athlete.rank
                )}
              </span>
              <span className="col-name">
                <span className="athlete-name">{athlete.firstName}</span>
                <span className="athlete-lastname">{athlete.lastName}</span>
              </span>
              <span className="col-country">
                <span className="country-flag-small">{countryFlags[athlete.country] || '🏳️'}</span>
              </span>
              <span className="col-strength">{athlete.strength}</span>
              <span className={`col-trend trend-${athlete.trendDirection}`}>
                {athlete.trendDirection === 'up' && '↑'}
                {athlete.trendDirection === 'down' && '↓'}
                {athlete.trendDirection === 'neutral' && '−'}
                {athlete.trend180Days !== null && Math.abs(athlete.trend180Days)}
              </span>
              <span className="col-rating">
                <span className={`rating-badge rating-${athlete.rating.charAt(0)}`}>
                  {athlete.rating}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 运动员详情弹窗 */}
      {selectedAthlete && (
        <div className="ae-detail-overlay" onClick={() => setSelectedAthlete(null)}>
          <div className="ae-detail-card" onClick={(e) => e.stopPropagation()}>
            <button className="ae-detail-close" onClick={() => setSelectedAthlete(null)}>
              ×
            </button>
            <div className="ae-detail-header">
              <div className="ae-detail-rank">#{selectedAthlete.rank}</div>
              <div className="ae-detail-name">
                <h3>{selectedAthlete.firstName}</h3>
                <span className="ae-detail-lastname">{selectedAthlete.lastName}</span>
              </div>
              <div className="ae-detail-country">
                <span className="country-flag-large">{countryFlags[selectedAthlete.country]}</span>
                <span>{countryNames[selectedAthlete.country] || selectedAthlete.country}</span>
              </div>
            </div>
            <div className="ae-detail-stats">
              <div className="detail-stat">
                <div className="detail-stat-label">强度分数</div>
                <div className="detail-stat-value">{selectedAthlete.strength}</div>
              </div>
              <div className="detail-stat">
                <div className="detail-stat-label">保守估计</div>
                <div className="detail-stat-value">{selectedAthlete.conservativeEstimate}</div>
              </div>
              <div className="detail-stat">
                <div className="detail-stat-label">180天趋势</div>
                <div className={`detail-stat-value trend-${selectedAthlete.trendDirection}`}>
                  {selectedAthlete.trendDirection === 'up' && '↑ '}
                  {selectedAthlete.trendDirection === 'down' && '↓ '}
                  {selectedAthlete.trend180Days ?? '−'}
                </div>
              </div>
              <div className="detail-stat">
                <div className="detail-stat-label">等级评定</div>
                <div className="detail-stat-value">
                  <span className={`rating-badge rating-${selectedAthlete.rating.charAt(0)}`}>
                    {selectedAthlete.rating}
                  </span>
                </div>
              </div>
            </div>
            <div className="ae-detail-footer">
              <a
                href={`https://fencingtracker.com${selectedAthlete.profileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ae-detail-link"
              >
                🔗 查看 FencingTracker 详情
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 数据来源 */}
      <div className="ae-footer">
        <div className="ae-source">
          数据来源：
          <a href={data.metadata.source} target="_blank" rel="noopener noreferrer">
            FencingTracker
          </a>
        </div>
        <div className="ae-updated">
          更新时间：{new Date(data.metadata.fetchedAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </div>
  )
}
