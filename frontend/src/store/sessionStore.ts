/**
 * Session state management using Zustand
 *
 * 适配 5-phase 执行模型
 */

import { create } from 'zustand'
import type { AgentSession, LegacyExecutionPhase } from '../types/agent'

interface SessionState {
  session: AgentSession | null
  selectedPhaseId: string | null
  expandedPhaseIds: Set<string>
  lockedPhaseIds: Set<string>

  // Actions
  setSession: (session: AgentSession | null) => void
  selectPhase: (phaseId: string | null) => void
  togglePhaseExpanded: (phaseId: string) => void
  togglePhaseLocked: (phaseId: string) => void
  updatePhase: (phase: LegacyExecutionPhase) => void

  // Computed
  getSelectedPhase: () => LegacyExecutionPhase | null
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  selectedPhaseId: null,
  expandedPhaseIds: new Set(),
  lockedPhaseIds: new Set(),

  setSession: (session) => set({
    session,
    selectedPhaseId: null,
    expandedPhaseIds: new Set(),
    lockedPhaseIds: new Set(),
  }),

  selectPhase: (phaseId) => set((state) => {
    // 选择阶段时，确保该阶段保持展开状态
    if (phaseId && !state.expandedPhaseIds.has(phaseId)) {
      const newExpanded = new Set(state.expandedPhaseIds)
      newExpanded.add(phaseId)
      return { selectedPhaseId: phaseId, expandedPhaseIds: newExpanded }
    }
    return { selectedPhaseId: phaseId }
  }),

  togglePhaseExpanded: (phaseId) => set((state) => {
    const newExpanded = new Set(state.expandedPhaseIds)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    return { expandedPhaseIds: newExpanded }
  }),

  togglePhaseLocked: (phaseId) => set((state) => {
    const newLocked = new Set(state.lockedPhaseIds)
    if (newLocked.has(phaseId)) {
      newLocked.delete(phaseId)
    } else {
      newLocked.add(phaseId)
    }
    return { lockedPhaseIds: newLocked }
  }),

  updatePhase: (updatedPhase) => set((state) => {
    if (!state.session || !state.session.phases) return state
    const newPhases = state.session.phases.map((phase) =>
      phase.phase_id === updatedPhase.phase_id ? updatedPhase : phase
    )
    return {
      session: { ...state.session, phases: newPhases },
    }
  }),

  getSelectedPhase: () => {
    const { session, selectedPhaseId } = get()
    if (!session || !selectedPhaseId || !session.phases) return null
    return session.phases.find((p) => p.phase_id === selectedPhaseId) || null
  },
}))
