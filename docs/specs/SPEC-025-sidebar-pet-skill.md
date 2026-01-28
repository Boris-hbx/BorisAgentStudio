# SPEC-025: 侧边栏跟随小宠物 Skill

> 作者: Boris Huai
> 起草日期: 2026-01-27
> 状态: 已完成

---

## 问题陈述 (Why)

用户希望从 Next 项目中提取"跟随鼠标移动的小宠物"功能，抽象成可复用的 Skill，以便在 BorisAgentStudio 或其他项目中使用。

## 目标与成功标准 (DoD)

1. ✅ 分析 Next 项目中的小宠物实现
2. ✅ 抽象出核心逻辑，形成 SKILL 文档
3. ✅ Skill 文档符合项目规范
4. ✅ 包含清晰的使用说明和参数定义

## 非目标 (Out of Scope)

- 不在本次任务中实现该功能到 BorisAgentStudio
- 不修改 Next 项目代码

---

## 技术方案 (How)

### 源代码分析

从 Next 项目提取的关键文件：
- `frontend/templates/desktop/base.html` - JavaScript 逻辑
- `frontend/assets/css/style.css` - CSS 样式

### 核心概念

小宠物是一个垂直条状的可交互元素，固定在屏幕侧边：
- **外形**：垂直胶囊形 (宽 24px, 高 80px)
- **眼睛**：3 只眼睛，垂直排列，能表达情绪
- **位置**：fixed 定位，贴在侧边栏边缘

### 状态机

| 状态 | 触发条件 | 眼睛行为 |
|------|----------|----------|
| idle（待机） | 鼠标远离 | 微弱发光 |
| active（激活） | 鼠标进入活动区域 | 变亮 |
| following（跟随） | 鼠标移动 | 保持激活 |
| excited（兴奋） | 快速追赶 | 抖动动画 |
| returning（回归） | 鼠标离开后 | 恢复待机 |
| slim（瘦身） | 进入躲避区域 | 变小 |
| at-edge（贴边） | 侧边栏折叠 | 渐变色 |
| at-sidebar（贴侧边栏） | 侧边栏展开 | 半透明 |

### 配置参数

```json
{
  "dimensions": { "width": 24, "height": 80 },
  "behavior": {
    "activeZoneWidth": 100,
    "closeDistance": 20,
    "rushEasing": 0.3,
    "gentleEasing": 0.1,
    "returnDelay": 600
  },
  "avoidZones": [{ "top": 200, "bottom": 300 }]
}
```

---

## 交互设计 (UX)

### 鼠标交互

1. 鼠标进入活动区域 → 小宠物激活，开始注意
2. 鼠标移动 → 小宠物平滑跟随 Y 坐标
3. 鼠标快速移动 → 小宠物急速追赶，眼睛抖动
4. 鼠标离开 → 延迟后缓慢回归中央

### 点击交互

- 点击小宠物 → 切换侧边栏折叠/展开状态

---

## 风险清单与应对

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 原实现与侧边栏强耦合 | 中 | Skill 抽象为独立组件 |
| 硬编码尺寸和位置 | 中 | 所有参数可配置 |
| 可能遮挡重要 UI | 中 | 提供 avoidZones 机制 |
| 移动端不适用 | 低 | 明确标注桌面端专用 |

---

## 决策记录 (Decision Log)

### D1: Skill 格式选择

**决策**：使用 JSON 格式定义 Skill

**理由**：
- 与项目现有 Skill 格式保持一致
- 易于解析和验证
- 支持 IDE 自动补全

**替代方案**：Markdown 文档（不够结构化）、TypeScript 接口（需要编译）

### D2: 状态设计

**决策**：定义 8 种状态

**理由**：
- 完整覆盖原实现的所有行为
- 每种状态有明确的触发条件
- 便于实现者理解和扩展

---

## 产出物

| 产出 | 位置 |
|------|------|
| Skill 定义 | `skills/builtin/SKILL-009-sidebar-pet.json` |
| Spec 文档 | `docs/specs/SPEC-025-sidebar-pet-skill.md` |

---

## 参考

- 来源项目：`C:\Project\boris-workspace\Next`
- 相关 Skill：SKILL-001-interactive-particles.json
