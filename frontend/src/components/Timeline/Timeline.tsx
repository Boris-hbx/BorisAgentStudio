/**
 * Timeline - Main timeline visualization component
 *
 * 基于 SPEC-011：分层工作流可视化
 * 使用 PhaseGroupList 统一处理 v2.x 和 v3.0 数据格式
 */

import type { ToolCall } from '../../types/agent'
import { PhaseGroupList } from '../PhaseGroup'
import './Timeline.css'

interface TimelineProps {
  session: import('../../types/agent').AgentSession
  onSelectToolCall: (toolCall: ToolCall | null) => void
  selectedToolCallId: string | null
}

export function Timeline({ session, onSelectToolCall, selectedToolCallId }: TimelineProps) {
  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2 className="timeline-title">{session.task_title}</h2>
        <span className="timeline-model">{session.agent.model_id}</span>
      </div>
      <PhaseGroupList
        session={session}
        onSelectToolCall={onSelectToolCall}
        selectedToolCallId={selectedToolCallId}
      />
    </div>
  )
}

// 空状态组件
export function TimelineEmpty() {
  return (
    <div className="timeline-empty">
      <p>加载 Session 数据后显示工作流</p>
    </div>
  )
}
