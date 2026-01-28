/**
 * PhaseNode - 可展开的阶段节点组件
 *
 * 基于 SPEC-011：分层工作流可视化
 * 基于 SPEC-027：多 Agent 协作可视化增强
 */

import type { PhaseGroup } from '../../utils/groupToolCalls'
import { PHASE_COLORS } from '../../utils/groupToolCalls'
import type { ToolCall, ContextReference, Decision } from '../../types/agent'
import { CONTEXT_TYPE_CONFIG, CONTEXT_USAGE_MODE_CONFIG, TOOL_CATEGORY_CONFIG, ContextType, ContextUsageMode, ToolCategory } from '../../types/agent'
import { parseRoleFromCallId, ROLE_CONFIG } from '../../utils/roleUtils'
import './PhaseNode.css'

/** 角色配置（本地兼容，用于描述解析） */
const LOCAL_ROLE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  product_owner: { icon: '👔', color: '#f59e0b', label: 'Product Owner' },
  architect: { icon: '🏛️', color: '#a78bfa', label: 'Architect' },
  challenger: { icon: '🛡️', color: '#fb923c', label: 'Challenger' },
  design_authority: { icon: '🎨', color: '#ec4899', label: 'Design Authority' },
  developer: { icon: '👨‍💻', color: '#60a5fa', label: 'Developer' },
  reviewer: { icon: '🔍', color: '#34d399', label: 'Reviewer' },
}

/** 从描述中提取角色信息 */
function parseRolesFromDescription(description: string): {
  roles: Array<{ role: string; count?: number }>
  cleanDescription: string
} {
  const roles: Array<{ role: string; count?: number }> = []
  let cleanDescription = description

  // 检测角色关键词（支持 Boris's Team 全部 6 个角色）
  const rolePatterns = [
    { pattern: /product[_\s-]?owner/i, role: 'product_owner' },
    { pattern: /architect/i, role: 'architect' },
    { pattern: /challenger[s]?/i, role: 'challenger' },
    { pattern: /design[_\s-]?authority/i, role: 'design_authority' },
    { pattern: /developer[s]?/i, role: 'developer' },
    { pattern: /reviewer[s]?/i, role: 'reviewer' },
  ]

  for (const { pattern, role } of rolePatterns) {
    if (pattern.test(description)) {
      // 检测是否有数量（如 "2 developers"）
      const countMatch = description.match(new RegExp(`(\\d+)\\s*${role}`, 'i'))
      const count = countMatch ? parseInt(countMatch[1], 10) : undefined
      roles.push({ role, count })
    }
  }

  return { roles, cleanDescription }
}

/** 从工具调用中检测执行角色 */
function detectRolesFromToolCalls(toolCalls: ToolCall[]): Array<{ role: string; count: number }> {
  const roleMap = new Map<string, number>()

  for (const tc of toolCalls) {
    if (tc.subagent_info?.subagent_type) {
      const role = tc.subagent_info.subagent_type
      roleMap.set(role, (roleMap.get(role) || 0) + 1)
    }
  }

  // 如果没有 subagent，但有工具调用，默认是 architect
  if (roleMap.size === 0 && toolCalls.length > 0) {
    // 检查是否有委派类工具
    const hasDelegation = toolCalls.some(tc => tc.tool_name === 'Task')
    if (hasDelegation) {
      roleMap.set('architect', 1)
    }
  }

  return Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }))
}

/** 角色增强描述组件 */
function RoleEnhancedDescription({
  description,
  toolCalls,
}: {
  description: string
  toolCalls: ToolCall[]
}) {
  // 从描述解析角色
  const { roles: descRoles } = parseRolesFromDescription(description)

  // 从工具调用检测角色
  const toolRoles = detectRolesFromToolCalls(toolCalls)

  // 合并角色信息（优先用工具调用的统计）
  const displayRoles = toolRoles.length > 0 ? toolRoles : descRoles

  // 如果没有角色信息，显示原始描述
  if (displayRoles.length === 0) {
    return <div className="phase-description">{description}</div>
  }

  // 构建角色流：检测是否有委派关系
  const hasDelegation = toolCalls.some(tc => tc.tool_name === 'Task')
  const delegatedRoles = toolRoles.filter(r => r.role !== 'architect')

  return (
    <div className="phase-description role-enhanced">
      <div className="role-flow-inline">
        {/* 主执行角色 */}
        {descRoles.some(r => r.role === 'architect') && (
          <span className="role-badge" style={{ borderColor: LOCAL_ROLE_CONFIG.architect.color }}>
            <span className="role-icon">{LOCAL_ROLE_CONFIG.architect.icon}</span>
            <span className="role-name" style={{ color: LOCAL_ROLE_CONFIG.architect.color }}>
              Architect
            </span>
          </span>
        )}

        {/* 委派箭头和目标角色 */}
        {hasDelegation && delegatedRoles.length > 0 && (
          <>
            <span className="role-arrow">→</span>
            {delegatedRoles.map((r, idx) => {
              const config = LOCAL_ROLE_CONFIG[r.role] || { icon: '👤', color: '#6b7280', label: r.role }
              return (
                <span key={r.role}>
                  {idx > 0 && <span className="role-plus">+</span>}
                  <span className="role-badge" style={{ borderColor: config.color }}>
                    <span className="role-icon">{config.icon}</span>
                    {r.count > 1 && <span className="role-count">×{r.count}</span>}
                    <span className="role-name" style={{ color: config.color }}>
                      {config.label}
                    </span>
                  </span>
                </span>
              )
            })}
          </>
        )}

        {/* 无委派时显示描述中的角色 */}
        {!hasDelegation && descRoles.length > 0 && (
          descRoles.map((r, idx) => {
            const config = LOCAL_ROLE_CONFIG[r.role] || { icon: '👤', color: '#6b7280', label: r.role }
            return (
              <span key={r.role}>
                {idx > 0 && <span className="role-arrow">→</span>}
                <span className="role-badge" style={{ borderColor: config.color }}>
                  <span className="role-icon">{config.icon}</span>
                  {r.count && r.count > 1 && <span className="role-count">×{r.count}</span>}
                  <span className="role-name" style={{ color: config.color }}>
                    {config.label}
                  </span>
                </span>
              </span>
            )
          })
        )}
      </div>
      <div className="role-description-text">{description}</div>
    </div>
  )
}

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
          {/* 阶段描述 - 带角色指示 */}
          {group.description && (
            <RoleEnhancedDescription
              description={group.description}
              toolCalls={group.tool_calls}
            />
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

  // 解析角色 - 统一显示角色图标
  const role = parseRoleFromCallId(toolCall.call_id)
  const roleConfig = ROLE_CONFIG[role]

  // 提取输出摘要
  const outputSummary = getOutputSummary(toolCall)

  return (
    <button
      className={`tool-chip ${isSelected ? 'selected' : ''} status-${toolCall.output.status}`}
      style={{ borderColor: categoryConfig.color }}
      onClick={onClick}
      title={`[${roleConfig.labelCn}] ${toolCall.input.description || toolCall.tool_name}\n输出: ${outputSummary}`}
    >
      <span
        className="chip-role"
        style={{ backgroundColor: roleConfig.color }}
        title={roleConfig.labelCn}
      >
        {roleConfig.icon}
      </span>
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
