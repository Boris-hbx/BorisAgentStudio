# Agent Session Logs

此目录存储 Code Agent 执行日志，用于可视化展示。

## 命名规范

```
{session_id}.json
```

- `session_id`: 唯一会话标识符
- 示例: `demo-001.json`, `debug-2026-01-25-001.json`

## 文件格式

参考 `demo-001.json`，每个 session 文件包含：

```json
{
  "session_id": "string",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "steps": [AgentStep...]
}
```

### AgentStep 结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| step_id | string | Y | 步骤唯一标识 |
| step_name | string | Y | 步骤类型（见下表） |
| status | string | Y | pending/running/success/failed/skipped |
| input | any | N | 步骤输入数据 |
| output | any | N | 步骤输出数据 |
| context_link | string | N | 上下文来源步骤 ID |
| skill_source | object | N | 调用的技能信息 |
| domain_knowledge_source | array | N | 使用的领域知识列表 |
| domain_matching_score | number | Y | 领域知识匹配度 (0-1) |
| timestamp | string | N | 执行时间戳 |
| duration_ms | number | N | 执行耗时（毫秒） |
| error_message | string | N | 失败时的错误信息 |

### step_name 枚举值

| 值 | 中文名称 | 流程顺序 |
|----|----------|----------|
| requirement_input | 需求输入 | 1 |
| task_decomposition | 任务拆解 | 2 |
| code_generation | 代码生成 | 3 |
| environment_execution | 环境执行 | 4 |
| debug_fix | 调试修复 | 5 |
| result_verification | 结果验证 | 6 |
| memory_consolidation | 记忆沉淀 | 7 |

## 示例文件

- `demo-001.json` - 成功执行案例（斐波那契函数）
- `demo-002-failed.json` - 失败案例（用于测试错误展示）
