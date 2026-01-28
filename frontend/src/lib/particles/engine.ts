/**
 * Particle Physics Engine
 * 参考 Next 项目的实现
 */

import type { ParticleConfig } from './config'
import type { Particle, Fragment, Point } from './particle'
import { createParticle, createFragment } from './particle'

// 恐惧与爆炸配置 - 参考 Next 项目
const FEAR_THRESHOLD = 15      // 开始颤抖
const EXPLODE_THRESHOLD = 45   // 分裂

export interface ParticleEngine {
  particles: Particle[]
  fragments: Fragment[]
  config: ParticleConfig
  bounds: { width: number; height: number }
  mousePos: Point | null
}

/**
 * Initialize particle engine
 */
export function createEngine(
  bounds: { width: number; height: number },
  config: ParticleConfig
): ParticleEngine {
  const particles: Particle[] = []

  for (let i = 0; i < config.particleCount; i++) {
    particles.push(createParticle(i, bounds, config))
  }

  return {
    particles,
    fragments: [],
    config,
    bounds,
    mousePos: null,
  }
}

/**
 * Update engine bounds (on resize)
 */
export function updateBounds(
  engine: ParticleEngine,
  bounds: { width: number; height: number }
): void {
  engine.bounds = bounds

  // Clamp particles to new bounds
  const margin = engine.config.margin
  for (const p of engine.particles) {
    p.x = Math.max(margin, Math.min(bounds.width - margin, p.x))
    p.y = Math.max(margin, Math.min(bounds.height - margin, p.y))
  }
}

/**
 * Update mouse position
 */
export function updateMousePos(engine: ParticleEngine, pos: Point | null): void {
  engine.mousePos = pos
}

/**
 * 检测是否被困在边缘 - 参考 Next 项目
 * 条件：靠近边缘 AND 鼠标靠近粒子
 */
function isStuckAtEdge(
  p: Particle,
  mousePos: Point | null,
  bounds: { width: number; height: number },
  config: ParticleConfig
): boolean {
  const edgeMargin = p.radius + 5

  // 检测是否靠近边缘
  const nearEdge = p.x < edgeMargin ||
                   p.x > bounds.width - edgeMargin ||
                   p.y < edgeMargin ||
                   p.y > bounds.height - edgeMargin

  // 检测鼠标是否靠近
  if (!mousePos) return false

  const dx = p.x - mousePos.x
  const dy = p.y - mousePos.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const nearMouse = dist < config.repelRadius + 20

  return nearEdge && nearMouse
}

/**
 * 爆炸分裂 - 参考 Next 项目
 */
function explodeParticle(
  engine: ParticleEngine,
  particle: Particle,
  particleIndex: number
): void {
  // 创建 3 个碎片
  for (let i = 0; i < 3; i++) {
    engine.fragments.push(
      createFragment(particle, i, particleIndex, engine.config.colors)
    )
  }
  // 移除原粒子
  engine.particles.splice(particleIndex, 1)
}

/**
 * 碎片汇合重组 - 参考 Next 项目
 */
function reuniteFragments(engine: ParticleEngine): void {
  // 按 parentIndex 分组
  const groups: { [key: number]: { fragment: Fragment; index: number }[] } = {}

  engine.fragments.forEach((f, i) => {
    if (!groups[f.parentIndex]) groups[f.parentIndex] = []
    groups[f.parentIndex].push({ fragment: f, index: i })
  })

  const toRemove: number[] = []

  for (const parentIndex in groups) {
    const group = groups[parentIndex]

    // 检查所有碎片是否都到期
    const allExpired = group.every(g => g.fragment.life <= 0)

    if (allExpired && group.length > 0) {
      // 计算汇合中心点
      let cx = 0, cy = 0
      group.forEach(g => {
        cx += g.fragment.x
        cy += g.fragment.y
      })
      cx /= group.length
      cy /= group.length

      // 创建新粒子
      const newParticle = createParticle(
        engine.particles.length,
        engine.bounds,
        engine.config,
        cx,
        cy
      )
      newParticle.vx = (Math.random() - 0.5) * 3
      newParticle.vy = (Math.random() - 0.5) * 3
      engine.particles.push(newParticle)

      // 标记要移除的碎片
      group.forEach(g => toRemove.push(g.index))
    }
  }

  // 从后往前移除
  toRemove.sort((a, b) => b - a)
  toRemove.forEach(i => engine.fragments.splice(i, 1))
}

/**
 * Main physics update loop
 */
export function updateEngine(engine: ParticleEngine): void {
  const { particles, fragments, config, bounds, mousePos } = engine

  // 复制数组避免 splice 问题
  const particlesToProcess = particles.slice()

  for (let i = 0; i < particlesToProcess.length; i++) {
    const p = particlesToProcess[i]
    // 找到当前实际索引
    const actualIndex = particles.indexOf(p)
    if (actualIndex === -1) continue // 已被移除

    // 计算当前速度
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)

    // 动态尾巴长度：基础长度 + 速度加成
    const dynamicTailLength = Math.max(5, Math.min(config.tailLength, Math.floor(5 + speed * 2)))

    p.trail.push({ x: p.x, y: p.y })
    while (p.trail.length > dynamicTailLength) p.trail.shift()

    // 检测是否被困 - 关键：同时满足靠近边缘和鼠标靠近
    if (isStuckAtEdge(p, mousePos, bounds, config)) {
      p.stuckTime++

      if (p.stuckTime > FEAR_THRESHOLD) {
        p.isShaking = true
        p.shakeOffset.x = (Math.random() - 0.5) * 3
        p.shakeOffset.y = (Math.random() - 0.5) * 3
      }

      if (p.stuckTime > EXPLODE_THRESHOLD) {
        explodeParticle(engine, p, actualIndex)
        continue // 粒子已移除，跳过后续处理
      }
    } else {
      p.stuckTime = Math.max(0, p.stuckTime - 2)
      p.isShaking = false
      p.shakeOffset.x = 0
      p.shakeOffset.y = 0
    }

    // 鼠标排斥
    if (mousePos) {
      const dx = p.x - mousePos.x
      const dy = p.y - mousePos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < config.repelRadius && dist > 0) {
        const force = (config.repelRadius - dist) / config.repelRadius * config.repelForce * 0.1
        p.vx += (dx / dist) * force
        p.vy += (dy / dist) * force
      }
    }

    // 自主移动：缓慢转向目标角度
    p.angleChangeCountdown--
    if (p.angleChangeCountdown <= 0) {
      p.targetAngle = Math.random() * Math.PI * 2
      p.angleChangeCountdown = 100 + Math.random() * 150
    }

    const currentAngle = Math.atan2(p.vy, p.vx)
    let angleDiff = p.targetAngle - currentAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    const turnSpeed = 0.015
    const newAngle = currentAngle + angleDiff * turnSpeed

    if (speed < 1.5) {
      p.vx += Math.cos(newAngle) * 0.05
      p.vy += Math.sin(newAngle) * 0.05
    }

    // 应用摩擦力
    p.vx *= config.friction
    p.vy *= config.friction

    // 速度限制
    if (speed > config.maxSpeed) {
      p.vx = (p.vx / speed) * config.maxSpeed
      p.vy = (p.vy / speed) * config.maxSpeed
    }

    // 更新位置
    p.x += p.vx
    p.y += p.vy

    // 边界碰撞
    const margin = config.margin
    if (p.x < margin) {
      p.x = margin
      p.vx = Math.abs(p.vx) * 0.8
    } else if (p.x > bounds.width - margin) {
      p.x = bounds.width - margin
      p.vx = -Math.abs(p.vx) * 0.8
    }

    if (p.y < margin) {
      p.y = margin
      p.vy = Math.abs(p.vy) * 0.8
    } else if (p.y > bounds.height - margin) {
      p.y = bounds.height - margin
      p.vy = -Math.abs(p.vy) * 0.8
    }

    p.targetAngle = Math.atan2(p.vy, p.vx)
  }

  // 更新碎片
  for (const f of fragments) {
    // 记录尾巴
    f.trail.push({ x: f.x, y: f.y })
    if (f.trail.length > 8) f.trail.shift()

    // 无视鼠标时间递减
    if (f.ignoreMouseTime > 0) {
      f.ignoreMouseTime--
    } else if (mousePos) {
      // 鼠标排斥
      const dx = f.x - mousePos.x
      const dy = f.y - mousePos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < config.repelRadius && dist > 0) {
        const force = (config.repelRadius - dist) / config.repelRadius * 0.5
        f.vx += (dx / dist) * force
        f.vy += (dy / dist) * force
      }
    }

    // 摩擦力
    f.vx *= 0.98
    f.vy *= 0.98

    // 更新位置
    f.x += f.vx
    f.y += f.vy

    // 生命递减
    f.life--

    // 边界碰撞
    const margin = config.margin
    if (f.x < margin) {
      f.x = margin
      f.vx = Math.abs(f.vx)
    } else if (f.x > bounds.width - margin) {
      f.x = bounds.width - margin
      f.vx = -Math.abs(f.vx)
    }

    if (f.y < margin) {
      f.y = margin
      f.vy = Math.abs(f.vy)
    } else if (f.y > bounds.height - margin) {
      f.y = bounds.height - margin
      f.vy = -Math.abs(f.vy)
    }
  }

  // 检查碎片汇合
  reuniteFragments(engine)
}
