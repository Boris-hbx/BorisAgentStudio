/**
 * Session import service
 *
 * 基于 STD-001 v3.0：工具调用流优先模型
 *
 * 核心验证规则：
 * - tool_calls[] 必须存在且为数组
 * - phases[] 可选（v2.x 兼容）
 * - phase_annotations[] 可选（v3.0 事后标注）
 * - updated_at 可选（如不存在，使用 completed_at）
 */

import type { AgentSession, PhaseType, PhaseStatus } from '../types/agent'
import { PHASE_ORDER } from '../types/agent'

const VALID_PHASE_TYPES: PhaseType[] = [...PHASE_ORDER, 'mixed', 'unclassified']
const VALID_STATUSES: PhaseStatus[] = ['pending', 'running', 'success', 'failed', 'skipped']

interface ValidationError {
  field: string
  message: string
}

interface ImportResult {
  success: boolean
  session?: AgentSession
  errors?: ValidationError[]
}

/**
 * Parse and validate a session JSON file
 */
export async function importSessionFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    return validateSession(data)
  } catch (e) {
    return {
      success: false,
      errors: [{ field: 'file', message: `JSON 解析失败: ${e}` }],
    }
  }
}

/**
 * Validate session data structure (STD-001 v3.0)
 *
 * 核心规则：
 * - tool_calls[] 是第一公民，必须存在
 * - phases[] 是 v2.x 兼容字段，可选
 * - phase_annotations[] 是 v3.0 事后标注，可选
 */
export function validateSession(data: unknown): ImportResult {
  const errors: ValidationError[] = []

  if (!data || typeof data !== 'object') {
    return {
      success: false,
      errors: [{ field: 'root', message: '无效的 JSON 对象' }],
    }
  }

  const obj = data as Record<string, unknown>

  // === 必需字段 ===

  if (!obj.session_id || typeof obj.session_id !== 'string') {
    errors.push({ field: 'session_id', message: 'session_id 必填且必须是字符串' })
  }

  if (!obj.task_title || typeof obj.task_title !== 'string') {
    errors.push({ field: 'task_title', message: 'task_title 必填' })
  }

  if (!obj.created_at || typeof obj.created_at !== 'string') {
    errors.push({ field: 'created_at', message: 'created_at 必填' })
  }

  // tool_calls 是 v3.0 的核心，必须存在
  if (!Array.isArray(obj.tool_calls)) {
    errors.push({ field: 'tool_calls', message: 'tool_calls 必须是数组' })
  }

  if (!obj.summary || typeof obj.summary !== 'object') {
    errors.push({ field: 'summary', message: 'summary 必填且必须是对象' })
  }

  // === 可选字段验证 ===

  // phases 是可选的（v2.x 兼容），如果存在则验证格式
  if (obj.phases !== undefined && !Array.isArray(obj.phases)) {
    errors.push({ field: 'phases', message: 'phases 如果存在必须是数组' })
  }

  // phase_annotations 是可选的（v3.0），如果存在则验证格式
  if (obj.phase_annotations !== undefined && !Array.isArray(obj.phase_annotations)) {
    errors.push({ field: 'phase_annotations', message: 'phase_annotations 如果存在必须是数组' })
  }

  // 如果有 phases，验证每个 phase 的格式
  if (Array.isArray(obj.phases)) {
    const phases = obj.phases as unknown[]
    phases.forEach((phase, index) => {
      const phaseErrors = validatePhase(phase, index)
      errors.push(...phaseErrors)
    })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  // 自动填充 updated_at（如果不存在）
  const session = data as AgentSession
  if (!session.updated_at) {
    session.updated_at = session.completed_at || session.created_at
  }

  // 自动填充 phases 为空数组（如果不存在）
  if (!session.phases) {
    session.phases = []
  }

  return {
    success: true,
    session,
  }
}

/**
 * Validate individual phase
 */
function validatePhase(phase: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = []
  const prefix = `phases[${index}]`

  if (!phase || typeof phase !== 'object') {
    errors.push({ field: prefix, message: '阶段必须是对象' })
    return errors
  }

  const p = phase as Record<string, unknown>

  // phase_id
  if (!p.phase_id || typeof p.phase_id !== 'string') {
    errors.push({ field: `${prefix}.phase_id`, message: 'phase_id 必填' })
  }

  // phase_type
  if (!p.phase_type || !VALID_PHASE_TYPES.includes(p.phase_type as PhaseType)) {
    errors.push({
      field: `${prefix}.phase_type`,
      message: `phase_type 必须是: ${VALID_PHASE_TYPES.join(', ')}`,
    })
  }

  // status
  if (!p.status || !VALID_STATUSES.includes(p.status as PhaseStatus)) {
    errors.push({
      field: `${prefix}.status`,
      message: `status 必须是: ${VALID_STATUSES.join(', ')}`,
    })
  }

  // input is required
  if (!('input' in p)) {
    errors.push({ field: `${prefix}.input`, message: 'input 字段必须存在' })
  }

  // output is required
  if (!('output' in p)) {
    errors.push({ field: `${prefix}.output`, message: 'output 字段必须存在' })
  }

  // context_used should be array
  if (p.context_used && !Array.isArray(p.context_used)) {
    errors.push({ field: `${prefix}.context_used`, message: 'context_used 必须是数组' })
  }

  // decisions should be array
  if (p.decisions && !Array.isArray(p.decisions)) {
    errors.push({ field: `${prefix}.decisions`, message: 'decisions 必须是数组' })
  }

  return errors
}
