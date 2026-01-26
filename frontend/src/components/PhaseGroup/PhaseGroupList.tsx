/**
 * PhaseGroupList - 阶段分组列表组件
 *
 * 包含阶段概览和展开的阶段详情
 */

import { useState, useMemo } from 'react'
import type { AgentSession, ToolCall } from '../../types/agent'
import { getPhaseGroups, PHASE_COLORS } from '../../utils/groupToolCalls'
import { PhaseNode } from './PhaseNode'
import './PhaseGroupList.css'

interface PhaseGroupListProps {
  session: AgentSession
  onSelectToolCall: (toolCall: ToolCall | null) => void
  selectedToolCallId: string | null
}

export function PhaseGroupList({
  session,
  onSelectToolCall,
  selectedToolCallId,
}: PhaseGroupListProps) {
  // 单选模式：同时只展开一个（'input' 或阶段 group_id）
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 转换为 PhaseGroup 列表
  const groups = useMemo(() => getPhaseGroups(session), [session])

  const toggleExpand = (id: string) => {
    // 点击已展开的则关闭，否则展开新的（自动关闭之前的）
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleSelectToolCall = (toolCall: ToolCall) => {
    if (selectedToolCallId === toolCall.call_id) {
      onSelectToolCall(null)
    } else {
      onSelectToolCall(toolCall)
    }
  }

  const collapseAll = () => {
    setExpandedId(null)
  }

  const showPrompt = expandedId === 'input'
  const expandedGroupId = expandedId !== 'input' ? expandedId : null

  return (
    <div className="phase-group-list">
      {/* 阶段概览 */}
      <div className="phase-overview">
        <div className="overview-flow">
          {/* 用户输入节点 */}
          {session.user_prompt && (
            <div className="overview-item">
              <button
                className={`overview-node input-node ${showPrompt ? 'active' : ''}`}
                onClick={() => toggleExpand('input')}
                title={session.user_prompt}
              >
                <span className="overview-label">输入</span>
                <span className="overview-icon">💬</span>
              </button>
              <span className="overview-arrow">→</span>
            </div>
          )}
          {groups.map((group, idx) => (
            <div key={group.group_id} className="overview-item">
              {idx > 0 && <span className="overview-arrow">→</span>}
              <button
                className={`overview-node ${expandedGroupId === group.group_id ? 'active' : ''} ${group.has_errors ? 'has-errors' : ''}`}
                style={{ '--phase-color': PHASE_COLORS[group.phase_type] } as React.CSSProperties}
                onClick={() => toggleExpand(group.group_id)}
                title={`${group.label}: ${group.tool_count} 次调用`}
              >
                <span className="overview-label">{group.label}</span>
                <span className="overview-count">{group.tool_count}</span>
              </button>
            </div>
          ))}
        </div>
        {expandedGroupId && (
          <div className="overview-actions">
            <button className="action-btn" onClick={collapseAll} title="折叠">
              折叠
            </button>
          </div>
        )}
      </div>

      {/* 展开的内容区域 */}
      {(showPrompt || expandedGroupId) && (
        <div className="phase-details">
          {/* 用户输入详情 */}
          {showPrompt && session.user_prompt && (
            <div className="prompt-detail">
              <div className="prompt-detail-header">
                <span className="prompt-detail-icon">💬</span>
                <span className="prompt-detail-title">用户输入</span>
                <button className="prompt-close" onClick={() => setExpandedId(null)}>▲</button>
              </div>
              <div className="prompt-detail-content">{session.user_prompt}</div>
            </div>
          )}

          {/* 展开的阶段详情 */}
          {expandedGroupId && groups
            .filter((group) => group.group_id === expandedGroupId)
            .map((group) => (
              <PhaseNode
                key={group.group_id}
                group={group}
                isExpanded={true}
                onToggleExpand={() => toggleExpand(group.group_id)}
                onSelectToolCall={handleSelectToolCall}
                selectedToolCallId={selectedToolCallId}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export { PhaseNode }
