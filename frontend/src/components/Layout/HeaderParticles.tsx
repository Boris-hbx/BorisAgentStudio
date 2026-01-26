/**
 * HeaderParticles - Interactive particle background for Header
 * Based on SPEC-012
 */

import { useEffect, useRef, useCallback } from 'react'
import {
  createEngine,
  updateEngine,
  updateBounds,
  updateMousePos,
  renderEngine,
  DEFAULT_HEADER_CONFIG,
  type ParticleEngine,
} from '../../lib/particles'
import './HeaderParticles.css'

interface HeaderParticlesProps {
  enabled?: boolean
}

export function HeaderParticles({ enabled = true }: HeaderParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<ParticleEngine | null>(null)
  const animationRef = useRef<number>(0)
  const isVisibleRef = useRef(true)

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Animation loop
  const animate = useCallback(() => {
    if (!engineRef.current || !canvasRef.current || !isVisibleRef.current) {
      animationRef.current = requestAnimationFrame(animate)
      return
    }

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    updateEngine(engineRef.current)
    renderEngine(ctx, engineRef.current)

    animationRef.current = requestAnimationFrame(animate)
  }, [])

  // Handle mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!engineRef.current || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Only apply if mouse is within canvas bounds
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      updateMousePos(engineRef.current, { x, y })
    } else {
      updateMousePos(engineRef.current, null)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (engineRef.current) {
      updateMousePos(engineRef.current, null)
    }
  }, [])

  // Handle resize
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return

    const parent = canvasRef.current.parentElement
    if (!parent) return

    const width = parent.clientWidth
    const height = parent.clientHeight

    // Update canvas size (with device pixel ratio for sharpness)
    const dpr = window.devicePixelRatio || 1
    canvasRef.current.width = width * dpr
    canvasRef.current.height = height * dpr
    canvasRef.current.style.width = `${width}px`
    canvasRef.current.style.height = `${height}px`

    const ctx = canvasRef.current.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    updateBounds(engineRef.current, { width, height })
  }, [])

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = !document.hidden
  }, [])

  // Initialize
  useEffect(() => {
    if (!enabled || prefersReducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    // Initialize canvas size
    const width = parent.clientWidth
    const height = parent.clientHeight

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    // Create engine
    engineRef.current = createEngine({ width, height }, DEFAULT_HEADER_CONFIG)

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    parent.addEventListener('mouseleave', handleMouseLeave)

    // ResizeObserver for more accurate resize detection
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(parent)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      parent.removeEventListener('mouseleave', handleMouseLeave)
      resizeObserver.disconnect()
    }
  }, [enabled, prefersReducedMotion, animate, handleMouseMove, handleMouseLeave, handleResize, handleVisibilityChange])

  if (!enabled || prefersReducedMotion) {
    return null
  }

  return <canvas ref={canvasRef} className="header-particles" />
}
