/**
 * SessionSearch - Session 搜索与过滤组件
 *
 * 提供关键词搜索、高级过滤和排序功能
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { SessionListItem } from '../../services/mockData'
import { getAvailableSessions } from '../../services/mockData'
import './SessionSearch.css'

interface SessionSearchProps {
  onSelectSession: (sessionId: string) => void
  selectedSessionId: string | null
}

interface SearchFilters {
  status: 'all' | 'success' | 'failed' | 'partial'
  timeRange: 'all' | 'today' | 'week' | 'month'
}

interface SortConfig {
  field: 'name' | 'session_id' | 'status'
  direction: 'asc' | 'desc'
}

interface ParsedQuery {
  keywords: string[]
  toolFilter?: string
  statusFilter?: string
  exactPhrases: string[]
}

function parseSearchQuery(query: string): ParsedQuery {
  const result: ParsedQuery = { keywords: [], exactPhrases: [] }

  // 提取精确短语 "..."
  const phraseRegex = /"([^"]+)"/g
  let match
  while ((match = phraseRegex.exec(query)) !== null) {
    result.exactPhrases.push(match[1].toLowerCase())
  }
  let cleanQuery = query.replace(phraseRegex, '')

  // 提取特殊过滤器
  const toolMatch = cleanQuery.match(/tool:(\S+)/i)
  if (toolMatch) {
    result.toolFilter = toolMatch[1].toLowerCase()
    cleanQuery = cleanQuery.replace(toolMatch[0], '')
  }

  const statusMatch = cleanQuery.match(/status:(\S+)/i)
  if (statusMatch) {
    result.statusFilter = statusMatch[1].toLowerCase()
    cleanQuery = cleanQuery.replace(statusMatch[0], '')
  }

  // 剩余作为关键词
  result.keywords = cleanQuery
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((k) => k.toLowerCase())

  return result
}

function matchSession(session: SessionListItem, parsed: ParsedQuery): boolean {
  const nameLC = session.name.toLowerCase()
  const descLC = session.description.toLowerCase()
  const idLC = session.session_id.toLowerCase()

  // 精确短语匹配
  for (const phrase of parsed.exactPhrases) {
    if (!nameLC.includes(phrase) && !descLC.includes(phrase)) {
      return false
    }
  }

  // 状态过滤
  if (parsed.statusFilter && session.status !== parsed.statusFilter) {
    return false
  }

  // 关键词匹配 (所有关键词都必须匹配)
  for (const keyword of parsed.keywords) {
    if (
      !nameLC.includes(keyword) &&
      !descLC.includes(keyword) &&
      !idLC.includes(keyword)
    ) {
      return false
    }
  }

  return true
}

export function SessionSearch({
  onSelectSession,
  selectedSessionId,
}: SessionSearchProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    status: 'all',
    timeRange: 'all',
  })
  const [sort, setSort] = useState<SortConfig>({
    field: 'session_id',
    direction: 'desc',
  })
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const allSessions = useMemo(() => getAvailableSessions(), [])

  // 过滤和排序
  const filteredSessions = useMemo(() => {
    const parsed = parseSearchQuery(query)

    let results = allSessions.filter((session) => {
      // 应用搜索查询
      if (query && !matchSession(session, parsed)) {
        return false
      }

      // 应用状态过滤
      if (filters.status !== 'all' && session.status !== filters.status) {
        return false
      }

      return true
    })

    // 排序
    results.sort((a, b) => {
      let comparison = 0
      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'session_id':
          comparison = a.session_id.localeCompare(b.session_id)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }
      return sort.direction === 'asc' ? comparison : -comparison
    })

    return results
  }, [allSessions, query, filters, sort])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" 聚焦搜索框
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // Escape 清空搜索
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('')
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleStatusFilter = useCallback(
    (status: SearchFilters['status']) => {
      setFilters((f) => ({ ...f, status }))
    },
    []
  )

  const handleSort = useCallback((field: SortConfig['field']) => {
    setSort((s) => ({
      field,
      direction: s.field === field && s.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setQuery('')
    setFilters({ status: 'all', timeRange: 'all' })
    setSort({ field: 'session_id', direction: 'desc' })
  }, [])

  const hasActiveFilters =
    query || filters.status !== 'all' || filters.timeRange !== 'all'

  return (
    <div className="session-search">
      {/* 搜索栏 */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="搜索 Sessions... (按 / 聚焦)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              ×
            </button>
          )}
        </div>
        <button
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          筛选 {hasActiveFilters && <span className="filter-badge">•</span>}
        </button>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-section">
            <label className="filter-label">状态</label>
            <div className="filter-options">
              {(['all', 'success', 'failed', 'partial'] as const).map(
                (status) => (
                  <button
                    key={status}
                    className={`filter-option ${filters.status === status ? 'active' : ''}`}
                    onClick={() => handleStatusFilter(status)}
                  >
                    {status === 'all'
                      ? '全部'
                      : status === 'success'
                        ? '成功'
                        : status === 'failed'
                          ? '失败'
                          : '部分'}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="filter-section">
            <label className="filter-label">排序</label>
            <div className="filter-options">
              {(
                [
                  { field: 'session_id', label: '时间' },
                  { field: 'name', label: '名称' },
                  { field: 'status', label: '状态' },
                ] as const
              ).map(({ field, label }) => (
                <button
                  key={field}
                  className={`filter-option ${sort.field === field ? 'active' : ''}`}
                  onClick={() => handleSort(field)}
                >
                  {label}
                  {sort.field === field && (
                    <span className="sort-indicator">
                      {sort.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              清除筛选
            </button>
          )}
        </div>
      )}

      {/* 结果统计 */}
      <div className="search-stats">
        找到 {filteredSessions.length} 个结果
        {filteredSessions.length !== allSessions.length &&
          ` (共 ${allSessions.length} 个)`}
      </div>

      {/* 结果列表 */}
      <div className="search-results">
        {filteredSessions.map((session) => (
          <button
            key={session.session_id}
            className={`session-item ${selectedSessionId === session.session_id ? 'selected' : ''}`}
            onClick={() => onSelectSession(session.session_id)}
          >
            <div className="session-item-header">
              <span
                className={`status-badge status-${session.status}`}
                title={session.status}
              >
                {session.status === 'success'
                  ? '✓'
                  : session.status === 'failed'
                    ? '✗'
                    : '◐'}
              </span>
              <span className="session-name">{session.name}</span>
            </div>
            <div className="session-description">{session.description}</div>
            <div className="session-id">{session.session_id}</div>
          </button>
        ))}

        {filteredSessions.length === 0 && (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <span>未找到匹配的 Session</span>
            {hasActiveFilters && (
              <button className="clear-filters-inline" onClick={clearFilters}>
                清除筛选条件
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
