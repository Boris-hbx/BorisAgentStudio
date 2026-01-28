/**
 * Boris Agent Studio - Main Application
 *
 * Code Agent 全流程可视化 Web 应用
 * 基于 SPEC-011：分层工作流可视化
 */

import { useEffect, useState } from 'react'
import { Header, SessionBar } from './components/Layout'
import { Sidebar, type SidebarModule } from './components/Sidebar'
import { AgentExplorer } from './components/Sidebar/modules/AgentExplorer'
import { AthleteEvaluation } from './components/Sidebar/modules/AthleteEvaluation'
import { Timeline, TimelineEmpty } from './components/Timeline'
import { HarmonyStudio } from './components/HarmonyStudio'
import { AthleteEvaluationView } from './components/AthleteEvaluation'
import { InsightView } from './components/Insight'
import { ToolDetailPanel } from './components/ToolDetailPanel'
import { useSessionStore } from './store/sessionStore'
import { loadMockSession } from './services/mockData'
import type { ToolCall } from './types/agent'
import './App.css'

/** 占位页面组件 */
function ComingSoon({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon-content">
        <span className="coming-soon-icon">{icon}</span>
        <h2 className="coming-soon-title">{title}</h2>
        <p className="coming-soon-text">功能正在开发中，敬请期待</p>
        <div className="coming-soon-decoration">
          <span>🚧</span>
          <span>👷</span>
          <span>🔨</span>
        </div>
      </div>
    </div>
  )
}

function App() {
  const setSession = useSessionStore((state) => state.setSession)
  const session = useSessionStore((state) => state.session)
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null)
  const [activeModule, setActiveModule] = useState('agent-explorer')

  // 定义 Sidebar 模块
  const sidebarModules: SidebarModule[] = [
    {
      id: 'agent-explorer',
      icon: '🤖',
      label: 'Agent 展示',
      render: (collapsed) => <AgentExplorer collapsed={collapsed} />,
    },
    {
      id: 'harmony-studio',
      icon: '🎨',
      label: 'HarmonyStudio',
      render: () => null, // 内容在主区域显示
    },
    {
      id: 'athlete-evaluation',
      icon: '🤺',
      label: '运动员评测',
      render: (collapsed) => <AthleteEvaluation collapsed={collapsed} />,
    },
    {
      id: 'insight',
      icon: '🔭',
      label: '洞察',
      render: () => null, // 内容在主区域显示
    },
    {
      id: 'tools',
      icon: '🔧',
      label: '工具箱',
      render: () => null,
    },
    {
      id: 'docs',
      icon: '📚',
      label: '文档',
      render: () => null,
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: '设置',
      render: () => null,
    },
  ]

  useEffect(() => {
    // Load mock data on mount
    const mockSession = loadMockSession()
    setSession(mockSession)
  }, [setSession])

  // 清除选中状态当 session 变化时
  useEffect(() => {
    setSelectedToolCall(null)
  }, [session?.session_id])

  const handleSelectToolCall = (toolCall: ToolCall | null) => {
    setSelectedToolCall(toolCall)
  }

  const handleCloseToolDetail = () => {
    setSelectedToolCall(null)
  }

  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId)
  }

  // 渲染主内容区
  const renderMainContent = () => {
    // HarmonyStudio 模块
    if (activeModule === 'harmony-studio') {
      return <HarmonyStudio />
    }

    // 运动员评测模块
    if (activeModule === 'athlete-evaluation') {
      return <AthleteEvaluationView />
    }

    // 洞察模块
    if (activeModule === 'insight') {
      return <InsightView />
    }

    // 占位模块显示 Coming Soon
    if (activeModule === 'tools') {
      return <ComingSoon icon="🔧" title="工具箱" />
    }
    if (activeModule === 'docs') {
      return <ComingSoon icon="📚" title="文档中心" />
    }
    if (activeModule === 'settings') {
      return <ComingSoon icon="⚙️" title="设置" />
    }

    // Agent 展示模块显示 Timeline
    if (session) {
      return (
        <Timeline
          session={session}
          onSelectToolCall={handleSelectToolCall}
          selectedToolCallId={selectedToolCall?.call_id || null}
        />
      )
    }
    return <TimelineEmpty />
  }

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar
          modules={sidebarModules}
          defaultModule="agent-explorer"
          onModuleChange={handleModuleChange}
        />
        <div className="app-content">
          {(activeModule === 'agent-explorer') && <SessionBar />}
          <main className="app-main">
            {renderMainContent()}
          </main>
        </div>
        {activeModule === 'agent-explorer' && (
          <ToolDetailPanel
            toolCall={selectedToolCall}
            session={session}
            onClose={handleCloseToolDetail}
          />
        )}
      </div>
    </div>
  )
}

export default App
