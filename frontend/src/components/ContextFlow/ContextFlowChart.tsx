/**
 * ContextFlowChart - 上下文流转简图
 *
 * 展示上下文工程的四阶段流程：构建 → 存储 → 检索 → 优化
 * 与 5-phase 执行阶段联动高亮
 */

import { useSessionStore } from '../../store/sessionStore'
import type { PhaseType } from '../../types/agent'
import './ContextFlowChart.css'

/**
 * 上下文阶段定义
 */
type ContextStage = 'build' | 'store' | 'retrieve' | 'optimize'

interface StageInfo {
  id: ContextStage
  label: string
  items: string[]
}

const STAGES: StageInfo[] = [
  { id: 'build', label: '构建', items: ['理解需求', '任务分解'] },
  { id: 'store', label: '存储', items: ['工作记忆', '决策缓存'] },
  { id: 'retrieve', label: '检索', items: ['文件读取', '代码搜索'] },
  { id: 'optimize', label: '优化', items: ['验证结果', '总结经验'] },
]

/**
 * 5-phase 与上下文阶段的映射关系
 */
const PHASE_TO_STAGES: Record<PhaseType, ContextStage[]> = {
  understand: ['build'],
  explore: ['retrieve'],
  plan: ['build', 'store'],
  execute: ['retrieve', 'store'],
  verify: ['optimize'],
  mixed: ['build', 'retrieve'],
  unclassified: [],
}

export function ContextFlowChart() {
  const session = useSessionStore((state) => state.session)
  const expandedPhaseIds = useSessionStore((state) => state.expandedPhaseIds)

  // 计算当前激活的上下文阶段
  const activeStages = new Set<ContextStage>()

  if (session && session.phases) {
    session.phases.forEach((phase) => {
      if (expandedPhaseIds.has(phase.phase_id)) {
        const stages = PHASE_TO_STAGES[phase.phase_type] || []
        stages.forEach((stage) => activeStages.add(stage))
      }
    })
  }

  // 计算工具调用统计
  const toolStats = session
    ? {
        perception: session.tool_calls.filter((tc) => tc.tool_category === 'perception').length,
        action: session.tool_calls.filter((tc) => tc.tool_category === 'action').length,
      }
    : { perception: 0, action: 0 }

  return (
    <div className="context-flow-chart">
      <div className="flow-stages">
        {STAGES.map((stage, index) => (
          <div key={stage.id} className="stage-wrapper">
            <div className={`stage ${activeStages.has(stage.id) ? 'active' : ''}`}>
              <div className="stage-header">{stage.label}</div>
              <div className="stage-items">
                {stage.items.map((item) => (
                  <div key={item} className="stage-item">
                    {item}
                  </div>
                ))}
                {/* 检索阶段显示工具统计 */}
                {stage.id === 'retrieve' && toolStats.perception > 0 && (
                  <div className="stage-stat">
                    <span className="stat-dot perception" />
                    {toolStats.perception} 次读取
                  </div>
                )}
                {/* 存储阶段显示写入统计 */}
                {stage.id === 'store' && toolStats.action > 0 && (
                  <div className="stage-stat">
                    <span className="stat-dot action" />
                    {toolStats.action} 次写入
                  </div>
                )}
              </div>
            </div>
            {index < STAGES.length - 1 && (
              <div
                className={`flow-arrow ${
                  activeStages.has(stage.id) && activeStages.has(STAGES[index + 1].id)
                    ? 'active'
                    : ''
                }`}
              >
                <svg viewBox="0 0 24 12" className="arrow-svg">
                  <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
                  <polygon points="18,2 24,6 18,10" fill="currentColor" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部联动提示 */}
      {activeStages.size > 0 && (
        <div className="flow-hint">
          <span className="hint-line" />
          <span className="hint-text">当前阶段关联</span>
        </div>
      )}
    </div>
  )
}
