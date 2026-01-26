/**
 * Boris Agent Studio - Main Application
 *
 * Code Agent 全流程可视化 Web 应用
 * 基于 SPEC-011：分层工作流可视化
 */

import { useEffect, useState } from 'react'
import { Header, StatusBar } from './components/Layout'
import { Timeline, TimelineEmpty } from './components/Timeline'
import { ToolDetailPanel } from './components/ToolDetailPanel'
import { useSessionStore } from './store/sessionStore'
import { loadMockSession } from './services/mockData'
import type { ToolCall } from './types/agent'
import './App.css'

function App() {
  const setSession = useSessionStore((state) => state.setSession)
  const session = useSessionStore((state) => state.session)
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null)

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

  return (
    <div className="app">
      <Header />
      {session && <StatusBar />}
      <div className="app-body">
        <main className="app-main">
          {session ? (
            <Timeline
              session={session}
              onSelectToolCall={handleSelectToolCall}
              selectedToolCallId={selectedToolCall?.call_id || null}
            />
          ) : (
            <TimelineEmpty />
          )}
        </main>
        <ToolDetailPanel
          toolCall={selectedToolCall}
          session={session}
          onClose={handleCloseToolDetail}
        />
      </div>
    </div>
  )
}

export default App
