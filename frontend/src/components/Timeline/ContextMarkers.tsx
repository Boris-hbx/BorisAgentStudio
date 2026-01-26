/**
 * ContextMarkers - 上下文来源标识
 *
 * 在阶段节点下方显示彩色圆点，表示该阶段使用的上下文来源
 */

import type { ContextReference, ContextType } from '../../types/agent'
import { CONTEXT_TYPE_CONFIG } from '../../types/agent'
import './ContextMarkers.css'

// 默认配置，用于未知的 context type
const DEFAULT_CONFIG = { color: '#6b7280', label: '其他' }

// 安全获取 context 配置
function getConfig(type: string) {
  return CONTEXT_TYPE_CONFIG[type as ContextType] || DEFAULT_CONFIG
}

interface ContextMarkersProps {
  contexts?: ContextReference[]
  maxVisible?: number
}

export function ContextMarkers({ contexts, maxVisible = 5 }: ContextMarkersProps) {
  if (!contexts || contexts.length === 0) {
    return (
      <div className="context-markers">
        <span className="empty-marker" title="该阶段未使用外部上下文" />
      </div>
    )
  }

  const visible = contexts.slice(0, maxVisible)
  const overflow = contexts.length - maxVisible

  return (
    <div className="context-markers">
      {visible.map((ctx, index) => {
        const config = getConfig(ctx.type)
        const tooltip = `${config.label}: ${ctx.source}${ctx.summary ? `\n${ctx.summary}` : ''}`

        return (
          <span
            key={`${ctx.type}-${index}`}
            className={`marker marker-${ctx.type}`}
            style={{ '--marker-color': config.color } as React.CSSProperties}
            title={tooltip}
          />
        )
      })}
      {overflow > 0 && (
        <span className="marker-overflow" title={`还有 ${overflow} 个上下文来源`}>
          +{overflow}
        </span>
      )}
    </div>
  )
}
