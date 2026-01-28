/**
 * Particle class for interactive particle system
 * Based on SPEC-006 and SPEC-012
 */

import type { ParticleConfig } from './config'

export interface Point {
  x: number
  y: number
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  trail: Point[]
  targetAngle: number
  angleChangeCountdown: number
  stuckTime: number
  isShaking: boolean
  /** 震动偏移 */
  shakeOffset: Point
}

export interface Fragment {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  trail: Point[]
  life: number
  maxLife: number
  parentIndex: number
  ignoreMouseTime: number
}

/**
 * Create a new particle
 */
export function createParticle(
  id: number,
  bounds: { width: number; height: number },
  config: ParticleConfig,
  x?: number,
  y?: number
): Particle {
  // 大部分粒子生成在顶栏区域
  const spawnX = x ?? Math.random() * bounds.width
  const spawnY = y ?? Math.random() * bounds.height

  // 初始速度：主要水平方向
  const baseAngle = Math.random() < 0.5 ? 0 : Math.PI
  const angle = baseAngle + (Math.random() - 0.5) * Math.PI / 3
  const speed = 1.5 + Math.random() * 1.0

  return {
    id,
    x: spawnX,
    y: spawnY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
    color: config.colors[id % config.colors.length],
    alpha: 0.7 + Math.random() * 0.2,
    trail: [],
    targetAngle: angle,
    angleChangeCountdown: 100 + Math.random() * 150,
    stuckTime: 0,
    isShaking: false,
    shakeOffset: { x: 0, y: 0 },
  }
}

/**
 * Create a fragment from exploded particle
 * 参考 Next 项目的 explodeParticle
 */
export function createFragment(
  particle: Particle,
  fragmentIndex: number,
  parentIndex: number,
  colors: string[]
): Fragment {
  // 参考 Next 项目: 3个碎片均匀分布，使用不同颜色
  const angle = (Math.PI * 2 / 3) * fragmentIndex + Math.random() * 0.5
  const speed = 3 + Math.random() * 2  // 参考 Next: 3-5 速度
  const fragmentColor = colors[(parentIndex + fragmentIndex * 2) % colors.length]

  return {
    x: particle.x,
    y: particle.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: particle.radius * 0.5,
    color: fragmentColor,
    alpha: 0.9,
    trail: [],
    life: 60,  // 参考 reuniteDelay = 60
    maxLife: 60,
    parentIndex,
    ignoreMouseTime: 40,  // 参考 Next: 无视鼠标的时间
  }
}
