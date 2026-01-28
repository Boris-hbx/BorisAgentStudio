/**
 * Particle System Configuration
 * Based on SPEC-012: Header Particles
 */

export interface ParticleConfig {
  /** Number of particles */
  particleCount: number
  /** Mouse repel radius in pixels */
  repelRadius: number
  /** Repel force strength */
  repelForce: number
  /** Maximum particle speed */
  maxSpeed: number
  /** Friction coefficient (0-1) */
  friction: number
  /** Trail length (number of points) */
  tailLength: number
  /** Particle colors */
  colors: string[]
  /** Minimum particle radius */
  minRadius: number
  /** Maximum particle radius */
  maxRadius: number
  /** Boundary margin in pixels */
  margin: number
}

export const DEFAULT_HEADER_CONFIG: ParticleConfig = {
  particleCount: 6,
  repelRadius: 180,
  repelForce: 12,
  maxSpeed: 10,
  friction: 0.97,
  tailLength: 12,
  colors: [
    'rgba(96, 165, 250, 0.7)',   // #60a5fa blue
    'rgba(52, 211, 153, 0.7)',   // #34d399 green
    'rgba(248, 113, 113, 0.7)', // #f87171 red
    'rgba(251, 191, 36, 0.7)',  // #fbbf24 yellow
    'rgba(167, 139, 250, 0.7)', // #a78bfa purple
    'rgba(244, 114, 182, 0.7)', // #f472b6 pink
  ],
  minRadius: 4,
  maxRadius: 7,
  margin: 4,
}
