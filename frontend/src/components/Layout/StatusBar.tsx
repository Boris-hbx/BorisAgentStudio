/**
 * StatusBar component - real-time status indicator
 *
 * 展示 5-phase 执行进度
 */

import { useMemo } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { PHASE_LABELS } from '../../types/agent'
import './StatusBar.css'

export function StatusBar() {
  const session = useSessionStore((state) => state.session)

  const stats = useMemo(() => {
    if (!session) {
      return {
        completed: 0,
        total: 5,
        percentage: 0,
        currentPhase: null,
        totalDuration: 0,
        toolCallsCount: 0,
        contextCount: 0,
      }
    }

    const phases = session.phases || []
    const completed = phases.filter(
      (p) => p.status === 'success' || p.status === 'skipped'
    ).length
    const total = phases.length || 1
    const percentage = Math.round((completed / total) * 100)

    const currentPhase = phases.find((p) => p.status === 'running')

    const totalDuration = session.summary.total_duration_ms

    const toolCallsCount = session.summary.tool_calls_count

    const contextCount = phases.reduce(
      (sum, p) => sum + (p.context_used?.length || 0),
      0
    )

    return {
      completed,
      total,
      percentage,
      currentPhase,
      totalDuration,
      toolCallsCount,
      contextCount,
    }
  }, [session])

  if (!session) return null

  return (
    <div className="status-bar">
      {/* 原始 Prompt */}
      {session.user_prompt && (
        <>
          <div className="status-item prompt-item">
            <span className="status-label">Prompt</span>
            <span className="status-value prompt-text" title={session.user_prompt}>
              {session.user_prompt.length > 50
                ? session.user_prompt.slice(0, 50) + '...'
                : session.user_prompt}
            </span>
          </div>
          <div className="status-divider" />
        </>
      )}

      <div className="status-item">
        <span className="status-label">进度</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <span className="status-value">
          {stats.completed}/{stats.total} ({stats.percentage}%)
        </span>
      </div>

      <div className="status-divider" />

      <div className="status-item">
        <span className="status-label">耗时</span>
        <span className="status-value">{formatDuration(stats.totalDuration)}</span>
      </div>

      <div className="status-divider" />

      <div className="status-item">
        <span className="status-label">当前</span>
        <span className="status-value status-current">
          {stats.currentPhase ? PHASE_LABELS[stats.currentPhase.phase_type] : '已完成'}
        </span>
      </div>

      <div className="status-divider" />

      <div className="status-item">
        <span className="status-label">工具调用</span>
        <span className="status-value">{stats.toolCallsCount} 次</span>
      </div>

      <div className="status-divider" />

      <div className="status-item">
        <span className="status-label">上下文</span>
        <span className="status-value">{stats.contextCount} 项</span>
      </div>
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
