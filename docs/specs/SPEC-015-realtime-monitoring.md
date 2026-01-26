# SPEC-015: 实时监控模式

> 作者: Boris Huai
> 起草日期: 2026-01-26
> 状态: 草稿

---

## 1. 概述

本规格定义实时监控功能的设计，使用户能够实时观察正在执行的 Agent 行为。

---

## 2. 功能需求

### 2.1 核心功能

| 功能 | 描述 |
|------|------|
| 实时工具调用 | 实时显示正在执行的工具调用 |
| 进度指示 | 显示当前执行进度和状态 |
| 实时输出 | 流式展示工具调用输出 |
| 执行控制 | 暂停/恢复/取消执行 (未来) |

### 2.2 监控视图

| 视图 | 描述 |
|------|------|
| 流式视图 | 按时间顺序展示工具调用流 |
| 阶段视图 | 按阶段分组展示 |
| 统计视图 | 实时统计信息 |

---

## 3. 架构设计

### 3.1 数据流

```
┌─────────────┐    WebSocket    ┌─────────────┐
│   Agent     │ ───────────────▶│   Backend   │
│  (外部)     │    事件推送     │   Server    │
└─────────────┘                 └──────┬──────┘
                                       │
                                       │ WebSocket
                                       ▼
                                ┌─────────────┐
                                │   Frontend  │
                                │   Client    │
                                └─────────────┘
```

### 3.2 WebSocket 协议

#### 连接

```typescript
const ws = new WebSocket('ws://localhost:8080/ws')

// 订阅 Session
ws.send(JSON.stringify({
  type: 'subscribe',
  payload: { session_id: 'current' }
}))
```

#### 事件类型

| 事件 | 描述 | Payload |
|------|------|---------|
| `session:started` | Session 开始 | `{ session_id, task_title, user_prompt }` |
| `tool:started` | 工具调用开始 | `{ call_id, tool_name, input }` |
| `tool:progress` | 工具调用进度 | `{ call_id, progress, message }` |
| `tool:output` | 工具调用输出 (流式) | `{ call_id, chunk }` |
| `tool:completed` | 工具调用完成 | `{ call_id, output, duration_ms }` |
| `tool:failed` | 工具调用失败 | `{ call_id, error }` |
| `phase:changed` | 阶段变化 | `{ phase_type, annotation }` |
| `session:completed` | Session 完成 | `{ status, summary }` |

---

## 4. UI 设计

### 4.1 监控模式入口

```
┌─────────────────────────────────────────────────────────┐
│ BorisAgentStudio                    [历史] [⚡ 实时监控] │
└─────────────────────────────────────────────────────────┘
```

### 4.2 实时监控界面

```
┌─────────────────────────────────────────────────────────┐
│ ⚡ 实时监控                              [连接状态: 🟢] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 当前任务: 实现 Header 粒子效果                           │
│ 状态: 执行中  |  已用时: 2m 35s  |  工具调用: 8          │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ● Read                                    完成 ✓   │ │
│ │   frontend/src/components/Header.tsx      1.2s     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ● Write                                   执行中 ⟳ │ │
│ │   frontend/src/components/HeaderParticles.tsx      │ │
│ │   ████████████░░░░░░░░ 60%                         │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ○ Edit                                    等待中   │ │
│ │   (排队中)                                         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [展开输出 ▼]                                            │
└─────────────────────────────────────────────────────────┘
```

### 4.3 实时输出面板

```
┌─────────────────────────────────────────────────────────┐
│ 工具输出                                     [自动滚动] │
├─────────────────────────────────────────────────────────┤
│ [10:35:21] Read: 读取文件 Header.tsx                    │
│ [10:35:22] Read: 成功，共 127 行                        │
│ [10:35:23] Write: 创建文件 HeaderParticles.tsx          │
│ [10:35:24] Write: 写入第 1-50 行...                     │
│ [10:35:25] Write: 写入第 51-100 行...                   │
│ ▌                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 组件设计

### 5.1 组件结构

```
RealtimeMonitor/
├── RealtimeMonitor.tsx       # 主监控组件
├── RealtimeMonitor.css
├── ConnectionStatus.tsx      # 连接状态指示
├── LiveToolCall.tsx          # 实时工具调用卡片
├── LiveProgress.tsx          # 进度条
├── LiveOutput.tsx            # 实时输出日志
├── LiveStats.tsx             # 实时统计
└── index.ts
```

### 5.2 状态管理

```typescript
interface RealtimeState {
  // 连接状态
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'

  // 当前 Session
  currentSession: {
    session_id: string
    task_title: string
    user_prompt: string
    started_at: string
  } | null

  // 工具调用列表
  toolCalls: LiveToolCall[]

  // 当前阶段
  currentPhase: PhaseType | null

  // 统计信息
  stats: {
    elapsed_ms: number
    tool_calls_count: number
    completed_count: number
    failed_count: number
  }

  // 输出日志
  outputLogs: LogEntry[]
}

interface LiveToolCall {
  call_id: string
  tool_name: string
  tool_category: ToolCategory
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at?: string
  ended_at?: string
  duration_ms?: number
  progress?: number
  input?: ToolInput
  output?: ToolOutput
  error?: string
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  tool_call_id?: string
}
```

---

## 6. WebSocket 客户端

### 6.1 连接管理

```typescript
// services/websocket.ts
export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<Function>> = new Map()

  connect(url: string): void {
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.emit('connected')
    }

    this.ws.onclose = () => {
      this.emit('disconnected')
      this.attemptReconnect(url)
    }

    this.ws.onerror = (error) => {
      this.emit('error', error)
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.emit(message.type, message.payload)
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

      setTimeout(() => {
        this.emit('reconnecting', this.reconnectAttempts)
        this.connect(url)
      }, delay)
    } else {
      this.emit('reconnect_failed')
    }
  }

  subscribe(sessionId: string): void {
    this.send({ type: 'subscribe', payload: { session_id: sessionId } })
  }

  unsubscribe(sessionId: string): void {
    this.send({ type: 'unsubscribe', payload: { session_id: sessionId } })
  }

  private send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data))
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }
}
```

### 6.2 React Hook

```typescript
// hooks/useRealtimeMonitor.ts
export function useRealtimeMonitor() {
  const [state, dispatch] = useReducer(realtimeReducer, initialState)
  const wsRef = useRef<WebSocketClient | null>(null)

  useEffect(() => {
    const ws = new WebSocketClient()
    wsRef.current = ws

    ws.on('connected', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' })
    })

    ws.on('disconnected', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' })
    })

    ws.on('session:started', (payload) => {
      dispatch({ type: 'SESSION_STARTED', payload })
    })

    ws.on('tool:started', (payload) => {
      dispatch({ type: 'TOOL_STARTED', payload })
    })

    ws.on('tool:progress', (payload) => {
      dispatch({ type: 'TOOL_PROGRESS', payload })
    })

    ws.on('tool:completed', (payload) => {
      dispatch({ type: 'TOOL_COMPLETED', payload })
    })

    ws.on('tool:failed', (payload) => {
      dispatch({ type: 'TOOL_FAILED', payload })
    })

    ws.on('session:completed', (payload) => {
      dispatch({ type: 'SESSION_COMPLETED', payload })
    })

    ws.connect('ws://localhost:8080/ws')
    ws.subscribe('current')

    return () => {
      ws.disconnect()
    }
  }, [])

  return {
    ...state,
    subscribe: (sessionId: string) => wsRef.current?.subscribe(sessionId),
    unsubscribe: (sessionId: string) => wsRef.current?.unsubscribe(sessionId),
  }
}
```

---

## 7. 后端实现

### 7.1 WebSocket Handler (Rust)

```rust
// src/websocket/handler.rs
use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use tokio::sync::broadcast;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();

    // 订阅事件广播
    let mut rx = state.event_broadcaster.subscribe();

    // 处理接收消息的任务
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                // 处理客户端命令
                if let Ok(cmd) = serde_json::from_str::<ClientCommand>(&text) {
                    match cmd.command_type.as_str() {
                        "subscribe" => {
                            // 处理订阅
                        }
                        "unsubscribe" => {
                            // 处理取消订阅
                        }
                        _ => {}
                    }
                }
            }
        }
    });

    // 处理发送消息的任务
    let send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            let msg = Message::Text(serde_json::to_string(&event).unwrap());
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    tokio::select! {
        _ = recv_task => {},
        _ = send_task => {},
    }
}
```

### 7.2 事件广播

```rust
// src/services/event_broadcaster.rs
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct EventBroadcaster {
    tx: broadcast::Sender<AgentEvent>,
}

impl EventBroadcaster {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(100);
        Self { tx }
    }

    pub fn broadcast(&self, event: AgentEvent) {
        let _ = self.tx.send(event);
    }

    pub fn subscribe(&self) -> broadcast::Receiver<AgentEvent> {
        self.tx.subscribe()
    }
}

#[derive(Clone, Serialize)]
pub struct AgentEvent {
    pub event_type: String,
    pub payload: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}
```

---

## 8. 性能优化

### 8.1 消息节流

```typescript
// 对于高频事件进行节流
const throttledProgress = useThrottle((payload: ToolProgress) => {
  dispatch({ type: 'TOOL_PROGRESS', payload })
}, 100) // 100ms 节流
```

### 8.2 输出日志限制

```typescript
// 限制日志条数，防止内存溢出
const MAX_LOG_ENTRIES = 1000

function addLogEntry(logs: LogEntry[], entry: LogEntry): LogEntry[] {
  const newLogs = [...logs, entry]
  if (newLogs.length > MAX_LOG_ENTRIES) {
    return newLogs.slice(-MAX_LOG_ENTRIES)
  }
  return newLogs
}
```

### 8.3 虚拟化

对于长列表使用虚拟滚动（参考 SPEC-014）。

---

## 9. 错误处理

### 9.1 连接错误

```typescript
ws.on('error', (error) => {
  toast.error('WebSocket 连接失败')
  dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' })
})

ws.on('reconnecting', (attempt) => {
  toast.info(`正在重连... (${attempt}/${maxAttempts})`)
})

ws.on('reconnect_failed', () => {
  toast.error('无法连接到服务器，请检查后端服务')
})
```

### 9.2 消息解析错误

```typescript
ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data)
    // 验证消息格式
    if (!isValidMessage(message)) {
      console.warn('Invalid message format:', message)
      return
    }
    handleMessage(message)
  } catch (e) {
    console.error('Failed to parse WebSocket message:', e)
  }
}
```

---

## 10. 实现计划

### Phase 1: WebSocket 基础
- [ ] WebSocket 客户端实现
- [ ] 连接状态管理
- [ ] 基础事件处理

### Phase 2: UI 实现
- [ ] 监控界面布局
- [ ] 实时工具调用列表
- [ ] 进度指示

### Phase 3: 完善功能
- [ ] 实时输出日志
- [ ] 实时统计
- [ ] 自动滚动

### Phase 4: 优化
- [ ] 消息节流
- [ ] 日志限制
- [ ] 断线重连

---

## 11. 相关文档

- [STD-003](../../standards/api/STD-003-api-standards.md) - API 规范 (WebSocket 部分)
- [SKILL-005](../../skills/builtin/SKILL-005-realtime-monitor.json) - 实时监控技能
