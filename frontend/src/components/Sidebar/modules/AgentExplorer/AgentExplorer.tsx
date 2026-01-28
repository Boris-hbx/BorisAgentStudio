/**
 * AgentExplorer - Agent 展示模块
 *
 * 左侧栏仅用于模块导航，不显示内容
 * Session 选择功能已移至 SessionBar
 */

interface AgentExplorerProps {
  collapsed?: boolean
}

export function AgentExplorer({ collapsed: _collapsed }: AgentExplorerProps) {
  // 左侧栏仅保留导航，不显示内容
  return null
}
