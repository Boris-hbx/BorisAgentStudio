# STD-006: 可访问性规范

> 版本: 1.0
> 作者: Boris Huai
> 创建日期: 2026-01-26
> 状态: 生效中

---

## 1. 概述

本标准定义 BorisAgentStudio 项目的可访问性 (Accessibility, A11y) 要求，确保所有用户都能有效使用本工具。

---

## 2. 合规目标

### 2.1 WCAG 2.1 等级

- **目标等级**: AA (中等)
- **参考标准**: Web Content Accessibility Guidelines 2.1

### 2.2 核心原则

| 原则 | 描述 |
|------|------|
| **可感知** | 信息和界面元素必须能被用户感知 |
| **可操作** | 界面组件和导航必须可操作 |
| **可理解** | 信息和操作界面必须可理解 |
| **健壮性** | 内容必须能被各种用户代理解释 |

---

## 3. 键盘导航

### 3.1 基本要求

- 所有功能必须可通过键盘访问
- 焦点顺序符合视觉逻辑
- 焦点状态清晰可见

### 3.2 焦点样式

```css
/* 默认焦点样式 */
:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* 仅键盘焦点 (使用 :focus-visible) */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### 3.3 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Tab` | 向前移动焦点 |
| `Shift+Tab` | 向后移动焦点 |
| `Enter/Space` | 激活按钮/链接 |
| `Escape` | 关闭弹窗/取消操作 |
| `Arrow Keys` | 在列表/菜单中导航 |
| `/` | 聚焦搜索框 |
| `?` | 显示快捷键帮助 |

### 3.4 焦点管理

```typescript
// 模态框打开时焦点管理
function openModal() {
  // 保存之前的焦点
  previousFocus.current = document.activeElement as HTMLElement

  // 聚焦到模态框第一个可聚焦元素
  const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  firstFocusable?.focus()
}

function closeModal() {
  // 恢复之前的焦点
  previousFocus.current?.focus()
}
```

### 3.5 焦点陷阱

```typescript
// 模态框内的焦点陷阱
function trapFocus(e: KeyboardEvent) {
  const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  if (!focusableElements?.length) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }
}
```

---

## 4. 屏幕阅读器支持

### 4.1 语义化 HTML

```tsx
// ✅ 推荐：语义化元素
<nav aria-label="主导航">
  <ul>
    <li><a href="/sessions">Sessions</a></li>
  </ul>
</nav>

<main>
  <article aria-labelledby="session-title">
    <h1 id="session-title">Session 详情</h1>
  </article>
</main>

// ❌ 避免：无语义 div
<div class="nav">
  <div class="nav-item">Sessions</div>
</div>
```

### 4.2 ARIA 属性

| 属性 | 用途 | 示例 |
|------|------|------|
| `aria-label` | 提供文本标签 | `<button aria-label="关闭">×</button>` |
| `aria-labelledby` | 引用其他元素作为标签 | `<div aria-labelledby="title">` |
| `aria-describedby` | 引用描述信息 | `<input aria-describedby="help">` |
| `aria-expanded` | 展开/折叠状态 | `<button aria-expanded="true">` |
| `aria-selected` | 选中状态 | `<li aria-selected="true">` |
| `aria-hidden` | 对屏幕阅读器隐藏 | `<span aria-hidden="true">🔍</span>` |
| `aria-live` | 动态内容更新通知 | `<div aria-live="polite">` |
| `aria-busy` | 加载状态 | `<div aria-busy="true">` |

### 4.3 动态内容

```tsx
// 状态更新通知
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {status === 'loading' && '正在加载...'}
  {status === 'success' && '加载完成'}
  {status === 'error' && '加载失败'}
</div>

// 仅屏幕阅读器可见的样式
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 4.4 图标和装饰元素

```tsx
// 装饰性图标 - 对屏幕阅读器隐藏
<span aria-hidden="true">✓</span>

// 功能性图标 - 提供标签
<button aria-label="展开详情">
  <span aria-hidden="true">▶</span>
</button>

// 状态图标 - 提供文字说明
<span className="status-badge">
  <span aria-hidden="true">✓</span>
  <span className="sr-only">成功</span>
</span>
```

---

## 5. 颜色与对比度

### 5.1 对比度要求

| 类型 | 最低对比度 (AA) | 增强对比度 (AAA) |
|------|-----------------|------------------|
| 正常文本 | 4.5:1 | 7:1 |
| 大文本 (≥18pt) | 3:1 | 4.5:1 |
| 图形/UI 组件 | 3:1 | - |

### 5.2 颜色使用原则

```css
/* 不仅依赖颜色传达信息 */

/* ❌ 仅用颜色区分状态 */
.success { color: green; }
.error { color: red; }

/* ✅ 颜色 + 图标/文字 */
.success {
  color: var(--status-success);
}
.success::before {
  content: '✓ ';
}

.error {
  color: var(--status-failed);
}
.error::before {
  content: '✗ ';
}
```

### 5.3 高对比度模式

```css
@media (prefers-contrast: high) {
  :root {
    --bg-primary: #000;
    --bg-secondary: #111;
    --text-primary: #fff;
    --text-secondary: #ccc;
    --border-default: #fff;
    --accent: #0ff;
  }
}
```

---

## 6. 响应式与缩放

### 6.1 文本缩放

- 支持 200% 文本缩放不丢失内容
- 使用相对单位 (rem, em) 而非 px

```css
/* ✅ 推荐 */
font-size: 1rem;
padding: 0.5rem 1rem;
line-height: 1.5;

/* ❌ 避免 */
font-size: 16px;
padding: 8px 16px;
line-height: 24px;
```

### 6.2 页面缩放

- 支持 400% 页面缩放
- 内容在 320px 宽度下可用

### 6.3 减少动画

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. 表单可访问性

### 7.1 标签关联

```tsx
// ✅ 显式关联
<label htmlFor="session-search">搜索</label>
<input id="session-search" type="text" />

// ✅ 隐式关联
<label>
  搜索
  <input type="text" />
</label>

// ✅ 使用 aria-label
<input type="text" aria-label="搜索 Sessions" placeholder="搜索..." />
```

### 7.2 错误提示

```tsx
<div className="form-field">
  <label htmlFor="email">邮箱</label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <span id="email-error" className="error-message" role="alert">
      {error}
    </span>
  )}
</div>
```

### 7.3 必填字段

```tsx
<label htmlFor="name">
  名称
  <span aria-hidden="true" className="required">*</span>
</label>
<input id="name" type="text" required aria-required="true" />
```

---

## 8. 组件可访问性模式

### 8.1 按钮

```tsx
// 普通按钮
<button type="button" onClick={handleClick}>
  保存
</button>

// 图标按钮
<button type="button" aria-label="关闭" onClick={handleClose}>
  <span aria-hidden="true">×</span>
</button>

// 切换按钮
<button
  type="button"
  aria-pressed={isToggled}
  onClick={() => setIsToggled(!isToggled)}
>
  {isToggled ? '已启用' : '已禁用'}
</button>
```

### 8.2 可展开面板

```tsx
<div className="expandable">
  <button
    aria-expanded={isExpanded}
    aria-controls="panel-content"
    onClick={() => setIsExpanded(!isExpanded)}
  >
    <span>{title}</span>
    <span aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
  </button>
  <div
    id="panel-content"
    hidden={!isExpanded}
    role="region"
    aria-labelledby="panel-title"
  >
    {content}
  </div>
</div>
```

### 8.3 标签页

```tsx
<div className="tabs">
  <div role="tablist" aria-label="Session 视图">
    {tabs.map((tab, index) => (
      <button
        key={tab.id}
        role="tab"
        id={`tab-${tab.id}`}
        aria-selected={activeTab === tab.id}
        aria-controls={`panel-${tab.id}`}
        tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => setActiveTab(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
  {tabs.map((tab) => (
    <div
      key={tab.id}
      role="tabpanel"
      id={`panel-${tab.id}`}
      aria-labelledby={`tab-${tab.id}`}
      hidden={activeTab !== tab.id}
      tabIndex={0}
    >
      {tab.content}
    </div>
  ))}
</div>
```

### 8.4 模态框

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">确认删除</h2>
  <p id="modal-description">确定要删除这个 Session 吗？此操作无法撤销。</p>
  <div className="modal-actions">
    <button onClick={onCancel}>取消</button>
    <button onClick={onConfirm}>确认删除</button>
  </div>
</div>
```

---

## 9. 测试清单

### 9.1 自动化测试

```typescript
// 使用 jest-axe 进行自动化测试
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<PhaseNode group={mockGroup} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 9.2 手动测试清单

- [ ] 仅用键盘完成所有操作
- [ ] 使用屏幕阅读器 (NVDA/VoiceOver) 测试
- [ ] 200% 文本缩放测试
- [ ] 高对比度模式测试
- [ ] 减少动画模式测试
- [ ] 颜色对比度检查

---

## 10. 工具推荐

| 工具 | 用途 |
|------|------|
| axe DevTools | 浏览器扩展，自动检测问题 |
| WAVE | 可视化可访问性检查 |
| Lighthouse | 综合性能和可访问性审计 |
| jest-axe | 自动化测试集成 |
| Colour Contrast Analyser | 对比度检查工具 |
| NVDA | Windows 屏幕阅读器 |
| VoiceOver | macOS 屏幕阅读器 |

---

## 11. 相关文档

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [STD-002](../coding/STD-002-coding-standards.md) - 编码规范
