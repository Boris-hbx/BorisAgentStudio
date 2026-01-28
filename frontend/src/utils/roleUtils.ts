/**
 * Role utilities for multi-agent collaboration visualization
 *
 * 从 call_id 解析角色，统计角色活跃度
 */

import type { ToolCall } from '../types/agent'

/** 角色类型 */
export type RoleType =
  | 'product_owner'
  | 'architect'
  | 'challenger'
  | 'design_authority'
  | 'developer'
  | 'reviewer'
  | 'unknown'

/** 角色配置 */
export const ROLE_CONFIG: Record<RoleType, { icon: string; color: string; label: string; labelCn: string }> = {
  product_owner: { icon: '👔', color: '#f59e0b', label: 'PO', labelCn: '产品负责人' },
  architect: { icon: '🏛️', color: '#a78bfa', label: 'Arch', labelCn: '架构师' },
  challenger: { icon: '🛡️', color: '#fb923c', label: 'Chall', labelCn: '风险官' },
  design_authority: { icon: '🎨', color: '#ec4899', label: 'DA', labelCn: '体验官' },
  developer: { icon: '👨‍💻', color: '#60a5fa', label: 'Dev', labelCn: '开发者' },
  reviewer: { icon: '🔍', color: '#34d399', label: 'Review', labelCn: '审查员' },
  unknown: { icon: '👤', color: '#6b7280', label: '?', labelCn: '未知' },
}

/** call_id 前缀到角色的映射 */
const ROLE_PREFIXES: Record<string, RoleType> = {
  // Product Owner
  'po': 'product_owner',
  'product': 'product_owner',
  'product_owner': 'product_owner',
  // Architect
  'arch': 'architect',
  'architect': 'architect',
  // Challenger
  'challenger': 'challenger',
  'chall': 'challenger',
  // Design Authority
  'da': 'design_authority',
  'design': 'design_authority',
  'design_authority': 'design_authority',
  // Developer
  'dev': 'developer',
  'developer': 'developer',
  'impl': 'developer',
  // Reviewer
  'reviewer': 'reviewer',
  'review': 'reviewer',
}

/**
 * 从 call_id 解析角色
 *
 * 支持的格式：
 * - po-001, po-init-001
 * - architect-design-001
 * - challenger-risk-001
 * - da-risk-001, design-authority-001
 * - developer-impl-001, dev-001
 * - reviewer-review-001
 */
export function parseRoleFromCallId(callId: string): RoleType {
  // 尝试匹配第一个 '-' 之前的部分
  const firstPart = callId.split('-')[0].toLowerCase()
  if (ROLE_PREFIXES[firstPart]) {
    return ROLE_PREFIXES[firstPart]
  }

  // 尝试匹配前两个部分（如 design_authority）
  const parts = callId.toLowerCase().split('-')
  if (parts.length >= 2) {
    const twoPartKey = `${parts[0]}_${parts[1]}`
    if (ROLE_PREFIXES[twoPartKey]) {
      return ROLE_PREFIXES[twoPartKey]
    }
  }

  // 尝试匹配关键词
  const lowerCallId = callId.toLowerCase()
  for (const [prefix, role] of Object.entries(ROLE_PREFIXES)) {
    if (lowerCallId.includes(prefix)) {
      return role
    }
  }

  return 'unknown'
}

/** 角色活跃度统计 */
export interface RoleActivity {
  role: RoleType
  icon: string
  color: string
  label: string
  labelCn: string
  callCount: number
  percentage: number
  callIds: string[]
}

/**
 * 统计各角色的工具调用活跃度
 */
export function getRoleActivities(toolCalls: ToolCall[]): RoleActivity[] {
  const roleMap = new Map<RoleType, { count: number; callIds: string[] }>()

  for (const tc of toolCalls) {
    const role = parseRoleFromCallId(tc.call_id)
    const existing = roleMap.get(role) || { count: 0, callIds: [] }
    existing.count++
    existing.callIds.push(tc.call_id)
    roleMap.set(role, existing)
  }

  const total = toolCalls.length
  const activities: RoleActivity[] = []

  // 按固定顺序输出（PO → Arch → Chall → DA → Dev → Reviewer）
  const orderedRoles: RoleType[] = [
    'product_owner',
    'architect',
    'challenger',
    'design_authority',
    'developer',
    'reviewer',
    'unknown',
  ]

  for (const role of orderedRoles) {
    const data = roleMap.get(role)
    if (data && data.count > 0) {
      const config = ROLE_CONFIG[role]
      activities.push({
        role,
        icon: config.icon,
        color: config.color,
        label: config.label,
        labelCn: config.labelCn,
        callCount: data.count,
        percentage: total > 0 ? (data.count / total) * 100 : 0,
        callIds: data.callIds,
      })
    }
  }

  return activities
}

/**
 * 检查 session 是否为多 Agent 模式
 */
export function isMultiAgentSession(session: { collaboration?: { mode?: string } }): boolean {
  return session.collaboration?.mode === 'multi_agent'
}
