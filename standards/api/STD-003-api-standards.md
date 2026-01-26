# STD-003: API 规范

> 版本: 1.0
> 作者: Boris Huai
> 创建日期: 2026-01-26
> 状态: 生效中

---

## 1. 概述

本标准定义 BorisAgentStudio 前后端通信的 API 设计规范，包括 REST API 和 WebSocket 事件。

---

## 2. REST API 规范

### 2.1 基础路径

```
/api/v{version}/{resource}
```

- 版本号使用整数：`v1`, `v2`
- 资源名使用复数形式：`sessions`, `tools`, `phases`

### 2.2 端点设计

| 操作 | HTTP 方法 | 路径模式 | 示例 |
|------|-----------|----------|------|
| 列表 | GET | `/{resources}` | `GET /api/v1/sessions` |
| 详情 | GET | `/{resources}/{id}` | `GET /api/v1/sessions/abc123` |
| 创建 | POST | `/{resources}` | `POST /api/v1/sessions` |
| 更新 | PUT | `/{resources}/{id}` | `PUT /api/v1/sessions/abc123` |
| 部分更新 | PATCH | `/{resources}/{id}` | `PATCH /api/v1/sessions/abc123` |
| 删除 | DELETE | `/{resources}/{id}` | `DELETE /api/v1/sessions/abc123` |

### 2.3 查询参数

| 参数 | 用途 | 示例 |
|------|------|------|
| `page` | 分页页码 | `?page=2` |
| `limit` | 每页数量 | `?limit=20` |
| `sort` | 排序字段 | `?sort=-created_at` (负号表示降序) |
| `filter[field]` | 过滤条件 | `?filter[status]=success` |
| `search` | 全文搜索 | `?search=keyword` |
| `fields` | 字段选择 | `?fields=id,name,status` |

### 2.4 请求格式

```http
Content-Type: application/json
Accept: application/json
```

### 2.5 响应格式

#### 成功响应

```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### 错误响应

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid session ID format",
    "details": [
      {
        "field": "session_id",
        "message": "Must be a valid UUID"
      }
    ]
  }
}
```

---

## 3. HTTP 状态码

### 3.1 成功状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功获取/更新资源 |
| 201 | Created | 成功创建资源 |
| 204 | No Content | 成功删除资源 |

### 3.2 客户端错误

| 状态码 | 含义 | 错误码 |
|--------|------|--------|
| 400 | Bad Request | `VALIDATION_ERROR`, `INVALID_FORMAT` |
| 401 | Unauthorized | `UNAUTHORIZED` |
| 403 | Forbidden | `FORBIDDEN` |
| 404 | Not Found | `NOT_FOUND` |
| 409 | Conflict | `CONFLICT`, `DUPLICATE` |
| 422 | Unprocessable Entity | `UNPROCESSABLE` |
| 429 | Too Many Requests | `RATE_LIMITED` |

### 3.3 服务端错误

| 状态码 | 含义 | 错误码 |
|--------|------|--------|
| 500 | Internal Server Error | `INTERNAL_ERROR` |
| 502 | Bad Gateway | `BAD_GATEWAY` |
| 503 | Service Unavailable | `SERVICE_UNAVAILABLE` |
| 504 | Gateway Timeout | `GATEWAY_TIMEOUT` |

---

## 4. 错误码定义

### 4.1 错误码格式

```
{DOMAIN}_{ERROR_TYPE}
```

示例：`SESSION_NOT_FOUND`, `TOOL_CALL_INVALID`

### 4.2 错误码列表

| 错误码 | HTTP 状态 | 描述 |
|--------|-----------|------|
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `INVALID_FORMAT` | 400 | 数据格式不正确 |
| `SESSION_NOT_FOUND` | 404 | Session 不存在 |
| `TOOL_CALL_NOT_FOUND` | 404 | 工具调用不存在 |
| `SESSION_ALREADY_EXISTS` | 409 | Session ID 已存在 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

---

## 5. WebSocket 规范

### 5.1 连接

```
ws://localhost:8080/ws
```

### 5.2 消息格式

```json
{
  "type": "event_type",
  "payload": { ... },
  "timestamp": "2026-01-26T10:00:00Z"
}
```

### 5.3 事件类型命名

格式：`{resource}:{action}`

| 事件类型 | 描述 | Payload |
|----------|------|---------|
| `session:created` | Session 创建 | `{ session_id, task_title }` |
| `session:updated` | Session 更新 | `{ session_id, changes }` |
| `session:completed` | Session 完成 | `{ session_id, status, summary }` |
| `tool:started` | 工具调用开始 | `{ session_id, call_id, tool_name }` |
| `tool:completed` | 工具调用完成 | `{ session_id, call_id, output }` |
| `tool:failed` | 工具调用失败 | `{ session_id, call_id, error }` |
| `phase:changed` | 阶段切换 | `{ session_id, phase_type }` |

### 5.4 客户端命令

| 命令 | 描述 | Payload |
|------|------|---------|
| `subscribe` | 订阅 Session | `{ session_id }` |
| `unsubscribe` | 取消订阅 | `{ session_id }` |
| `ping` | 心跳检测 | `{}` |

### 5.5 服务端响应

| 响应 | 描述 |
|------|------|
| `subscribed` | 订阅成功确认 |
| `unsubscribed` | 取消订阅确认 |
| `pong` | 心跳响应 |
| `error` | 错误信息 |

---

## 6. API 端点清单

### 6.1 Sessions

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/v1/sessions` | 获取 Session 列表 |
| GET | `/api/v1/sessions/{id}` | 获取 Session 详情 |
| POST | `/api/v1/sessions` | 创建 Session |
| DELETE | `/api/v1/sessions/{id}` | 删除 Session |
| GET | `/api/v1/sessions/{id}/tool-calls` | 获取工具调用列表 |
| GET | `/api/v1/sessions/{id}/phases` | 获取阶段列表 |

### 6.2 Tool Calls

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/v1/tool-calls/{id}` | 获取工具调用详情 |

### 6.3 Statistics

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/v1/stats/overview` | 获取统计概览 |
| GET | `/api/v1/stats/tools` | 获取工具使用统计 |

---

## 7. 版本控制策略

### 7.1 版本演进规则

- **补丁版本**：向后兼容的修复，无需更新 API 版本
- **小版本**：向后兼容的新增功能，无需更新 API 版本
- **大版本**：破坏性变更，需要新 API 版本 (v1 → v2)

### 7.2 废弃策略

1. 宣布废弃，标记 `Deprecated` header
2. 保持旧版本运行至少 6 个月
3. 发送废弃警告响应头
4. 最终移除

```http
Deprecation: true
Sunset: Sat, 01 Jul 2026 00:00:00 GMT
Link: </api/v2/sessions>; rel="successor-version"
```

---

## 8. 安全考虑

### 8.1 请求验证

- 所有输入必须验证和转义
- 限制请求体大小 (默认 1MB)
- 限制查询参数数量

### 8.2 速率限制

- 默认：100 请求/分钟/IP
- Header 返回限制信息：

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706284800
```

---

## 9. 相关文档

- [STD-001](../data/STD-001-agent-session-logging.md) - Session 日志标准
- [SPEC-015](../../docs/specs/SPEC-015-realtime-monitoring.md) - 实时监控规范 (待创建)
