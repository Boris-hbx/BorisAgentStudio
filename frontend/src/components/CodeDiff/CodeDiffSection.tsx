/**
 * CodeDiffSection - 代码变更展示组件
 *
 * 在 ToolDetailPanel 中展示 Write/Edit 工具的文件变更内容
 */

import type { AgentSession, ToolCall } from '../../types/agent'
import {
  extractCodeChangeInfo,
  findRelatedRead,
  getFileName,
  getLanguageFromPath,
  truncateContent,
} from '../../utils/codeDiffUtils'
import './CodeDiffSection.css'

interface CodeDiffSectionProps {
  toolCall: ToolCall
  session: AgentSession
}

export function CodeDiffSection({ toolCall, session }: CodeDiffSectionProps) {
  const changeInfo = extractCodeChangeInfo(toolCall)
  if (!changeInfo) return null

  const language = getLanguageFromPath(changeInfo.filePath)
  const fileName = getFileName(changeInfo.filePath)
  const relatedRead = findRelatedRead(session, toolCall)

  return (
    <div className="code-diff-section">
      {/* Header */}
      <div className="code-diff-header">
        <span className="code-diff-label">
          {changeInfo.operation === 'write' ? '写入' : '编辑'}
        </span>
        <span className="code-diff-file" title={changeInfo.filePath}>
          {fileName}
        </span>
        <span className="code-diff-lang">{language}</span>
      </div>

      {/* Content based on operation type */}
      <div className="code-diff-content">
        {changeInfo.operation === 'write' ? (
          <WriteContent
            content={changeInfo.content}
            beforeContent={relatedRead?.context_contribution?.full_content}
          />
        ) : (
          <EditContent
            oldString={changeInfo.oldString}
            newString={changeInfo.newString}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Write 操作的内容展示
 */
function WriteContent({
  content,
  beforeContent,
}: {
  content?: string
  beforeContent?: string
}) {
  if (!content) {
    return <div className="code-diff-empty">内容未记录</div>
  }

  const { text: displayContent, truncated } = truncateContent(content, 30)

  // 如果有 Before 内容，显示对比
  if (beforeContent) {
    const { text: displayBefore, truncated: beforeTruncated } =
      truncateContent(beforeContent, 20)

    return (
      <div className="code-diff-compare">
        <div className="code-diff-before-section">
          <span className="code-diff-section-label">Before</span>
          <pre className="code-diff-before">
            {displayBefore}
            {beforeTruncated && (
              <span className="code-diff-truncated">（内容已截断）</span>
            )}
          </pre>
        </div>
        <div className="code-diff-after-section">
          <span className="code-diff-section-label">After</span>
          <pre className="code-diff-after">
            {displayContent}
            {truncated && (
              <span className="code-diff-truncated">（内容已截断）</span>
            )}
          </pre>
        </div>
      </div>
    )
  }

  // 仅显示写入内容
  return (
    <div className="code-diff-write">
      <pre className="code-diff-after">
        {displayContent}
        {truncated && (
          <span className="code-diff-truncated">（内容已截断）</span>
        )}
      </pre>
    </div>
  )
}

/**
 * Edit 操作的内容展示
 */
function EditContent({
  oldString,
  newString,
}: {
  oldString?: string
  newString?: string
}) {
  if (!oldString && !newString) {
    return <div className="code-diff-empty">变更内容未记录</div>
  }

  return (
    <div className="code-diff-edit">
      {oldString && (
        <div className="code-diff-before-section">
          <span className="code-diff-section-label">替换前</span>
          <pre className="code-diff-before">{oldString}</pre>
        </div>
      )}
      {newString && (
        <div className="code-diff-after-section">
          <span className="code-diff-section-label">替换后</span>
          <pre className="code-diff-after">{newString}</pre>
        </div>
      )}
    </div>
  )
}
