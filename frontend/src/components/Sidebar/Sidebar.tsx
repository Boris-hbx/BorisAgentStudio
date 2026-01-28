/**
 * Sidebar - 可折叠的左侧导航栏
 *
 * 功能：
 * - 多模块导航
 * - 可折叠/展开
 * - 响应式自动折叠
 * - 用户操作后保持状态
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { SidebarItem } from './SidebarItem'
import { SidebarPet } from './SidebarPet'
import './Sidebar.css'

export interface SidebarModule {
  id: string
  icon: string
  label: string
  /** 模块内容渲染函数，接收 collapsed 状态 */
  render: (collapsed: boolean) => ReactNode
  /** 是否禁用（占位模块） */
  disabled?: boolean
}

interface SidebarProps {
  modules: SidebarModule[]
  defaultModule?: string
  defaultCollapsed?: boolean
  onModuleChange?: (moduleId: string) => void
}

const BREAKPOINT = 1200

export function Sidebar({
  modules,
  defaultModule,
  defaultCollapsed = false,
  onModuleChange,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [activeModule, setActiveModule] = useState(
    defaultModule || modules[0]?.id || ''
  )
  // 用户手动操作后不再自动响应窗口变化
  const [userOverride, setUserOverride] = useState(false)

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      if (userOverride) return
      const shouldCollapse = window.innerWidth < BREAKPOINT
      setCollapsed(shouldCollapse)
    }

    // 初始检查
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [userOverride])

  const handleToggle = useCallback(() => {
    setUserOverride(true)
    setCollapsed((c) => !c)
  }, [])

  const handleModuleClick = useCallback((moduleId: string) => {
    setActiveModule(moduleId)
    onModuleChange?.(moduleId)
  }, [onModuleChange])

  const currentModule = modules.find((m) => m.id === activeModule)

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* 导航区 */}
      <nav className="sidebar-nav">
        {modules.map((module) => (
          <SidebarItem
            key={module.id}
            icon={module.icon}
            label={module.label}
            active={activeModule === module.id}
            collapsed={collapsed}
            onClick={() => handleModuleClick(module.id)}
          />
        ))}
      </nav>

      {/* 内容区 */}
      <div className="sidebar-content">
        {currentModule && currentModule.render(collapsed)}
      </div>

      {/* 紫色分隔线 - 小宠物"趴在"线条上 */}
      <div className="sidebar-divider-line" />

      {/* 小宠物 */}
      <SidebarPet collapsed={collapsed} onToggle={handleToggle} />
    </aside>
  )
}
