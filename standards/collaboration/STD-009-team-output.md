# STD-009: /team 命令产出标准

> 版本: 1.0
> 状态: 生效中
> 适用范围: 所有 /team 命令执行

---

## 概述

当使用 `/team` 命令启动多 Agent 协作时，意味着这是一个**重要任务**。

本标准定义了 `/team` 命令的强制产出要求。

---

## 强制产出（Required Outputs）

### 1. 结构化 Spec

每个 `/team` 任务必须产出或更新一个 Spec 文档。

**位置**: `docs/specs/SPEC-{序号}-{功能名}.md`

**必须包含的章节**:

```markdown
# SPEC-{序号}: {功能名称}

> 作者: Boris Huai
> 起草日期: YYYY-MM-DD
> 状态: 草稿 | 实施中 | 已完成

---

## 1. 问题陈述 (Why)
【PO 填写】
- 要解决的核心问题是什么？
- 为什么现在需要解决？

## 2. 目标与成功标准 (Definition of Done)
【PO 填写】
- [ ] 成功标准 1（必须是可验证的）
- [ ] 成功标准 2
- [ ] ...

## 3. 非目标 (Out of Scope)
【PO 填写】
明确列出本次不做的事情：
- 不做 X，因为...
- 不做 Y，因为...

## 4. 技术方案 (How)
【Architect 填写】
### 4.1 整体设计
### 4.2 数据模型
### 4.3 接口设计
### 4.4 关键实现点

## 5. 交互设计 (UX)
【Architect + Design Authority 填写】
### 5.1 交互流程
### 5.2 视觉设计
### 5.3 动效说明

## 6. 风险清单与应对
【Challenger + Design Authority 输出，Architect 回应】

| 风险 | 类型 | 优先级 | 应对措施 | 决策理由 |
|------|------|--------|----------|----------|
| ... | 技术/体验 | P0/P1/P2 | ... | ... |

## 7. 决策记录 (Decision Log)
【全员贡献】

| 日期 | 决策 | 理由 | 参与角色 |
|------|------|------|----------|
| ... | ... | ... | ... |
```

### 2. Agent 协作日志

每个 `/team` 任务必须记录完整的协作日志。

**位置**: `data/sessions/{日期}-{序号}-{任务简述}.json`

**格式**: 遵循 STD-001 v3.0 + STD-008 多 Agent 扩展

**必须记录**:
- 每个角色的工具调用
- 角色之间的交互消息
- 阶段切换点
- 关键决策点

### 3. 决策 Rationale

所有关键决策必须记录理由。

**不允许**:
```
决定使用 Redis 做缓存。
```

**必须**:
```
决定使用 Redis 做缓存。
理由：
1. 项目已有 Redis 依赖，无需引入新技术栈
2. 支持 TTL 自动过期，符合缓存需求
3. 性能满足 100ms 响应要求
考虑过的替代方案：
- 内存 Map：进程重启丢失，不适合
- Memcached：功能较单一，Redis 更灵活
```

---

## 角色产出责任

| 角色 | 产出责任 |
|------|----------|
| Product Owner | 问题陈述、目标、DoD、非目标、最终确认 |
| Architect | 技术方案、回应风险、决策记录、Spec 维护 |
| Challenger | 技术风险清单（带优先级） |
| Design Authority | 体验风险清单、设计原则检查 |
| Developer | 代码实现、自测报告 |
| Reviewer | 审查报告、DoD 检查结果 |

---

## 角色输出格式规范（Tool Call Output Schema）

每个角色的工具调用必须在 `output.result` 中包含结构化数据，以便在 Web 端可视化展示。

### Product Owner 初始化输出

```json
{
  "display": "问题陈述和目标初始化完成",
  "problem_statement": "用户希望...",
  "goals": [
    "目标 1（可验证）",
    "目标 2（可验证）"
  ],
  "non_goals": [
    "不做 X，因为...",
    "不做 Y，因为..."
  ]
}
```

### Product Owner 最终确认输出

```json
{
  "display": "任务完成确认",
  "verdict": "通过",
  "dod_checklist": [
    {
      "goal": "目标 1",
      "met": true,
      "evidence": "通过方式/证据说明"
    },
    {
      "goal": "目标 2",
      "met": true,
      "evidence": "..."
    }
  ],
  "summary": "总结说明"
}
```

### Challenger 技术风险评估输出

```json
{
  "display": "技术风险评估完成",
  "risk_list": [
    {
      "id": "C1",
      "risk": "风险描述",
      "level": "高|中|低",
      "suggestion": "建议的应对措施"
    },
    {
      "id": "C2",
      "risk": "...",
      "level": "...",
      "suggestion": "..."
    }
  ]
}
```

### Design Authority 体验风险评估输出

```json
{
  "display": "体验风险评估完成",
  "risk_list": [
    {
      "id": "D1",
      "risk": "体验风险描述",
      "level": "高|中|低",
      "suggestion": "建议的应对措施"
    }
  ],
  "design_principles_check": [
    {
      "principle": "设计原则名称",
      "passed": true,
      "note": "检查说明"
    }
  ]
}
```

### Architect 回应质疑输出

```json
{
  "display": "质疑回应完成，Spec 已更新",
  "challenger_responses": [
    {
      "risk_id": "C1",
      "action": "接受|部分接受|拒绝|降级",
      "solution": "具体解决方案",
      "rationale": "决策理由"
    }
  ],
  "design_authority_responses": [
    {
      "risk_id": "D1",
      "action": "接受|部分接受|拒绝|降级",
      "solution": "具体解决方案",
      "rationale": "决策理由"
    }
  ],
  "spec_updates": [
    "更新了技术方案中的 X 部分",
    "添加了 Y 配置项"
  ]
}
```

### Developer 实现输出

```json
{
  "display": "实现完成",
  "files_created": [
    {
      "path": "文件路径",
      "description": "文件说明",
      "lines": 100
    }
  ],
  "files_modified": [
    {
      "path": "文件路径",
      "changes": "修改说明"
    }
  ],
  "self_test": {
    "passed": true,
    "tests_run": ["测试 1", "测试 2"],
    "notes": "备注"
  }
}
```

### Reviewer 审查输出

```json
{
  "display": "审查完成",
  "verdict": "通过|需修改|拒绝",
  "checklist": [
    {
      "item": "检查项目",
      "passed": true,
      "note": "检查备注"
    }
  ],
  "findings": [
    {
      "severity": "critical|major|minor",
      "file": "文件路径",
      "line": 42,
      "issue": "问题描述",
      "suggestion": "修改建议"
    }
  ],
  "commendations": [
    "值得表扬的点 1",
    "值得表扬的点 2"
  ],
  "session_log_verified": true
}

---

## 质量检查清单

在任务完成前，必须确认：

- [ ] Spec 包含所有必需章节
- [ ] 所有决策都有 rationale
- [ ] 风险清单中的 P0 风险全部有应对措施
- [ ] Agent 日志已保存
- [ ] DoD 中的所有条目都已验证

---

## 违规处理

如果 `/team` 任务未满足以上产出要求：

1. **PO 有权拒绝宣布完成**
2. **Reviewer 应在审查中指出缺失**
3. **日志缺失的任务不计入有效样本**

---

## 参考

- STD-001: Agent Session 日志记录标准
- STD-008: 多 Agent 日志标准
- SPEC-004: 文档规范
