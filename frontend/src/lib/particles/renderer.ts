/**
 * Particle Renderer
 * Canvas 2D rendering for particles
 */

import type { ParticleEngine } from './engine'

/**
 * Render particles and fragments to canvas
 */
export function renderEngine(
  ctx: CanvasRenderingContext2D,
  engine: ParticleEngine
): void {
  const { particles, fragments, config } = engine

  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Render particle trails (skip hidden particles)
  for (const p of particles) {
    if (p.isHidden) continue
    if (p.trail.length > 1) {
      ctx.beginPath()
      ctx.moveTo(p.trail[0].x, p.trail[0].y)

      for (let i = 1; i < p.trail.length; i++) {
        ctx.lineTo(p.trail[i].x, p.trail[i].y)
      }

      // Trail gradient - thinner and more transparent at the end
      const gradient = ctx.createLinearGradient(
        p.trail[0].x, p.trail[0].y,
        p.x, p.y
      )

      // Extract base color without alpha
      const baseColor = p.color.replace(/[\d.]+\)$/, '')
      gradient.addColorStop(0, baseColor + '0)')
      gradient.addColorStop(1, baseColor + '0.3)')

      ctx.strokeStyle = gradient
      ctx.lineWidth = p.radius * 0.5
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }

  // Render particles (skip hidden particles)
  for (const p of particles) {
    if (p.isHidden) continue

    ctx.beginPath()

    // Shake effect
    let x = p.x
    let y = p.y
    if (p.isShaking) {
      x += (Math.random() - 0.5) * 4
      y += (Math.random() - 0.5) * 4
    }

    ctx.arc(x, y, p.radius, 0, Math.PI * 2)

    // Soft glow effect
    ctx.shadowBlur = 8
    ctx.shadowColor = p.color

    ctx.fillStyle = p.color
    ctx.fill()

    // Reset shadow
    ctx.shadowBlur = 0
  }

  // Render fragments
  for (const f of fragments) {
    const alpha = f.life / f.maxLife
    ctx.beginPath()
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2)

    // Fade out as life decreases
    const baseColor = f.color.replace(/[\d.]+\)$/, '')
    ctx.fillStyle = baseColor + (alpha * 0.6) + ')'
    ctx.fill()
  }
}
