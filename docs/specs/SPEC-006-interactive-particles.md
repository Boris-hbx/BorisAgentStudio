# SPEC-006: Interactive Particles (可交互粒子系统)

> 作者: Boris Huai
> 起草日期: 2026-01-25
> 状态: 草稿

---

## 1. 背景与动机

从 `C:\Project\boris-workspace\Next` 项目中发现一个优秀的交互设计：界面上有一群可以和鼠标互动的小球（粒子）。这些粒子具备以下特点：

- 自主游动，仿佛有生命
- 鼠标靠近时会被"推开"（排斥效果）
- 被困时会"惊恐颤抖"，最终爆裂成碎片
- 碎片会自动汇合重组

这种设计为界面增添了趣味性和生命感，值得提炼为可复用的 Skill。

---

## 2. 功能目标

### 2.1 核心功能

1. **粒子渲染** - Canvas 上绘制彩色小球
2. **自主游动** - 粒子自动移动，有随机转向行为
3. **鼠标排斥** - 鼠标靠近时粒子被推开
4. **拖尾效果** - 粒子移动时留下渐隐的轨迹
5. **边界碰撞** - 粒子在指定区域内弹跳
6. **爆裂重组** - 被困时爆裂，之后自动重组

### 2.2 可配置参数

| 参数 | 说明 | 默认值 | 范围 |
|------|------|--------|------|
| `repelRadius` | 鼠标感应半径 | 180px | 50-300 |
| `repelForce` | 排斥力度 | 12 | 1-15 |
| `maxSpeed` | 最大速度 | 10 | 5-20 |
| `friction` | 摩擦系数 | 0.97 | 0.9-0.999 |
| `tailLength` | 尾巴长度 | 5 | 0-15 |
| `particleCount` | 粒子数量 | 8 | 3-20 |

---

## 3. 技术设计

### 3.1 物理引擎

#### 鼠标排斥力计算

```
距离: dist = sqrt((px - mx)² + (py - my)²)
比率: ratio = 1 - dist / repelRadius
力度: force = ratio² × repelForce × 1.5
速度增量: vx += (dx / dist) × force
         vy += (dy / dist) × force
```

特点：距离越近，排斥力越大（二次方关系）

#### 速度控制

```
当前速度: speed = sqrt(vx² + vy²)
限速: if speed > maxSpeed → normalize to maxSpeed
摩擦: vx *= friction, vy *= friction
```

#### 边界碰撞

```
if nextX < margin → vx = |vx| × 0.8  (反弹 + 能量损耗)
if nextY < margin → vy = |vy| × 0.8
```

### 3.2 自主行为（AI）

粒子在不受鼠标影响时会自主游动：

1. 每隔 40-120 帧随机选择新的目标角度
2. 平滑转向（每帧转一小步）
3. 区分水平区域（左右游动为主）和垂直区域（自由方向）

### 3.3 爆裂重组机制

```
被困检测: 连续 N 帧贴边 + 速度极低
惊恐阶段: 15帧后开始颤抖
爆裂阶段: 45帧后分裂成3个碎片
重组阶段: 碎片生命到期后在汇合点重生
```

### 3.4 尾巴渲染

- 动态长度：速度越快尾巴越长
- 渐变透明：尾端透明度低
- 渐变粗细：尾端线条细

---

## 4. 应用场景

### 4.1 BorisAgentStudio 应用位置

| 位置 | 说明 |
|------|------|
| 顶栏背景 | L形区域的水平部分 |
| 侧边栏背景 | L形区域的垂直部分 |
| 加载状态 | 等待数据时的动效 |

### 4.2 配色方案

与现有主题协调：
- `#58a6ff` (accent blue)
- `#f97316` (orange)
- `#a855f7` (purple)
- `#22c55e` (green)

---

## 5. 实现计划

### Phase 1: 基础粒子系统
- [ ] Canvas 初始化
- [ ] 粒子创建与渲染
- [ ] 基础物理（速度、摩擦、边界）

### Phase 2: 鼠标交互
- [ ] 鼠标位置追踪
- [ ] 排斥力计算
- [ ] 逃跑行为

### Phase 3: 高级效果
- [ ] 拖尾渲染
- [ ] 自主游动 AI
- [ ] 爆裂与重组

### Phase 4: 配置与集成
- [ ] 参数配置面板
- [ ] 与主题系统集成
- [ ] 性能优化

---

## 6. 文件结构

```
frontend/src/
├── components/
│   └── Particles/
│       ├── ParticleCanvas.tsx      # React 组件封装
│       ├── ParticleCanvas.css      # 样式
│       └── index.ts
├── lib/
│   └── particles/
│       ├── engine.ts               # 物理引擎
│       ├── particle.ts             # 粒子类
│       ├── renderer.ts             # 渲染器
│       ├── config.ts               # 配置管理
│       └── index.ts
```

---

## 7. 参考资料

- 源代码: `C:\Project\boris-workspace\Next\frontend\index.html` (行 4623-5794)
- 关键函数: `createParticle`, `updateParticle`, `explodeParticle`, `reuniteFragments`

---

## 8. 验收标准

1. 粒子在指定区域自然游动
2. 鼠标靠近时粒子明显被推开
3. 粒子不会逃出边界
4. 被困时有颤抖和爆裂效果
5. 配置参数可通过 UI 调整
6. 60fps 流畅运行（20个粒子以内）
