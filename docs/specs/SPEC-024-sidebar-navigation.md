# SPEC-024: 左侧导航栏（Sidebar）

> 作者: Boris Huai
> 起草日期: 2026-01-27
> 状态: 已完成

---

## 1. 问题陈述 (Why)

当前 BorisAgentStudio 主页布局为：Header + 主内容区（Timeline + 右侧详情面板）。

**问题**：
1. 所有功能都挤在主内容区，未来功能扩展会导致布局混乱
2. Session 选择器在 Header 里，功能发现性差
3. 缺乏统一的导航结构，用户不知道有哪些功能可用
4. 未来要增加更多 Claude Code 开发尝试模块，没有地方放

**为什么现在需要解决**：
- 项目正在快速演进，功能模块越来越多
- 需要建立可扩展的导航架构，避免后期大重构

## 2. 目标与成功标准 (DoD)

- [x] 新增可折叠的左侧栏（Sidebar）组件
- [x] Sidebar 支持多个功能模块，首个模块为 "Agent 展示"
- [x] "Agent 展示" 模块包含 Session 列表、搜索和过滤功能
- [x] Sidebar 可折叠/展开，默认展开状态
- [x] 折叠后仅显示图标，hover 显示 tooltip
- [x] Sidebar 宽度合理（展开 280px，折叠 56px）
- [x] 响应式：窄屏自动折叠
- [x] 视觉风格与现有设计一致（深色主题、紫色点缀）

## 3. 非目标 (Out of Scope)

- 不做其他功能模块的具体实现（只预留入口）
- 不做路由系统（单页应用）
- 不做 Sidebar 配置持久化（刷新重置）
- 不做移动端适配

## 4. 技术方案 (How)

### 4.1 整体布局

```
┌──────────────────────────────────────────────────────────────────┐
│  Header                                                          │
├────────┬─────────────────────────────────────────────────────────┤
│        │  StatusBar                                              │
│  S     ├─────────────────────────────────────────────┬───────────┤
│  I     │                                             │           │
│  D     │  Timeline (main content)                    │  Detail   │
│  E     │                                             │  Panel    │
│  B     │                                             │           │
│  A     │                                             │           │
│  R     │                                             │           │
└────────┴─────────────────────────────────────────────┴───────────┘
```

### 4.2 组件结构

```
frontend/src/components/Sidebar/
├── index.ts              # 导出
├── Sidebar.tsx           # 主容器（折叠状态、模块切换）
├── Sidebar.css           # 样式
├── SidebarItem.tsx       # 单个导航项
└── modules/
    └── AgentExplorer/    # Agent 展示模块
        ├── index.ts
        ├── AgentExplorer.tsx
        └── AgentExplorer.css
```

### 4.3 状态设计

```typescript
interface SidebarState {
  collapsed: boolean       // 折叠状态
  activeModule: string     // 当前激活的模块 ID
  userOverride: boolean    // 用户手动操作后不再自动响应窗口变化
}

interface SidebarModule {
  id: string
  icon: string
  label: string
  render: (collapsed: boolean) => ReactNode
  disabled?: boolean
}
```

### 4.4 预设模块

| 模块 ID | 图标 | 名称 | 状态 |
|---------|------|------|------|
| `agent-explorer` | 🤖 | Agent 展示 | 已实现 |
| `tools` | 🔧 | 工具箱 | 占位 |
| `docs` | 📚 | 文档 | 占位 |
| `settings` | ⚙️ | 设置 | 占位 |

## 5. 交互设计 (UX)

### 5.1 折叠/展开

- **展开状态**：280px 宽，显示图标+文字+内容区
- **折叠状态**：56px 宽，仅显示图标
- **折叠按钮**：底部 «/» 箭头
- **Tooltip**：折叠时 hover 显示模块名

### 5.2 模块切换

- 点击导航图标切换模块
- 当前模块左边框紫色高亮
- 禁用的模块显示为半透明

### 5.3 响应式

- 窗口宽度 < 1200px：自动折叠
- 用户手动展开后：不再自动折叠（userOverride）
- 刷新页面：重置为自动响应

### 5.4 动效

- 折叠/展开：`transition: width 0.2s ease`
- 高亮切换：`transition: all 0.15s ease`

## 6. 风险清单与应对

| 风险 | 类型 | 优先级 | 应对措施 | 决策理由 |
|------|------|--------|----------|----------|
| 状态同步 | 技术 | P1 | 沿用 zustand store | 已验证可靠 |
| 响应式冲突 | 技术 | P2 | userOverride 标记 | 用户意图优先 |
| 性能 | 技术 | P2 | 纯 CSS transition | 避免 JS 动画 |
| 折叠提示不明显 | 体验 | P2 | «/» 箭头图标 | 直观且节省空间 |

## 7. 决策记录 (Decision Log)

| 日期 | 决策 | 理由 | 参与角色 |
|------|------|------|----------|
| 2026-01-27 | Sidebar 宽度 280px/56px | 280px 足够展示 Session 卡片，56px 可容纳图标 | Architect |
| 2026-01-27 | 使用 emoji 图标 | 与项目风格一致，易于辨识 | DA |
| 2026-01-27 | userOverride 机制 | 用户手动操作后不再自动响应，避免与用户意图冲突 | Challenger, Architect |
| 2026-01-27 | 从 Header 移除 Session 选择器 | 功能整合到 AgentExplorer，避免重复 | PO |

---

## 实现文件

### 新增

- `frontend/src/components/Sidebar/index.ts`
- `frontend/src/components/Sidebar/Sidebar.tsx`
- `frontend/src/components/Sidebar/Sidebar.css`
- `frontend/src/components/Sidebar/SidebarItem.tsx`
- `frontend/src/components/Sidebar/modules/AgentExplorer/index.ts`
- `frontend/src/components/Sidebar/modules/AgentExplorer/AgentExplorer.tsx`
- `frontend/src/components/Sidebar/modules/AgentExplorer/AgentExplorer.css`

### 修改

- `frontend/src/App.tsx` - 集成 Sidebar
- `frontend/src/App.css` - 布局调整
- `frontend/src/components/Layout/Header.tsx` - 移除 Session 选择器
