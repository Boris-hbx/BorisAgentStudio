# SPEC-019: 插件/扩展系统

> 作者: Boris Huai
> 起草日期: 2026-01-26
> 状态: 草稿

---

## 1. 概述

本规格定义 BorisAgentStudio 的插件系统设计，允许第三方扩展可视化和分析能力。

---

## 2. 设计目标

### 2.1 核心目标

- **可扩展性**: 支持自定义可视化和分析
- **隔离性**: 插件错误不影响主应用
- **安全性**: 限制插件权限
- **易用性**: 简单的插件开发体验

### 2.2 非目标

- 不支持后端插件 (v1.0)
- 不支持修改核心数据模型
- 不支持跨域数据访问

---

## 3. 插件类型

### 3.1 可视化插件

扩展 Session 数据的可视化方式：

| 类型 | 描述 | 示例 |
|------|------|------|
| 视图插件 | 新的可视化视图 | 火焰图、网络图 |
| 面板插件 | 详情面板扩展 | 自定义工具详情 |
| 图表插件 | 统计图表 | 自定义图表类型 |

### 3.2 分析插件

扩展数据分析能力：

| 类型 | 描述 | 示例 |
|------|------|------|
| 过滤器插件 | 自定义过滤逻辑 | 复杂查询条件 |
| 统计插件 | 自定义统计指标 | 领域特定指标 |
| 导出插件 | 自定义导出格式 | PDF 报告 |

### 3.3 主题插件

自定义视觉风格：

| 类型 | 描述 |
|------|------|
| 颜色主题 | 自定义配色方案 |
| 图标主题 | 自定义图标集 |

---

## 4. 插件 API

### 4.1 插件清单 (manifest.json)

```json
{
  "name": "flame-graph-view",
  "version": "1.0.0",
  "displayName": "火焰图视图",
  "description": "以火焰图形式展示工具调用耗时",
  "author": "Your Name",
  "type": "visualization",
  "main": "index.js",
  "permissions": [
    "read:session",
    "read:toolCalls"
  ],
  "contributes": {
    "views": [
      {
        "id": "flame-graph",
        "name": "火焰图",
        "icon": "flame.svg"
      }
    ]
  }
}
```

### 4.2 插件生命周期

```typescript
interface Plugin {
  // 插件激活时调用
  activate(context: PluginContext): void

  // 插件停用时调用
  deactivate(): void
}

interface PluginContext {
  // 订阅事件
  subscriptions: Disposable[]

  // 访问 Session 数据
  sessions: SessionAPI

  // 注册视图
  registerView(view: ViewContribution): Disposable

  // 注册命令
  registerCommand(command: string, handler: Function): Disposable

  // 显示通知
  showMessage(message: string, type?: 'info' | 'warn' | 'error'): void
}
```

### 4.3 视图插件 API

```typescript
interface ViewContribution {
  id: string
  name: string
  icon?: string

  // 渲染视图
  render(container: HTMLElement, session: AgentSession): void

  // 视图销毁
  dispose?(): void
}

// 示例：火焰图插件
class FlameGraphView implements ViewContribution {
  id = 'flame-graph'
  name = '火焰图'

  render(container: HTMLElement, session: AgentSession) {
    const data = this.transformToFlameGraph(session.tool_calls)
    const chart = new FlameGraph(container)
    chart.render(data)
  }

  private transformToFlameGraph(toolCalls: ToolCall[]) {
    // 转换为火焰图数据格式
  }
}
```

### 4.4 Session API

```typescript
interface SessionAPI {
  // 获取当前 Session
  getCurrentSession(): AgentSession | null

  // 获取所有 Sessions
  getAllSessions(): AgentSession[]

  // 监听 Session 变化
  onSessionChange(callback: (session: AgentSession) => void): Disposable

  // 获取工具调用
  getToolCalls(sessionId: string): ToolCall[]

  // 获取阶段标注
  getPhaseAnnotations(sessionId: string): PhaseAnnotation[]
}
```

---

## 5. 插件沙箱

### 5.1 隔离机制

使用 iframe 或 Web Worker 隔离插件代码：

```typescript
class PluginSandbox {
  private iframe: HTMLIFrameElement

  constructor(plugin: PluginManifest) {
    this.iframe = document.createElement('iframe')
    this.iframe.sandbox.add('allow-scripts')
    this.iframe.src = 'about:blank'
  }

  // 发送消息给插件
  postMessage(message: PluginMessage) {
    this.iframe.contentWindow?.postMessage(message, '*')
  }

  // 接收插件消息
  onMessage(handler: (message: PluginMessage) => void) {
    window.addEventListener('message', (event) => {
      if (event.source === this.iframe.contentWindow) {
        handler(event.data)
      }
    })
  }
}
```

### 5.2 权限控制

```typescript
interface PluginPermissions {
  // 读取权限
  'read:session': boolean
  'read:toolCalls': boolean
  'read:phases': boolean

  // UI 权限
  'ui:view': boolean
  'ui:panel': boolean
  'ui:command': boolean

  // 系统权限
  'system:clipboard': boolean
  'system:download': boolean
}

function checkPermission(
  plugin: PluginManifest,
  permission: keyof PluginPermissions
): boolean {
  return plugin.permissions.includes(permission)
}
```

---

## 6. 插件管理

### 6.1 插件加载

```typescript
class PluginManager {
  private plugins: Map<string, LoadedPlugin> = new Map()

  async loadPlugin(manifest: PluginManifest) {
    // 验证清单
    validateManifest(manifest)

    // 创建沙箱
    const sandbox = new PluginSandbox(manifest)

    // 加载代码
    const code = await fetch(manifest.main).then(r => r.text())
    sandbox.load(code)

    // 激活插件
    const context = this.createContext(manifest)
    sandbox.postMessage({ type: 'activate', context })

    this.plugins.set(manifest.name, { manifest, sandbox })
  }

  async unloadPlugin(name: string) {
    const plugin = this.plugins.get(name)
    if (plugin) {
      plugin.sandbox.postMessage({ type: 'deactivate' })
      plugin.sandbox.destroy()
      this.plugins.delete(name)
    }
  }
}
```

### 6.2 插件市场 (未来)

```
┌─────────────────────────────────────────────────────────┐
│ 插件市场                                         [搜索] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 推荐插件                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ 🔥 火焰图   │ │ 📊 高级图表 │ │ 📄 PDF导出  │        │
│ │ ★★★★☆ 4.2 │ │ ★★★★★ 4.8 │ │ ★★★★☆ 4.1 │        │
│ │ [安装]      │ │ [已安装]    │ │ [安装]      │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                         │
│ 已安装 (2)                                              │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 📊 高级图表 v1.2.0              [禁用] [卸载]     │  │
│ │ 🌈 暗色主题 v2.0.1              [禁用] [卸载]     │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. 插件开发

### 7.1 开发工具

```bash
# 创建插件项目
npx create-bas-plugin my-plugin

# 开发模式
npm run dev

# 构建
npm run build

# 发布
npm run publish
```

### 7.2 项目结构

```
my-plugin/
├── manifest.json
├── src/
│   └── index.ts
├── assets/
│   └── icon.svg
├── package.json
└── tsconfig.json
```

### 7.3 示例插件

```typescript
// src/index.ts
import { Plugin, PluginContext, ViewContribution } from '@bas/plugin-api'

export function activate(context: PluginContext) {
  // 注册视图
  const view: ViewContribution = {
    id: 'my-custom-view',
    name: '自定义视图',

    render(container, session) {
      container.innerHTML = `
        <div class="my-view">
          <h2>${session.task_title}</h2>
          <p>工具调用: ${session.tool_calls.length}</p>
        </div>
      `
    }
  }

  context.subscriptions.push(
    context.registerView(view)
  )

  // 注册命令
  context.subscriptions.push(
    context.registerCommand('myPlugin.sayHello', () => {
      context.showMessage('Hello from my plugin!')
    })
  )
}

export function deactivate() {
  // 清理资源
}
```

---

## 8. 实现计划

### Phase 1: 基础架构
- [ ] 插件清单格式
- [ ] 插件加载器
- [ ] 基本沙箱

### Phase 2: API 实现
- [ ] Session API
- [ ] 视图注册
- [ ] 命令注册

### Phase 3: 开发工具
- [ ] CLI 工具
- [ ] 开发模式
- [ ] 文档

### Phase 4: 插件市场 (未来)
- [ ] 插件仓库
- [ ] 版本管理
- [ ] 评分系统

---

## 9. 安全考虑

### 9.1 代码审查

- 插件代码必须开源
- 社区审查机制
- 自动安全扫描

### 9.2 权限最小化

- 默认最小权限
- 明确权限请求
- 用户确认授权

### 9.3 运行时保护

- 资源限制 (CPU/内存)
- API 调用频率限制
- 错误隔离

---

## 10. 相关文档

- VS Code Extension API (参考)
- Chrome Extension API (参考)
