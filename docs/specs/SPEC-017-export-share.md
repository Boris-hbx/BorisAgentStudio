# SPEC-017: 导出与分享

> 作者: Boris Huai
> 起草日期: 2026-01-26
> 状态: 草稿

---

## 1. 概述

本规格定义 Session 导出与分享功能的设计，支持多种格式导出和便捷分享。

---

## 2. 功能需求

### 2.1 导出格式

| 格式 | 用途 | 包含内容 |
|------|------|----------|
| JSON | 数据备份/导入 | 完整 Session 数据 |
| Markdown | 报告/文档 | 格式化的执行摘要 |
| PNG/SVG | 图片分享 | 可视化截图 |
| HTML | 独立查看 | 自包含的可视化页面 |

### 2.2 导出范围

| 范围 | 描述 |
|------|------|
| 完整 Session | 所有数据 |
| 选中阶段 | 仅选中的阶段 |
| 工具调用详情 | 单个工具调用 |
| 可视化视图 | 当前显示的视图 |

### 2.3 分享方式

| 方式 | 描述 |
|------|------|
| 文件下载 | 下载到本地 |
| 复制到剪贴板 | 快速粘贴 |
| 生成链接 | 可分享的 URL (未来) |

---

## 3. 导出格式详细设计

### 3.1 JSON 导出

保持与 STD-001 兼容的完整格式：

```json
{
  "session_id": "2026-01-26-001",
  "schema_version": "3.0",
  "task_title": "任务标题",
  "user_prompt": "用户输入",
  "status": "success",
  "tool_calls": [...],
  "phase_annotations": [...],
  "summary": {...},
  "exported_at": "2026-01-26T10:00:00Z",
  "exported_by": "BorisAgentStudio v0.1"
}
```

### 3.2 Markdown 导出

```markdown
# Session 执行报告

## 基本信息

- **Session ID**: 2026-01-26-001
- **任务**: 实现顶栏粒子效果
- **状态**: ✅ 成功
- **执行时间**: 2m 35s
- **工具调用**: 12 次

## 用户输入

> 参考 skill 001 interactive，帮我给网页的最上面设计一个交互小球的效果。

## 执行过程

### 阶段 1: 探索 (5 次调用, 45s)

1. **Read** `SKILL-001-interactive-particles.json` ✓ (1.2s)
2. **Read** `SPEC-006-interactive-particles.md` ✓ (0.8s)
3. **Glob** `**/*.tsx` ✓ (0.5s)
4. **Read** `Header.tsx` ✓ (1.0s)
5. **Read** `App.tsx` ✓ (0.9s)

### 阶段 2: 执行 (6 次调用, 1m 30s)

1. **Write** `frontend/src/lib/particles/config.ts` ✓ (2.1s)
   - 创建粒子配置类型定义
2. **Write** `frontend/src/lib/particles/particle.ts` ✓ (3.2s)
   - 创建粒子数据结构
...

## 文件变更

| 操作 | 文件 |
|------|------|
| 创建 | `frontend/src/lib/particles/config.ts` |
| 创建 | `frontend/src/lib/particles/particle.ts` |
| 修改 | `frontend/src/components/Layout/Header.tsx` |

## 统计

- 文件创建: 5
- 文件修改: 2
- 总代码行数: ~350

---
*导出时间: 2026-01-26 10:00:00*
*导出工具: BorisAgentStudio v0.1*
```

### 3.3 HTML 导出

生成自包含的 HTML 文件，包含：

- 内联 CSS 样式
- Session 数据 (JSON)
- 简化的可视化渲染
- 无需外部依赖

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Session: 实现顶栏粒子效果</title>
  <style>
    /* 内联样式 */
    :root { --bg-primary: #1a1a2e; ... }
    .session-viewer { ... }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const SESSION_DATA = { /* JSON 数据 */ };
    // 简化的渲染逻辑
    function render() { ... }
    render();
  </script>
</body>
</html>
```

### 3.4 图片导出 (PNG/SVG)

使用 html2canvas 或 SVG 序列化：

```typescript
async function exportToPNG(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#1a1a2e',
    scale: 2, // 高分辨率
  })

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  })
}

function exportToSVG(element: SVGElement): string {
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(element)

  // 添加样式
  const styleElement = document.createElement('style')
  styleElement.textContent = getComputedStyles()

  const svgDoc = new DOMParser().parseFromString(svgString, 'image/svg+xml')
  svgDoc.documentElement.insertBefore(styleElement, svgDoc.documentElement.firstChild)

  return new XMLSerializer().serializeToString(svgDoc)
}
```

---

## 4. UI 设计

### 4.1 导出按钮

```
┌──────────────────────────────────────────────┐
│ Session: 实现顶栏粒子效果      [导出 ▼] [...]  │
└──────────────────────────────────────────────┘
```

### 4.2 导出菜单

```
┌──────────────────────┐
│ 导出为...            │
├──────────────────────┤
│ 📄 JSON (完整数据)   │
│ 📝 Markdown 报告     │
│ 🖼️ PNG 图片          │
│ 📊 SVG 矢量图        │
│ 🌐 HTML 页面         │
├──────────────────────┤
│ 📋 复制 JSON         │
│ 📋 复制 Markdown     │
└──────────────────────┘
```

### 4.3 导出选项对话框

```
┌─────────────────────────────────────────────┐
│ 导出选项                               [×]  │
├─────────────────────────────────────────────┤
│                                             │
│ 导出范围                                    │
│ ○ 完整 Session                              │
│ ● 当前视图                                  │
│ ○ 选中的阶段                                │
│                                             │
│ 包含内容                                    │
│ ☑ 工具调用详情                              │
│ ☑ 输入/输出数据                             │
│ ☐ 上下文引用                                │
│ ☑ 阶段标注                                  │
│                                             │
│ 图片设置 (PNG/SVG)                          │
│ 分辨率: [2x ▼]                              │
│ 背景: [深色 ▼]                              │
│                                             │
│              [取消]  [导出]                 │
└─────────────────────────────────────────────┘
```

---

## 5. 实现

### 5.1 导出服务

```typescript
// services/exportService.ts

export interface ExportOptions {
  format: 'json' | 'markdown' | 'png' | 'svg' | 'html'
  scope: 'full' | 'view' | 'selection'
  includeToolDetails: boolean
  includeIO: boolean
  includeContext: boolean
  includeAnnotations: boolean
  imageScale?: number
  theme?: 'dark' | 'light'
}

export async function exportSession(
  session: AgentSession,
  options: ExportOptions
): Promise<{ blob: Blob; filename: string }> {
  switch (options.format) {
    case 'json':
      return exportToJSON(session, options)
    case 'markdown':
      return exportToMarkdown(session, options)
    case 'png':
      return exportToPNG(session, options)
    case 'svg':
      return exportToSVG(session, options)
    case 'html':
      return exportToHTML(session, options)
    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }
}

function exportToJSON(
  session: AgentSession,
  options: ExportOptions
): { blob: Blob; filename: string } {
  const data = {
    ...session,
    exported_at: new Date().toISOString(),
    exported_by: 'BorisAgentStudio v0.1',
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })

  return {
    blob,
    filename: `${session.session_id}.json`,
  }
}

function exportToMarkdown(
  session: AgentSession,
  options: ExportOptions
): { blob: Blob; filename: string } {
  const markdown = generateMarkdownReport(session, options)

  const blob = new Blob([markdown], {
    type: 'text/markdown',
  })

  return {
    blob,
    filename: `${session.session_id}-report.md`,
  }
}

function generateMarkdownReport(
  session: AgentSession,
  options: ExportOptions
): string {
  const lines: string[] = []

  lines.push(`# Session 执行报告`)
  lines.push('')
  lines.push(`## 基本信息`)
  lines.push('')
  lines.push(`- **Session ID**: ${session.session_id}`)
  lines.push(`- **任务**: ${session.task_title}`)
  lines.push(`- **状态**: ${session.status === 'success' ? '✅ 成功' : '❌ 失败'}`)
  lines.push(`- **执行时间**: ${formatDuration(session.summary.total_duration_ms)}`)
  lines.push(`- **工具调用**: ${session.summary.tool_calls_count} 次`)
  lines.push('')

  if (session.user_prompt) {
    lines.push(`## 用户输入`)
    lines.push('')
    lines.push(`> ${session.user_prompt}`)
    lines.push('')
  }

  if (options.includeToolDetails) {
    lines.push(`## 执行过程`)
    lines.push('')

    for (const tc of session.tool_calls) {
      const status = tc.output.status === 'success' ? '✓' : '✗'
      const duration = tc.duration_ms ? `(${tc.duration_ms}ms)` : ''

      lines.push(`- **${tc.tool_name}** ${status} ${duration}`)

      if (options.includeIO && tc.input.description) {
        lines.push(`  - ${tc.input.description}`)
      }
    }
    lines.push('')
  }

  lines.push(`---`)
  lines.push(`*导出时间: ${new Date().toLocaleString()}*`)
  lines.push(`*导出工具: BorisAgentStudio v0.1*`)

  return lines.join('\n')
}
```

### 5.2 下载工具

```typescript
// utils/download.ts

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
```

### 5.3 导出组件

```typescript
// components/ExportMenu/ExportMenu.tsx

export function ExportMenu({ session }: { session: AgentSession }) {
  const [showOptions, setShowOptions] = useState(false)
  const [options, setOptions] = useState<ExportOptions>(defaultOptions)

  const handleExport = async (format: ExportOptions['format']) => {
    try {
      const { blob, filename } = await exportSession(session, {
        ...options,
        format,
      })
      downloadBlob(blob, filename)
      toast.success(`已导出 ${filename}`)
    } catch (error) {
      toast.error('导出失败')
    }
  }

  const handleCopy = async (format: 'json' | 'markdown') => {
    try {
      const { blob } = await exportSession(session, {
        ...options,
        format,
      })
      const text = await blob.text()
      await copyToClipboard(text)
      toast.success('已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  return (
    <div className="export-menu">
      <Dropdown
        trigger={<button className="export-btn">导出 ▼</button>}
        items={[
          { label: '📄 JSON', onClick: () => handleExport('json') },
          { label: '📝 Markdown', onClick: () => handleExport('markdown') },
          { label: '🖼️ PNG', onClick: () => handleExport('png') },
          { label: '📊 SVG', onClick: () => handleExport('svg') },
          { label: '🌐 HTML', onClick: () => handleExport('html') },
          { divider: true },
          { label: '📋 复制 JSON', onClick: () => handleCopy('json') },
          { label: '📋 复制 Markdown', onClick: () => handleCopy('markdown') },
          { divider: true },
          { label: '⚙️ 导出选项...', onClick: () => setShowOptions(true) },
        ]}
      />

      {showOptions && (
        <ExportOptionsDialog
          options={options}
          onChange={setOptions}
          onClose={() => setShowOptions(false)}
        />
      )}
    </div>
  )
}
```

---

## 6. 实现计划

### Phase 1: 基础导出
- [ ] JSON 导出
- [ ] Markdown 导出
- [ ] 下载功能

### Phase 2: 图片导出
- [ ] PNG 导出
- [ ] SVG 导出
- [ ] 导出选项

### Phase 3: 高级功能
- [ ] HTML 导出
- [ ] 复制到剪贴板
- [ ] 选择性导出

---

## 7. 相关文档

- [SKILL-004](../../skills/builtin/SKILL-004-export.json) - 导出技能
- [STD-001](../../standards/data/STD-001-agent-session-logging.md) - Session 日志标准
