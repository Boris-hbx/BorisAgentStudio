# SPEC-007: 响应式详情面板布局

> 作者: Boris Huai
> 起草日期: 2026-01-25
> 状态: 草稿

---

## 1. 问题描述

当前详情面板（DetailPanel）采用 `position: fixed` 的右侧抽屉式布局，打开时会遮盖主内容区域。用户无法同时查看完整的时序图和详情内容。

### 当前行为

```
┌─────────────────────────────────┐
│ Header                          │
├─────────────────────────────────┤
│ StatusBar                       │
├─────────────────────────────────┤
│                                 │
│  Timeline + ContextFlow         │  ← 被遮盖
│                        ┌────────┤
│                        │ Detail │  ← fixed 定位，覆盖内容
│                        │ Panel  │
│                        │        │
└────────────────────────┴────────┘
```

### 期望行为

```
┌─────────────────────────────────┐
│ Header                          │
├─────────────────────────────────┤
│ StatusBar                       │
├────────────────────────┬────────┤
│                        │        │
│  Timeline + ContextFlow│ Detail │  ← 主内容区挤压，两者并排
│  （宽度自适应）         │ Panel  │
│                        │        │
│                        │        │
└────────────────────────┴────────┘
```

---

## 2. 设计目标

1. 详情面板打开时，主内容区域向左挤压而非被遮盖
2. 保持动画过渡效果的流畅性
3. 用户始终能看到完整的时序图和对应的详情
4. 支持响应式布局（小屏幕时仍可使用遮盖模式）

---

## 3. 技术方案

### 3.1 布局结构调整

**Before:**
```tsx
<div className="app">
  <Header />
  <StatusBar />
  <main className="app-main">
    <Timeline />
    <ContextFlowChart />
  </main>
  <DetailPanel />  {/* fixed 定位，独立于文档流 */}
</div>
```

**After:**
```tsx
<div className="app">
  <Header />
  <StatusBar />
  <div className="app-body">  {/* 新增：水平 flex 容器 */}
    <main className="app-main">
      <Timeline />
      <ContextFlowChart />
    </main>
    <DetailPanel />  {/* 正常文档流，flex item */}
  </div>
</div>
```

### 3.2 CSS 样式

```css
/* 新增：水平布局容器 */
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 主内容区自适应宽度 */
.app-main {
  flex: 1;
  min-width: 0;  /* 允许收缩 */
  transition: flex 0.3s ease;
}

/* 详情面板：固定宽度，不再 fixed 定位 */
.detail-panel {
  width: 420px;
  flex-shrink: 0;
  /* 移除 position: fixed */
  /* 移除 top/right/bottom */
}

/* 详情面板关闭时隐藏 */
.detail-panel.hidden {
  width: 0;
  overflow: hidden;
}
```

### 3.3 动画过渡

使用 CSS transition 实现平滑的宽度变化：

```css
.app-main {
  transition: all 0.3s ease;
}

.detail-panel {
  transition: width 0.3s ease, opacity 0.2s ease;
}
```

### 3.4 移除遮罩层

由于不再是弹窗模式，遮罩层（overlay）不再需要：

```tsx
// Before
return (
  <>
    <div className="detail-overlay" onClick={handleClose} />
    <div className="detail-panel">...</div>
  </>
)

// After
return (
  <div className={`detail-panel ${selectedPhaseId ? '' : 'hidden'}`}>
    ...
  </div>
)
```

---

## 4. 响应式适配

### 4.1 大屏幕（>= 1024px）

- 使用挤压布局
- 详情面板宽度：420px
- 主内容区最小宽度：600px

### 4.2 小屏幕（< 1024px）

- 可选择保留遮盖模式
- 或使用全屏详情视图

```css
@media (max-width: 1023px) {
  .detail-panel {
    position: fixed;
    /* 恢复 fixed 定位 */
  }
}
```

---

## 5. 实现步骤

### Phase 1: 布局重构
- [ ] App.tsx 添加 `.app-body` 容器
- [ ] App.css 添加 `.app-body` 样式
- [ ] DetailPanel.css 移除 fixed 定位

### Phase 2: 组件调整
- [ ] DetailPanel.tsx 移除 overlay
- [ ] 添加 hidden 状态的条件渲染
- [ ] 添加关闭按钮样式调整

### Phase 3: 动画优化
- [ ] 添加 transition 过渡效果
- [ ] 优化展开/收起动画

### Phase 4: 响应式
- [ ] 添加媒体查询
- [ ] 测试不同屏幕尺寸

---

## 6. 文件变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `App.tsx` | 修改 | 添加 `.app-body` 容器 |
| `App.css` | 修改 | 添加 `.app-body` 样式 |
| `DetailPanel.tsx` | 修改 | 移除 overlay，调整渲染逻辑 |
| `DetailPanel.css` | 修改 | 移除 fixed 定位，添加 hidden 状态 |

---

## 7. 验收标准

1. 详情面板打开时，时序图完整可见（未被遮盖）
2. 展开/收起动画流畅（~300ms）
3. 点击时序节点后，对应节点与详情面板可同时查看
4. 关闭详情面板后，主内容区恢复全宽
5. TypeScript 编译无错误

---

## 8. 风险与考虑

### 8.1 时序图宽度变化
- 时序图可能需要横向滚动或缩放以适应较窄的空间
- 考虑添加 `overflow-x: auto`

### 8.2 ContextFlowChart 适配
- 流程图可能需要响应容器宽度变化
- 可能需要 ResizeObserver 监听容器尺寸

### 8.3 动画性能
- 使用 `transform` 或 `width` 动画
- 避免触发大量重排
