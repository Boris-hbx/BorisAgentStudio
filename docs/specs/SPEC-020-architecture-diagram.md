# SPEC-020: 架构图可视化

> 作者: Boris Huai
> 起草日期: 2026-01-26
> 状态: 实施中

---

## 设计目标

为 BorisAgentStudio 提供可交互的系统架构图，帮助开发者和用户：

1. **理解系统结构**：清晰展示四层架构（规范层、前端层、后端层、数据层）
2. **探索组件关系**：可视化组件间的依赖和数据流向
3. **快速定位**：通过交互快速定位到具体文件和模块

---

## 产出物

| 文件 | 用途 |
|------|------|
| `docs/architecture/index.html` | 主页面 |
| `docs/architecture/architecture.css` | 样式定义 |
| `docs/architecture/architecture.js` | D3.js 可视化逻辑 |
| `docs/architecture/data/architecture.json` | 架构数据 |

---

## 技术方案

### 技术栈

- **HTML5 + CSS3**：页面结构和样式
- **D3.js v7**：可视化渲染（通过 CDN 加载）
- **无需构建**：直接用浏览器打开即可查看

### 架构分层

```
┌─────────────────────────────────────────────────────────┐
│                    规范层 (Specification)                │
│  CLAUDE.md | specs/ | standards/ | rules/ | skills/     │
├─────────────────────────────────────────────────────────┤
│                    前端层 (Frontend)                     │
│  React 组件: Timeline | Detail | Layout | Context | ... │
│  状态管理: Zustand | 类型: TypeScript                   │
├─────────────────────────────────────────────────────────┤
│                    后端层 (Backend)                      │
│  Rust Axum: API | WebSocket | Models | Services          │
├─────────────────────────────────────────────────────────┤
│                    数据层 (Data)                         │
│  data/sessions/ | capability-snapshots/ | PrtSc/         │
└─────────────────────────────────────────────────────────┘
```

---

## 数据模型

### 节点 (Node)

```typescript
interface ArchitectureNode {
  id: string;           // 唯一标识
  name: string;         // 显示名称
  layer: 'spec' | 'frontend' | 'backend' | 'data';
  type: 'layer' | 'module' | 'component' | 'file';
  description?: string; // 详细描述
  path?: string;        // 文件路径
  children?: string[];  // 子节点 ID 列表
}
```

### 连接 (Link)

```typescript
interface ArchitectureLink {
  source: string;       // 源节点 ID
  target: string;       // 目标节点 ID
  type: 'contains' | 'uses' | 'data_flow' | 'api_call';
  label?: string;       // 连接标签
}
```

### 层级类型

| 层级 | 颜色 | 说明 |
|------|------|------|
| spec | #a855f7 (紫色) | 规范与约定 |
| frontend | #3b82f6 (蓝色) | 前端组件 |
| backend | #f97316 (橙色) | 后端服务 |
| data | #22c55e (绿色) | 数据存储 |

---

## 交互设计

### 基础交互

| 交互 | 行为 |
|------|------|
| 鼠标滚轮 | 缩放视图 |
| 拖拽画布 | 平移视图 |
| 悬停节点 | 显示详情提示 |
| 点击节点 | 展开/折叠子节点 |

### 高亮联动

- **悬停节点**：高亮该节点的所有连接
- **点击层级**：聚焦该层级的所有节点

### 控制按钮

| 按钮 | 功能 |
|------|------|
| 重置视图 | 恢复初始缩放和位置 |
| 展开全部 | 展开所有可折叠节点 |
| 折叠全部 | 折叠所有展开的节点 |

---

## 视觉设计

### 配色方案

遵循项目现有配色（暗色主题）：

```css
/* 背景 */
--bg-primary: #0d1117;
--bg-secondary: #161b22;
--bg-tertiary: #21262d;

/* 文字 */
--text-primary: #c9d1d9;
--text-secondary: #8b949e;

/* 边框 */
--border-default: #30363d;

/* 层级颜色 */
--layer-spec: #a855f7;
--layer-frontend: #3b82f6;
--layer-backend: #f97316;
--layer-data: #22c55e;
```

### 节点样式

| 类型 | 形状 | 大小 |
|------|------|------|
| layer | 圆角矩形 | 宽度自适应，高度固定 |
| module | 圆角矩形 | 中等 |
| component | 小圆角矩形 | 较小 |
| file | 圆形 | 最小 |

### 连接线样式

| 类型 | 样式 |
|------|------|
| contains | 虚线 |
| uses | 实线 |
| data_flow | 带箭头实线 |
| api_call | 带箭头虚线 |

---

## 布局算法

采用**分层布局**：

1. 四个层级按垂直顺序排列
2. 同层内节点水平分布
3. 使用 D3.js 力导向微调节点位置，避免重叠

---

## 验证标准

1. **可访问性**：直接用浏览器打开 `index.html` 即可查看
2. **完整性**：四层架构全部展示
3. **交互性**：缩放、平移、悬停提示正常工作
4. **准确性**：组件关系正确反映实际代码结构

---

## 相关文档

- [SPEC-001: 项目总览](./SPEC-001-project-overview.md)
- [SPEC-002: 可视化界面设计](./SPEC-002-visualization-design.md)
- [CLAUDE.md](../../CLAUDE.md)
