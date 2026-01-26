# SPEC-003: 数据导入规范

> 作者: Boris Huai
> 起草日期: 2026-01-24
> 状态: 实施中

---

## 概述

定义 Agent 执行记录的 JSON 导入格式，支持用户上传真实 Agent 执行日志进行可视化分析。

---

## 导入格式规范

### Session 文件格式

文件名：`session-{id}.json` 或任意 `.json` 文件

```json
{
  "session_id": "string (必填)",
  "created_at": "ISO 8601 时间戳 (必填)",
  "updated_at": "ISO 8601 时间戳 (必填)",
  "steps": [AgentStep, ...]
}
```

### AgentStep 格式

```json
{
  "step_id": "string (必填)",
  "step_name": "StepName 枚举值 (必填)",
  "status": "pending | running | success | failed | skipped (必填)",
  "input": "any (必填，可为 null)",
  "output": "any (可选)",
  "context_link": "string (可选，关联的上一步 step_id)",
  "skill_source": {
    "id": "string",
    "name": "string",
    "description": "string",
    "source": "string"
  },
  "domain_knowledge_source": [
    {
      "id": "string",
      "name": "string",
      "content": "string",
      "relevance_score": "0.0 - 1.0"
    }
  ],
  "domain_matching_score": "0.0 - 1.0 (必填，默认 0)",
  "timestamp": "ISO 8601 (可选)",
  "duration_ms": "number (可选)",
  "error_message": "string (可选，失败时填写)"
}
```

### StepName 枚举值

| 值 | 含义 |
|----|------|
| requirement_input | 需求输入 |
| task_decomposition | 任务拆解 |
| code_generation | 代码生成 |
| environment_execution | 环境执行 |
| debug_fix | 调试修复 |
| result_verification | 结果验证 |
| memory_consolidation | 记忆沉淀 |

---

## 导入方式

### 方式一：前端上传

1. 用户点击"导入 Session"按钮
2. 选择本地 JSON 文件
3. 前端解析并验证格式
4. 加载到可视化界面

### 方式二：API 上传

```
POST /api/v1/sessions/import
Content-Type: application/json

{session JSON body}
```

---

## 示例文件

参考：`data/mock-session.json`

---

## 验证规则

导入时进行以下验证：

1. **必填字段检查**：session_id, steps, step_id, step_name, status, input
2. **枚举值检查**：step_name, status 必须是有效枚举值
3. **步骤顺序**：steps 数组应按 STEP_ORDER 顺序排列
4. **评分范围**：domain_matching_score 和 relevance_score 必须在 0-1 之间

验证失败时显示具体错误信息。

---

## 相关文档

- [SPEC-001: 项目总览](./SPEC-001-project-overview.md)
- [SPEC-002: 可视化界面设计](./SPEC-002-visualization-design.md)
