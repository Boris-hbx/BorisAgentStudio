/**
 * TimelineNode - Individual phase node in the timeline
 *
 * 展示 Claude Code 执行阶段的详细信息
 */

import { useRef } from 'react'
import type { LegacyExecutionPhase, ToolCall, PhaseType } from '../../types/agent'
import { PHASE_LABELS } from '../../types/agent'
import { useSessionStore } from '../../store/sessionStore'
import { ContextMarkers } from './ContextMarkers'
import './TimelineNode.css'

interface TimelineNodeProps {
  phase: LegacyExecutionPhase
  toolCalls: ToolCall[]
  isExpanded: boolean
  isLocked: boolean
}

// 安全获取阶段标签
function getPhaseLabel(phaseType: PhaseType): string {
  return PHASE_LABELS[phaseType] || phaseType
}

export function TimelineNode({ phase, toolCalls, isExpanded, isLocked }: TimelineNodeProps) {
  const { togglePhaseExpanded, togglePhaseLocked, selectPhase } = useSessionStore()
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = () => {
    // 延时处理，区分单击和双击
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    clickTimer.current = setTimeout(() => {
      togglePhaseExpanded(phase.phase_id)
      clickTimer.current = null
    }, 200)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // 取消单击的延时操作
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    selectPhase(phase.phase_id)
  }

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止冒泡，避免触发 togglePhaseExpanded
    selectPhase(phase.phase_id)
  }

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    togglePhaseLocked(phase.phase_id)
  }

  const statusClass = `node-status-${phase.status}`

  return (
    <div
      className={`timeline-node ${statusClass} ${isExpanded ? 'expanded' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="node-header">
        <span className="node-name">{getPhaseLabel(phase.phase_type)}</span>
        <div className="node-actions">
          {isExpanded && (
            <button
              className={`lock-btn ${isLocked ? 'locked' : ''}`}
              onClick={handleLockClick}
              title={isLocked ? '解锁' : '锁定'}
            >
              {isLocked ? '🔒' : '🔓'}
            </button>
          )}
          <span className="status-badge">{getStatusText(phase.status)}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="node-content">
          {phase.duration_ms !== undefined && (
            <div className="node-row">
              <span className="row-label">耗时:</span>
              <span className="row-value">{formatDuration(phase.duration_ms)}</span>
            </div>
          )}

          {toolCalls.length > 0 && (
            <div className="node-row">
              <span className="row-label">工具调用:</span>
              <span className="row-value">{toolCalls.length} 次</span>
            </div>
          )}

          {phase.decisions && phase.decisions.length > 0 && (
            <div className="node-decisions">
              <span className="row-label">决策:</span>
              {phase.decisions.map((dec: { decision_id: string; type: string; description: string }) => (
                <div key={dec.decision_id} className="decision-item">
                  <span className="decision-type">[{getDecisionTypeLabel(dec.type)}]</span>
                  <span className="decision-desc">{dec.description}</span>
                </div>
              ))}
            </div>
          )}

          {toolCalls.length > 0 && (
            <div className="node-tools">
              <span className="row-label">工具:</span>
              <div className="tool-list">
                {toolCalls.slice(0, 5).map((tc) => (
                  <span
                    key={tc.call_id}
                    className={`tool-tag tool-${tc.tool_category}`}
                    title={tc.input.description}
                  >
                    {tc.tool_name}
                  </span>
                ))}
                {toolCalls.length > 5 && (
                  <span className="tool-more">+{toolCalls.length - 5}</span>
                )}
              </div>
            </div>
          )}

          <button className="detail-btn" onClick={handleDetailClick}>
            查看详情
          </button>
        </div>
      )}

      {/* Context markers below node */}
      <ContextMarkers contexts={phase.context_used} />
    </div>
  )
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待执行',
    running: '运行中',
    success: '成功',
    failed: '失败',
    skipped: '跳过',
  }
  return map[status] || status
}

function getDecisionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    approach: '方案',
    tool_selection: '工具',
    error_handling: '错误处理',
    optimization: '优化',
  }
  return map[type] || type
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
