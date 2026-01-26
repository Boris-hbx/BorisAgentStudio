/**
 * ToolCallFlow - Tool call sequence visualization (v3.0)
 *
 * 基于 STD-001 v3.0：工具调用流优先模型
 * 直接渲染 tool_calls 序列，phase_annotations 作为可选分组
 */

import { useMemo, useState } from 'react'
import type { ToolCall, PhaseAnnotation, ToolCategory } from '../../types/agent'
import { TOOL_CATEGORY_CONFIG, PHASE_LABELS, PhaseType } from '../../types/agent'
import './ToolCallFlow.css'

interface ToolCallFlowProps {
  toolCalls: ToolCall[]
  phaseAnnotations?: PhaseAnnotation[]
}

// Phase type colors for annotation groups
const PHASE_COLORS: Record<PhaseType, string> = {
  understand: '#8b5cf6',
  explore: '#3b82f6',
  plan: '#22c55e',
  execute: '#f97316',
  verify: '#ec4899',
  mixed: '#6b7280',
  unclassified: '#4b5563',
}

export function ToolCallFlow({ toolCalls, phaseAnnotations }: ToolCallFlowProps) {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [hoveredCallId, setHoveredCallId] = useState<string | null>(null)

  // Build a map from call_id to annotation
  const callAnnotationMap = useMemo(() => {
    const map = new Map<string, PhaseAnnotation>()
    if (!phaseAnnotations) return map

    // Create index map for range lookup
    const callIdToIndex = new Map(toolCalls.map((tc, i) => [tc.call_id, i]))

    for (const ann of phaseAnnotations) {
      const startIdx = callIdToIndex.get(ann.tool_call_range.start_call_id)
      const endIdx = callIdToIndex.get(ann.tool_call_range.end_call_id)
      if (startIdx !== undefined && endIdx !== undefined) {
        for (let i = startIdx; i <= endIdx; i++) {
          map.set(toolCalls[i].call_id, ann)
        }
      }
    }
    return map
  }, [toolCalls, phaseAnnotations])

  // Group consecutive calls by annotation for visual grouping
  const groupedCalls = useMemo(() => {
    const groups: Array<{
      annotation?: PhaseAnnotation
      calls: ToolCall[]
    }> = []

    let currentGroup: { annotation?: PhaseAnnotation; calls: ToolCall[] } | null = null

    for (const tc of toolCalls) {
      const ann = callAnnotationMap.get(tc.call_id)
      const annId = ann?.annotation_id

      if (!currentGroup || currentGroup.annotation?.annotation_id !== annId) {
        currentGroup = { annotation: ann, calls: [] }
        groups.push(currentGroup)
      }
      currentGroup.calls.push(tc)
    }

    return groups
  }, [toolCalls, callAnnotationMap])

  const handleCallClick = (callId: string) => {
    setSelectedCallId(callId === selectedCallId ? null : callId)
  }

  const selectedCall = toolCalls.find((tc) => tc.call_id === selectedCallId)

  return (
    <div className="tool-call-flow">
      {/* Main flow visualization */}
      <div className="flow-container">
        {/* Start node */}
        <div className="flow-start">
          <div className="start-node">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <polygon points="8,5 19,12 8,19" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Tool call groups */}
        {groupedCalls.map((group, groupIdx) => (
          <div key={groupIdx} className="flow-group">
            {/* Group header (phase annotation) */}
            {group.annotation && (
              <div
                className="group-header"
                style={{ borderColor: PHASE_COLORS[group.annotation.phase_type] }}
              >
                <span
                  className="group-phase"
                  style={{ color: PHASE_COLORS[group.annotation.phase_type] }}
                >
                  {PHASE_LABELS[group.annotation.phase_type]}
                </span>
                <span className="group-confidence">
                  {group.annotation.confidence}
                </span>
              </div>
            )}

            {/* Tool calls in this group */}
            <div className="group-calls">
              {group.calls.map((tc, idx) => (
                <div key={tc.call_id} className="call-wrapper">
                  {/* Edge from previous */}
                  {(groupIdx > 0 || idx > 0) && (
                    <div className={`flow-edge edge-${tc.output.status}`}>
                      <svg viewBox="0 0 24 12" className="edge-svg">
                        <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" />
                        <polygon points="16,3 24,6 16,9" fill="currentColor" />
                      </svg>
                    </div>
                  )}

                  {/* Tool call node */}
                  <div
                    className={`call-node status-${tc.output.status} category-${tc.tool_category} ${
                      selectedCallId === tc.call_id ? 'selected' : ''
                    } ${hoveredCallId === tc.call_id ? 'hovered' : ''}`}
                    onClick={() => handleCallClick(tc.call_id)}
                    onMouseEnter={() => setHoveredCallId(tc.call_id)}
                    onMouseLeave={() => setHoveredCallId(null)}
                    style={{
                      borderColor: TOOL_CATEGORY_CONFIG[tc.tool_category as ToolCategory]?.color,
                    }}
                  >
                    <span className="call-index">{toolCalls.indexOf(tc) + 1}</span>
                    <span className="call-name">{tc.tool_name}</span>
                    {tc.output.status === 'failed' && (
                      <span className="call-error-indicator" title="执行失败">!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* End node */}
        <div className="flow-end">
          <div className="flow-edge edge-final">
            <svg viewBox="0 0 24 12" className="edge-svg">
              <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
            </svg>
          </div>
          <div className="end-node">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <rect x="6" y="6" width="12" height="12" fill="currentColor" rx="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tool category legend */}
      <div className="flow-legend">
        {Object.entries(TOOL_CATEGORY_CONFIG).map(([key, config]) => (
          <div key={key} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: config.color }} />
            <span className="legend-label">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Selected call detail panel */}
      {selectedCall && (
        <div className="call-detail-panel">
          <div className="detail-header">
            <span className="detail-title">
              #{toolCalls.indexOf(selectedCall) + 1} {selectedCall.tool_name}
            </span>
            <button className="detail-close" onClick={() => setSelectedCallId(null)}>
              &times;
            </button>
          </div>
          <div className="detail-content">
            <div className="detail-row">
              <span className="detail-label">类别:</span>
              <span
                className="detail-value"
                style={{
                  color: TOOL_CATEGORY_CONFIG[selectedCall.tool_category as ToolCategory]?.color,
                }}
              >
                {TOOL_CATEGORY_CONFIG[selectedCall.tool_category as ToolCategory]?.label}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">状态:</span>
              <span className={`detail-value status-text-${selectedCall.output.status}`}>
                {selectedCall.output.status === 'success' ? '成功' : '失败'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">耗时:</span>
              <span className="detail-value">{formatDuration(selectedCall.duration_ms)}</span>
            </div>
            {selectedCall.input.description && (
              <div className="detail-row">
                <span className="detail-label">描述:</span>
                <span className="detail-value">{selectedCall.input.description}</span>
              </div>
            )}
            {selectedCall.input.params && Object.keys(selectedCall.input.params).length > 0 && (
              <div className="detail-row detail-row-block">
                <span className="detail-label">参数:</span>
                <pre className="detail-code">
                  {JSON.stringify(selectedCall.input.params, null, 2)}
                </pre>
              </div>
            )}
            {selectedCall.output.error && (
              <div className="detail-row detail-row-block">
                <span className="detail-label">错误:</span>
                <pre className="detail-code detail-error">{selectedCall.output.error}</pre>
              </div>
            )}
            {selectedCall.context_contribution && (
              <div className="detail-row">
                <span className="detail-label">上下文贡献:</span>
                <span className="detail-value">{selectedCall.context_contribution.summary}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
