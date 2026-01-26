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
  trail: Point[]
  targetAngle: number
  angleChangeCountdown: number
  stuckFrames: number
  isShaking: boolean
  /** 粒子是否隐藏（爆裂后等待重组） */
  isHidden: boolean
  /** 重组目标位置 */
  reuniteTarget: Point | null
}

export interface Fragment {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  life: number
  maxLife: number
  parentId: number
  reuniteTarget: Point
}

/**
 * Create a new particle
 */
export function createParticle(
  id: number,
  bounds: { width: number; height: number },
  config: ParticleConfig
): Particle {
  const margin = config.margin
  const x = margin + Math.random() * (bounds.width - margin * 2)
  const y = margin + Math.random() * (bounds.height - margin * 2)

  // Random initial velocity (mostly horizontal for header)
  const angle = Math.random() * Math.PI * 2
  const speed = 1 + Math.random() * 2

  return {
    id,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed * 0.3, // Reduce vertical movement
    radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
    color: config.colors[id % config.colors.length],
    trail: [],
    targetAngle: angle,
    angleChangeCountdown: 60 + Math.random() * 60,
    stuckFrames: 0,
    isShaking: false,
    isHidden: false,
    reuniteTarget: null,
  }
}

/**
 * Create a fragment from exploded particle
 */
export function createFragment(
  particle: Particle,
  index: number,
  reuniteTarget: Point
): Fragment {
  // Evenly distribute fragments in a circle (3 fragments = 120° apart)
  const baseAngle = (index / 3) * Math.PI * 2
  const angle = baseAngle + (Math.random() - 0.5) * 0.5 // Add some randomness
  const speed = 4 + Math.random() * 3

  return {
    x: particle.x,
    y: particle.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: particle.radius * 0.5,
    color: particle.color,
    life: 70 + Math.random() * 20,
    maxLife: 90,
    parentId: particle.id,
    reuniteTarget,
  }
}
