# STD-005: 错误处理规范

> 版本: 1.0
> 作者: Boris Huai
> 创建日期: 2026-01-26
> 状态: 生效中

---

## 1. 概述

本标准定义 BorisAgentStudio 项目的错误处理策略、错误分类和用户反馈规范。

---

## 2. 错误分类

### 2.1 错误层级

```
┌─────────────────────────────────────────┐
│           用户可见错误                   │
│  (User-facing errors)                   │
├─────────────────────────────────────────┤
│           应用层错误                     │
│  (Application errors)                   │
├─────────────────────────────────────────┤
│           系统层错误                     │
│  (System errors)                        │
└─────────────────────────────────────────┘
```

### 2.2 错误类型

| 类型 | 描述 | 用户消息 | 技术处理 |
|------|------|----------|----------|
| **验证错误** | 用户输入不合法 | 明确说明问题 | 400 Bad Request |
| **业务错误** | 业务规则不满足 | 解释原因 | 422 Unprocessable |
| **认证错误** | 身份验证失败 | 请重新登录 | 401 Unauthorized |
| **授权错误** | 权限不足 | 无权访问 | 403 Forbidden |
| **资源错误** | 资源不存在 | 未找到 | 404 Not Found |
| **网络错误** | 连接/超时 | 网络问题，请重试 | 重试机制 |
| **服务器错误** | 内部异常 | 服务暂时不可用 | 500 + 日志 |

---

## 3. 错误码体系

### 3.1 错误码格式

```
{DOMAIN}_{CATEGORY}_{SPECIFIC}
```

| 部分 | 含义 | 示例 |
|------|------|------|
| DOMAIN | 业务域 | SESSION, TOOL, API |
| CATEGORY | 错误类别 | VALIDATION, NOT_FOUND |
| SPECIFIC | 具体错误 | INVALID_FORMAT |

### 3.2 通用错误码

| 错误码 | HTTP | 描述 |
|--------|------|------|
| `VALIDATION_FAILED` | 400 | 参数验证失败 |
| `INVALID_FORMAT` | 400 | 数据格式错误 |
| `UNAUTHORIZED` | 401 | 未认证 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `RATE_LIMITED` | 429 | 请求过于频繁 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

### 3.3 业务错误码

| 错误码 | HTTP | 描述 |
|--------|------|------|
| `SESSION_NOT_FOUND` | 404 | Session 不存在 |
| `SESSION_INVALID_STATUS` | 422 | Session 状态不允许操作 |
| `TOOL_CALL_NOT_FOUND` | 404 | 工具调用不存在 |
| `TOOL_CALL_TIMEOUT` | 408 | 工具调用超时 |
| `PHASE_INVALID_TRANSITION` | 422 | 非法的阶段转换 |
| `IMPORT_INVALID_SCHEMA` | 400 | 导入数据格式错误 |
| `EXPORT_GENERATION_FAILED` | 500 | 导出生成失败 |

---

## 4. 前端错误处理

### 4.1 错误边界 (Error Boundary)

```tsx
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 上报错误
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
```

### 4.2 错误展示组件

```tsx
// components/ErrorFallback.tsx
interface ErrorFallbackProps {
  error: Error | null
  resetError?: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="error-fallback">
      <div className="error-icon">⚠️</div>
      <h2>出现了一些问题</h2>
      <p className="error-message">
        {getErrorMessage(error)}
      </p>
      {resetError && (
        <button onClick={resetError}>重试</button>
      )}
    </div>
  )
}

function getErrorMessage(error: Error | null): string {
  if (!error) return '未知错误'

  // 映射技术错误到用户友好消息
  const messageMap: Record<string, string> = {
    'NetworkError': '网络连接失败，请检查网络后重试',
    'TimeoutError': '请求超时，请稍后重试',
    'SESSION_NOT_FOUND': '找不到该会话',
    // ...更多映射
  }

  return messageMap[error.name] || error.message || '发生了意外错误'
}
```

### 4.3 API 错误处理

```typescript
// services/api.ts
import { ApiError } from '../types/error'

export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.message || 'Request failed',
        response.status,
        errorData.error?.details
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // 网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('NETWORK_ERROR', '网络连接失败', 0)
    }

    throw new ApiError('UNKNOWN_ERROR', '发生了意外错误', 0)
  }
}
```

### 4.4 全局错误处理

```typescript
// hooks/useErrorHandler.ts
import { useCallback } from 'react'
import { toast } from '../components/Toast'

export function useErrorHandler() {
  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      // API 错误显示 toast
      toast.error(error.userMessage)

      // 特殊处理
      if (error.code === 'UNAUTHORIZED') {
        // 跳转登录
      }
    } else if (error instanceof Error) {
      toast.error('发生了意外错误')
      console.error(error)
    }
  }, [])

  return { handleError }
}
```

---

## 5. 后端错误处理 (Rust)

### 5.1 错误类型定义

```rust
// src/error.rs
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct AppError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Vec<ErrorDetail>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ErrorDetail {
    pub field: String,
    pub message: String,
}

#[derive(Debug)]
pub enum Error {
    // 验证错误
    Validation(String),
    ValidationDetails(Vec<ErrorDetail>),

    // 资源错误
    NotFound(String),
    Conflict(String),

    // 认证错误
    Unauthorized,
    Forbidden,

    // 系统错误
    Internal(String),
    Database(String),
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let (status, error) = match self {
            Error::Validation(msg) => (
                StatusCode::BAD_REQUEST,
                AppError {
                    code: "VALIDATION_FAILED".into(),
                    message: msg,
                    details: None,
                },
            ),
            Error::ValidationDetails(details) => (
                StatusCode::BAD_REQUEST,
                AppError {
                    code: "VALIDATION_FAILED".into(),
                    message: "Validation failed".into(),
                    details: Some(details),
                },
            ),
            Error::NotFound(resource) => (
                StatusCode::NOT_FOUND,
                AppError {
                    code: format!("{}_NOT_FOUND", resource.to_uppercase()),
                    message: format!("{} not found", resource),
                    details: None,
                },
            ),
            Error::Conflict(msg) => (
                StatusCode::CONFLICT,
                AppError {
                    code: "CONFLICT".into(),
                    message: msg,
                    details: None,
                },
            ),
            Error::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                AppError {
                    code: "UNAUTHORIZED".into(),
                    message: "Authentication required".into(),
                    details: None,
                },
            ),
            Error::Forbidden => (
                StatusCode::FORBIDDEN,
                AppError {
                    code: "FORBIDDEN".into(),
                    message: "Permission denied".into(),
                    details: None,
                },
            ),
            Error::Internal(msg) => {
                // 记录内部错误，但不暴露给用户
                tracing::error!("Internal error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    AppError {
                        code: "INTERNAL_ERROR".into(),
                        message: "An internal error occurred".into(),
                        details: None,
                    },
                )
            }
            Error::Database(msg) => {
                tracing::error!("Database error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    AppError {
                        code: "INTERNAL_ERROR".into(),
                        message: "An internal error occurred".into(),
                        details: None,
                    },
                )
            }
        };

        let body = serde_json::json!({ "error": error });
        (status, axum::Json(body)).into_response()
    }
}
```

### 5.2 使用示例

```rust
// src/api/sessions.rs
pub async fn get_session(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<SessionResponse>, Error> {
    let session = state
        .session_service
        .get_by_id(&id)
        .await
        .map_err(|e| Error::Database(e.to_string()))?
        .ok_or(Error::NotFound("Session".into()))?;

    Ok(Json(SessionResponse { data: session }))
}
```

---

## 6. 重试策略

### 6.1 重试配置

```typescript
// config/retry.ts
export const RETRY_CONFIG = {
  // 最大重试次数
  maxRetries: 3,

  // 初始延迟 (ms)
  initialDelay: 1000,

  // 最大延迟 (ms)
  maxDelay: 10000,

  // 延迟倍数 (指数退避)
  backoffMultiplier: 2,

  // 可重试的错误码
  retryableCodes: [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'SERVICE_UNAVAILABLE',
    'RATE_LIMITED',
  ],
}
```

### 6.2 重试实现

```typescript
// utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // 检查是否可重试
      if (error instanceof ApiError) {
        if (!config.retryableCodes.includes(error.code)) {
          throw error
        }
      }

      // 最后一次尝试不等待
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )
        await sleep(delay)
      }
    }
  }

  throw lastError!
}
```

---

## 7. 错误日志

### 7.1 日志级别

| 级别 | 使用场景 |
|------|----------|
| ERROR | 需要立即关注的错误 |
| WARN | 潜在问题，但不影响功能 |
| INFO | 重要业务事件 |
| DEBUG | 调试信息 |

### 7.2 错误日志格式

```json
{
  "level": "error",
  "timestamp": "2026-01-26T10:00:00Z",
  "error_code": "SESSION_NOT_FOUND",
  "message": "Session not found",
  "context": {
    "session_id": "abc123",
    "user_id": "user456",
    "request_id": "req789"
  },
  "stack_trace": "..."
}
```

---

## 8. 用户消息指南

### 8.1 消息原则

- **简洁**：不超过一句话
- **友好**：不责怪用户
- **可操作**：告诉用户怎么做
- **专业**：不暴露技术细节

### 8.2 消息模板

| 错误类型 | 用户消息 |
|----------|----------|
| 网络错误 | 网络连接失败，请检查网络后重试 |
| 超时 | 请求超时，请稍后重试 |
| 验证错误 | {具体字段}格式不正确 |
| 资源不存在 | 找不到该{资源名称} |
| 服务器错误 | 服务暂时不可用，请稍后重试 |
| 权限不足 | 您没有权限执行此操作 |

---

## 9. 相关文档

- [STD-003](../api/STD-003-api-standards.md) - API 规范
- [STD-004](../testing/STD-004-testing-standards.md) - 测试规范
