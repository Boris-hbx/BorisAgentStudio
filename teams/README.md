# Team Definitions

> 多 Agent 协作团队配置

本目录定义不同的 Agent 团队配置，用于多 Agent 协作场景。

---

## 概念

### Team（团队）

一个 Team 是一组预定义的 Agent 配置，包括：
- 团队成员组成
- 每个成员的角色和特质
- 协作模式和流程

### Agent Personality（性格特质）

每个 Agent 有不同的性格倾向，影响其行为方式：

| 维度 | 低分端 | 高分端 | 说明 |
|------|--------|--------|------|
| `risk_tolerance` | 谨慎 (cautious) | 激进 (aggressive) | 对风险的容忍程度 |
| `trust_level` | 质疑 (skeptical) | 信任 (trusting) | 对他人输出的信任度 |
| `focus_scope` | 细节 (detail) | 全局 (big_picture) | 关注的粒度 |
| `communication` | 被动 (reactive) | 主动 (proactive) | 沟通主动性 |
| `decision_speed` | 深思 (deliberate) | 快速 (quick) | 决策速度 |

分数范围：1-5（1=低分端，5=高分端）

---

## 文件命名

```
TEAM-{序号}-{团队名}.yaml
```

示例：
- `TEAM-001-balanced.yaml` - 平衡团队
- `TEAM-002-risk-aware.yaml` - 风险意识团队

---

## Schema

```yaml
# Team 定义格式
team_id: string           # 唯一标识
name: string              # 显示名称
description: string       # 团队描述
version: string           # 版本号

# 协作配置
collaboration:
  pattern: master_worker | peer_to_peer | pipeline
  orchestrator: string    # 协调者 agent_id

# 成员定义
members:
  - agent_id: string      # 唯一标识
    agent_type: string    # architect | developer | reviewer | challenger | ...
    name: string          # 显示名称
    role: string          # 角色描述

    # 性格特质 (1-5)
    personality:
      risk_tolerance: number
      trust_level: number
      focus_scope: number
      communication: number
      decision_speed: number

    # 专业领域
    expertise: string[]

    # 行为指导
    guidelines:
      - string

# 工作流程
workflow:
  - stage: string
    participants: string[]  # agent_ids
    description: string
```

---

## 内置团队

### TEAM-001: Balanced（平衡团队）

标准的三角色团队，适合常规开发任务。

```
Architect → Developer(s) → Reviewer
```

### TEAM-002: Risk-Aware（风险意识团队）

增加 Challenger 角色，适合高风险或关键系统开发。

```
Architect → Challenger → Developer(s) → Reviewer
            (质疑设计)
```

---

## 使用方式

1. 在 Session 开始时指定 Team
2. 系统根据 Team 配置初始化 Agent
3. 按 workflow 阶段执行协作

---

## 扩展

### 添加新团队

1. 创建新的 YAML 文件
2. 遵循 Schema 定义
3. 确保 agent_type 已注册（内置或通过 `registerAgentType()`）

### 添加新 Agent 类型

1. 在 `collaboration.ts` 中注册类型
2. 定义该类型的输入/输出契约
3. 在团队配置中使用
