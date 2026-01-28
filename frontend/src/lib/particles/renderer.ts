/**
 * Particle Renderer
 * 参考 Next 项目的 drawParticle 实现
 */

import type { ParticleEngine } from './engine'
import type { Particle, Fragment } from './particle'

/**
 * 绘制单个粒子 - 参考 Next 项目
 */
function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const drawX = p.x + p.shakeOffset.x
  const drawY = p.y + p.shakeOffset.y

  // 平滑彗星尾巴效果：使用渐变路径
  if (p.trail.length > 2) {
    // 从尾部到头部绘制平滑渐变
    for (let i = 1; i < p.trail.length; i++) {
      const t0 = p.trail[i - 1]
      const t1 = p.trail[i]
      const progress = i / p.trail.length

      // 线条宽度：从细到粗
      const width0 = p.radius * 2 * (progress - 1 / p.trail.length) * 0.9
      const width1 = p.radius * 2 * progress * 0.9

      // 透明度：从淡到浓，使用三次方让渐变更平滑
      const alpha = p.alpha * progress * progress * progress * 0.6

      // 绘制渐变线段
      ctx.beginPath()
      ctx.moveTo(t0.x, t0.y)
      ctx.lineTo(t1.x, t1.y)
      ctx.strokeStyle = p.color
      ctx.lineWidth = Math.max(1, (width0 + width1) / 2)
      ctx.lineCap = 'round'
      ctx.globalAlpha = alpha
      ctx.stroke()
    }

    // 连接尾巴末端到球体，确保平滑过渡
    if (p.trail.length > 0) {
      const lastTrail = p.trail[p.trail.length - 1]
      ctx.beginPath()
      ctx.moveTo(lastTrail.x, lastTrail.y)
      ctx.lineTo(drawX, drawY)
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.radius * 1.6
      ctx.lineCap = 'round'
      ctx.globalAlpha = p.alpha * 0.5
      ctx.stroke()
    }
  }

  // 主球体（震动时带红色光晕）
  ctx.beginPath()
  ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2)
  ctx.fillStyle = p.color
  ctx.globalAlpha = p.alpha
  ctx.shadowColor = p.isShaking ? '#ff0000' : p.color
  ctx.shadowBlur = p.isShaking ? 15 : 10
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

/**
 * 绘制碎片 - 参考 Next 项目
 */
function drawFragment(
  ctx: CanvasRenderingContext2D,
  f: Fragment,
  reuniteDelay: number
): void {
  // 尾巴
  for (let i = 0; i < f.trail.length; i++) {
    const t = f.trail[i]
    const progress = i / f.trail.length
    ctx.beginPath()
    ctx.arc(t.x, t.y, f.radius * progress * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = f.color
    ctx.globalAlpha = f.alpha * progress * 0.4
    ctx.fill()
  }

  // 碎片主体
  ctx.beginPath()
  ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2)
  ctx.fillStyle = f.color
  ctx.globalAlpha = f.alpha * (f.life / reuniteDelay)
  ctx.shadowColor = f.color
  ctx.shadowBlur = 8
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

/**
 * Render particles and fragments to canvas
 */
export function renderEngine(
  ctx: CanvasRenderingContext2D,
  engine: ParticleEngine
): void {
  const { particles, fragments } = engine

  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // 绘制粒子
  for (const p of particles) {
    drawParticle(ctx, p)
  }

  // 绘制碎片
  for (const f of fragments) {
    drawFragment(ctx, f, 60)
  }
}
