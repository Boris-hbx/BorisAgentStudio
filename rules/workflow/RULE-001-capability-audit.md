# RULE-001: Claude Code 能力审视机制

> 作者: Boris Huai
> 创建日期: 2026-01-25
> 状态: 生效

---

## 目的

建立定期审视 Claude Code 能力变化的机制，确保 BorisAgentStudio 的执行模型与实际 Agent 行为保持同步。

---

## 审视频率

| 触发条件 | 审视类型 | 说明 |
|----------|----------|------|
| 每周一 | 例行审视 | 快速检查，生成能力快照 |
| Claude Code 版本更新 | 版本审视 | 详细对比，记录变更 |
| 发现行为异常 | 即时审视 | 调查原因，确认是否为能力变化 |
| 用户要求 | 按需审视 | 手动触发完整审视 |

---

## 审视内容

### 1. 工具集审视 (Tools Audit)

检查当前可用的工具列表：

```markdown
## 工具集快照 - {日期}

### 感知类工具
- [ ] Read - 读取文件
- [ ] Glob - 文件搜索
- [ ] Grep - 内容搜索
- [ ] LSP - 代码智能
- [ ] WebFetch - 获取网页
- [ ] WebSearch - 网络搜索

### 行动类工具
- [ ] Write - 创建文件
- [ ] Edit - 修改文件
- [ ] Bash - 执行命令
- [ ] Task - 子 Agent
- [ ] NotebookEdit - Jupyter 编辑

### 交互类工具
- [ ] AskUserQuestion - 提问用户

### 新增工具
- (列出本次发现的新工具)

### 移除工具
- (列出不再可用的工具)

### 变更工具
- (列出参数或行为有变化的工具)
```

### 2. 执行模型审视 (Execution Model Audit)

确认五阶段模型是否仍然准确：

```markdown
## 执行模型验证 - {日期}

### 阶段验证
- [ ] 理解 (Understand) - 意图解析仍有效
- [ ] 探索 (Explore) - 上下文构建模式不变
- [ ] 规划 (Plan) - 任务分解逻辑一致
- [ ] 执行 (Execute) - 工具调用方式不变
- [ ] 验证 (Verify) - 结果检查流程一致

### 新增能力
- (如：新的推理模式、新的编排能力)

### 行为变化
- (如：工具调用顺序变化、错误处理变化)
```

### 3. 上下文机制审视 (Context Audit)

检查上下文管理方式：

```markdown
## 上下文机制 - {日期}

### 上下文来源
- [ ] 对话历史 - 仍在工作
- [ ] CLAUDE.md - 仍被读取和遵守
- [ ] 系统提示 - 格式/内容是否变化
- [ ] 工具结果缓存 - 行为一致

### 上下文限制
- 最大上下文长度: {tokens}
- 文件读取限制: {lines}
- 工具结果截断: {chars}

### 变化记录
- (记录任何上下文处理的变化)
```

---

## 审视输出

### 能力快照文件

存储位置：`data/capability-snapshots/`

命名规范：`{日期}-capability-snapshot.json`

```json
{
  "snapshot_date": "2026-01-25",
  "claude_code_version": "1.0.x",
  "model_id": "claude-opus-4-5-20251101",
  "tools": {
    "perception": ["Read", "Glob", "Grep", "LSP", "WebFetch", "WebSearch"],
    "action": ["Write", "Edit", "Bash", "Task", "NotebookEdit"],
    "interaction": ["AskUserQuestion"]
  },
  "execution_model": {
    "phases": ["understand", "explore", "plan", "execute", "verify"],
    "supports_iteration": true,
    "supports_parallel_tools": true
  },
  "context": {
    "max_tokens": "estimated",
    "file_read_limit": 2000,
    "supports_images": true,
    "supports_pdf": true
  },
  "changes_from_previous": []
}
```

### 变更日志

存储位置：`data/capability-changelog.md`

```markdown
# Claude Code 能力变更日志

## 2026-01-25
- 初始能力快照建立
- 确认五阶段执行模型

## 2026-XX-XX (未来)
- 新增工具: XXX
- 工具变更: YYY 参数调整
- 执行模型: 无变化
```

---

## 审视流程

### 例行审视（每周一）

```
1. Claude 执行自省
   - 列出当前可用工具
   - 测试关键工具行为
   - 检查系统提示内容

2. 生成能力快照
   - 保存到 data/capability-snapshots/

3. 与上周快照对比
   - 如无变化：记录"无变化"
   - 如有变化：生成变更报告

4. 更新变更日志
   - 追加到 data/capability-changelog.md
```

### 版本审视（Claude Code 更新时）

```
1. 记录新版本号

2. 执行完整能力测试
   - 每个工具调用一次
   - 验证返回格式

3. 对比变化
   - 工具增减
   - 参数变化
   - 行为变化

4. 评估影响
   - 对可视化模型的影响
   - 对日志格式的影响
   - 对 SPEC 文档的影响

5. 提出更新建议
   - 需要修改的文档
   - 需要调整的代码

6. 通知项目所有者
```

---

## 自省提示词

Claude 执行自省时使用的提示：

```
我需要审视当前的能力状态。请：

1. 列出我当前可用的所有工具（tool names）
2. 描述每个工具的主要参数
3. 说明我的执行模式（能否并行调用、能否迭代）
4. 描述我的上下文限制
5. 与上次快照对比，指出任何变化

请以结构化格式输出。
```

---

## 与 BorisAgentStudio 的联动

当发现能力变化时：

| 变化类型 | 影响 | 行动 |
|----------|------|------|
| 新增工具 | 可视化可能需要新图标/颜色 | 更新 SPEC-003，添加工具类型 |
| 移除工具 | 历史日志中的工具可能无法识别 | 保持向后兼容，标记为"已废弃" |
| 执行模型变化 | 五阶段可能不再准确 | 更新 SPEC-003，重新设计可视化 |
| 上下文变化 | 日志内容可能增减 | 更新 STD-001 日志标准 |

---

## 责任

- **Claude Code**: 执行自省，生成快照
- **项目所有者**: 审批重大变更，确认更新方向
- **BorisAgentStudio**: 适配变化，保持可视化准确

---

## 相关文档

- [SPEC-003: Claude Code 执行模型](../../docs/specs/SPEC-003-claude-code-execution-model.md)
- [STD-001: Agent Session 日志标准](../../standards/data/STD-001-agent-session-logging.md)
