# SPEC-008: 循环流程可视化

> 作者: Boris Huai
> 起草日期: 2026-01-25
> 状态: 草稿

---

## 1. 背景与动机

在 Code Agent 的 5-phase 执行模型中，存在一个重要的循环机制：

```
规划 (Plan) → 执行 (Execute) → [失败] → 重新规划 (Plan) → 重新执行 (Execute) → ...
```

当执行阶段失败时，Agent 可能会返回规划阶段重新制定策略，然后再次执行。这个循环可能执行多次，直到成功或达到最大重试次数。

**当前问题**：现有可视化只展示线性流程，无法体现这种循环重试机制。

---

## 2. 目标

1. **可视化循环流程**：在 Plan → Execute 之间添加循环箭头
2. **区分执行状态**：通过颜色区分循环是否被执行
3. **展示执行次数**：在箭头下方显示循环执行次数
4. **提供交互查看**：点击循环箭头可查看每次循环的详情

---

## 3. 视觉设计

### 3.1 循环箭头位置

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  理解    │ →  │  探索    │ →  │  规划    │ →  │  执行    │ →  │  验证    │
│ Understand│    │ Explore  │    │  Plan    │    │ Execute  │    │ Verify   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                      ↑              │
                                      │    ╭────╮    │
                                      └────│ 0  │────┘
                                           ╰────╯
                                        循环箭头
```

循环箭头从 Execute 底部出发，绕过下方，指向 Plan 的底部。

### 3.2 颜色状态

| 状态 | 箭头颜色 | 数字 | 说明 |
|------|---------|------|------|
| 未执行 | 灰色 `#6b7280` | 0 | 循环从未触发，Execute 一次成功 |
| 已执行 | 蓝色 `#3b82f6` | 1+ | 循环执行了 N 次 |
| 正在循环 | 蓝色脉冲动画 | N | 当前正在进行第 N+1 次尝试 |

### 3.3 数字徽章设计

```css
.loop-badge {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);

  min-width: 18px;
  height: 18px;
  border-radius: 9px;

  font-size: 0.6875rem;
  font-weight: 600;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* 未执行状态 */
.loop-badge.inactive {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

/* 已执行状态 */
.loop-badge.active {
  background: var(--accent);
  color: white;
}
```

### 3.4 SVG 路径设计

循环箭头采用弧形路径，从 Execute 节点下方出发，绕一个弧形回到 Plan 节点下方：

```tsx
<svg className="loop-arrow" viewBox="0 0 200 60">
  {/* 弧形路径：从右侧起点到左侧终点 */}
  <path
    d="M 180 0
       C 180 40, 20 40, 20 0"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeDasharray={inactive ? "4 4" : "none"}
  />

  {/* 箭头头部 */}
  <polygon
    points="20,0 15,8 25,8"
    fill="currentColor"
    transform="rotate(-90 20 0)"
  />
</svg>
```

---

## 4. 数据模型

### 4.1 ExecutionPhase 扩展

在 `ExecutionPhase` 接口中添加循环相关字段：

```typescript
export interface ExecutionPhase {
  // ... 现有字段 ...

  /**
   * 循环执行信息（仅 plan/execute 阶段使用）
   */
  loop_info?: {
    /** 当前是第几次尝试（从 1 开始） */
    attempt_number: number

    /** 最大重试次数限制 */
    max_attempts: number

    /** 是否因循环而触发（非首次执行） */
    is_retry: boolean

    /** 前一次尝试的 phase_id（用于追溯） */
    previous_attempt_id?: string
  }
}
```

### 4.2 AgentSession 扩展

在会话级别记录循环统计：

```typescript
export interface AgentSession {
  // ... 现有字段 ...

  /**
   * 循环执行摘要
   */
  loop_summary?: {
    /** Plan → Execute 循环执行次数 */
    plan_execute_loops: number

    /** 最终是否成功 */
    loop_resolved: boolean

    /** 所有循环尝试的 phase_id 列表 */
    loop_phase_ids: string[]
  }
}
```

### 4.3 示例数据

**场景：执行失败后重试一次成功**

```json
{
  "session_id": "2026-01-25-example",
  "loop_summary": {
    "plan_execute_loops": 1,
    "loop_resolved": true,
    "loop_phase_ids": ["plan-001", "execute-001", "plan-002", "execute-002"]
  },
  "phases": [
    {
      "phase_id": "plan-001",
      "phase_type": "plan",
      "status": "success",
      "loop_info": {
        "attempt_number": 1,
        "max_attempts": 3,
        "is_retry": false
      }
    },
    {
      "phase_id": "execute-001",
      "phase_type": "execute",
      "status": "failed",
      "loop_info": {
        "attempt_number": 1,
        "max_attempts": 3,
        "is_retry": false
      }
    },
    {
      "phase_id": "plan-002",
      "phase_type": "plan",
      "status": "success",
      "loop_info": {
        "attempt_number": 2,
        "max_attempts": 3,
        "is_retry": true,
        "previous_attempt_id": "plan-001"
      }
    },
    {
      "phase_id": "execute-002",
      "phase_type": "execute",
      "status": "success",
      "loop_info": {
        "attempt_number": 2,
        "max_attempts": 3,
        "is_retry": true,
        "previous_attempt_id": "execute-001"
      }
    }
  ]
}
```

---

## 5. 组件设计

### 5.1 新组件：LoopArrow

```
frontend/src/components/Timeline/LoopArrow.tsx
frontend/src/components/Timeline/LoopArrow.css
```

**Props 接口**：

```typescript
interface LoopArrowProps {
  /** 循环执行次数（0 表示未执行） */
  loopCount: number

  /** 是否正在进行循环（用于动画） */
  isLooping: boolean

  /** 点击回调：查看循环详情 */
  onClick?: () => void
}
```

### 5.2 Timeline 组件修改

在 Plan 和 Execute 节点之间渲染 LoopArrow：

```tsx
// Timeline.tsx
{phaseType === 'execute' && (
  <LoopArrow
    loopCount={session.loop_summary?.plan_execute_loops ?? 0}
    isLooping={planPhase?.status === 'running' || executePhase?.status === 'running'}
    onClick={handleLoopClick}
  />
)}
```

### 5.3 布局调整

为容纳循环箭头，需要在 Plan-Execute 区域下方预留空间：

```css
.timeline {
  /* 现有样式 */
  padding-bottom: 60px; /* 为循环箭头预留空间 */
}

.loop-arrow-container {
  position: absolute;
  /* 定位在 Plan 和 Execute 节点下方 */
  top: 100%;
  left: 0;
  right: 0;
  height: 50px;
}
```

---

## 6. 交互设计

### 6.1 悬停提示

鼠标悬停在循环箭头上时显示 Tooltip：

- **未执行**：`"Plan → Execute 循环未触发"`
- **已执行**：`"Plan → Execute 循环执行了 N 次"`

### 6.2 点击行为

点击循环箭头打开循环详情面板，展示：

1. 每次循环尝试的时间线
2. 失败原因摘要
3. 策略调整说明

### 6.3 键盘导航

- `Tab` 可以聚焦到循环箭头
- `Enter` / `Space` 触发点击

---

## 7. 实现步骤

### Phase 1: 数据模型（基础）

1. 更新 `types/agent.ts`，添加 `loop_info` 和 `loop_summary` 类型
2. 创建示例 session 数据，包含循环场景

### Phase 2: 组件开发（核心）

1. 创建 `LoopArrow.tsx` 组件
2. 实现 SVG 弧形箭头绘制
3. 实现数字徽章
4. 添加状态样式（灰色/蓝色/动画）

### Phase 3: 集成（整合）

1. 修改 `Timeline.tsx`，在合适位置渲染 LoopArrow
2. 调整布局，预留循环箭头空间
3. 连接 Zustand store 获取循环数据

### Phase 4: 交互增强（优化）

1. 添加 Tooltip 悬停提示
2. 实现循环详情面板
3. 添加键盘导航支持

---

## 8. 边界情况

| 场景 | 处理方式 |
|------|---------|
| 没有 loop_summary 字段 | 显示灰色箭头，数字 0 |
| 循环次数超过 9 | 显示 "9+" |
| 正在循环中 | 蓝色脉冲动画 + 当前次数 |
| 达到最大重试仍失败 | 红色箭头 + 最终次数 |

---

## 9. 可访问性

1. **颜色对比**：确保灰色/蓝色与背景有足够对比度
2. **ARIA 标签**：`aria-label="Plan to Execute loop, executed N times"`
3. **焦点指示**：聚焦时显示明显的 focus ring
4. **屏幕阅读器**：正确朗读循环状态和次数

---

## 10. 未来扩展

1. **其他循环类型**：如 Execute → Verify 失败后重试
2. **循环原因分类**：区分"代码错误"、"环境问题"、"策略调整"等
3. **循环效率分析**：展示每次循环的耗时对比
4. **循环模式识别**：自动识别常见的失败-重试模式

---

## 11. 验收标准

- [ ] 循环箭头正确显示在 Plan 和 Execute 节点下方
- [ ] 未执行循环时显示灰色箭头和数字 0
- [ ] 执行过循环时显示蓝色箭头和实际次数
- [ ] 鼠标悬停显示正确的提示信息
- [ ] 动画效果流畅，不影响性能
- [ ] 响应式布局在不同屏幕尺寸下正常显示
