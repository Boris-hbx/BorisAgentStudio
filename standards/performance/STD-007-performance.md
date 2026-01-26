# STD-007: 性能规范

> 版本: 1.0
> 作者: Boris Huai
> 创建日期: 2026-01-26
> 状态: 生效中

---

## 1. 概述

本标准定义 BorisAgentStudio 项目的性能要求、优化策略和监控指标。

---

## 2. 性能目标

### 2.1 核心指标

| 指标 | 目标值 | 最大值 |
|------|--------|--------|
| 首屏加载时间 (FCP) | < 1.5s | < 3s |
| 可交互时间 (TTI) | < 2s | < 5s |
| 最大内容绘制 (LCP) | < 2.5s | < 4s |
| 累积布局偏移 (CLS) | < 0.1 | < 0.25 |
| 首次输入延迟 (FID) | < 100ms | < 300ms |

### 2.2 资源限制

| 资源 | 目标值 | 最大值 |
|------|--------|--------|
| JS Bundle (gzipped) | < 200KB | < 500KB |
| CSS Bundle (gzipped) | < 50KB | < 100KB |
| 初始请求数 | < 10 | < 20 |
| 总传输大小 | < 500KB | < 1MB |

### 2.3 运行时性能

| 场景 | 目标 |
|------|------|
| 列表滚动 | 60fps |
| 展开/折叠动画 | 60fps |
| Session 切换 | < 100ms |
| 搜索响应 | < 300ms |
| 大 Session 渲染 (>100 工具调用) | < 500ms |

---

## 3. 前端优化策略

### 3.1 代码分割

```typescript
// 路由级分割
const SessionDetail = lazy(() => import('./pages/SessionDetail'))
const SessionComparison = lazy(() => import('./pages/SessionComparison'))

// 组件级分割
const CodeDiff = lazy(() => import('./components/CodeDiff'))
const FlameGraph = lazy(() => import('./components/FlameGraph'))
```

### 3.2 懒加载

```typescript
// 图片懒加载
<img loading="lazy" src={imageSrc} alt="" />

// 组件懒加载
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

### 3.3 虚拟滚动

大列表使用虚拟滚动：

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  })

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3.4 Memo 和缓存

```typescript
// 组件 memo
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // ...
})

// 计算缓存
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// 回调缓存
const handleClick = useCallback(() => {
  doSomething()
}, [])
```

### 3.5 防抖和节流

```typescript
// 搜索防抖
const debouncedSearch = useDebouncedCallback((query: string) => {
  performSearch(query)
}, 300)

// 滚动节流
const throttledScroll = useThrottle((event: ScrollEvent) => {
  handleScroll(event)
}, 100)
```

---

## 4. 数据优化

### 4.1 数据结构优化

```typescript
// ❌ 避免深层嵌套
const badStructure = {
  session: {
    data: {
      toolCalls: {
        items: [...]
      }
    }
  }
}

// ✅ 扁平化结构
const goodStructure = {
  sessions: { [id]: Session },
  toolCalls: { [id]: ToolCall },
  sessionToolCalls: { [sessionId]: string[] }
}
```

### 4.2 增量更新

```typescript
// ❌ 避免全量替换
setState({ ...state, items: newItems })

// ✅ 增量更新
setState(produce(state, draft => {
  draft.items[index] = newItem
}))
```

### 4.3 分页加载

```typescript
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// 无限滚动
function useInfiniteScroll<T>(fetchFn: (page: number) => Promise<T[]>) {
  const [data, setData] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadMore = async () => {
    if (!hasMore) return

    const newData = await fetchFn(page)
    setData([...data, ...newData])
    setPage(page + 1)
    setHasMore(newData.length > 0)
  }

  return { data, loadMore, hasMore }
}
```

---

## 5. 渲染优化

### 5.1 避免不必要的渲染

```typescript
// 使用选择器访问状态
const toolCalls = useSessionStore(
  useCallback(state => state.session?.tool_calls ?? [], [])
)

// 状态切片
const status = useSessionStore(state => state.session?.status)
```

### 5.2 条件渲染优化

```typescript
// ❌ 避免在渲染中创建对象
<Component style={{ marginTop: 10 }} />

// ✅ 使用常量或 CSS 类
const styles = { marginTop: 10 }
<Component style={styles} />

// 或
<Component className="mt-10" />
```

### 5.3 Key 优化

```typescript
// ❌ 避免使用 index 作为 key
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// ✅ 使用稳定的唯一 ID
{items.map((item) => (
  <Item key={item.id} data={item} />
))}
```

---

## 6. 动画性能

### 6.1 使用 GPU 加速

```css
/* ✅ 使用 transform 和 opacity */
.animated {
  transform: translateX(100px);
  opacity: 0.5;
  will-change: transform, opacity;
}

/* ❌ 避免动画这些属性 */
.bad-animation {
  left: 100px;     /* 触发布局 */
  width: 200px;    /* 触发布局 */
  margin: 10px;    /* 触发布局 */
}
```

### 6.2 减少动画偏好

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

## 7. 网络优化

### 7.1 请求合并

```typescript
// 批量请求
async function batchFetch(ids: string[]) {
  const response = await fetch('/api/v1/sessions/batch', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
  return response.json()
}
```

### 7.2 缓存策略

```typescript
// SWR 缓存
const { data, error, isLoading } = useSWR(
  `/api/v1/sessions/${id}`,
  fetcher,
  {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  }
)
```

### 7.3 预加载

```typescript
// 链接预加载
<link rel="prefetch" href="/api/v1/sessions" />

// 代码预加载
const prefetchComponent = () => import('./HeavyComponent')
```

---

## 8. 监控与度量

### 8.1 性能监控

```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  console.log(metric)
  // 发送到分析服务
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

### 8.2 性能预算

```json
// bundlesize.config.json
{
  "files": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "200 kB",
      "compression": "gzip"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "50 kB",
      "compression": "gzip"
    }
  ]
}
```

### 8.3 CI 性能检查

```yaml
# .github/workflows/perf.yml
performance:
  runs-on: ubuntu-latest
  steps:
    - name: Lighthouse CI
      uses: treosh/lighthouse-ci-action@v10
      with:
        urls: |
          http://localhost:5173/
        budgetPath: ./lighthouse-budget.json
```

---

## 9. 后端性能

### 9.1 响应时间目标

| 端点 | 目标 | 最大值 |
|------|------|--------|
| GET /sessions | < 50ms | < 200ms |
| GET /sessions/{id} | < 100ms | < 500ms |
| POST /sessions | < 200ms | < 1s |
| WebSocket 消息 | < 10ms | < 50ms |

### 9.2 并发处理

```rust
// 使用连接池
let pool = PgPoolOptions::new()
    .max_connections(20)
    .connect(&database_url)
    .await?;

// 异步处理
async fn handle_request(req: Request) -> Response {
    let data = tokio::spawn(async move {
        fetch_data().await
    }).await?;

    Response::json(data)
}
```

---

## 10. 性能清单

### 10.1 开发时检查

- [ ] 组件使用 memo 避免不必要渲染
- [ ] 大列表使用虚拟滚动
- [ ] 搜索/输入使用防抖
- [ ] 图片使用懒加载
- [ ] 避免内联对象/函数

### 10.2 构建时检查

- [ ] Bundle 大小在预算内
- [ ] 代码分割正确
- [ ] Tree shaking 生效
- [ ] 图片已优化

### 10.3 运行时检查

- [ ] Core Web Vitals 达标
- [ ] 无内存泄漏
- [ ] 动画流畅 (60fps)
- [ ] 无长任务阻塞

---

## 11. 相关文档

- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [STD-004](../testing/STD-004-testing-standards.md) - 测试规范
