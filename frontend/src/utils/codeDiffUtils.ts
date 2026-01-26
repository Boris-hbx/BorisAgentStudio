/**
 * Code Diff Utilities
 *
 * 代码变更可视化的工具函数
 */

import type { AgentSession, ToolCall } from '../types/agent'

/**
 * 查找与 Write/Edit 操作关联的 Read 调用
 *
 * 向前搜索同文件的 Read 调用，用于 Before/After 对比
 */
export function findRelatedRead(
  session: AgentSession,
  writeCall: ToolCall
): ToolCall | null {
  const filePath = writeCall.input.params.file_path as string
  if (!filePath) return null

  const writeIndex = session.tool_calls.findIndex(
    (tc) => tc.call_id === writeCall.call_id
  )
  if (writeIndex === -1) return null

  // 向前查找同文件的 Read 调用
  for (let i = writeIndex - 1; i >= 0; i--) {
    const tc = session.tool_calls[i]
    if (
      tc.tool_name === 'Read' &&
      tc.input.params.file_path === filePath &&
      tc.context_contribution?.full_content
    ) {
      return tc
    }
  }
  return null
}

/**
 * 从文件路径提取扩展名
 */
export function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([^.]+)$/)
  return match ? `.${match[1].toLowerCase()}` : ''
}

/**
 * 文件扩展名到编程语言的映射
 */
const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.json': 'json',
  '.md': 'markdown',
  '.rs': 'rust',
  '.py': 'python',
  '.go': 'go',
  '.java': 'java',
  '.html': 'html',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.sh': 'bash',
  '.bash': 'bash',
  '.sql': 'sql',
}

/**
 * 根据文件路径获取编程语言标识
 */
export function getLanguageFromPath(filePath: string): string {
  const ext = getFileExtension(filePath)
  return EXT_TO_LANG[ext] || 'text'
}

/**
 * 判断工具调用是否为代码变更操作
 */
export function isCodeChangeOperation(toolCall: ToolCall): boolean {
  return toolCall.tool_name === 'Write' || toolCall.tool_name === 'Edit'
}

/**
 * 从 Write/Edit 工具调用中提取代码变更信息
 */
export interface CodeChangeInfo {
  filePath: string
  operation: 'write' | 'edit'
  description?: string
  // Write 操作
  content?: string
  // Edit 操作
  oldString?: string
  newString?: string
}

export function extractCodeChangeInfo(toolCall: ToolCall): CodeChangeInfo | null {
  if (!isCodeChangeOperation(toolCall)) return null

  const params = toolCall.input.params
  const filePath = params.file_path as string
  if (!filePath) return null

  if (toolCall.tool_name === 'Write') {
    return {
      filePath,
      operation: 'write',
      description: toolCall.input.description,
      content: params.content as string | undefined,
    }
  }

  if (toolCall.tool_name === 'Edit') {
    return {
      filePath,
      operation: 'edit',
      description: toolCall.input.description,
      oldString: params.old_string as string | undefined,
      newString: params.new_string as string | undefined,
    }
  }

  return null
}

/**
 * 截断过长的代码内容，添加省略提示
 */
export function truncateContent(
  content: string,
  maxLines: number = 50
): { text: string; truncated: boolean } {
  const lines = content.split('\n')
  if (lines.length <= maxLines) {
    return { text: content, truncated: false }
  }
  return {
    text: lines.slice(0, maxLines).join('\n') + '\n...',
    truncated: true,
  }
}

/**
 * 从文件路径提取文件名
 */
export function getFileName(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || filePath
}
