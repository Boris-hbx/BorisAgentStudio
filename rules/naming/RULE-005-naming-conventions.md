# RULE-005: 命名约定

> 版本: 1.0
> 作者: Boris Huai
> 创建日期: 2026-01-26
> 状态: 生效中

---

## 1. 概述

本规则定义 BorisAgentStudio 项目中文件、代码和资源的命名约定。

---

## 2. 文件命名

### 2.1 前端文件

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| React 组件 | PascalCase | `PhaseNode.tsx` |
| 组件样式 | 与组件同名 | `PhaseNode.css` |
| Hook | camelCase + use 前缀 | `useSessionStore.ts` |
| 工具函数 | camelCase | `groupToolCalls.ts` |
| 类型定义 | camelCase | `agent.ts` |
| 测试文件 | 原文件名 + .test | `PhaseNode.test.tsx` |
| 常量文件 | camelCase | `constants.ts` |

### 2.2 后端文件 (Rust)

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 模块 | snake_case | `session_service.rs` |
| 测试模块 | snake_case + _test | `session_test.rs` |

### 2.3 配置文件

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 规格文档 | SPEC-{序号}-{名称} | `SPEC-013-project-enhancement.md` |
| 标准文档 | STD-{序号}-{名称} | `STD-003-api-standards.md` |
| 规则文档 | RULE-{序号}-{名称} | `RULE-003-git-commit.md` |
| 技能定义 | SKILL-{序号}-{名称} | `SKILL-001-particles.json` |

### 2.4 目录命名

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 组件目录 | PascalCase | `PhaseGroup/` |
| 功能目录 | camelCase | `utils/` |
| 配置目录 | 小写 | `config/` |

---

## 3. 代码命名

### 3.1 TypeScript/JavaScript

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 变量 | camelCase | `sessionData` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 函数 | camelCase | `getSessionById` |
| 类 | PascalCase | `SessionManager` |
| 接口 | PascalCase | `AgentSession` |
| 类型别名 | PascalCase | `ToolCallStatus` |
| 枚举 | PascalCase | `PhaseType` |
| 枚举成员 | UPPER_SNAKE_CASE | `PHASE_EXPLORE` |
| React 组件 | PascalCase | `PhaseNode` |
| Hook | camelCase + use | `useSessionStore` |
| 事件处理器 | handle + 事件名 | `handleClick` |
| 布尔变量 | is/has/can/should | `isExpanded` |

### 3.2 Rust

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 变量 | snake_case | `session_data` |
| 常量 | UPPER_SNAKE_CASE | `MAX_CONNECTIONS` |
| 函数 | snake_case | `get_session_by_id` |
| 结构体 | PascalCase | `SessionManager` |
| 枚举 | PascalCase | `PhaseType` |
| 枚举变体 | PascalCase | `Explore` |
| Trait | PascalCase | `Serializable` |
| 模块 | snake_case | `session_service` |
| 宏 | snake_case! | `debug_log!` |

### 3.3 CSS

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 类名 | kebab-case | `phase-node` |
| 修饰符 | 双连字符 | `phase-node--expanded` |
| 元素 | 双下划线 | `phase-node__header` |
| 状态类 | is-/has- | `is-active` |
| CSS 变量 | --前缀 + kebab | `--phase-color` |

---

## 4. 语义命名

### 4.1 动词选择

| 操作类型 | 推荐动词 | 示例 |
|----------|----------|------|
| 获取数据 | get, fetch, load | `getSession`, `fetchData` |
| 设置数据 | set, update | `setStatus`, `updateSession` |
| 创建 | create, add | `createSession`, `addToolCall` |
| 删除 | delete, remove | `deleteSession`, `removeItem` |
| 检查 | is, has, can | `isValid`, `hasError` |
| 转换 | to, format, parse | `toJSON`, `formatDate` |
| 处理 | handle, process | `handleClick`, `processData` |
| 计算 | calc, compute | `calcDuration`, `computeStats` |

### 4.2 名词选择

| 概念 | 推荐名词 | 避免 |
|------|----------|------|
| 列表数据 | items, list | data, array |
| 单个项目 | item, entry | element, thing |
| 数量 | count, total | num, number |
| 状态 | status, state | flag |
| 配置 | config, options | settings, params |
| 回调 | callback, handler | func, fn |

### 4.3 布尔变量命名

```typescript
// ✅ 推荐
const isLoading = true
const hasError = false
const canSubmit = true
const shouldUpdate = false
const wasProcessed = true

// ❌ 避免
const loading = true      // 不明确是状态还是动作
const error = false       // 不明确是布尔还是错误对象
const submit = true       // 看起来像动作
```

---

## 5. 特殊约定

### 5.1 缩写规则

| 规则 | 示例 |
|------|------|
| 常见缩写保持大写 | `ID`, `URL`, `API` |
| 变量中缩写首字母大写 | `sessionId`, `apiUrl` |
| 类名中缩写全大写 | `APIClient`, `URLParser` |

### 5.2 前缀约定

| 前缀 | 用途 | 示例 |
|------|------|------|
| `_` | 私有/内部 | `_internalState` |
| `$` | Observable/Stream | `$events` |
| `on` | 事件属性 | `onClick` |
| `use` | React Hook | `useSession` |

### 5.3 后缀约定

| 后缀 | 用途 | 示例 |
|------|------|------|
| `Props` | 组件 Props 类型 | `PhaseNodeProps` |
| `State` | 状态类型 | `SessionState` |
| `Context` | React Context | `ThemeContext` |
| `Provider` | Context Provider | `ThemeProvider` |
| `Handler` | 事件处理函数类型 | `ClickHandler` |
| `Config` | 配置类型 | `ParticleConfig` |
| `Options` | 可选参数类型 | `FetchOptions` |
| `Result` | 返回结果类型 | `SearchResult` |
| `Error` | 错误类型 | `ValidationError` |

---

## 6. 项目特定命名

### 6.1 领域术语

| 术语 | 命名 | 说明 |
|------|------|------|
| 会话 | session | Agent 执行会话 |
| 工具调用 | toolCall | 单次工具调用 |
| 阶段 | phase | 执行阶段 |
| 阶段分组 | phaseGroup | 工具调用分组 |
| 上下文 | context | 上下文引用 |

### 6.2 组件命名

| 功能 | 组件名 |
|------|--------|
| 阶段分组列表 | `PhaseGroupList` |
| 阶段节点 | `PhaseNode` |
| 工具详情面板 | `ToolDetailPanel` |
| 状态栏 | `StatusBar` |
| 头部粒子效果 | `HeaderParticles` |

---

## 7. 反模式

### 7.1 避免的命名

```typescript
// ❌ 单字母变量 (循环变量除外)
const d = new Date()

// ❌ 无意义命名
const data = fetchData()
const info = getInfo()
const temp = calculate()

// ❌ 数字后缀
const session1 = ...
const session2 = ...

// ❌ 类型作为名称
const string = 'hello'
const array = [1, 2, 3]
const object = { key: 'value' }

// ❌ 否定布尔
const isNotValid = false  // 应该用 isInvalid 或 !isValid
```

### 7.2 推荐替代

```typescript
// ✅ 描述性命名
const createdDate = new Date()

// ✅ 具体命名
const sessionData = fetchSessionData()
const userInfo = getUserInfo()
const totalDuration = calculateDuration()

// ✅ 语义化区分
const activeSession = ...
const archivedSession = ...

// ✅ 类型化命名
const greeting = 'hello'
const numbers = [1, 2, 3]
const config = { key: 'value' }

// ✅ 正向布尔
const isValid = true
```

---

## 8. 检查工具

### 8.1 ESLint 规则

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'camelcase': ['error', { properties: 'never' }],
    '@typescript-eslint/naming-convention': [
      'error',
      // 变量: camelCase
      { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
      // 函数: camelCase
      { selector: 'function', format: ['camelCase'] },
      // 类型: PascalCase
      { selector: 'typeLike', format: ['PascalCase'] },
      // 接口不要 I 前缀
      { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: false } },
      // 布尔变量
      { selector: 'variable', types: ['boolean'], format: ['PascalCase'], prefix: ['is', 'has', 'can', 'should', 'was'] },
    ],
  },
}
```

---

## 9. 相关文档

- [STD-002](../../standards/coding/STD-002-coding-standards.md) - 编码规范
- [RULE-003](./RULE-003-git-commit-standards.md) - Git 提交规范
