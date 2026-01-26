/**
 * Particle System
 * Interactive particle effects for header and other areas
 */

export { DEFAULT_HEADER_CONFIG } from './config'
export type { ParticleConfig } from './config'

export { createParticle, createFragment } from './particle'
export type { Particle, Fragment, Point } from './particle'

export { createEngine, updateBounds, updateMousePos, updateEngine } from './engine'
export type { ParticleEngine } from './engine'

export { renderEngine } from './renderer'
