/**
 * InsightTabs - 洞察维度切换 Tab
 */

import type { InsightDimension, InsightData } from '../../types/insight'
import { DIMENSION_CONFIGS } from '../../types/insight'

interface InsightTabsProps {
  activeDimension: InsightDimension
  onDimensionChange: (dimension: InsightDimension) => void
  data: InsightData | null
}

export function InsightTabs({ activeDimension, onDimensionChange, data }: InsightTabsProps) {
  // 检查维度是否有数据
  const hasData = (dimension: InsightDimension): boolean => {
    if (!data) return false
    switch (dimension) {
      case 'projects':
        return (data.projects?.length > 0) || ((data.github_trending?.length ?? 0) > 0)
      case 'people':
        return data.people?.length > 0
      case 'organizations':
        return data.organizations?.length > 0
      case 'events':
        return data.events?.length > 0
      default:
        return false
    }
  }

  // 获取维度数量
  const getCount = (dimension: InsightDimension): number => {
    if (!data) return 0
    switch (dimension) {
      case 'projects':
        return data.projects?.length || (data.github_trending?.length ?? 0)
      case 'people':
        return data.people?.length || 0
      case 'organizations':
        return data.organizations?.length || 0
      case 'events':
        return data.events?.length || 0
      default:
        return 0
    }
  }

  return (
    <div className="insight-tabs">
      {DIMENSION_CONFIGS.map((config) => {
        const isEnabled = config.enabled && hasData(config.id)
        const isActive = activeDimension === config.id
        const count = getCount(config.id)

        return (
          <button
            key={config.id}
            className={`insight-tab ${isActive ? 'active' : ''} ${!isEnabled ? 'disabled' : ''}`}
            onClick={() => isEnabled && onDimensionChange(config.id)}
            disabled={!isEnabled}
            title={!config.enabled ? '即将上线' : !hasData(config.id) ? '暂无数据' : undefined}
          >
            <span className="tab-icon">{config.icon}</span>
            <span className="tab-name">{config.name}</span>
            {count > 0 && <span className="tab-count">{count}</span>}
            {!config.enabled && <span className="tab-badge">即将上线</span>}
          </button>
        )
      })}
    </div>
  )
}
