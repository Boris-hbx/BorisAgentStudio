/**
 * Core type definitions for Claude Code execution visualization.
 *
 * 基于 STD-001 v3.0：工具调用流优先模型
 *
 * 核心理念：
 * - tool_calls[] 是第一公民（真实执行流）
 * - phase_annotations[] 是可选的事后分析
 */

// ============ 状态类型 ============

export type SessionStatus = 'success' | 'failed' | 'in_progress'

export type PhaseStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

// ============ 阶段分析框架 ============

/**
 * 五阶段分析框架（用于事后标注，不是执行约束）
 */
export type PhaseType =
  | 'understand'
  | 'explore'
  | 'plan'
  | 'execute'
  | 'verify'
  | 'mixed'        // 混合，无法明确分类
  | 'unclassified' // 未标注

export const PHASE_LABELS: Record<PhaseType, string> = {
  understand: '理解',
  explore: '探索',
  plan: '规划',
  execute: '执行',
  verify: '验证',
  mixed: '混合',
  unclassified: '未标注',
}

export const PHASE_ORDER: PhaseType[] = [
  'understand',
  'explore',
  'plan',
  'execute',
  'verify',
]

/**
 * 标注置信度
 */
export type AnnotationConfidence = 'high' | 'medium' | 'low'

/**
 * 标注来源
 */
export type AnnotationSource = 'agent' | 'human' | 'auto'

// ============ 工具类型 ============

/**
 * 工具类别（扩展版）
 */
export type ToolCategory =
  | 'perception'       // 感知：Read, Glob, Grep, LSP
  | 'action'           // 行动：Write, Edit, Bash
  | 'interaction'      // 交互：Task, AskUserQuestion
  | 'planning'         // 规划：EnterPlanMode, ExitPlanMode
  | 'task_management'  // 任务管理：TaskCreate, TaskUpdate

export const TOOL_CATEGORY_CONFIG: Record<ToolCategory, { color: string; label: string }> = {
  perception: { color: '#3b82f6', label: '感知' },
  action: { color: '#f97316', label: '行动' },
  interaction: { color: '#a855f7', label: '交互' },
  planning: { color: '#22c55e', label: '规划' },
  task_management: { color: '#6b7280', label: '任务管理' },
}

// ============ 上下文类型 ============

/**
 * 上下文引用类型
 */
export type ContextType =
  | 'claude_md'
  | 'rule'
  | 'standard'
  | 'skill'
  | 'spec'
  | 'file'
  | 'user_message'
  | 'tool_result'
  | 'capability'

/**
 * 上下文使用方式
 */
export type ContextUsageMode = 'read' | 'modified' | 'read_then_modified'

export const CONTEXT_USAGE_MODE_CONFIG: Record<ContextUsageMode, { color: string; bgColor: string; label: string }> = {
  read: { color: '#0369a1', bgColor: '#e0f2fe', label: '仅读取' },
  modified: { color: '#92400e', bgColor: '#fef3c7', label: '已修改' },
  read_then_modified: { color: '#166534', bgColor: '#dcfce7', label: '读取并修改' },
}

/**
 * 上下文类型的颜色映射（用于可视化）
 */
export const CONTEXT_TYPE_CONFIG: Record<ContextType, { color: string; label: string }> = {
  claude_md: { color: '#f97316', label: 'CLAUDE.md' },
  rule: { color: '#3b82f6', label: '规则' },
  standard: { color: '#22c55e', label: '标准' },
  skill: { color: '#f97316', label: '技能' },
  spec: { color: '#a855f7', label: '规格' },
  file: { color: '#8b949e', label: '文件' },
  user_message: { color: '#58a6ff', label: '用户消息' },
  tool_result: { color: '#6b7280', label: '工具结果' },
  capability: { color: '#ec4899', label: '能力' },
}

// ============ 核心数据结构 ============

/**
 * 上下文引用
 */
export interface ContextReference {
  type: string  // 允许任意类型，已知类型见 ContextType
  source: string
  relevance?: 'high' | 'medium' | 'low'
  summary?: string
  quoted_content?: string
  usage_mode?: ContextUsageMode
}

/**
 * 决策记录
 */
export interface Decision {
  decision_id: string
  type: 'approach' | 'tool_selection' | 'error_handling' | 'skip' | 'retry'
  description: string
  reasoning?: string
  alternatives_considered?: string[]
}

/**
 * 子代理统计信息（用于 Task 工具）
 */
export interface SubagentInfo {
  subagent_type: string
  tool_uses: number
  tokens_used?: number
  tools_breakdown?: Array<{
    tool_name: string
    count: number
  }>
}

/**
 * 工具调用记录（核心数据结构）
 *
 * 这是日志的第一公民，每次工具调用都是独立、可观测的事件。
 */
export interface ToolCall {
  call_id: string
  tool_name: string
  tool_category: ToolCategory

  started_at: string
  ended_at: string
  duration_ms: number

  input: {
    params: Record<string, unknown>
    description?: string
    raw_command?: string
  }

  output: {
    status: 'success' | 'failed'
    result?: Record<string, unknown>
    error?: string
    truncated?: boolean
  }

  context_contribution?: {
    type: 'file_content' | 'search_result' | 'command_output' | 'knowledge'
    summary: string
    full_content?: string
  }

  subagent_info?: SubagentInfo
}

/**
 * 阶段标注（可选，事后分析）
 *
 * 这不是 Agent 执行的"阶段"，而是对执行过程的解读。
 */
export interface PhaseAnnotation {
  annotation_id: string
  phase_type: PhaseType

  /** 覆盖的工具调用范围 */
  tool_call_range: {
    start_call_id: string
    end_call_id: string
  }

  /** 标注元数据 */
  annotated_by: AnnotationSource
  annotated_at: string
  confidence: AnnotationConfidence

  /** 标注内容 */
  description?: string
  decisions?: Decision[]
  context_used?: ContextReference[]
}

// ============ 会话结构 ============

/**
 * Agent 信息
 */
export interface AgentInfo {
  model_id: string
  capability_snapshot?: string
}

/**
 * 会话摘要
 */
export interface SessionSummary {
  total_duration_ms: number
  tool_calls_count: number
  files_created: string[]
  files_modified: string[]
  errors_encountered?: number
}

/**
 * Agent 执行会话（STD-001 v3.0）
 *
 * 核心数据模型：
 * - tool_calls[] 必须：真实执行流
 * - phase_annotations[] 可选：事后分析标注
 */
export interface AgentSession {
  session_id: string
  task_title: string
  task_description?: string
  user_prompt: string

  created_at: string
  completed_at?: string  // v3.0 使用 completed_at
  updated_at?: string    // 兼容旧字段
  status: SessionStatus

  agent: AgentInfo

  /** 核心：工具调用序列（必须） */
  tool_calls: ToolCall[]

  /** 可选：阶段标注（事后分析） */
  phase_annotations?: PhaseAnnotation[]

  /** 摘要 */
  summary: SessionSummary

  // ============ v2.x 兼容字段 ============
  /** @deprecated 使用 phase_annotations 替代 */
  phases?: LegacyExecutionPhase[]
}

// ============ v2.x 兼容类型 ============

/**
 * 循环执行信息（v2.x 兼容）
 * @deprecated
 */
export interface LoopInfo {
  attempt_number: number
  max_attempts: number
  is_retry: boolean
  previous_attempt_id?: string
}

/**
 * 文件探索记录（v2.x 兼容）
 * @deprecated
 */
export interface FileExplorationRecord {
  files_considered: Array<{
    path: string
    reason: string
    used: boolean
  }>
  selection_reasoning: string
}

/**
 * 旧版执行阶段（v2.x 兼容）
 * @deprecated 使用 PhaseAnnotation 替代
 */
export interface LegacyExecutionPhase {
  phase_id: string
  phase_type: PhaseType
  status: PhaseStatus
  started_at: string
  ended_at: string
  duration_ms: number
  input: Record<string, unknown>
  output: Record<string, unknown>
  tool_call_ids: string[]
  context_used: ContextReference[]
  decisions: Decision[]
  loop_info?: LoopInfo
  exploration_record?: FileExplorationRecord
}

/**
 * 循环执行摘要（v2.x 兼容）
 * @deprecated
 */
export interface LoopSummary {
  plan_execute_loops: number
  loop_resolved: boolean
  loop_phase_ids: string[]
}

// ============ WebSocket ============

export type WSEventType = 'tool_call' | 'phase_annotation' | 'session_complete' | 'subscribed'

export interface WSMessage {
  event: WSEventType
  data: unknown
}

// ============ 兼容旧格式的类型 ============

/**
 * 领域知识来源类型（保留用于 KnowledgeMarkers）
 */
export type KnowledgeSourceType = 'skill' | 'graph' | 'temp' | 'unknown'

export const KNOWLEDGE_SOURCE_CONFIG: Record<KnowledgeSourceType, { color: string; label: string }> = {
  skill: { color: 'var(--knowledge-skill)', label: '.skill 文件' },
  graph: { color: 'var(--knowledge-graph)', label: '知识图谱' },
  temp: { color: 'var(--knowledge-temp)', label: '临时读取' },
  unknown: { color: 'var(--text-secondary)', label: '未知来源' },
}

// ============ 工具函数 ============

/**
 * 判断是否为 v2.x 旧格式会话
 */
export function isLegacySession(session: AgentSession): boolean {
  return !!(session.phases && session.phases.length > 0 && !session.phase_annotations)
}

/**
 * 从旧格式提取工具调用（兼容处理）
 */
export function getToolCalls(session: AgentSession): ToolCall[] {
  if (session.tool_calls && session.tool_calls.length > 0) {
    return session.tool_calls
  }
  // v2.x 兼容：tool_calls 应该已经是扁平的
  return session.tool_calls || []
}

/**
 * 获取阶段标注（兼容 v2.x）
 */
export function getPhaseAnnotations(session: AgentSession): PhaseAnnotation[] {
  if (session.phase_annotations) {
    return session.phase_annotations
  }
  // v2.x 兼容：从 phases 转换
  if (session.phases) {
    return session.phases.map((phase, index) => ({
      annotation_id: `ann-${index + 1}`,
      phase_type: phase.phase_type,
      tool_call_range: {
        start_call_id: phase.tool_call_ids[0] || '',
        end_call_id: phase.tool_call_ids[phase.tool_call_ids.length - 1] || '',
      },
      annotated_by: 'auto' as AnnotationSource,
      annotated_at: phase.ended_at,
      confidence: 'medium' as AnnotationConfidence,
      description: `${PHASE_LABELS[phase.phase_type]}阶段`,
      decisions: phase.decisions,
      context_used: phase.context_used,
    }))
  }
  return []
}
