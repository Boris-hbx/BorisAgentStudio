/**
 * Multi-Agent Collaboration Type Definitions
 *
 * Extends the base agent.ts types to support multi-agent sessions.
 * Based on SPEC-021, SPEC-022, SPEC-023, and STD-008.
 *
 * Design Principle: Extensible agent types via registry pattern.
 * New agent types can be added without modifying core interfaces.
 */

import type {
  AgentSession,
  SessionStatus,
  SessionSummary,
  ToolCall,
  ToolCategory,
} from './agent'

// ============ Agent Identity ============

/**
 * Built-in agent types (common roles)
 */
export type BuiltinAgentType =
  | 'architect'
  | 'developer'
  | 'reviewer'
  | 'challenger'
  | 'product_owner'
  | 'design_authority'

/**
 * Agent type - extensible string type
 * Built-in types are provided for convenience, but any string is valid.
 * This allows custom agent types like 'tester', 'documenter', 'security', etc.
 */
export type AgentType = BuiltinAgentType | (string & {})

/**
 * Agent role category for grouping similar agents
 */
export type AgentRoleCategory = 'orchestrator' | 'worker' | 'validator' | 'specialist'

/**
 * Unique identifier for an agent instance
 */
export interface AgentIdentifier {
  agent_id: string
  agent_type: AgentType
  instance_id?: string
  /** Optional: role category for grouping */
  role_category?: AgentRoleCategory
}

/**
 * Agent type configuration for visualization
 */
export interface AgentTypeConfig {
  color: string
  bgColor: string
  label: string
  icon: string
  role_category: AgentRoleCategory
}

/**
 * Built-in agent type configurations
 */
export const BUILTIN_AGENT_CONFIGS: Record<BuiltinAgentType, AgentTypeConfig> = {
  product_owner: { color: '#f59e0b', bgColor: '#fffbeb', label: 'Product Owner', icon: '👔', role_category: 'orchestrator' },
  architect: { color: '#a78bfa', bgColor: '#f5f3ff', label: 'Architect', icon: '🏛️', role_category: 'orchestrator' },
  challenger: { color: '#fb923c', bgColor: '#fff7ed', label: 'Challenger', icon: '🛡️', role_category: 'validator' },
  design_authority: { color: '#ec4899', bgColor: '#fdf2f8', label: 'Design Authority', icon: '🎨', role_category: 'validator' },
  developer: { color: '#60a5fa', bgColor: '#eff6ff', label: 'Developer', icon: '👨‍💻', role_category: 'worker' },
  reviewer: { color: '#34d399', bgColor: '#f0fdf4', label: 'Reviewer', icon: '🔍', role_category: 'validator' },
}

/**
 * Agent type registry - extensible configuration store
 * Use registerAgentType() to add custom types at runtime.
 */
const agentTypeRegistry = new Map<string, AgentTypeConfig>(
  Object.entries(BUILTIN_AGENT_CONFIGS)
)

/**
 * Default config for unknown agent types
 */
const DEFAULT_AGENT_CONFIG: AgentTypeConfig = {
  color: '#6b7280',
  bgColor: '#f9fafb',
  label: 'Agent',
  icon: '🤖',
  role_category: 'specialist',
}

/**
 * Color palette for auto-assigning colors to new agent types
 */
const AGENT_COLOR_PALETTE = [
  { color: '#ec4899', bgColor: '#fdf2f8' }, // Pink
  { color: '#f59e0b', bgColor: '#fffbeb' }, // Amber
  { color: '#14b8a6', bgColor: '#f0fdfa' }, // Teal
  { color: '#6366f1', bgColor: '#eef2ff' }, // Indigo
  { color: '#84cc16', bgColor: '#f7fee7' }, // Lime
  { color: '#f43f5e', bgColor: '#fff1f2' }, // Rose
  { color: '#0ea5e9', bgColor: '#f0f9ff' }, // Sky
  { color: '#a855f7', bgColor: '#faf5ff' }, // Purple
]

/**
 * Register a custom agent type
 */
export function registerAgentType(type: string, config: Partial<AgentTypeConfig>): void {
  const colorIndex = agentTypeRegistry.size % AGENT_COLOR_PALETTE.length
  const defaultColors = AGENT_COLOR_PALETTE[colorIndex]

  agentTypeRegistry.set(type, {
    color: config.color ?? defaultColors.color,
    bgColor: config.bgColor ?? defaultColors.bgColor,
    label: config.label ?? type.charAt(0).toUpperCase() + type.slice(1),
    icon: config.icon ?? '🤖',
    role_category: config.role_category ?? 'specialist',
  })
}

/**
 * Get configuration for an agent type
 * Returns default config for unknown types (graceful degradation)
 */
export function getAgentTypeConfig(type: AgentType): AgentTypeConfig {
  return agentTypeRegistry.get(type) ?? {
    ...DEFAULT_AGENT_CONFIG,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }
}

/**
 * Get all registered agent types
 */
export function getRegisteredAgentTypes(): string[] {
  return Array.from(agentTypeRegistry.keys())
}

/**
 * Check if an agent type is registered
 */
export function isRegisteredAgentType(type: string): boolean {
  return agentTypeRegistry.has(type)
}

/**
 * @deprecated Use getAgentTypeConfig() instead for extensibility
 * Kept for backward compatibility
 */
export const AGENT_TYPE_CONFIG: Record<BuiltinAgentType, AgentTypeConfig> = BUILTIN_AGENT_CONFIGS

// ============ Collaboration Session ============

/**
 * Collaboration mode
 */
export type CollaborationMode = 'single' | 'multi_agent'

/**
 * Collaboration pattern
 */
export type CollaborationPattern = 'master_worker' | 'peer_to_peer' | 'pipeline'

/**
 * Collaboration metadata
 */
export interface CollaborationInfo {
  mode: CollaborationMode
  pattern: CollaborationPattern
  orchestrator: AgentIdentifier
  participants: AgentIdentifier[]
}

/**
 * Multi-Agent Session - extends AgentSession
 */
export interface MultiAgentSession extends AgentSession {
  collaboration: CollaborationInfo
  sub_sessions: SubAgentSession[]
  messages: AgentMessage[]
  summary: MultiAgentSessionSummary
}

// ============ Sub-Agent Sessions ============

/**
 * Task assignment within a sub-session
 */
export interface TaskAssignment {
  task_id: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dependencies?: string[]
}

/**
 * Base agent output interface
 * All agent-specific outputs should extend this
 */
export interface BaseAgentOutput {
  task_id: string
  status: 'completed' | 'partial' | 'failed'
  summary: string
  /** Discriminator for type checking */
  output_type?: string
}

/**
 * Generic agent output - for custom agent types
 */
export interface GenericAgentOutput extends BaseAgentOutput {
  output_type: 'generic'
  data?: Record<string, unknown>
}

/**
 * Union of all known output types + generic fallback
 * Use type guards (isDeveloperOutput, isReviewerOutput) to narrow
 */
export type AgentOutput = DeveloperOutput | ReviewerOutput | GenericAgentOutput

/**
 * Sub-agent execution session
 */
export interface SubAgentSession {
  sub_session_id: string
  parent_session_id: string
  agent: AgentIdentifier

  triggered_by_call_id: string

  task: TaskAssignment

  started_at: string
  completed_at?: string
  status: SessionStatus
  tool_calls: ToolCall[]

  /**
   * Agent output - extensible via AgentOutput union
   * Use type guards to determine specific output type
   */
  output?: AgentOutput
}

// ============ Developer Contracts ============

/**
 * Context file reference
 */
export interface ContextFile {
  path: string
  reason: string
  sections?: string[]
}

/**
 * Previous attempt summary
 */
export interface AttemptSummary {
  attempt_number: number
  outcome: string
  feedback: string
}

/**
 * Input to Developer agent
 */
export interface DeveloperInput {
  task_id: string
  task_description: string

  context: {
    specs: ContextFile[]
    reference_files: ContextFile[]
    previous_attempts?: AttemptSummary[]
  }

  constraints: {
    scope: string[]
    testing_required: boolean
    must_not_break?: string[]
    style_guide?: string
  }

  acceptance_criteria: string[]
}

/**
 * File change record
 */
export interface FileChange {
  path: string
  change_type?: 'created' | 'modified' | 'deleted'
  lines_added?: number
  lines_removed?: number
  description?: string
}

/**
 * Output from Developer agent
 */
export interface DeveloperOutput {
  task_id: string
  status: 'completed' | 'partial' | 'failed'

  changes: {
    files_created: FileChange[]
    files_modified: FileChange[]
    files_deleted: string[]
  }

  summary: string
  implementation_notes?: string

  self_review?: {
    tests_run: boolean
    tests_passed: boolean
    type_check_passed: boolean
    known_issues?: string[]
  }

  blockers?: string[]
  suggestions?: string[]
}

// ============ Reviewer Contracts ============

/**
 * Review focus area
 */
export type ReviewFocusArea =
  | 'security'
  | 'performance'
  | 'style'
  | 'logic'
  | 'error_handling'
  | 'test_coverage'

/**
 * Custom check definition
 */
export interface CustomCheck {
  name: string
  command: string
  expected_exit_code: number
}

/**
 * Review summary from previous iteration
 */
export interface ReviewSummary {
  review_number: number
  verdict: string
  key_findings: string[]
}

/**
 * Input to Reviewer agent
 */
export interface ReviewerInput {
  review_id: string
  task_id: string

  scope: {
    files: string[]
    focus_areas: ReviewFocusArea[]
    ignore_patterns?: string[]
  }

  criteria: {
    must_pass_tests: boolean
    must_pass_type_check: boolean
    must_pass_lint?: boolean
    custom_checks?: CustomCheck[]
  }

  context: {
    task_description: string
    acceptance_criteria: string[]
    previous_reviews?: ReviewSummary[]
  }
}

/**
 * Review finding severity
 */
export type FindingSeverity = 'critical' | 'major' | 'minor' | 'suggestion'

/**
 * Review finding category
 */
export type FindingCategory = 'bug' | 'security' | 'performance' | 'style' | 'logic' | 'test'

/**
 * Severity configuration for visualization
 */
export const FINDING_SEVERITY_CONFIG: Record<FindingSeverity, { color: string; bgColor: string; label: string }> = {
  critical: { color: '#dc2626', bgColor: '#fef2f2', label: 'Critical' },
  major: { color: '#f97316', bgColor: '#fff7ed', label: 'Major' },
  minor: { color: '#eab308', bgColor: '#fefce8', label: 'Minor' },
  suggestion: { color: '#6b7280', bgColor: '#f9fafb', label: 'Suggestion' },
}

/**
 * Single review finding
 */
export interface ReviewFinding {
  finding_id: string
  severity: FindingSeverity
  category: FindingCategory

  location: {
    file: string
    line_start?: number
    line_end?: number
    code_snippet?: string
  }

  description: string
  rationale: string
  suggestion?: string

  fixed_in_iteration?: number
}

/**
 * Verification result
 */
export interface VerificationResult {
  passed: boolean
  output?: string
  error?: string
}

/**
 * Required change from review
 */
export interface RequiredChange {
  change_id: string
  priority: 'must_fix' | 'should_fix' | 'consider'
  related_findings: string[]
  description: string
}

/**
 * Review verdict
 */
export type ReviewVerdict = 'approved' | 'changes_requested' | 'rejected'

/**
 * Output from Reviewer agent
 */
export interface ReviewerOutput {
  review_id: string
  task_id: string

  verdict: ReviewVerdict

  findings: ReviewFinding[]

  verification: {
    tests: VerificationResult
    type_check: VerificationResult
    lint?: VerificationResult
    custom: Record<string, VerificationResult>
  }

  summary: string

  required_changes?: RequiredChange[]
  commendations?: string[]
}

// ============ Agent Messages ============

/**
 * Message types for inter-agent communication
 */
export type MessageType =
  | 'task_assignment'
  | 'task_progress'
  | 'task_completion'
  | 'review_request'
  | 'review_result'
  | 'feedback'
  | 'status_query'
  | 'status_response'
  | 'abort'
  | 'acknowledgment'

/**
 * Message type configuration for visualization
 */
export const MESSAGE_TYPE_CONFIG: Record<MessageType, { color: string; label: string; icon: string }> = {
  task_assignment: { color: '#3b82f6', label: 'Task Assignment', icon: '📋' },
  task_progress: { color: '#6b7280', label: 'Progress', icon: '⏳' },
  task_completion: { color: '#22c55e', label: 'Completed', icon: '✅' },
  review_request: { color: '#f59e0b', label: 'Review Request', icon: '📝' },
  review_result: { color: '#8b5cf6', label: 'Review Result', icon: '📊' },
  feedback: { color: '#6b7280', label: 'Feedback', icon: '💬' },
  status_query: { color: '#6b7280', label: 'Status Query', icon: '❓' },
  status_response: { color: '#6b7280', label: 'Status Response', icon: '📍' },
  abort: { color: '#ef4444', label: 'Abort', icon: '🛑' },
  acknowledgment: { color: '#6b7280', label: 'Ack', icon: '👍' },
}

/**
 * Inter-agent message
 */
export interface AgentMessage {
  message_id: string
  timestamp: string
  sequence_number: number

  from_agent: AgentIdentifier
  to_agent: AgentIdentifier

  message_type: MessageType
  payload: unknown

  correlation_id?: string
  reply_to?: string
}

// ============ Summary Types ============

/**
 * Per-agent summary statistics
 */
export interface AgentSummary {
  agent_id: string
  agent_type: AgentType
  role_category?: AgentRoleCategory
  tool_calls_count: number
  duration_ms: number
  status: 'completed' | 'failed' | 'in_progress'
}

/**
 * Extended summary for multi-agent sessions
 * Uses flexible array structure to support any number/type of agents
 */
export interface MultiAgentSessionSummary extends SessionSummary {
  /**
   * All participating agents (extensible array)
   * Use helper functions to query by role_category or agent_type
   */
  agents: AgentSummary[]

  /**
   * Agent counts by role category (computed)
   */
  agent_counts?: {
    orchestrators: number
    workers: number
    validators: number
    specialists: number
    total: number
  }

  tasks: {
    total: number
    completed: number
    failed: number
  }

  review_iterations: number
  final_verdict?: ReviewVerdict
}

// ============ Summary Helper Functions ============

/**
 * Get agents by role category
 */
export function getAgentsByCategory(
  summary: MultiAgentSessionSummary,
  category: AgentRoleCategory
): AgentSummary[] {
  return summary.agents.filter(a => {
    const config = getAgentTypeConfig(a.agent_type)
    return a.role_category === category || config.role_category === category
  })
}

/**
 * Get agents by type
 */
export function getAgentsByType(
  summary: MultiAgentSessionSummary,
  type: AgentType
): AgentSummary[] {
  return summary.agents.filter(a => a.agent_type === type)
}

/**
 * Get the orchestrator agent (assumes single orchestrator)
 */
export function getOrchestrator(summary: MultiAgentSessionSummary): AgentSummary | undefined {
  return getAgentsByCategory(summary, 'orchestrator')[0]
}

/**
 * Get all worker agents
 */
export function getWorkers(summary: MultiAgentSessionSummary): AgentSummary[] {
  return getAgentsByCategory(summary, 'worker')
}

/**
 * Get all validator agents
 */
export function getValidators(summary: MultiAgentSessionSummary): AgentSummary[] {
  return getAgentsByCategory(summary, 'validator')
}

// ============ Extended SubagentInfo ============

/**
 * Extended SubagentInfo that links to sub_sessions
 */
export interface ExtendedSubagentInfo {
  subagent_type: string
  sub_session_id?: string
  tool_uses: number
  tokens_used?: number
  tools_breakdown?: Array<{
    tool_name: string
    count: number
  }>
}

// ============ Team Definition Types ============

/**
 * Agent personality trait dimensions (1-5 scale)
 * 1 = low end, 5 = high end
 */
export interface AgentPersonality {
  /** 风险容忍度: 1=谨慎(cautious) ↔ 5=激进(aggressive) */
  risk_tolerance: number
  /** 信任程度: 1=质疑(skeptical) ↔ 5=信任(trusting) */
  trust_level: number
  /** 关注范围: 1=细节(detail) ↔ 5=全局(big_picture) */
  focus_scope: number
  /** 沟通方式: 1=被动(reactive) ↔ 5=主动(proactive) */
  communication: number
  /** 决策速度: 1=深思(deliberate) ↔ 5=快速(quick) */
  decision_speed: number
}

/**
 * Team member definition
 */
export interface TeamMember {
  agent_id: string
  agent_type: AgentType
  name: string
  role: string
  personality: AgentPersonality
  expertise: string[]
  guidelines: string[]
  /** Challenger-specific: dimensions to challenge */
  challenge_dimensions?: ChallengeDimension[]
}

/**
 * Challenge dimension for Challenger agent
 */
export interface ChallengeDimension {
  dimension: string
  questions: string[]
}

/**
 * Workflow stage definition
 */
export interface WorkflowStage {
  stage: string
  participants: string[]
  description: string
}

/**
 * Team definition
 */
export interface TeamDefinition {
  team_id: string
  name: string
  description: string
  version: string

  collaboration: {
    pattern: CollaborationPattern
    orchestrator: string
  }

  members: TeamMember[]
  workflow: WorkflowStage[]

  /** Scenarios where this team is recommended */
  recommended_for?: string[]
}

/**
 * Personality trait labels for display
 */
export const PERSONALITY_TRAIT_LABELS: Record<keyof AgentPersonality, { name: string; lowEnd: string; highEnd: string }> = {
  risk_tolerance: { name: '风险容忍度', lowEnd: '谨慎', highEnd: '激进' },
  trust_level: { name: '信任程度', lowEnd: '质疑', highEnd: '信任' },
  focus_scope: { name: '关注范围', lowEnd: '细节', highEnd: '全局' },
  communication: { name: '沟通方式', lowEnd: '被动', highEnd: '主动' },
  decision_speed: { name: '决策速度', lowEnd: '深思', highEnd: '快速' },
}

// ============ Utility Types ============

/**
 * Selection state for visualization
 */
export type CollaborationSelection =
  | { type: 'none' }
  | { type: 'agent'; agentId: string }
  | { type: 'tool_call'; callId: string; sessionId: string }
  | { type: 'sub_session'; subSessionId: string }
  | { type: 'task'; taskId: string }
  | { type: 'message'; messageId: string }
  | { type: 'delegation'; fromCallId: string; toSubSessionId: string }

/**
 * Filter state for swimlane view
 */
export interface CollaborationFilter {
  agents: string[]
  tool_categories: ToolCategory[]
  time_range?: {
    start: number
    end: number
  }
  status?: ('success' | 'failed')[]
  search_query?: string
}

/**
 * Agent status for overview cards
 */
export type AgentStatus = 'active' | 'idle' | 'completed' | 'error'

/**
 * Agent card data for visualization
 */
export interface AgentCardData {
  agent: AgentIdentifier
  status: AgentStatus
  tool_calls_count: number
  duration_ms: number
  tasks: {
    assigned: number
    completed: number
    pending: number
    failed: number
  }
}

// ============ Type Guards ============

/**
 * Check if a session is a multi-agent session
 */
export function isMultiAgentSession(session: AgentSession): session is MultiAgentSession {
  return (
    'collaboration' in session &&
    (session as MultiAgentSession).collaboration?.mode === 'multi_agent'
  )
}

/**
 * Check if output is DeveloperOutput
 */
export function isDeveloperOutput(output: unknown): output is DeveloperOutput {
  return (
    typeof output === 'object' &&
    output !== null &&
    'changes' in output &&
    typeof (output as DeveloperOutput).changes === 'object'
  )
}

/**
 * Check if output is ReviewerOutput
 */
export function isReviewerOutput(output: unknown): output is ReviewerOutput {
  return (
    typeof output === 'object' &&
    output !== null &&
    'verdict' in output &&
    'findings' in output
  )
}

// ============ Utility Functions ============

/**
 * Get all tool calls across all sub-sessions
 */
export function getAllToolCalls(session: MultiAgentSession): Array<ToolCall & { session_id: string; agent: AgentIdentifier }> {
  const calls: Array<ToolCall & { session_id: string; agent: AgentIdentifier }> = []

  // Main session calls
  for (const call of session.tool_calls) {
    calls.push({
      ...call,
      session_id: session.session_id,
      agent: session.collaboration.orchestrator,
    })
  }

  // Sub-session calls
  for (const sub of session.sub_sessions) {
    for (const call of sub.tool_calls) {
      calls.push({
        ...call,
        session_id: sub.sub_session_id,
        agent: sub.agent,
      })
    }
  }

  return calls.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
}

/**
 * Get messages filtered by agent
 */
export function getMessagesForAgent(session: MultiAgentSession, agentId: string): AgentMessage[] {
  return session.messages.filter(
    m => m.from_agent.agent_id === agentId || m.to_agent.agent_id === agentId
  )
}

/**
 * Get sub-session by ID
 */
export function getSubSession(session: MultiAgentSession, subSessionId: string): SubAgentSession | undefined {
  return session.sub_sessions.find(s => s.sub_session_id === subSessionId)
}

/**
 * Get sub-session triggered by a tool call
 */
export function getSubSessionByTrigger(session: MultiAgentSession, callId: string): SubAgentSession | undefined {
  return session.sub_sessions.find(s => s.triggered_by_call_id === callId)
}

/**
 * Calculate agent statistics from session
 */
export function calculateAgentStats(session: MultiAgentSession, agentId: string): AgentCardData | null {
  const isOrchestrator = session.collaboration.orchestrator.agent_id === agentId
  const agent = isOrchestrator
    ? session.collaboration.orchestrator
    : session.collaboration.participants.find(p => p.agent_id === agentId)

  if (!agent) return null

  let tool_calls_count = 0
  let duration_ms = 0
  const tasks = { assigned: 0, completed: 0, pending: 0, failed: 0 }

  if (isOrchestrator) {
    tool_calls_count = session.tool_calls.length
    duration_ms = session.summary.total_duration_ms
    tasks.assigned = session.sub_sessions.length
    tasks.completed = session.sub_sessions.filter(s => s.status === 'success').length
    tasks.failed = session.sub_sessions.filter(s => s.status === 'failed').length
    tasks.pending = session.sub_sessions.filter(s => s.status === 'in_progress').length
  } else {
    const subs = session.sub_sessions.filter(s => s.agent.agent_id === agentId)
    for (const sub of subs) {
      tool_calls_count += sub.tool_calls.length
      if (sub.started_at && sub.completed_at) {
        duration_ms += new Date(sub.completed_at).getTime() - new Date(sub.started_at).getTime()
      }
      tasks.assigned++
      if (sub.status === 'success') tasks.completed++
      else if (sub.status === 'failed') tasks.failed++
      else tasks.pending++
    }
  }

  const hasError = tasks.failed > 0
  const isComplete = tasks.pending === 0 && tasks.assigned > 0
  const isActive = tasks.pending > 0

  return {
    agent,
    status: hasError ? 'error' : isActive ? 'active' : isComplete ? 'completed' : 'idle',
    tool_calls_count,
    duration_ms,
    tasks,
  }
}
