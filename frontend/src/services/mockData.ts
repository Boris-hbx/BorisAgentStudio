/**
 * Session data service
 *
 * 动态加载 data/sessions/ 目录下的所有 JSON 文件
 * 使用 Vite 的 import.meta.glob 实现，无需手动维护文件列表
 */

import type { AgentSession } from '../types/agent'

/** 团队成员简要信息 */
export interface AgentMemberBrief {
  role: 'product_owner' | 'architect' | 'challenger' | 'design_authority' | 'developer' | 'reviewer' | string
  count: number
  label: string
}

/** 团队协作信息 */
export interface TeamCollaboration {
  team_name?: string
  pattern: 'master_worker' | 'pipeline' | 'peer_to_peer'
  members: AgentMemberBrief[]
}

export interface SessionListItem {
  session_id: string
  name: string
  description: string
  status: 'success' | 'failed' | 'partial'
  /** 是否为多 Agent 协作 Session */
  is_multi_agent?: boolean
  /** 参与的 Agent 数量 */
  agent_count?: number
  /** 团队协作详情 */
  collaboration?: TeamCollaboration
}

// 使用 Vite 的 glob 导入动态加载所有 session 文件
const sessionModules = import.meta.glob<{ default: AgentSession }>(
  '../../../data/sessions/*.json',
  { eager: true }
)

/**
 * 从文件路径提取 session_id
 */
function extractSessionId(path: string): string {
  const filename = path.split('/').pop() || ''
  return filename.replace('.json', '')
}

/**
 * 从 session 数据提取协作信息
 */
function extractCollaboration(session: AgentSession): {
  is_multi_agent: boolean
  agent_count: number
  collaboration?: TeamCollaboration
} {
  const collab = (session as unknown as Record<string, unknown>).collaboration as Record<string, unknown> | undefined

  if (!collab || collab.mode !== 'multi_agent') {
    return { is_multi_agent: false, agent_count: 1 }
  }

  const participants = collab.participants as Array<{ agent_type: string }> | undefined
  const agentCount = participants ? participants.length + 1 : 1 // +1 for orchestrator

  // 提取团队成员信息
  const memberCounts: Record<string, number> = {}
  if (participants) {
    for (const p of participants) {
      memberCounts[p.agent_type] = (memberCounts[p.agent_type] || 0) + 1
    }
  }

  const roleLabels: Record<string, string> = {
    product_owner: '产品负责人',
    architect: '架构师',
    challenger: '风险官',
    design_authority: '体验官',
    developer: '开发者',
    reviewer: '审查员',
  }

  const members: AgentMemberBrief[] = Object.entries(memberCounts).map(([role, count]) => ({
    role,
    count,
    label: roleLabels[role] || role,
  }))

  return {
    is_multi_agent: true,
    agent_count: agentCount,
    collaboration: {
      team_name: collab.team_name as string | undefined,
      pattern: (collab.pattern as TeamCollaboration['pattern']) || 'master_worker',
      members,
    },
  }
}

/**
 * 构建 session 映射和列表
 */
const sessionsMap: Record<string, AgentSession> = {}
const sessionsList: SessionListItem[] = []

for (const [path, module] of Object.entries(sessionModules)) {
  const session = module.default
  const sessionId = session.session_id || extractSessionId(path)

  sessionsMap[sessionId] = session

  const collabInfo = extractCollaboration(session)

  sessionsList.push({
    session_id: sessionId,
    name: session.task_title || sessionId,
    description: (session as unknown as Record<string, unknown>).task_description as string || '',
    status: session.status as 'success' | 'failed' | 'partial',
    ...collabInfo,
  })
}

// 按 created_at 时间倒序排列（最新在前）
// 如果没有 created_at，则按 session_id 倒序（session_id 包含日期前缀）
sessionsList.sort((a, b) => {
  const sessionA = sessionsMap[a.session_id]
  const sessionB = sessionsMap[b.session_id]
  const timeA = sessionA?.created_at || a.session_id
  const timeB = sessionB?.created_at || b.session_id
  return timeB.localeCompare(timeA)
})

/**
 * 获取可用 session 列表
 */
export function getAvailableSessions(): SessionListItem[] {
  return sessionsList
}

/**
 * 加载默认的 session（第一个可用的）
 */
export function loadMockSession(): AgentSession | null {
  const firstSession = sessionsList[0]
  return firstSession ? sessionsMap[firstSession.session_id] : null
}

/**
 * 按 session_id 加载指定的 session
 */
export function loadSessionById(sessionId: string): AgentSession | null {
  return sessionsMap[sessionId] ?? null
}

/**
 * 获取所有 session 的数量
 */
export function getSessionCount(): number {
  return sessionsList.length
}
