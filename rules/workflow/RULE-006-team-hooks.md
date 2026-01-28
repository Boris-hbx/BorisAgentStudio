# RULE-006: Team 协作 Hook 规则

> 版本: 1.0
> 状态: 生效中
> 适用范围: /team 命令执行

---

## 概述

Hook 定义了"什么时候必须出手"。

本规则定义 `/team` 协作过程中的强制触发点。

---

## Hook 定义格式

```
触发条件 → 必须执行的动作
```

---

## 全局 Hook

### Hook G1: 任务开始

```
触发: /team 命令执行
动作: Product Owner 必须先初始化 Spec（问题、目标、DoD、非目标）
阻塞: 在 PO 初始化完成前，其他角色不得开始工作
```

### Hook G2: 任务结束

```
触发: Reviewer 审查通过
动作: Product Owner 必须确认是否达成目标
输出: ✅ 完成 或 🔄 回退（说明原因）
```

---

## 角色专属 Hook

### Architect Hook

```
Hook A1:
触发: PO 初始化完成
动作: Architect 开始设计

Hook A2:
触发: Challenger 或 Design Authority 提出质疑
动作: Architect 必须逐条回应（接受/拒绝/降级 + rationale）

Hook A3:
触发: Developer 遇到 Spec 未覆盖的情况
动作: Architect 必须响应并更新 Spec
```

### Challenger Hook

```
Hook C1:
触发: Architect 完成初版设计
动作: Challenger 必须进行技术风险质疑

Hook C2:
触发: Spec 技术方案发生变更
动作: Challenger 必须复审变更部分
```

### Design Authority Hook

```
Hook D1:
触发: Architect 完成初版设计
动作: Design Authority 必须进行体验风险质疑

Hook D2:
触发: UI/交互 Spec 发生变更
动作: Design Authority 必须复审变更部分
```

### Developer Hook

```
Hook DEV1:
触发: Architect 回应质疑并更新 Spec 完成
动作: Developer 开始实现

Hook DEV2:
触发: 实现中遇到 Spec 未覆盖的情况
动作: 停止实现，回到 Architect 确认，不得擅自决策
```

### Reviewer Hook

```
Hook R1:
触发: Developer 声明实现完成
动作: Reviewer 必须执行全面审查

Hook R2:
触发: 审查发现问题
动作: 返回 Developer 修复，不得直接通过

Hook R3:
触发: 审查通过 & 任务即将完成
动作: Reviewer 必须验证 Session 日志已记录
验证项:
  - 日志文件存在于 data/sessions/ 目录
  - 日志格式符合 STD-001 规范
  - tool_calls 已完整记录
  - 如未记录，要求 Developer 补充
```

### Product Owner Hook

```
Hook PO1:
触发: 任务开始
动作: 初始化 Spec

Hook PO2:
触发: Reviewer 审查通过
动作: 确认 DoD 是否全部满足

Hook PO3:
触发: 任何角色请求变更 Scope
动作: PO 必须批准或拒绝，不得忽略
```

---

## Hook 优先级

当多个 Hook 同时触发时，按以下优先级执行：

1. **阻塞类 Hook**（必须先完成才能继续）
2. **质疑类 Hook**（Challenger, Design Authority）
3. **执行类 Hook**（Developer, Reviewer）

---

## 违规处理

如果 Hook 被跳过：

1. **Reviewer 应在审查中指出**
2. **PO 有权要求补充缺失的步骤**
3. **严重违规可导致任务回退**

---

## 示例场景

### 场景 1: 正常流程

```
1. /team boris 实现用户认证功能
2. [Hook G1] → PO 初始化 Spec
3. [Hook A1] → Architect 设计方案
4. [Hook C1 + D1] → Challenger 和 Design Authority 并行质疑
5. [Hook A2] → Architect 回应质疑
6. [Hook DEV1] → Developer 实现
7. [Hook R1] → Reviewer 审查
8. [Hook R3] → Reviewer 验证 Session 日志
9. [Hook G2] → PO 确认完成
```

### 场景 2: 设计变更

```
1. Developer 实现中发现需要调整设计
2. [Hook DEV2] → 停止，回到 Architect
3. Architect 更新 Spec
4. [Hook C2 + D2] → Challenger 和 DA 复审变更部分
5. [Hook A2] → Architect 回应
6. Developer 继续实现
```

### 场景 3: 审查不通过

```
1. Reviewer 发现问题
2. [Hook R2] → 返回 Developer
3. Developer 修复
4. [Hook R1] → Reviewer 重新审查
5. 通过后 [Hook G2] → PO 确认
```

---

## 参考

- TEAM-003-boris-team.yaml
- STD-009-team-output.md
