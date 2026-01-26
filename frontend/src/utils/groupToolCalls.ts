/**
 * groupToolCalls.ts - 工具调用分组转换层
 *
 * 将不同格式的 session 数据统一转换为 PhaseGroup 结构
 * 支持 v2.x phases、v3.0 phase_annotations、自动分组
 */

import type {
  AgentSession,
  ToolCall,
  PhaseType,
  ContextReference,
  Decision,
  ToolCategory,
} from '../types/agent'
import { PHASE_LABELS } from '../types/agent'

/**
 * 统一的阶段分组结构
 */
export interface PhaseGroup {
  group_id: string
  phase_type: PhaseType
  label: string

  // 统计信息
  tool_count: number
  duration_ms: number
  has_errors: boolean

  // 内容
  tool_calls: ToolCall[]
  decisions: Decision[]
  context_used: ContextReference[]
  description?: string

  // 元信息
  source: 'phases' | 'annotations' | 'auto'
  confidence: 'high' | 'medium' | 'low'
}

/**
 * 从 session 数据生成 PhaseGroup 列表
 */
export function getPhaseGroups(session: AgentSession): PhaseGroup[] {
  // 优先级：v2.x phases > v3.0 phase_annotations > 自动分组
  if (session.phases && session.phases.length > 0) {
    return fromLegacyPhases(session)
  }

  if (session.phase_annotations && session.phase_annotations.length > 0) {
    return fromPhaseAnnotations(session)
  }

  // 自动分组
  return autoGroupToolCalls(session.tool_calls)
}

/**
 * 从 v2.x phases 转换
 */
function fromLegacyPhases(session: AgentSession): PhaseGroup[] {
  const phases = session.phases || []
  const toolCallMap = new Map(session.tool_calls.map((tc) => [tc.call_id, tc]))

  return phases.map((phase, index) => {
    const toolCalls = (phase.tool_call_ids || [])
      .map((id) => toolCallMap.get(id))
      .filter((tc): tc is ToolCall => tc !== undefined)

    return {
      group_id: phase.phase_id || `phase-${index}`,
      phase_type: phase.phase_type,
      label: PHASE_LABELS[phase.phase_type] || phase.phase_type,
      tool_count: toolCalls.length,
      duration_ms: phase.duration_ms || calculateDuration(toolCalls),
      has_errors: toolCalls.some((tc) => tc.output.status === 'failed'),
      tool_calls: toolCalls,
      decisions: phase.decisions || [],
      context_used: phase.context_used || [],
      description: undefined,
      source: 'phases',
      confidence: 'high',
    }
  })
}

/**
 * 从 v3.0 phase_annotations 转换
 */
function fromPhaseAnnotations(session: AgentSession): PhaseGroup[] {
  const annotations = session.phase_annotations || []
  const toolCalls = session.tool_calls || []

  // 创建 call_id 到 index 的映射
  const callIdToIndex = new Map(toolCalls.map((tc, i) => [tc.call_id, i]))

  return annotations.map((ann) => {
    const startIdx = callIdToIndex.get(ann.tool_call_range.start_call_id) ?? 0
    const endIdx = callIdToIndex.get(ann.tool_call_range.end_call_id) ?? toolCalls.length - 1
    const groupToolCalls = toolCalls.slice(startIdx, endIdx + 1)

    return {
      group_id: ann.annotation_id,
      phase_type: ann.phase_type,
      label: PHASE_LABELS[ann.phase_type] || ann.phase_type,
      tool_count: groupToolCalls.length,
      duration_ms: calculateDuration(groupToolCalls),
      has_errors: groupToolCalls.some((tc) => tc.output.status === 'failed'),
      tool_calls: groupToolCalls,
      decisions: ann.decisions || [],
      context_used: ann.context_used || [],
      description: ann.description,
      source: 'annotations',
      confidence: ann.confidence,
    }
  })
}

/**
 * 自动分组算法
 * 基于工具类别和时序特征推断阶段
 */
function autoGroupToolCalls(toolCalls: ToolCall[]): PhaseGroup[] {
  if (toolCalls.length === 0) {
    return []
  }

  const groups: PhaseGroup[] = []
  let currentGroup: ToolCall[] = []
  let currentPhaseType: PhaseType = 'unclassified'

  const flushGroup = () => {
    if (currentGroup.length > 0) {
      groups.push({
        group_id: `auto-${groups.length + 1}`,
        phase_type: currentPhaseType,
        label: PHASE_LABELS[currentPhaseType] || currentPhaseType,
        tool_count: currentGroup.length,
        duration_ms: calculateDuration(currentGroup),
        has_errors: currentGroup.some((tc) => tc.output.status === 'failed'),
        tool_calls: [...currentGroup],
        decisions: [],
        context_used: extractContextFromToolCalls(currentGroup),
        description: undefined,
        source: 'auto',
        confidence: 'low',
      })
      currentGroup = []
    }
  }

  for (let i = 0; i < toolCalls.length; i++) {
    const tc = toolCalls[i]
    const inferredPhase = inferPhaseFromToolCall(tc, i, toolCalls.length)

    // 如果阶段类型变化，刷新当前组
    if (currentGroup.length > 0 && inferredPhase !== currentPhaseType) {
      flushGroup()
    }

    currentPhaseType = inferredPhase
    currentGroup.push(tc)
  }

  // 刷新最后一组
  flushGroup()

  return groups
}

/**
 * 根据工具调用推断阶段类型
 */
function inferPhaseFromToolCall(
  tc: ToolCall,
  index: number,
  totalCount: number
): PhaseType {
  const category = tc.tool_category as ToolCategory
  const toolName = tc.tool_name.toLowerCase()

  // 规划工具
  if (category === 'planning' || toolName.includes('plan')) {
    return 'plan'
  }

  // 任务管理
  if (category === 'task_management') {
    return 'plan'
  }

  // 交互工具
  if (category === 'interaction') {
    return 'plan'
  }

  // 最后的 perception 可能是验证
  if (category === 'perception') {
    // 检查是否是验证类操作（tsc、test、check 等）
    const isVerification =
      toolName.includes('tsc') ||
      toolName.includes('test') ||
      toolName.includes('check') ||
      (tc.input.description?.toLowerCase().includes('验证') ?? false) ||
      (tc.input.description?.toLowerCase().includes('检查') ?? false)

    if (isVerification || index >= totalCount - 3) {
      // 最后几个 perception 调用可能是验证
      const remainingCalls = totalCount - index
      if (remainingCalls <= 3 && isVerification) {
        return 'verify'
      }
    }

    return 'explore'
  }

  // action 类型
  if (category === 'action') {
    return 'execute'
  }

  return 'mixed'
}

/**
 * 从工具调用中提取上下文引用
 */
function extractContextFromToolCalls(toolCalls: ToolCall[]): ContextReference[] {
  const contexts: ContextReference[] = []
  const seen = new Set<string>()

  for (const tc of toolCalls) {
    // 从 Read/Glob/Grep 操作中提取文件引用
    if (tc.tool_category === 'perception' && tc.input.params) {
      const filePath = tc.input.params.file_path as string | undefined
      if (filePath && !seen.has(filePath)) {
        seen.add(filePath)
        contexts.push({
          type: inferContextType(filePath),
          source: filePath,
          relevance: 'medium',
          usage_mode: 'read',
        })
      }
    }

    // 从 Write/Edit 操作中提取
    if (tc.tool_category === 'action' && tc.input.params) {
      const filePath = tc.input.params.file_path as string | undefined
      if (filePath && !seen.has(filePath)) {
        seen.add(filePath)
        contexts.push({
          type: inferContextType(filePath),
          source: filePath,
          relevance: 'high',
          usage_mode: 'modified',
        })
      } else if (filePath && seen.has(filePath)) {
        // 更新为 read_then_modified
        const existing = contexts.find((c) => c.source === filePath)
        if (existing) {
          existing.usage_mode = 'read_then_modified'
        }
      }
    }

    // 从 context_contribution 中提取
    if (tc.context_contribution) {
      const summary = tc.context_contribution.summary
      if (summary && !seen.has(summary)) {
        seen.add(summary)
        // 这里不添加，因为 context_contribution 是工具调用的输出，不是引用
      }
    }
  }

  return contexts
}

/**
 * 根据文件路径推断上下文类型
 */
function inferContextType(filePath: string): string {
  const lower = filePath.toLowerCase()

  if (lower.includes('claude.md')) return 'claude_md'
  if (lower.includes('/rules/') || lower.includes('\\rules\\')) return 'rule'
  if (lower.includes('/standards/') || lower.includes('\\standards\\')) return 'standard'
  if (lower.includes('/skills/') || lower.includes('\\skills\\')) return 'skill'
  if (lower.includes('/specs/') || lower.includes('\\specs\\')) return 'spec'
  if (lower.includes('capability')) return 'capability'

  return 'file'
}

/**
 * 计算工具调用的总耗时
 */
function calculateDuration(toolCalls: ToolCall[]): number {
  return toolCalls.reduce((sum, tc) => sum + (tc.duration_ms || 0), 0)
}

/**
 * 阶段颜色配置
 */
export const PHASE_COLORS: Record<PhaseType, string> = {
  understand: '#8b5cf6',
  explore: '#3b82f6',
  plan: '#22c55e',
  execute: '#f97316',
  verify: '#ec4899',
  mixed: '#6b7280',
  unclassified: '#4b5563',
}
