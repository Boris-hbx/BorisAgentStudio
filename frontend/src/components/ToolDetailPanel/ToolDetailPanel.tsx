/**
 * ToolDetailPanel - 工具调用详情面板
 *
 * 显示选中工具调用的详细信息
 */

import type { AgentSession, ToolCall, ToolCategory } from '../../types/agent'
import { TOOL_CATEGORY_CONFIG } from '../../types/agent'
import { CodeDiffSection } from '../CodeDiff'
import { isCodeChangeOperation } from '../../utils/codeDiffUtils'
import './ToolDetailPanel.css'

interface ToolDetailPanelProps {
  toolCall: ToolCall | null
  session: AgentSession | null
  onClose: () => void
}

export function ToolDetailPanel({ toolCall, session, onClose }: ToolDetailPanelProps) {
  if (!toolCall) {
    return (
      <div className="tool-detail-panel empty">
        <div className="empty-hint">
          <span className="empty-icon">🔧</span>
          <p>点击工具节点查看详情</p>
        </div>
      </div>
    )
  }

  const categoryConfig = TOOL_CATEGORY_CONFIG[toolCall.tool_category as ToolCategory] || {
    color: '#6b7280',
    label: '其他',
  }

  return (
    <div className="tool-detail-panel open">
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <span className="tool-name">{toolCall.tool_name}</span>
          <span
            className="tool-category"
            style={{ color: categoryConfig.color }}
          >
            {categoryConfig.label}
          </span>
        </div>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="panel-content">
        {/* Status & Duration */}
        <div className="detail-row">
          <span className="detail-label">状态</span>
          <span className={`detail-value status-${toolCall.output.status}`}>
            {toolCall.output.status === 'success' ? '✓ 成功' : '✗ 失败'}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">耗时</span>
          <span className="detail-value">{formatDuration(toolCall.duration_ms)}</span>
        </div>

        {/* Description */}
        {toolCall.input.description && (
          <div className="detail-section">
            <h4 className="section-title">描述</h4>
            <p className="description-text">{toolCall.input.description}</p>
          </div>
        )}

        {/* Parameters */}
        {toolCall.input.params && Object.keys(toolCall.input.params).length > 0 && (
          <div className="detail-section">
            <h4 className="section-title">参数</h4>
            <pre className="code-block">
              {JSON.stringify(toolCall.input.params, null, 2)}
            </pre>
          </div>
        )}

        {/* Raw command (for Bash) */}
        {toolCall.input.raw_command && (
          <div className="detail-section">
            <h4 className="section-title">命令</h4>
            <code className="command-block">{toolCall.input.raw_command}</code>
          </div>
        )}

        {/* Output */}
        {toolCall.output.result && (
          <div className="detail-section">
            <h4 className="section-title">输出</h4>
            {typeof toolCall.output.result === 'object' &&
            'display' in toolCall.output.result &&
            typeof toolCall.output.result.display === 'string' ? (
              <div className="output-display">{toolCall.output.result.display}</div>
            ) : (
              <pre className="code-block">
                {JSON.stringify(toolCall.output.result, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Error */}
        {toolCall.output.error && (
          <div className="detail-section error-section">
            <h4 className="section-title">错误</h4>
            <pre className="code-block error-block">{toolCall.output.error}</pre>
          </div>
        )}

        {/* Context contribution */}
        {toolCall.context_contribution && (
          <div className="detail-section">
            <h4 className="section-title">上下文贡献</h4>
            <div className="contribution-summary">
              <span className="contribution-type">
                [{toolCall.context_contribution.type}]
              </span>
              <span className="contribution-text">
                {toolCall.context_contribution.summary}
              </span>
            </div>
            {toolCall.context_contribution.full_content && (
              <details className="contribution-details">
                <summary>查看完整内容</summary>
                <pre className="code-block">
                  {toolCall.context_contribution.full_content}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Subagent info */}
        {toolCall.subagent_info && (
          <div className="detail-section">
            <h4 className="section-title">子代理信息</h4>
            <div className="subagent-info">
              <div className="detail-row">
                <span className="detail-label">类型</span>
                <span className="detail-value">{toolCall.subagent_info.subagent_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">工具调用</span>
                <span className="detail-value">{toolCall.subagent_info.tool_uses} 次</span>
              </div>
              {toolCall.subagent_info.tokens_used && (
                <div className="detail-row">
                  <span className="detail-label">Token 使用</span>
                  <span className="detail-value">
                    {formatTokens(toolCall.subagent_info.tokens_used)}
                  </span>
                </div>
              )}
              {toolCall.subagent_info.tools_breakdown && (
                <div className="tools-breakdown">
                  <h5>工具明细</h5>
                  <table>
                    <thead>
                      <tr>
                        <th>工具</th>
                        <th>次数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toolCall.subagent_info.tools_breakdown.map((tool, idx) => (
                        <tr key={idx}>
                          <td>{tool.tool_name}</td>
                          <td>{tool.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code diff for Write/Edit tools */}
        {session && isCodeChangeOperation(toolCall) && (
          <CodeDiffSection toolCall={toolCall} session={session} />
        )}
      </div>

      {/* Footer with meta info */}
      <div className="panel-footer">
        <span className="meta-item">ID: {toolCall.call_id}</span>
      </div>
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`
  return `${(tokens / 1000).toFixed(1)}k`
}
