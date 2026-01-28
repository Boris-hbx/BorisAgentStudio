/**
 * Timeline - Main timeline visualization component
 *
 * 基于 SPEC-011：分层工作流可视化
 */

import type { ToolCall, AgentSession } from '../../types/agent'
import { PhaseGroupList } from '../PhaseGroup'
import './Timeline.css'

interface TimelineProps {
  session: AgentSession
  onSelectToolCall: (toolCall: ToolCall | null) => void
  selectedToolCallId: string | null
}

export function Timeline({ session, onSelectToolCall, selectedToolCallId }: TimelineProps) {
  return (
    <div className="timeline-container">
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
