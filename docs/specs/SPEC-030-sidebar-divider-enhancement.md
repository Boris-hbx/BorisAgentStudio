# SPEC-030: 侧边栏分隔线与宠物优化

> 作者: Boris Huai
> 起草日期: 2026-01-27
> 状态: 已完成

## 概述

优化侧边栏的视觉呈现：移除冗余折叠按钮、添加紫色分隔线、调整小宠物位置和状态效果。

## 问题陈述

基于用户截图反馈：

1. **折叠按钮冗余**：底部 `>>` 按钮与小宠物功能重复
2. **左侧栏高度不足**：未贯穿全屏
3. **分隔线颜色不协调**：缺少与小宠物的视觉呼应
4. **小宠物位置不对**：被线条穿透，而非趴在线条上
5. **缺少动态效果**：折叠状态应有呼吸效果和透明度变化

## 目标 (DoD)

1. 移除左侧栏底部的 `>>` 折叠按钮
2. 左侧栏高度 100vh，贯穿全屏
3. 添加浅紫色分隔线，与小宠物配色呼应
4. 小宠物位置调整为"趴在"紫色线条上
5. 折叠时紫色线条有呼吸动画效果
6. 折叠时小宠物半透明 (opacity: 0.4)

## 非目标

- 不修改小宠物的点击交互逻辑
- 不修改左侧栏导航图标
- 不修改 Timeline 内容

## 技术方案

### 1. 移除折叠按钮

**文件**: `Sidebar.tsx`

删除 `<button className="sidebar-toggle">` 元素。

### 2. 左侧栏全屏高度

**文件**: `Sidebar.css`

```css
.sidebar {
  height: 100vh;
  border-right: none;
  position: relative;
}
```

### 3. 紫色分隔线

**新元素**: `.sidebar-divider-line`

```css
.sidebar-divider-line {
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(139, 92, 246, 0.3) 0%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(139, 92, 246, 0.3) 100%
  );
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
}
```

### 4. 呼吸动画（折叠状态）

```css
.sidebar.collapsed .sidebar-divider-line {
  animation: lineBreathing 4s ease-in-out infinite;
}

@keyframes lineBreathing {
  0%, 100% {
    opacity: 0.5;
    box-shadow: 0 0 6px rgba(139, 92, 246, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
  }
}
```

### 5. 小宠物位置调整

**文件**: `SidebarPet.tsx`

```typescript
// 调整为趴在线条左侧
const leftPosition = collapsed
  ? CONFIG.SIDEBAR_WIDTH_COLLAPSED - CONFIG.WIDTH - 1
  : CONFIG.SIDEBAR_WIDTH_EXPANDED - CONFIG.WIDTH - 1
```

### 6. 小宠物透明度

**文件**: `SidebarPet.css`

```css
.sidebar-pet.sidebar-collapsed {
  opacity: 0.4;
}

.sidebar-pet.sidebar-collapsed:hover {
  opacity: 0.8;
}
```

## 文件变更

| 文件 | 变更 |
|------|------|
| `Sidebar/Sidebar.tsx` | 删除折叠按钮，添加分隔线元素 |
| `Sidebar/Sidebar.css` | 100vh 高度，紫色分隔线样式，呼吸动画 |
| `Sidebar/SidebarPet.tsx` | 位置调整，添加 collapsed 类 |
| `Sidebar/SidebarPet.css` | 折叠状态透明度样式 |

## 验证

- TypeScript 编译通过
- Vite 构建成功 (681ms)
- 视觉效果符合用户期望

## 决策记录

| 决策 | 理由 | 替代方案 |
|------|------|----------|
| 使用 opacity 而非 visibility | 平滑过渡动画 | visibility (无过渡) |
| 呼吸动画 4s 周期 | 缓慢不分心 | 2s (过快) |
| 宠物透明度 0.4 | 可见但表达休眠 | 0.5 (太亮), 0.3 (太淡) |
| 分隔线渐变 | 顶部底部渐隐更自然 | 纯色 (生硬) |
