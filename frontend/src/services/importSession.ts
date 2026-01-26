/**
 * Session import service
 *
 * Handles file upload and validation for 5-phase execution model
 */

import type { AgentSession, PhaseType, PhaseStatus } from '../types/agent'
import { PHASE_ORDER } from '../types/agent'

const VALID_PHASE_TYPES: PhaseType[] = PHASE_ORDER
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
 * Validate session data structure (5-phase model)
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

  // Required fields
  if (!obj.session_id || typeof obj.session_id !== 'string') {
    errors.push({ field: 'session_id', message: 'session_id 必填且必须是字符串' })
  }

  if (!obj.task_title || typeof obj.task_title !== 'string') {
    errors.push({ field: 'task_title', message: 'task_title 必填' })
  }

  if (!obj.created_at || typeof obj.created_at !== 'string') {
    errors.push({ field: 'created_at', message: 'created_at 必填' })
  }

  if (!obj.updated_at || typeof obj.updated_at !== 'string') {
    errors.push({ field: 'updated_at', message: 'updated_at 必填' })
  }

  if (!Array.isArray(obj.phases)) {
    errors.push({ field: 'phases', message: 'phases 必须是数组' })
    return { success: false, errors }
  }

  if (!Array.isArray(obj.tool_calls)) {
    errors.push({ field: 'tool_calls', message: 'tool_calls 必须是数组' })
  }

  if (!obj.summary || typeof obj.summary !== 'object') {
    errors.push({ field: 'summary', message: 'summary 必填且必须是对象' })
  }

  // Validate each phase
  const phases = obj.phases as unknown[]
  phases.forEach((phase, index) => {
    const phaseErrors = validatePhase(phase, index)
    errors.push(...phaseErrors)
  })

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    session: data as AgentSession,
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
