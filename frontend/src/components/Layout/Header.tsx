/**
 * Header component - top control bar
 */

import { useRef, useState } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { importSessionFromFile } from '../../services/importSession'
import { getAvailableSessions, loadSessionById } from '../../services/mockData'
import { HeaderParticles } from './HeaderParticles'
import './Header.css'

export function Header() {
  const session = useSessionStore((state) => state.session)
  const setSession = useSessionStore((state) => state.setSession)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const availableSessions = getAvailableSessions()

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessionId = e.target.value
    if (!sessionId) return

    const selectedSession = loadSessionById(sessionId)
    if (selectedSession) {
      setSession(selectedSession)
      setError(null)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    const result = await importSessionFromFile(file)

    if (result.success && result.session) {
      setSession(result.session)
    } else if (result.errors) {
      setError(result.errors.map((e) => `${e.field}: ${e.message}`).join('\n'))
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <header className="header">
      <HeaderParticles />
      <div className="header-brand">
        <h1>Boris Agent Studio</h1>
      </div>

      <div className="header-actions">
        <button className="import-btn" onClick={handleImportClick}>
          导入 Session
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className="header-session">
        <select
          className="session-select"
          value={session?.session_id || ''}
          onChange={handleSessionChange}
        >
          <option value="">选择 Session...</option>
          {availableSessions.map((s) => (
            <option key={s.session_id} value={s.session_id}>
              {s.name} ({s.status === 'success' ? '成功' : s.status === 'failed' ? '失败' : '部分'})
            </option>
          ))}
        </select>
        {session && (
          <span className="session-id">{session.session_id}</span>
        )}
      </div>

      {error && (
        <div className="header-error">
          <span className="error-icon">⚠️</span>
          <pre className="error-text">{error}</pre>
          <button className="error-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </header>
  )
}
