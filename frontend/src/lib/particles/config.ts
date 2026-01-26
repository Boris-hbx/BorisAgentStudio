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
  particleCount: 4,
  repelRadius: 120,
  repelForce: 8,
  maxSpeed: 6,
  friction: 0.97,
  tailLength: 3,
  colors: [
    'rgba(88, 166, 255, 0.6)',   // accent blue
    'rgba(249, 115, 22, 0.5)',   // orange
    'rgba(168, 85, 247, 0.5)',   // purple
    'rgba(34, 197, 94, 0.5)',    // green
  ],
  minRadius: 4,
  maxRadius: 8,
  margin: 12,
}
