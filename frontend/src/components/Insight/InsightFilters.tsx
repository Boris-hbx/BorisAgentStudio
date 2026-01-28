/**
 * InsightFilters - 洞察筛选器组件
 *
 * 包含主题多选和时间筛选
 */

import type { InsightTopic, TimeRange } from '../../types/insight'
import { TIME_RANGE_CONFIGS } from '../../types/insight'

interface InsightFiltersProps {
  topics: InsightTopic[]
  selectedTopicIds: string[]
  onTopicsChange: (topicIds: string[]) => void
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
}

export function InsightFilters({
  topics,
  selectedTopicIds,
  onTopicsChange,
  timeRange,
  onTimeRangeChange,
}: InsightFiltersProps) {
  // 切换单个主题
  const toggleTopic = (topicId: string) => {
    if (selectedTopicIds.includes(topicId)) {
      // 至少保留一个
      if (selectedTopicIds.length > 1) {
        onTopicsChange(selectedTopicIds.filter(id => id !== topicId))
      }
    } else {
      onTopicsChange([...selectedTopicIds, topicId])
    }
  }

  // 全选/取消全选
  const toggleAll = () => {
    const enabledTopicIds = topics.filter(t => t.enabled).map(t => t.id)
    if (selectedTopicIds.length === enabledTopicIds.length) {
      // 已全选，取消到只保留第一个
      onTopicsChange([enabledTopicIds[0]])
    } else {
      // 未全选，全选
      onTopicsChange(enabledTopicIds)
    }
  }

  const allSelected = selectedTopicIds.length === topics.filter(t => t.enabled).length

  return (
    <div className="insight-filters">
      {/* 主题筛选 */}
      <div className="filter-group topic-filter">
        <span className="filter-label">主题：</span>
        <div className="topic-checkboxes">
          {topics.filter(t => t.enabled).map(topic => (
            <label
              key={topic.id}
              className={`topic-checkbox ${selectedTopicIds.includes(topic.id) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedTopicIds.includes(topic.id)}
                onChange={() => toggleTopic(topic.id)}
              />
              <span className="topic-icon">{topic.icon}</span>
              <span className="topic-name">{topic.name}</span>
            </label>
          ))}
          <button
            className={`select-all-btn ${allSelected ? 'all-selected' : ''}`}
            onClick={toggleAll}
          >
            {allSelected ? '取消全选' : '全选'}
          </button>
        </div>
      </div>

      {/* 时间筛选 */}
      <div className="filter-group time-filter">
        <span className="filter-label">时间：</span>
        <div className="time-options">
          {TIME_RANGE_CONFIGS.map(config => (
            <button
              key={config.id}
              className={`time-option ${timeRange === config.id ? 'active' : ''}`}
              onClick={() => onTimeRangeChange(config.id)}
            >
              {config.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
