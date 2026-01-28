/**
 * EmptyState - 空状态引导
 */

import { useState } from 'react'

interface EmptyStateProps {
  topicId: string
}

export function EmptyState({ topicId }: EmptyStateProps) {
  const [copied, setCopied] = useState(false)
  const command = `/insight ${topicId || 'agent-security'}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="insight-empty">
      <div className="empty-icon">🔭</div>
      <h3 className="empty-title">暂无洞察数据</h3>
      <p className="empty-text">执行命令获取最新洞察：</p>
      <div className="empty-command">
        <code>{command}</code>
        <button
          className={`copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="复制命令"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
    </div>
  )
}
