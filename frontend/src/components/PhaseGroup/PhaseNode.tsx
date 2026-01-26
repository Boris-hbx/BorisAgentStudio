/**
 * PhaseNode - 可展开的阶段节点组件
 *
 * 基于 SPEC-011：分层工作流可视化
 */

import type { PhaseGroup } from '../../utils/groupToolCalls'
import { PHASE_COLORS } from '../../utils/groupToolCalls'
import type { ToolCall, ContextReference, Decision } from '../../types/agent'
import { CONTEXT_TYPE_CONFIG, CONTEXT_USAGE_MODE_CONFIG, TOOL_CATEGORY_CONFIG, ContextType, ContextUsageMode, ToolCategory } from '../../types/agent'
import './PhaseNode.css'

interface PhaseNodeProps {
  group: PhaseGroup
  isExpanded: boolean
  onToggleExpand: () => void
  onSelectToolCall: (toolCall: ToolCall) => void
  selectedToolCallId: string | null
}

// 默认配置
const DEFAULT_CONTEXT_CONFIG = { color: '#6b7280', label: '文件' }
const DEFAULT_USAGE_CONFIG = { color: '#6b7280', bgColor: '#374151', label: '使用' }

export function PhaseNode({
  group,
  isExpanded,
  onToggleExpand,
  onSelectToolCall,
  selectedToolCallId,
}: PhaseNodeProps) {
  const phaseColor = PHASE_COLORS[group.phase_type]

  return (
    <div
      className={`phase-node ${isExpanded ? 'expanded' : ''} ${group.has_errors ? 'has-errors' : ''}`}
      style={{ '--phase-color': phaseColor } as React.CSSProperties}
    >
      {/* 折叠状态的头部 */}
      <div className="phase-header" onClick={onToggleExpand}>
        <div className="phase-title">
          <span className="phase-label" style={{ color: phaseColor }}>
            {group.label}
          </span>
          {group.source === 'auto' && (
            <span className="phase-auto-badge" title="自动推断">
              推断
            </span>
          )}
          {group.has_errors && <span className="phase-error-badge">!</span>}
        </div>
        <div className="phase-stats">
          <span className="stat-item">{group.tool_count} 次调用</span>
          <span className="stat-item">{formatDuration(group.duration_ms)}</span>
        </div>
        <button className="expand-toggle">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* 展开状态的内容 */}
      {isExpanded && (
        <div className="phase-content">
          {/* 阶段描述 */}
          {group.description && (
            <div className="phase-description">{group.description}</div>
          )}

          {/* 决策记录 */}
          {group.decisions.length > 0 && (
            <div className="phase-section">
              <h4 className="section-title">决策记录</h4>
              <div className="decisions-list">
                {group.decisions.map((dec, idx) => (
                  <DecisionItem key={dec.decision_id || idx} decision={dec} />
                ))}
              </div>
            </div>
          )}

          {/* 参考上下文 */}
          {group.context_used.length > 0 && (
            <div className="phase-section">
              <h4 className="section-title">参考上下文</h4>
              <div className="context-list">
                {group.context_used.map((ctx, idx) => (
                  <ContextItem key={idx} context={ctx} />
                ))}
              </div>
            </div>
          )}

          {/* 工具调用流 */}
          <div className="phase-section">
            <h4 className="section-title">工具调用流</h4>
            <div className="tool-flow">
              {group.tool_calls.map((tc, idx) => (
                <div key={tc.call_id} className="tool-flow-item">
                  {idx > 0 && <span className="flow-arrow">→</span>}
                  <ToolCallChip
                    toolCall={tc}
                    index={idx + 1}
                    isSelected={selectedToolCallId === tc.call_id}
                    onClick={() => onSelectToolCall(tc)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 决策项组件
 */
function DecisionItem({ decision }: { decision: Decision }) {
  const typeLabels: Record<string, string> = {
    approach: '方案',
    tool_selection: '工具',
    error_handling: '错误处理',
    skip: '跳过',
    retry: '重试',
  }

  return (
    <div className="decision-item">
      <span className="decision-type">[{typeLabels[decision.type] || decision.type}]</span>
      <span className="decision-desc">{decision.description}</span>
      {decision.reasoning && (
        <p className="decision-reasoning">{decision.reasoning}</p>
      )}
    </div>
  )
}

/**
 * 上下文引用项组件
 */
function ContextItem({ context }: { context: ContextReference }) {
  const typeConfig = CONTEXT_TYPE_CONFIG[context.type as ContextType] || DEFAULT_CONTEXT_CONFIG
  const usageConfig = context.usage_mode
    ? CONTEXT_USAGE_MODE_CONFIG[context.usage_mode as ContextUsageMode] || DEFAULT_USAGE_CONFIG
    : null

  // 上下文类型图标
  const typeIcons: Record<string, string> = {
    claude_md: '📜',
    rule: '📏',
    standard: '📋',
    skill: '⚡',
    spec: '📐',
    file: '📄',
    capability: '🧠',
  }

  return (
    <div className="context-item">
      <span className="context-icon">{typeIcons[context.type] || '📄'}</span>
      <span className="context-type" style={{ color: typeConfig.color }}>
        {typeConfig.label}
      </span>
      <span className="context-source">{context.source}</span>
      {usageConfig && (
        <span
          className="context-usage"
          style={{ color: usageConfig.color, backgroundColor: usageConfig.bgColor }}
        >
          {usageConfig.label}
        </span>
      )}
    </div>
  )
}

/**
 * 工具调用芯片组件
 */
function ToolCallChip({
  toolCall,
  index,
  isSelected,
  onClick,
}: {
  toolCall: ToolCall
  index: number
  isSelected: boolean
  onClick: () => void
}) {
  const categoryConfig = TOOL_CATEGORY_CONFIG[toolCall.tool_category as ToolCategory] || {
    color: '#6b7280',
    label: '其他',
  }

  // 提取输出摘要
  const outputSummary = getOutputSummary(toolCall)

  return (
    <button
      className={`tool-chip ${isSelected ? 'selected' : ''} status-${toolCall.output.status}`}
      style={{ borderColor: categoryConfig.color }}
      onClick={onClick}
      title={`${toolCall.input.description || toolCall.tool_name}\n输出: ${outputSummary}`}
    >
      <span className="chip-index">{index}</span>
      <span className="chip-name">{toolCall.tool_name}</span>
      {outputSummary && <span className="chip-output">{outputSummary}</span>}
      {toolCall.output.status === 'failed' && <span className="chip-error">!</span>}
    </button>
  )
}

/**
 * 提取工具调用的输出摘要
 */
function getOutputSummary(toolCall: ToolCall): string {
  if (toolCall.output.error) {
    return 'Error'
  }
  if (toolCall.output.result) {
    const result = toolCall.output.result
    if (typeof result === 'object' && 'display' in result && typeof result.display === 'string') {
      // 截取显示文本
      const display = result.display
      if (display.length > 20) {
        return display.slice(0, 20) + '...'
      }
      return display
    }
  }
  return ''
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
