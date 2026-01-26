/**
 * DetailPanel - Phase detail view panel
 *
 * 展示阶段详情：输入、输出、上下文、工具调用
 */

import { useState } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { PHASE_LABELS, CONTEXT_TYPE_CONFIG, ContextType, CONTEXT_USAGE_MODE_CONFIG, ContextUsageMode } from '../../types/agent'
import './DetailPanel.css'

type Tab = 'input' | 'output' | 'context' | 'tools'

// 默认配置，用于未知的 context type
const DEFAULT_CONTEXT_CONFIG = { color: '#6b7280', label: '其他' }

// 安全获取 context 配置
function getContextConfig(type: string) {
  return CONTEXT_TYPE_CONFIG[type as ContextType] || DEFAULT_CONTEXT_CONFIG
}

export function DetailPanel() {
  const selectedPhaseId = useSessionStore((state) => state.selectedPhaseId)
  const session = useSessionStore((state) => state.session)
  const selectPhase = useSessionStore((state) => state.selectPhase)

  const [activeTab, setActiveTab] = useState<Tab>('input')
  const [expandedContributions, setExpandedContributions] = useState<Set<string>>(new Set())
  const [expandedSubagents, setExpandedSubagents] = useState<Set<string>>(new Set())

  const toggleContribution = (callId: string) => {
    setExpandedContributions((prev) => {
      const next = new Set(prev)
      if (next.has(callId)) {
        next.delete(callId)
      } else {
        next.add(callId)
      }
      return next
    })
  }

  const toggleSubagent = (callId: string) => {
    setExpandedSubagents((prev) => {
      const next = new Set(prev)
      if (next.has(callId)) {
        next.delete(callId)
      } else {
        next.add(callId)
      }
      return next
    })
  }

  const isOpen = !!(selectedPhaseId && session)
  const phases = session?.phases || []
  const phase = (isOpen && session) ? phases.find((p) => p.phase_id === selectedPhaseId) : null
  const toolCalls = (phase && session) ? session.tool_calls.filter((tc) => phase.tool_call_ids?.includes(tc.call_id)) : []

  const handleClose = () => {
    selectPhase(null)
  }

  return (
    <div className={`detail-panel ${isOpen && phase ? 'open' : 'hidden'}`}>
      {phase && (
        <>
          <div className="panel-header">
            <h2>阶段详情：{PHASE_LABELS[phase.phase_type]}</h2>
            <button className="close-btn" onClick={handleClose}>
              ✕
            </button>
          </div>

      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          输入
        </button>
        <button
          className={`tab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          输出
        </button>
        <button
          className={`tab ${activeTab === 'context' ? 'active' : ''}`}
          onClick={() => setActiveTab('context')}
        >
          上下文 ({phase.context_used.length})
        </button>
        <button
          className={`tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          工具调用 ({toolCalls.length})
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'input' && (
          <div className="content-section">
            {/* 理解阶段：显示用户原始 prompt */}
            {phase.phase_type === 'understand' && session?.user_prompt && (
              <div className="user-prompt-section">
                <h4 className="section-title">用户原始请求</h4>
                <div className="user-prompt-content">
                  {session.user_prompt}
                </div>
              </div>
            )}

            {/* 探索阶段：显示文件探索记录 */}
            {phase.phase_type === 'explore' && phase.exploration_record && (
              <div className="exploration-section">
                <h4 className="section-title">文件探索决策</h4>
                <p className="exploration-reasoning">
                  {phase.exploration_record.selection_reasoning}
                </p>
                <div className="files-considered">
                  <table className="files-table">
                    <thead>
                      <tr>
                        <th>文件</th>
                        <th>考虑原因</th>
                        <th>是否使用</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phase.exploration_record.files_considered.map((file, idx) => (
                        <tr key={idx} className={file.used ? 'file-used' : 'file-not-used'}>
                          <td className="file-path">{file.path}</td>
                          <td className="file-reason">{file.reason}</td>
                          <td className="file-status">{file.used ? '✓ 使用' : '✗ 未使用'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <h4 className="section-title">阶段输入</h4>
            <pre className="json-view">
              {JSON.stringify(phase.input, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="content-section">
            {phase.output ? (
              <pre className="json-view">
                {JSON.stringify(phase.output, null, 2)}
              </pre>
            ) : (
              <p className="empty-state">无输出数据</p>
            )}
          </div>
        )}

        {activeTab === 'context' && (
          <div className="content-section">
            {phase.context_used.length > 0 ? (
              <div className="context-list">
                {phase.context_used.map((ctx, index) => {
                  const config = getContextConfig(ctx.type)
                  const usageModeConfig = ctx.usage_mode
                    ? CONTEXT_USAGE_MODE_CONFIG[ctx.usage_mode as ContextUsageMode]
                    : null
                  return (
                    <div key={index} className="context-card">
                      <div className="context-header">
                        <span
                          className="context-type"
                          style={{ color: config.color }}
                        >
                          [{config.label}]
                        </span>
                        <span className="context-source">{ctx.source}</span>
                        {usageModeConfig && (
                          <span
                            className="context-usage-mode"
                            style={{
                              color: usageModeConfig.color,
                              backgroundColor: usageModeConfig.bgColor,
                            }}
                          >
                            {usageModeConfig.label}
                          </span>
                        )}
                        {ctx.relevance && (
                          <span className={`context-relevance rel-${ctx.relevance}`}>
                            {ctx.relevance}
                          </span>
                        )}
                      </div>
                      {ctx.summary && (
                        <p className="context-summary">{ctx.summary}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="empty-state">此阶段未使用外部上下文</p>
            )}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="content-section">
            {toolCalls.length > 0 ? (
              <div className="tool-list">
                {toolCalls.map((tc) => (
                  <div key={tc.call_id} className="tool-card">
                    <div className="tool-header">
                      <span className={`tool-name tool-cat-${tc.tool_category}`}>
                        {tc.tool_name}
                      </span>
                      <span className={`tool-status status-${tc.output.status}`}>
                        {tc.output.status}
                      </span>
                      <span className="tool-duration">{tc.duration_ms}ms</span>
                    </div>

                    {/* 原始命令 */}
                    {tc.input.raw_command && (
                      <code className="tool-raw-command">{tc.input.raw_command}</code>
                    )}

                    {/* 描述 */}
                    <p className="tool-desc">{tc.input.description}</p>

                    {/* 参数详情 */}
                    {tc.input.params && Object.keys(tc.input.params).length > 0 && (
                      <div className="tool-params">
                        <span className="params-label">参数:</span>
                        <pre className="params-content">
                          {JSON.stringify(tc.input.params, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* 输出结果 */}
                    {tc.output.result && (
                      <div className="tool-result-section">
                        <div
                          className={`tool-result ${tc.subagent_info?.tools_breakdown ? 'expandable' : ''}`}
                          onClick={() => tc.subagent_info?.tools_breakdown && toggleSubagent(tc.call_id)}
                          role={tc.subagent_info?.tools_breakdown ? 'button' : undefined}
                          tabIndex={tc.subagent_info?.tools_breakdown ? 0 : undefined}
                        >
                          <span className="result-label">结果:</span>
                          {tc.subagent_info?.tools_breakdown && (
                            <span className="expand-icon">
                              {expandedSubagents.has(tc.call_id) ? '▼' : '▶'}
                            </span>
                          )}
                          {typeof tc.output.result === 'object' && 'display' in tc.output.result && typeof tc.output.result.display === 'string' ? (
                            <span className="result-display">{tc.output.result.display}</span>
                          ) : (
                            <pre className="result-content">
                              {JSON.stringify(tc.output.result, null, 2)}
                            </pre>
                          )}
                        </div>

                        {/* 子代理工具明细（展开后显示） */}
                        {tc.subagent_info?.tools_breakdown && expandedSubagents.has(tc.call_id) && (
                          <div className="subagent-details">
                            <div className="subagent-header">
                              <span className="subagent-type">{tc.subagent_info.subagent_type} 子代理</span>
                              <span className="subagent-stats">
                                共 {tc.subagent_info.tool_uses} 次工具调用
                                {tc.subagent_info.tokens_used && ` · ${formatTokens(tc.subagent_info.tokens_used)}`}
                              </span>
                            </div>
                            <div className="subagent-tools-detail">
                              <table className="tools-breakdown-table">
                                <thead>
                                  <tr>
                                    <th>工具</th>
                                    <th>调用次数</th>
                                    <th>占比</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tc.subagent_info.tools_breakdown.map((tool, idx) => (
                                    <tr key={idx}>
                                      <td className="tool-name-cell">{tool.tool_name}</td>
                                      <td className="tool-count-cell">{tool.count}</td>
                                      <td className="tool-percent-cell">
                                        {((tool.count / tc.subagent_info!.tool_uses) * 100).toFixed(0)}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 上下文贡献 */}
                    {tc.context_contribution && (
                      <div className="tool-contribution-section">
                        <div
                          className={`tool-contribution ${tc.context_contribution.full_content ? 'expandable' : ''}`}
                          onClick={() => tc.context_contribution?.full_content && toggleContribution(tc.call_id)}
                          role={tc.context_contribution.full_content ? 'button' : undefined}
                          tabIndex={tc.context_contribution.full_content ? 0 : undefined}
                        >
                          {tc.context_contribution.full_content && (
                            <span className="expand-icon">
                              {expandedContributions.has(tc.call_id) ? '▼' : '▶'}
                            </span>
                          )}
                          → {tc.context_contribution.summary}
                        </div>
                        {tc.context_contribution.full_content && expandedContributions.has(tc.call_id) && (
                          <pre className="contribution-content">
                            {tc.context_contribution.full_content}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">此阶段未调用工具</p>
            )}
          </div>
        )}
      </div>

      <div className="panel-meta">
        <div className="meta-row">
          <span className="meta-label">phase_id:</span>
          <span className="meta-value">{phase.phase_id}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">started_at:</span>
          <span className="meta-value">{phase.started_at}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">ended_at:</span>
          <span className="meta-value">{phase.ended_at}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">duration:</span>
          <span className="meta-value">{formatDuration(phase.duration_ms)}</span>
        </div>
      </div>

      {phase.decisions.length > 0 && (
        <div className="panel-decisions">
          <h3>决策记录</h3>
          {phase.decisions.map((dec) => (
            <div key={dec.decision_id} className="decision-card">
              <span className="decision-type">[{dec.type}]</span>
              <span className="decision-desc">{dec.description}</span>
              {dec.reasoning && (
                <p className="decision-reasoning">{dec.reasoning}</p>
              )}
            </div>
          ))}
        </div>
      )}

          {phase.status === 'failed' && (
            <div className="panel-error">
              <h3>⚠️ 阶段执行失败</h3>
              <p>请检查工具调用详情查看错误信息</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens} tokens`
  return `${(tokens / 1000).toFixed(1)}k tokens`
}
