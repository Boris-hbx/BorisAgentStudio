/**
 * Header component - top control bar
 *
 * 简洁版：只保留品牌标识
 * Session 导入功能已移至 AgentExplorer 模块
 */

import { HeaderParticles } from './HeaderParticles'
import './Header.css'

export function Header() {
  return (
    <header className="header">
      <HeaderParticles />
      <div className="header-brand">
        <h1>Boris Agent Studio</h1>
      </div>
    </header>
  )
}
