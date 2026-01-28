# /team - 多 Agent 团队协作

启动多 Agent 团队协作模式，使用指定团队配置完成任务。

## 核心原则

使用 `/team` 意味着这是**重要任务**，必须：
- 产出 **完整且结构化的 Spec**
- 记录 **全过程 Agent 协作日志**
- 所有关键决策必须有 **rationale**

## 语法

```
/team <team-name> <task-description>
```

## 可用团队

| 团队 | 成员 | 适用场景 |
|------|------|----------|
| `boris` | PO + Architect + Challenger + DA + Developer + Reviewer | Boris 的专属团队（推荐） |
| `balanced` | Architect + Developer + Reviewer | 简单任务 |
| `risk-aware` | Architect + Challenger + Developer + Reviewer | 风险敏感任务 |

## Boris's Team 角色

| 角色 | 图标 | 职责 | Owner of |
|------|------|------|----------|
| Product Owner | 👔 | 定义目标、DoD、取舍决策 | Outcome |
| Architect | 🏛️ | 设计方案、维护 Spec | Spec |
| Challenger | 🛡️ | 质疑技术风险 | Technical Risk |
| Design Authority | 🎨 | 质疑体验风险 | Experience |
| Developer | 👨‍💻 | 按 Spec 实现 | Implementation |
| Reviewer | 🔍 | 审查质量、验证 DoD | Quality Gate |

## 执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 👔 Product Owner                                            │
│     └─ 初始化 Spec：问题(Why)、目标(DoD)、非目标                 │
├─────────────────────────────────────────────────────────────────┤
│  2. 🏛️ Architect                                                │
│     └─ 设计初版方案（技术方案 + 交互草案）                       │
├─────────────────────────────────────────────────────────────────┤
│  3. 🛡️ Challenger + 🎨 Design Authority  ← 并行质疑             │
│     ├─ Challenger：技术风险清单                                 │
│     └─ Design Authority：体验风险清单                           │
├─────────────────────────────────────────────────────────────────┤
│  4. 🏛️ Architect                                                │
│     └─ 回应质疑，更新 Spec（记录决策 rationale）                 │
├─────────────────────────────────────────────────────────────────┤
│  5. 👨‍💻 Developer                                                │
│     └─ 按 Spec 实现                                             │
├─────────────────────────────────────────────────────────────────┤
│  6. 🔍 Reviewer                                                 │
│     └─ 审查：代码质量 + 风险处理 + 体验符合度 + DoD 检查         │
├─────────────────────────────────────────────────────────────────┤
│  7. 👔 Product Owner                                            │
│     └─ 确认是否达成目标，宣布完成或回退                          │
└─────────────────────────────────────────────────────────────────┘
```

## 输出格式

每个阶段使用明确的分隔标识：

```
═══════════════════════════════════════════════════════════════════
【{图标} {角色名}】{阶段描述}
───────────────────────────────────────────────────────────────────
我是谁：{Role}
我要做：{本阶段任务}
═══════════════════════════════════════════════════════════════════

{该角色的具体工作内容}
```

## 强制产出

### 1. Spec 文档

位置：`docs/specs/SPEC-{序号}-{功能名}.md`

必须包含：
- 问题陈述 (Why)
- 目标与成功标准 (DoD)
- 非目标 (Out of Scope)
- 技术方案 (How)
- 交互设计 (UX)
- 风险清单与应对
- 决策记录 (Decision Log)

### 2. Agent 协作日志

位置：`data/sessions/{日期}-{序号}-{任务简述}.json`

遵循：STD-001 + STD-008

### 3. 决策 Rationale

所有关键决策必须记录理由。

❌ 不允许：
```
使用 Redis 做缓存。
```

✅ 必须：
```
使用 Redis 做缓存。
理由：项目已有依赖，支持 TTL，性能满足要求。
替代方案：内存 Map（重启丢失）、Memcached（功能单一）。
```

## Hook 触发规则

| 触发条件 | 必须动作 |
|----------|----------|
| 任务开始 | PO 初始化 Spec |
| Architect 设计完成 | Challenger + DA 质疑 |
| Spec 技术变更 | Challenger 复审 |
| Spec 交互变更 | DA 复审 |
| Developer 遇到问题 | 回到 Architect，不得擅自决策 |
| Reviewer 通过 | PO 确认完成 |

详见：RULE-006-team-hooks.md

## 示例

```
/team boris 实现 Session 列表的多 Agent 协作可视化
```

```
/team boris 重构用户认证模块，支持 OAuth 2.0
```

## 配置文件

- `teams/TEAM-003-boris-team.yaml` - Boris's Team（推荐）
- `teams/TEAM-001-balanced.yaml` - 平衡团队
- `teams/TEAM-002-risk-aware.yaml` - 风险意识团队

## 参考文档

- STD-009-team-output.md - 产出标准
- RULE-006-team-hooks.md - Hook 规则
- STD-008-multi-agent-logging.md - 多 Agent 日志标准
