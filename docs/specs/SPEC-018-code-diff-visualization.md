# SPEC-018: 代码变更可视化

> 作者: Boris Huai
> 起草日期: 2026-01-26
> 状态: 草稿

---

## 1. 概述

本规格定义代码变更可视化功能的设计，帮助用户清晰理解 Agent 对代码的修改。

---

## 2. 功能需求

### 2.1 对比模式

| 模式 | 描述 |
|------|------|
| Side-by-side | 左右并排显示原始和修改后代码 |
| Inline | 上下显示，删除行在上，新增行在下 |
| Unified | 合并显示，用颜色区分变更 |

### 2.2 功能特性

| 特性 | 描述 |
|------|------|
| 语法高亮 | TypeScript/JavaScript/Rust/CSS 等 |
| 行号显示 | 原始和新文件的行号 |
| 单词级 Diff | 高亮行内具体变更的单词 |
| 上下文折叠 | 折叠未变更的代码区域 |
| 同步滚动 | Side-by-side 模式下同步滚动 |

---

## 3. UI 设计

### 3.1 Side-by-side 视图

```
┌─────────────────────────────┬─────────────────────────────┐
│ 原始文件                     │ 修改后                      │
│ Header.tsx                   │ Header.tsx                  │
├─────────────────────────────┼─────────────────────────────┤
│  10 │ import { useState }    │  10 │ import { useState }    │
│  11 │ import './Header.css'  │  11 │ import './Header.css'  │
│  12 │                        │  12 │ import { Particles }   │ +
│     │                        │  13 │                        │
│  13 │ export function Head.. │  14 │ export function Head.. │
│  14 │   return (             │  15 │   return (             │
│  15 │     <header>           │  16 │     <header>           │
│     │                        │  17 │       <Particles />    │ +
│  16 │       <h1>Title</h1>   │  18 │       <h1>Title</h1>   │
└─────────────────────────────┴─────────────────────────────┘
```

### 3.2 Inline 视图

```
┌─────────────────────────────────────────────────────────┐
│ Header.tsx                                              │
├─────────────────────────────────────────────────────────┤
│  10 │ import { useState }                               │
│  11 │ import './Header.css'                             │
│     │ + import { Particles }                            │ 绿色背景
│  13 │                                                   │
│  14 │ export function Header() {                        │
│  15 │   return (                                        │
│  16 │     <header>                                      │
│     │ +       <Particles />                             │ 绿色背景
│  18 │       <h1>Title</h1>                              │
└─────────────────────────────────────────────────────────┘
```

### 3.3 统计栏

```
┌─────────────────────────────────────────────────────────┐
│ +15 行  -3 行  ~2 文件                    [Inline ▼]    │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 技术实现

### 4.1 Diff 算法

使用 Myers diff 算法计算最小编辑距离：

```typescript
interface DiffLine {
  type: 'same' | 'add' | 'remove'
  content: string
  oldLineNum?: number
  newLineNum?: number
}

interface DiffResult {
  hunks: DiffHunk[]
  stats: {
    additions: number
    deletions: number
  }
}

interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

function computeDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')

  // Myers diff 算法实现
  // ...

  return { hunks, stats }
}
```

### 4.2 单词级 Diff

```typescript
interface WordDiff {
  type: 'same' | 'add' | 'remove'
  text: string
}

function computeWordDiff(oldLine: string, newLine: string): WordDiff[] {
  const oldWords = tokenize(oldLine)
  const newWords = tokenize(newLine)

  // 对单词级别进行 diff
  // ...

  return wordDiffs
}

function tokenize(line: string): string[] {
  // 按空格和标点分词，保留分隔符
  return line.split(/(\s+|[{}()[\],;:.])/).filter(Boolean)
}
```

### 4.3 语法高亮

```typescript
// 使用 Prism.js 或 highlight.js
import Prism from 'prismjs'

function highlightCode(code: string, language: string): string {
  return Prism.highlight(code, Prism.languages[language], language)
}

// 组合 diff 和语法高亮
function renderDiffLine(line: DiffLine, language: string): ReactNode {
  const highlighted = highlightCode(line.content, language)

  return (
    <div className={`diff-line diff-${line.type}`}>
      <span className="line-num">{line.oldLineNum || line.newLineNum}</span>
      <span
        className="line-content"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  )
}
```

---

## 5. 组件设计

### 5.1 组件结构

```
CodeDiff/
├── CodeDiff.tsx              # 主组件
├── CodeDiff.css
├── DiffView.tsx              # Diff 视图
├── SideBySideView.tsx        # 并排视图
├── InlineView.tsx            # 行内视图
├── DiffLine.tsx              # 单行渲染
├── DiffStats.tsx             # 统计显示
└── index.ts
```

### 5.2 Props 接口

```typescript
interface CodeDiffProps {
  oldCode: string
  newCode: string
  language: string
  filename?: string
  viewMode?: 'side-by-side' | 'inline' | 'unified'
  showLineNumbers?: boolean
  showWordDiff?: boolean
  contextLines?: number
}
```

---

## 6. 集成

### 6.1 在 ToolDetailPanel 中使用

当工具是 Write 或 Edit 时，显示代码变更：

```tsx
function ToolDetailPanel({ toolCall }: Props) {
  if (['Write', 'Edit'].includes(toolCall.tool_name)) {
    const oldCode = toolCall.input.params.old_string || ''
    const newCode = toolCall.input.params.new_string ||
                    toolCall.output.result?.content || ''

    return (
      <div className="tool-detail">
        <CodeDiff
          oldCode={oldCode}
          newCode={newCode}
          language={detectLanguage(toolCall.input.params.file_path)}
          filename={toolCall.input.params.file_path}
        />
      </div>
    )
  }

  // 其他工具的渲染...
}
```

---

## 7. 实现计划

### Phase 1: 基础 Diff
- [ ] Diff 算法实现
- [ ] 基本 Inline 视图
- [ ] 行号显示

### Phase 2: 高级视图
- [ ] Side-by-side 视图
- [ ] 语法高亮
- [ ] 同步滚动

### Phase 3: 优化
- [ ] 单词级 Diff
- [ ] 上下文折叠
- [ ] 虚拟滚动 (大文件)

---

## 8. 相关文档

- [SKILL-006](../../skills/builtin/SKILL-006-code-diff.json) - 代码 Diff 技能
