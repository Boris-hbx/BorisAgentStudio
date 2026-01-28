/**
 * SessionBar - Session 选择和状态栏
 *
 * 整合 Session 选择器和关键状态指标
 * 紧凑两行布局：标题 + 元信息
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { getAvailableSessions, loadSessionById, type SessionListItem } from '../../services/mockData'
import { importSessionFromFile } from '../../services/importSession'
import './SessionBar.css'

/** 获取角色图标 */
function getRoleIcon(role: string): string {
  switch (role) {
    case 'product_owner': return '👔'
    case 'architect': return '🏛️'
    case 'challenger': return '🛡️'
    case 'design_authority': return '🎨'
    case 'developer': return '👨‍💻'
    case 'reviewer': return '🔍'
    default: return '👤'
  }
}

export function SessionBar() {
  const session = useSessionStore((state) => state.session)
  const setSession = useSessionStore((state) => state.setSession)

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Session 列表已按时间倒序排列
  const allSessions = useMemo(() => getAvailableSessions(), [])

  // 过滤 Session 列表
  const filteredSessions = useMemo(() => {
    if (!searchQuery) return allSessions
    const q = searchQuery.toLowerCase()
    return allSessions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.session_id.toLowerCase().includes(q)
    )
  }, [allSessions, searchQuery])

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // 打开时聚焦搜索框
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelectSession = (sessionId: string) => {
    const selected = loadSessionById(sessionId)
    if (selected) {
      setSession(selected)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchQuery('')
    }
  }

  // 导入 Session
  const handleImportClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    const result = await importSessionFromFile(file)

    if (result.success && result.session) {
      setSession(result.session)
      setIsOpen(false)
    } else if (result.errors) {
      setImportError(result.errors.map((err) => `${err.field}: ${err.message}`).join('\n'))
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 计算状态指标
  const stats = useMemo(() => {
    if (!session) return null
    return {
      status: session.status,
      toolCallsCount: session.summary?.tool_calls_count || 0,
      duration: session.summary?.total_duration_ms || 0,
    }
  }, [session])

  return (
    <div className="session-bar">
      {/* Session 选择器 */}
      <div className="session-selector" ref={dropdownRef}>
        <button className="selector-trigger" onClick={handleToggle}>
          <span className="selector-icon">📋</span>
          <span className={`selector-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>

        {isOpen && (
          <div className="selector-dropdown">
            {/* 搜索和导入 */}
            <div className="dropdown-header">
              <input
                ref={searchInputRef}
                type="text"
                className="dropdown-search"
                placeholder="搜索 Session..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="dropdown-import" onClick={handleImportClick} title="导入">
                📥
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* 导入错误 */}
            {importError && (
              <div className="dropdown-error">
                <span>⚠️ {importError}</span>
                <button onClick={() => setImportError(null)}>×</button>
              </div>
            )}

            {/* Session 列表 */}
            <div className="dropdown-list">
              {filteredSessions.map((s) => (
                <SessionListItemComponent
                  key={s.session_id}
                  item={s}
                  isSelected={session?.session_id === s.session_id}
                  onClick={() => handleSelectSession(s.session_id)}
                />
              ))}
              {filteredSessions.length === 0 && (
                <div className="dropdown-empty">无匹配结果</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Session 信息区 - 两行紧凑布局 */}
      {session ? (
        <div className="session-info">
          {/* 第一行：标题 */}
          <div className="session-info-title" title={session.task_title}>
            {session.task_title}
          </div>
          {/* 第二行：元信息 */}
          <div className="session-info-meta">
            <span className="meta-model">{session.agent.model_id}</span>
            <span className="meta-separator">·</span>
            {stats && (
              <>
                <span className={`meta-status status-${stats.status}`}>
                  {stats.status === 'success' ? '✓成功' : stats.status === 'failed' ? '✗失败' : '⋯进行中'}
                </span>
                <span className="meta-separator">·</span>
                <span className="meta-stat">{stats.toolCallsCount}次调用</span>
                <span className="meta-separator">·</span>
                <span className="meta-stat">{formatDuration(stats.duration)}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="session-info empty">
          <span className="session-info-title">请选择 Session</span>
        </div>
      )}
    </div>
  )
}

/** Session 列表项组件 */
function SessionListItemComponent({
  item,
  isSelected,
  onClick,
}: {
  item: SessionListItem
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`dropdown-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="item-header">
        <span className={`item-status status-${item.status}`} />
        <span className="item-name" title={item.name}>{item.name}</span>
        {item.is_multi_agent && <span className="item-multi">👥</span>}
      </div>
      {item.collaboration && (
        <div className="item-team">
          {item.collaboration.members.slice(0, 4).map((m) => (
            <span key={m.role} className="item-role" title={m.label}>
              {getRoleIcon(m.role)}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
