# SPEC-012: Header Particles (顶栏交互粒子)

> 作者: Boris Huai
> 起草日期: 2026-01-25
> 状态: 实施中

---

## 1. 背景与动机

基于 SPEC-006 定义的可交互粒子系统，本 Spec 详细规划将粒子效果集成到 Header 顶栏区域的具体方案。

目标是为 Boris Agent Studio 增添视觉趣味性，同时保持专业感和良好的用户体验。

---

## 2. 当前布局分析

### 2.1 Header 组件结构

```
┌─────────────────────────────────────────────────────────────────┐
│  [Brand]          [Actions]                       [Session]     │
│  Boris Agent      导入 Session                    选择 Session  │
│  Studio                                           session-id    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 CSS 关键属性

| 属性 | 值 | 说明 |
|------|-----|------|
| display | flex | 水平布局 |
| padding | 0.75rem 1.5rem | 上下12px，左右24px |
| background | var(--bg-secondary) | 深色背景 (#161b22) |
| border-bottom | 1px solid var(--border-default) | 底部分隔线 |
| position | relative | 相对定位 |

### 2.3 尺寸估算

- **Header 高度**: ~48px（padding 24px + 内容 ~24px）
- **宽度**: 100vw（全屏宽度）
- **可用绘制区域**: 48px × viewport-width

---

## 3. 集成方案

### 3.1 Canvas 放置策略

```
Header (position: relative)
├── ParticleCanvas (position: absolute, z-index: 0, pointer-events: none)
├── header-brand (z-index: 1)
├── header-actions (z-index: 1)
└── header-session (z-index: 1)
```

**关键点**:
1. Canvas 作为 Header 的**第一个子元素**
2. 使用 `position: absolute` 覆盖整个 Header
3. `z-index: 0` 确保在其他内容下方
4. `pointer-events: none` 不阻挡 UI 交互

### 3.2 Canvas 样式

```css
.header-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
```

### 3.3 内容层样式调整

```css
.header-brand,
.header-actions,
.header-session {
  position: relative;
  z-index: 1;
}
```

---

## 4. 粒子行为定制

### 4.1 与通用粒子系统的差异

| 参数 | SPEC-006 默认值 | Header 推荐值 | 原因 |
|------|----------------|--------------|------|
| particleCount | 8 | 4 | 区域小，性能优先 |
| repelRadius | 180px | 120px | 更紧凑的交互范围 |
| repelForce | 12 | 8 | 柔和的排斥效果 |
| maxSpeed | 10 | 6 | 缓慢优雅的移动 |
| tailLength | 5 | 3 | 短尾减少视觉干扰 |

### 4.2 移动模式

由于 Header 是**窄长条形**区域：
- 主方向: **水平** (主要 X 轴运动)
- 垂直运动: 限制在 ±10px 范围
- 目标角度: 集中在 0°/180° 附近（左右游动）

### 4.3 边界处理

```
左边界: padding-left (24px)
右边界: width - padding-right (24px)
上边界: padding-top (12px)
下边界: height - padding-bottom (12px)
```

粒子在到达边界时轻柔反弹，避免穿透 UI 元素区域。

---

## 5. 视觉设计

### 5.1 配色方案

使用与主题协调的半透明色：

```javascript
const HEADER_PARTICLE_COLORS = [
  'rgba(88, 166, 255, 0.6)',   // accent blue
  'rgba(249, 115, 22, 0.5)',   // orange
  'rgba(168, 85, 247, 0.5)',   // purple
  'rgba(34, 197, 94, 0.5)',    // green
]
```

**透明度设置**:
- 粒子主体: 50-60% 透明度
- 尾巴: 从 40% 渐变到 0%
- 目的: 不喧宾夺主，作为背景装饰

### 5.2 粒子尺寸

```javascript
const PARTICLE_RADIUS = {
  min: 4,
  max: 8,
}
```

- 小粒子（4-6px）: 移动较快，尾巴较长
- 大粒子（6-8px）: 移动较慢，更稳重

### 5.3 发光效果

```javascript
// 可选：添加柔和的发光
ctx.shadowBlur = 8
ctx.shadowColor = particle.color
```

---

## 6. 交互行为

### 6.1 鼠标响应

- 鼠标进入 Header 区域时激活排斥
- 排斥力使粒子向两侧逃开
- 鼠标离开后粒子恢复自主游动

### 6.2 特殊处理

```javascript
// 检测鼠标是否在 Header 内
const isMouseInHeader = mouseY >= 0 && mouseY <= headerHeight
if (!isMouseInHeader) {
  // 不施加排斥力
}
```

### 6.3 爆裂机制

在窄长区域内，粒子更容易被困在角落。适当调整：
- 被困阈值: 从 45 帧提高到 60 帧（给更多逃脱机会）
- 颤抖幅度: 从 3px 降低到 2px（更微妙）
- 碎片数量: 从 3 个降低到 2 个

---

## 7. 性能优化

### 7.1 渲染优化

1. **requestAnimationFrame 节流**: 目标 60fps，但可降级到 30fps
2. **可见性检测**: `document.hidden` 时暂停动画
3. **ResizeObserver**: 响应式更新 Canvas 尺寸

### 7.2 内存管理

```javascript
const MAX_TRAIL_POINTS = 20  // 限制轨迹点数量
const MAX_FRAGMENTS = 6       // 限制碎片总数
```

### 7.3 可选禁用

```javascript
// 通过配置或媒体查询禁用
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // 禁用粒子动画
}
```

---

## 8. 文件结构

```
frontend/src/
├── components/
│   └── Layout/
│       ├── Header.tsx          # 修改：添加 ParticleCanvas
│       ├── Header.css          # 修改：添加 z-index 调整
│       └── HeaderParticles.tsx # 新增：Header 专用粒子组件
├── lib/
│   └── particles/              # 复用 SPEC-006 的粒子引擎
│       ├── engine.ts
│       ├── particle.ts
│       ├── renderer.ts
│       └── config.ts
```

---

## 9. 实现步骤

### Phase 1: 基础集成
- [ ] 创建 HeaderParticles.tsx 组件
- [ ] 修改 Header.tsx 集成 Canvas
- [ ] 调整 CSS z-index 层级

### Phase 2: 粒子引擎
- [ ] 实现基础物理引擎（复用 SPEC-006）
- [ ] 适配 Header 特定参数
- [ ] 实现水平运动约束

### Phase 3: 交互与特效
- [ ] 鼠标排斥交互
- [ ] 拖尾渲染
- [ ] 爆裂重组（简化版）

### Phase 4: 优化与打磨
- [ ] 性能优化
- [ ] 无障碍支持（reduced-motion）
- [ ] 参数微调

---

## 10. 验收标准

1. 粒子在 Header 区域内自然水平游动
2. 不遮挡任何 UI 元素（品牌名、按钮、选择器）
3. 鼠标靠近时粒子平滑逃开
4. 所有按钮和选择器可正常点击
5. 60fps 流畅运行（4 个粒子）
6. 支持 `prefers-reduced-motion` 禁用
7. 窗口缩放时 Canvas 正确调整尺寸

---

## 11. 配置接口

```typescript
interface HeaderParticlesConfig {
  enabled: boolean
  particleCount: number
  colors: string[]
  repelRadius: number
  repelForce: number
  maxSpeed: number
  friction: number
  tailLength: number
}

const DEFAULT_CONFIG: HeaderParticlesConfig = {
  enabled: true,
  particleCount: 4,
  colors: [
    'rgba(88, 166, 255, 0.6)',
    'rgba(249, 115, 22, 0.5)',
    'rgba(168, 85, 247, 0.5)',
    'rgba(34, 197, 94, 0.5)',
  ],
  repelRadius: 120,
  repelForce: 8,
  maxSpeed: 6,
  friction: 0.97,
  tailLength: 3,
}
```

---

## 12. 依赖关系

- **前置**: SPEC-006 粒子引擎设计
- **影响**: Header.tsx 组件结构

---

## 13. 风险与备选

| 风险 | 影响 | 备选方案 |
|------|------|---------|
| 性能问题 | 低端设备卡顿 | 提供禁用开关 |
| 视觉干扰 | 分散用户注意力 | 降低透明度或减少数量 |
| 边界冲突 | 粒子遮挡 UI | 调整安全边距 |

---

## 14. 未来扩展

1. **主题联动**: 根据当前 session 状态改变粒子颜色
2. **活动指示**: 数据加载时粒子加速运动
3. **节日模式**: 特殊节日更换粒子样式
