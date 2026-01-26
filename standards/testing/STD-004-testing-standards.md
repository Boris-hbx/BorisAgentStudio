# STD-004: 测试规范

> 版本: 1.0
> 作者: Boris Huai
> 创建日期: 2026-01-26
> 状态: 生效中

---

## 1. 概述

本标准定义 BorisAgentStudio 项目的测试策略、覆盖率要求和最佳实践。

---

## 2. 测试分层

```
┌─────────────────────────────────────┐
│          E2E Tests (10%)            │  ← 用户场景
├─────────────────────────────────────┤
│      Integration Tests (20%)        │  ← 模块协作
├─────────────────────────────────────┤
│        Unit Tests (70%)             │  ← 函数/组件
└─────────────────────────────────────┘
```

### 2.1 单元测试 (Unit Tests)

- **范围**：单个函数、组件、模块
- **隔离**：Mock 所有外部依赖
- **速度**：毫秒级执行
- **覆盖率目标**：≥ 80%

### 2.2 集成测试 (Integration Tests)

- **范围**：多个模块协作
- **隔离**：Mock 外部服务 (API, WebSocket)
- **速度**：秒级执行
- **覆盖率目标**：关键路径 100%

### 2.3 端到端测试 (E2E Tests)

- **范围**：完整用户场景
- **隔离**：使用测试环境
- **速度**：分钟级执行
- **覆盖率目标**：核心功能 100%

---

## 3. 技术栈

### 3.1 前端测试

| 工具 | 用途 |
|------|------|
| **Vitest** | 单元测试运行器 |
| **React Testing Library** | 组件测试 |
| **Playwright** | E2E 测试 |
| **MSW** | API Mock |

### 3.2 后端测试 (Rust)

| 工具 | 用途 |
|------|------|
| **cargo test** | 内置测试框架 |
| **mockall** | Mock 生成 |
| **tokio-test** | 异步测试 |

---

## 4. 文件命名规范

### 4.1 前端

```
src/
├── components/
│   └── PhaseNode/
│       ├── PhaseNode.tsx
│       ├── PhaseNode.test.tsx      # 单元测试
│       └── PhaseNode.spec.tsx      # 集成测试 (可选)
├── utils/
│   └── groupToolCalls.ts
│   └── groupToolCalls.test.ts
└── __tests__/                       # 跨模块集成测试
    └── session-flow.test.ts
```

### 4.2 E2E 测试

```
e2e/
├── fixtures/
│   └── test-session.json
├── pages/
│   └── SessionPage.ts              # Page Object
└── specs/
    ├── session-list.spec.ts
    └── tool-detail.spec.ts
```

### 4.3 后端 (Rust)

```
backend/
├── src/
│   └── services/
│       └── session.rs              # 包含 #[cfg(test)] mod tests
└── tests/
    └── api_integration.rs          # 集成测试
```

---

## 5. 测试编写规范

### 5.1 命名约定

```typescript
// 格式: should_[预期行为]_when_[条件]
describe('PhaseNode', () => {
  it('should expand details when clicked', () => { ... })
  it('should show error badge when has_errors is true', () => { ... })
  it('should not render when group is empty', () => { ... })
})
```

### 5.2 AAA 模式

```typescript
it('should filter sessions by status', () => {
  // Arrange - 准备测试数据
  const sessions = [
    { id: '1', status: 'success' },
    { id: '2', status: 'failed' },
  ]

  // Act - 执行被测操作
  const result = filterByStatus(sessions, 'success')

  // Assert - 验证结果
  expect(result).toHaveLength(1)
  expect(result[0].id).toBe('1')
})
```

### 5.3 组件测试最佳实践

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { PhaseNode } from './PhaseNode'

describe('PhaseNode', () => {
  const mockGroup = {
    group_id: 'test-1',
    phase_type: 'explore',
    label: '探索',
    tool_count: 5,
    has_errors: false,
    tool_calls: [],
  }

  it('should render phase label', () => {
    render(<PhaseNode group={mockGroup} />)
    expect(screen.getByText('探索')).toBeInTheDocument()
  })

  it('should call onToggleExpand when header clicked', () => {
    const onToggle = vi.fn()
    render(<PhaseNode group={mockGroup} onToggleExpand={onToggle} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  // 测试用户行为，而非实现细节
  it('should show tool list when expanded', async () => {
    render(<PhaseNode group={mockGroup} isExpanded={true} />)

    expect(screen.getByTestId('tool-list')).toBeVisible()
  })
})
```

### 5.4 避免的反模式

```typescript
// ❌ 不要测试实现细节
it('should set state to true', () => {
  const { result } = renderHook(() => useState(false))
  act(() => result.current[1](true))
  expect(result.current[0]).toBe(true)
})

// ✅ 测试用户可见的行为
it('should show expanded content after click', () => {
  render(<Expandable />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('Expanded content')).toBeVisible()
})
```

---

## 6. 覆盖率要求

### 6.1 整体目标

| 指标 | 最低要求 | 目标 |
|------|----------|------|
| 行覆盖率 | 70% | 80% |
| 分支覆盖率 | 60% | 75% |
| 函数覆盖率 | 80% | 90% |

### 6.2 关键模块要求

| 模块 | 最低覆盖率 |
|------|-----------|
| `utils/*` | 90% |
| `store/*` | 85% |
| `services/*` | 85% |
| `components/*` | 75% |

### 6.3 豁免规则

以下情况可豁免覆盖率要求（需注释说明）：

```typescript
/* istanbul ignore next -- @preserve 纯 UI 动画，无逻辑 */
function animateParticles() { ... }
```

- 纯 UI 动画代码
- 平台特定的 fallback 代码
- Debug/开发环境专用代码

---

## 7. Mock 策略

### 7.1 API Mock (MSW)

```typescript
// mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/v1/sessions', (req, res, ctx) => {
    return res(ctx.json({
      data: mockSessions,
      meta: { total: 10, page: 1 }
    }))
  }),

  rest.get('/api/v1/sessions/:id', (req, res, ctx) => {
    const { id } = req.params
    const session = mockSessions.find(s => s.id === id)

    if (!session) {
      return res(ctx.status(404), ctx.json({
        error: { code: 'SESSION_NOT_FOUND' }
      }))
    }

    return res(ctx.json({ data: session }))
  }),
]
```

### 7.2 WebSocket Mock

```typescript
// mocks/websocket.ts
class MockWebSocket {
  private listeners: Map<string, Function[]> = new Map()

  addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  // 测试辅助方法
  simulateMessage(data: any) {
    const callbacks = this.listeners.get('message') || []
    callbacks.forEach(cb => cb({ data: JSON.stringify(data) }))
  }
}
```

### 7.3 时间 Mock

```typescript
import { vi } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-26T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})
```

---

## 8. E2E 测试规范

### 8.1 Page Object 模式

```typescript
// e2e/pages/SessionPage.ts
import { Page, Locator } from '@playwright/test'

export class SessionPage {
  readonly page: Page
  readonly sessionList: Locator
  readonly searchInput: Locator
  readonly filterDropdown: Locator

  constructor(page: Page) {
    this.page = page
    this.sessionList = page.getByTestId('session-list')
    this.searchInput = page.getByPlaceholder('搜索...')
    this.filterDropdown = page.getByRole('combobox', { name: '状态' })
  }

  async goto() {
    await this.page.goto('/')
  }

  async searchSession(keyword: string) {
    await this.searchInput.fill(keyword)
    await this.page.keyboard.press('Enter')
  }

  async filterByStatus(status: string) {
    await this.filterDropdown.selectOption(status)
  }

  async getSessionCount(): Promise<number> {
    return await this.sessionList.locator('.session-item').count()
  }
}
```

### 8.2 测试用例

```typescript
// e2e/specs/session-list.spec.ts
import { test, expect } from '@playwright/test'
import { SessionPage } from '../pages/SessionPage'

test.describe('Session List', () => {
  let sessionPage: SessionPage

  test.beforeEach(async ({ page }) => {
    sessionPage = new SessionPage(page)
    await sessionPage.goto()
  })

  test('should display all sessions on load', async () => {
    const count = await sessionPage.getSessionCount()
    expect(count).toBeGreaterThan(0)
  })

  test('should filter sessions by search', async () => {
    await sessionPage.searchSession('particles')

    const count = await sessionPage.getSessionCount()
    expect(count).toBeLessThanOrEqual(5)
  })

  test('should filter sessions by status', async () => {
    await sessionPage.filterByStatus('failed')

    // 所有显示的 session 都应该是失败状态
    const badges = sessionPage.page.locator('.status-badge')
    await expect(badges).toHaveText(['failed'])
  })
})
```

---

## 9. CI 集成

### 9.1 测试阶段

```yaml
# .github/workflows/test.yml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install

    - name: Run unit tests
      run: pnpm test:unit --coverage

    - name: Run integration tests
      run: pnpm test:integration

    - name: Upload coverage
      uses: codecov/codecov-action@v4
      with:
        files: ./coverage/lcov.info
```

### 9.2 覆盖率检查

```yaml
    - name: Check coverage threshold
      run: |
        pnpm test:unit --coverage --coverageReporters=json-summary
        node scripts/check-coverage.js
```

---

## 10. 视觉回归测试

### 10.1 快照测试

```typescript
// 组件快照
it('should match snapshot', () => {
  const { container } = render(<PhaseNode group={mockGroup} />)
  expect(container).toMatchSnapshot()
})
```

### 10.2 Playwright 视觉对比

```typescript
test('visual regression: session detail', async ({ page }) => {
  await page.goto('/session/test-123')
  await page.waitForSelector('.session-detail')

  await expect(page).toHaveScreenshot('session-detail.png', {
    maxDiffPixels: 100,
  })
})
```

---

## 11. 相关文档

- [STD-002](../coding/STD-002-coding-standards.md) - 编码规范
- [Vitest 文档](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
