/**
 * Particle Physics Engine
 * Based on SPEC-006 and SPEC-012
 */

import type { ParticleConfig } from './config'
import type { Particle, Fragment, Point } from './particle'
import { createParticle, createFragment } from './particle'

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
 * Main physics update loop
 */
export function updateEngine(engine: ParticleEngine): void {
  const { particles, fragments, config, bounds, mousePos } = engine
  const margin = config.margin

  // Update particles
  for (const p of particles) {
    // Skip hidden particles (waiting for fragments to reunite)
    if (p.isHidden) {
      continue
    }

    // Store trail point
    if (config.tailLength > 0) {
      p.trail.push({ x: p.x, y: p.y })
      while (p.trail.length > config.tailLength) {
        p.trail.shift()
      }
    }

    // Autonomous movement - mostly horizontal for header
    p.angleChangeCountdown--
    if (p.angleChangeCountdown <= 0) {
      // Bias towards horizontal movement
      const horizontalBias = (Math.random() - 0.5) * Math.PI * 0.3 // ±27 degrees
      p.targetAngle = Math.random() > 0.5 ? horizontalBias : Math.PI + horizontalBias
      p.angleChangeCountdown = 40 + Math.random() * 80
    }

    // Gradually turn towards target angle
    const currentAngle = Math.atan2(p.vy, p.vx)
    let angleDiff = p.targetAngle - currentAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    const turnSpeed = 0.02
    const newAngle = currentAngle + angleDiff * turnSpeed
    const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const targetSpeed = 1.5

    if (currentSpeed < targetSpeed) {
      p.vx += Math.cos(newAngle) * 0.1
      p.vy += Math.sin(newAngle) * 0.05 // Less vertical acceleration
    }

    // Mouse repulsion
    if (mousePos) {
      const dx = p.x - mousePos.x
      const dy = p.y - mousePos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < config.repelRadius && dist > 0) {
        const ratio = 1 - dist / config.repelRadius
        const force = ratio * ratio * config.repelForce * 1.5
        p.vx += (dx / dist) * force
        p.vy += (dy / dist) * force
        p.stuckFrames = 0
      }
    }

    // Apply friction
    p.vx *= config.friction
    p.vy *= config.friction

    // Speed limit
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    if (speed > config.maxSpeed) {
      p.vx = (p.vx / speed) * config.maxSpeed
      p.vy = (p.vy / speed) * config.maxSpeed
    }

    // Update position
    let nextX = p.x + p.vx
    let nextY = p.y + p.vy

    // Boundary collision
    let hitBoundary = false
    if (nextX < margin) {
      nextX = margin
      p.vx = Math.abs(p.vx) * 0.8
      hitBoundary = true
    } else if (nextX > bounds.width - margin) {
      nextX = bounds.width - margin
      p.vx = -Math.abs(p.vx) * 0.8
      hitBoundary = true
    }

    if (nextY < margin) {
      nextY = margin
      p.vy = Math.abs(p.vy) * 0.8
      hitBoundary = true
    } else if (nextY > bounds.height - margin) {
      nextY = bounds.height - margin
      p.vy = -Math.abs(p.vy) * 0.8
      hitBoundary = true
    }

    p.x = nextX
    p.y = nextY

    // Stuck detection (simplified for header - less likely to get stuck)
    if (hitBoundary && speed < 0.5) {
      p.stuckFrames++
    } else {
      p.stuckFrames = Math.max(0, p.stuckFrames - 1)
    }

    // Shaking phase (被困 15 帧开始颤抖)
    if (p.stuckFrames > 15) {
      p.isShaking = true
    } else {
      p.isShaking = false
    }

    // Explosion phase (被困 45 帧爆裂)
    if (p.stuckFrames > 45) {
      // Calculate reunite target - somewhere safe in the canvas
      const reuniteTarget = {
        x: margin + Math.random() * (bounds.width - margin * 2),
        y: margin + Math.random() * (bounds.height - margin * 2),
      }

      // Create fragments that will fly out then reunite
      for (let i = 0; i < 3; i++) {
        fragments.push(createFragment(p, i, reuniteTarget))
      }

      // Hide particle until fragments reunite
      p.isHidden = true
      p.reuniteTarget = reuniteTarget
      p.stuckFrames = 0
      p.isShaking = false
      p.trail = []
    }
  }

  // Update fragments
  for (let i = fragments.length - 1; i >= 0; i--) {
    const f = fragments[i]

    // Phase 1: Fly outward (first 20 frames)
    // Phase 2: Return to reunite target
    const flyOutPhase = f.maxLife - f.life < 20

    if (flyOutPhase) {
      // Keep flying outward with initial velocity
      f.vx *= 0.96
      f.vy *= 0.96
    } else {
      // Move towards reunite target
      const dx = f.reuniteTarget.x - f.x
      const dy = f.reuniteTarget.y - f.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 3) {
        // Accelerate towards target
        const accel = 0.4
        f.vx += (dx / dist) * accel
        f.vy += (dy / dist) * accel
      }

      f.vx *= 0.92
      f.vy *= 0.92
    }

    f.x += f.vx
    f.y += f.vy
    f.life--

    // Check if fragment reached target or expired
    const dx = f.reuniteTarget.x - f.x
    const dy = f.reuniteTarget.y - f.y
    const distToTarget = Math.sqrt(dx * dx + dy * dy)

    if (f.life <= 0 || distToTarget < 5) {
      fragments.splice(i, 1)
    }
  }

  // Check if hidden particles can be restored (all their fragments reunited)
  for (const p of particles) {
    if (p.isHidden && p.reuniteTarget) {
      // Check if any fragments still belong to this particle
      const hasFragments = fragments.some(f => f.parentId === p.id)

      if (!hasFragments) {
        // All fragments reunited - restore particle at reunite target
        p.x = p.reuniteTarget.x
        p.y = p.reuniteTarget.y
        p.vx = (Math.random() - 0.5) * 2
        p.vy = (Math.random() - 0.5) * 0.5
        p.isHidden = false
        p.reuniteTarget = null
        p.trail = []
      }
    }
  }
}
