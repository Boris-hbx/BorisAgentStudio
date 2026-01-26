# STD-002: 编程规范

> 作者: Boris Huai
> 起草日期: 2026-01-25
> 版本: 1.0
> 状态: 生效中

---

## 目的

为 BorisAgentStudio 项目建立统一的编程规范，确保代码质量、可读性和可维护性。本规范参考业界最佳实践，适用于 React/TypeScript 前端和 Rust 后端开发。

---

## 通用原则

### 1. 代码即文档

```
好的代码应该自解释。
注释用于解释"为什么"，而非"做什么"。
```

### 2. 单一职责原则 (SRP)

- 每个函数只做一件事
- 每个组件只负责一个功能
- 每个文件只包含一个主要导出

### 3. 保持简单 (KISS)

- 优先选择简单直接的方案
- 避免过早优化
- 避免过度抽象

### 4. 不要重复自己 (DRY)

- 提取重复代码为函数/组件
- 但也要避免过度 DRY（3 次重复再抽象）

### 5. 童子军规则

```
离开时让代码比你发现时更干净。
```

---

## TypeScript/React 前端规范

### 文件组织

```
src/
├── components/           # React 组件
│   └── ComponentName/
│       ├── ComponentName.tsx      # 主组件
│       ├── ComponentName.css      # 样式
│       ├── ComponentName.test.tsx # 测试
│       └── index.ts               # 导出
├── hooks/                # 自定义 Hooks
├── services/             # API 服务
├── store/                # 状态管理
├── types/                # 类型定义
└── utils/                # 工具函数
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `TimelineNode`, `DetailPanel` |
| 函数 | camelCase | `handleClick`, `formatDuration` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 类型/接口 | PascalCase | `AgentSession`, `PhaseType` |
| 文件 (组件) | PascalCase | `TimelineNode.tsx` |
| 文件 (工具) | camelCase | `formatters.ts`, `mockData.ts` |
| CSS 类 | kebab-case | `.timeline-node`, `.panel-header` |

### TypeScript 规范

#### 类型优先

```typescript
// ✅ Good: 明确的类型定义
interface TimelineNodeProps {
  phase: ExecutionPhase
  isExpanded: boolean
  onToggle: (id: string) => void
}

// ❌ Bad: 使用 any
function handleData(data: any) { ... }

// ✅ Good: 使用 unknown + 类型守卫
function handleData(data: unknown) {
  if (isValidData(data)) { ... }
}
```

#### 优先使用 interface

```typescript
// ✅ 优先使用 interface（可扩展、更清晰的错误信息）
interface User {
  id: string
  name: string
}

// type 用于联合类型、映射类型等
type Status = 'pending' | 'success' | 'failed'
type PartialUser = Partial<User>
```

#### 避免类型断言

```typescript
// ❌ Bad: 强制类型断言
const user = data as User

// ✅ Good: 类型守卫
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data
}

if (isUser(data)) {
  // data 现在是 User 类型
}
```

#### 使用 const 断言

```typescript
// ✅ Good: 字面量类型推断
const PHASE_ORDER = ['understand', 'explore', 'plan', 'execute', 'verify'] as const
type PhaseType = typeof PHASE_ORDER[number]
```

### React 规范

#### 函数组件 + Hooks

```typescript
// ✅ Good: 函数组件
export function TimelineNode({ phase, isExpanded }: TimelineNodeProps) {
  const [activeTab, setActiveTab] = useState<Tab>('input')

  // ...
}

// ❌ Bad: 类组件（除非有特殊需求）
class TimelineNode extends React.Component { ... }
```

#### Props 解构

```typescript
// ✅ Good: 在参数中解构
function Button({ label, onClick, disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>
}

// ❌ Bad: 在函数体内解构
function Button(props: ButtonProps) {
  const { label, onClick, disabled } = props
  // ...
}
```

#### 事件处理器命名

```typescript
// ✅ Good: handle + 事件名
const handleClick = () => { ... }
const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => { ... }
const handleFormSubmit = (e: FormEvent) => { ... }

// Props 回调：on + 事件名
interface Props {
  onClick: () => void
  onValueChange: (value: string) => void
}
```

#### 条件渲染

```typescript
// ✅ Good: 短路求值用于简单条件
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}

// ✅ Good: 三元表达式用于二选一
{isExpanded ? <ExpandedView /> : <CollapsedView />}

// ✅ Good: 提前返回用于复杂条件
if (!data) return <EmptyState />
if (error) return <ErrorState error={error} />
return <DataView data={data} />

// ❌ Bad: 嵌套三元
{a ? (b ? <A /> : <B />) : (c ? <C /> : <D />)}
```

#### 避免内联函数（性能敏感场景）

```typescript
// ❌ Bad: 每次渲染创建新函数
<button onClick={() => handleClick(id)}>Click</button>

// ✅ Good: 使用 useCallback
const handleButtonClick = useCallback(() => {
  handleClick(id)
}, [id])

<button onClick={handleButtonClick}>Click</button>
```

#### 列表渲染

```typescript
// ✅ Good: 使用稳定的 key
{items.map((item) => (
  <ListItem key={item.id} item={item} />
))}

// ❌ Bad: 使用 index 作为 key（除非列表不会重排）
{items.map((item, index) => (
  <ListItem key={index} item={item} />
))}
```

### Hooks 规范

#### 自定义 Hook 命名

```typescript
// ✅ Good: use 前缀
function useSessionStore() { ... }
function useDebounce(value: string, delay: number) { ... }
function useLocalStorage<T>(key: string, initialValue: T) { ... }
```

#### 依赖数组

```typescript
// ✅ Good: 完整的依赖
useEffect(() => {
  fetchData(userId)
}, [userId, fetchData])

// ❌ Bad: 缺少依赖（ESLint 会警告）
useEffect(() => {
  fetchData(userId)
}, []) // 缺少 userId
```

#### useMemo / useCallback 使用原则

```typescript
// ✅ 适合使用的场景:
// 1. 计算开销大
const sortedList = useMemo(() =>
  items.sort((a, b) => a.score - b.score),
  [items]
)

// 2. 引用相等性重要（传给子组件的对象/函数）
const config = useMemo(() => ({ theme, locale }), [theme, locale])
const handleSubmit = useCallback(() => submitForm(data), [data])

// ❌ 不需要使用的场景:
// 1. 简单计算
const fullName = `${firstName} ${lastName}` // 不需要 useMemo

// 2. 原始值
const isValid = value.length > 0 // 不需要 useMemo
```

### CSS 规范

#### 使用 CSS 变量

```css
/* ✅ Good: 使用主题变量 */
.panel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

/* ❌ Bad: 硬编码颜色 */
.panel {
  background: #1e1e1e;
  color: #ffffff;
}
```

#### BEM 风格（可选但推荐）

```css
/* Block */
.timeline-node { }

/* Element */
.timeline-node__header { }
.timeline-node__content { }

/* Modifier */
.timeline-node--expanded { }
.timeline-node--failed { }
```

#### 避免深层嵌套

```css
/* ✅ Good: 扁平结构 */
.card { }
.card-header { }
.card-title { }

/* ❌ Bad: 深层嵌套 */
.card .header .title .text { }
```

---

## Rust 后端规范

### 文件组织

```
src/
├── main.rs               # 入口
├── lib.rs                # 库根
├── api/                  # HTTP 路由
│   ├── mod.rs
│   └── sessions.rs
├── models/               # 数据模型
│   ├── mod.rs
│   └── session.rs
├── services/             # 业务逻辑
│   ├── mod.rs
│   └── session_service.rs
└── errors.rs             # 错误类型
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 模块 | snake_case | `session_store`, `api_routes` |
| 函数 | snake_case | `get_session`, `parse_config` |
| 结构体 | PascalCase | `AgentSession`, `ToolCall` |
| 枚举 | PascalCase | `PhaseType`, `Status` |
| 常量 | UPPER_SNAKE_CASE | `MAX_CONNECTIONS` |
| 生命周期 | 短小写 | `'a`, `'static` |

### 错误处理

```rust
// ✅ Good: 使用 Result 和自定义错误类型
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Session not found: {0}")]
    NotFound(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Invalid input: {0}")]
    Validation(String),
}

pub type Result<T> = std::result::Result<T, AppError>;

// ❌ Bad: 使用 unwrap() 在生产代码
let data = file.read().unwrap(); // 可能 panic

// ✅ Good: 使用 ? 或显式处理
let data = file.read()?;
let data = file.read().unwrap_or_default();
```

### 所有权和借用

```rust
// ✅ Good: 优先借用而非获取所有权
fn process(data: &str) -> String { ... }

// ✅ Good: 需要修改时使用可变借用
fn update(data: &mut Config) { ... }

// ✅ Good: 需要所有权时才获取
fn consume(data: String) { ... }

// ✅ Good: 使用 Cow 延迟克隆
fn process(data: Cow<'_, str>) -> Cow<'_, str> { ... }
```

### 结构体设计

```rust
// ✅ Good: 派生常用 trait
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub status: Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

// ✅ Good: 使用 builder 模式处理复杂构造
impl SessionBuilder {
    pub fn new(id: String) -> Self { ... }
    pub fn status(mut self, status: Status) -> Self { ... }
    pub fn build(self) -> Result<Session> { ... }
}
```

### 异步代码

```rust
// ✅ Good: 使用 async/await
async fn fetch_session(id: &str) -> Result<Session> {
    let session = db.get(id).await?;
    Ok(session)
}

// ✅ Good: 并发执行独立任务
let (user, posts) = tokio::join!(
    fetch_user(user_id),
    fetch_posts(user_id)
);

// ✅ Good: 使用 Arc 共享状态
let state = Arc::new(AppState::new());
let state_clone = Arc::clone(&state);
```

---

## Git 规范

### 分支命名

```
feature/add-timeline-animation
fix/session-loading-error
refactor/simplify-phase-logic
docs/update-readme
```

### Commit 消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构（不改变功能）
- `style`: 代码格式（不影响代码运行）
- `docs`: 文档
- `test`: 测试
- `chore`: 构建/工具变更

**示例:**

```
feat(timeline): add phase expansion animation

- Add CSS transition for smooth expand/collapse
- Implement click delay to distinguish single/double click
- Update TimelineNode to support locked state

Closes #123
```

### 提交粒度

- 每个提交应该是一个**逻辑单元**
- 可以独立 review 和 revert
- 避免混合不相关的修改

---

## 注释规范

### 何时写注释

```typescript
// ✅ Good: 解释"为什么"
// 使用 200ms 延时区分单击和双击，避免双击时触发两次切换
clickTimer.current = setTimeout(() => {
  togglePhaseExpanded(phase.phase_id)
}, 200)

// ✅ Good: 解释复杂算法
// 二次方关系：距离越近排斥力越大
// force = (1 - dist/radius)² × repelForce × 1.5
const force = Math.pow(1 - dist / radius, 2) * repelForce * 1.5

// ❌ Bad: 解释"做什么"（代码已经表达）
// 增加计数器
count++

// ❌ Bad: 过时的注释
// 返回用户名（实际返回的是用户对象）
return user
```

### JSDoc / TSDoc

```typescript
/**
 * 格式化持续时间为人类可读字符串
 *
 * @param ms - 毫秒数
 * @returns 格式化后的字符串，如 "1.5s" 或 "2.3min"
 *
 * @example
 * formatDuration(1500)  // "1.5s"
 * formatDuration(90000) // "1.5min"
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
```

### TODO 注释

```typescript
// TODO(boris): 添加错误边界处理 (#issue-123)
// FIXME: 这里在大数据量时性能较差，需要优化
// HACK: 临时绕过 Safari 的 flex 布局 bug
// NOTE: 这个顺序很重要，不要随意调整
```

---

## 测试规范

### 测试文件命名

```
ComponentName.test.tsx    # 组件测试
utils.test.ts             # 工具函数测试
session.test.rs           # Rust 单元测试
```

### 测试结构 (AAA 模式)

```typescript
describe('formatDuration', () => {
  it('should format milliseconds correctly', () => {
    // Arrange
    const ms = 1500

    // Act
    const result = formatDuration(ms)

    // Assert
    expect(result).toBe('1.5s')
  })
})
```

### 测试命名

```typescript
// ✅ Good: 描述行为
it('should return empty array when no phases exist')
it('should throw error when session is null')
it('should expand node on single click')

// ❌ Bad: 模糊描述
it('works correctly')
it('test phase')
```

---

## 代码审查清单

### 提交前自查

- [ ] TypeScript 编译无错误
- [ ] ESLint 无警告
- [ ] 单元测试通过
- [ ] 无 `console.log` 残留
- [ ] 无 `any` 类型（除非必要并有注释）
- [ ] 无硬编码的魔法数字/字符串
- [ ] 新增代码有必要的注释
- [ ] 公共 API 有 JSDoc
- [ ] 错误情况有适当处理

### 审查要点

- [ ] 逻辑正确性
- [ ] 边界条件处理
- [ ] 错误处理完整
- [ ] 性能影响评估
- [ ] 安全性考虑
- [ ] 代码可读性
- [ ] 测试覆盖率

---

## 参考资料

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React Documentation](https://react.dev/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
