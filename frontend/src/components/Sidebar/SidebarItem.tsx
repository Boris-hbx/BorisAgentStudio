/**
 * SidebarItem - 侧边栏导航项
 */

import { useRef, useState } from 'react'

interface SidebarItemProps {
  icon: string
  label: string
  active: boolean
  collapsed: boolean
  onClick: () => void
}

export function SidebarItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: SidebarItemProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const itemRef = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={itemRef}
      className={`sidebar-item ${active ? 'active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => collapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-item-icon">{icon}</span>
      {!collapsed && <span className="sidebar-item-label">{label}</span>}
      {collapsed && showTooltip && (
        <div className="sidebar-tooltip">{label}</div>
      )}
    </button>
  )
}
