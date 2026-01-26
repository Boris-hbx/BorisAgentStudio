/**
 * LoopArrow - Plan → Execute 循环箭头组件
 *
 * 可视化 Plan → Execute 的重试循环
 * - 灰色：未执行循环
 * - 蓝色：已执行循环，显示次数
 * - 脉冲动画：正在循环中
 */

import './LoopArrow.css'

interface LoopArrowProps {
  /** 循环执行次数（0 表示未执行） */
  loopCount: number
  /** 是否正在进行循环（用于动画） */
  isLooping?: boolean
  /** 点击回调：查看循环详情 */
  onClick?: () => void
}

export function LoopArrow({ loopCount, isLooping = false, onClick }: LoopArrowProps) {
  const isActive = loopCount > 0
  const displayCount = loopCount > 9 ? '9+' : loopCount.toString()

  const statusClass = isLooping ? 'looping' : isActive ? 'active' : 'inactive'

  const ariaLabel = isActive
    ? `Plan to Execute loop, executed ${loopCount} time${loopCount > 1 ? 's' : ''}`
    : 'Plan to Execute loop, not executed'

  return (
    <div
      className={`loop-arrow-container ${statusClass}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <svg className="loop-arrow-svg" viewBox="0 0 200 50">
        {/* 弧形路径：从右侧（Execute）底部到左侧（Plan）底部 */}
        <path
          className="loop-path"
          d="M 170 5 C 170 40, 30 40, 30 5"
          fill="none"
          strokeWidth="2"
          strokeDasharray={isActive ? 'none' : '4 4'}
        />
        {/* 箭头头部 - 指向左侧 Plan */}
        <polygon
          className="loop-arrow-head"
          points="30,5 25,12 35,12"
        />
      </svg>

      {/* 循环次数徽章 */}
      <div className={`loop-badge ${statusClass}`}>
        {displayCount}
      </div>

      {/* Tooltip */}
      <div className="loop-tooltip">
        {isLooping
          ? `正在进行第 ${loopCount + 1} 次尝试...`
          : isActive
            ? `Plan → Execute 循环执行了 ${loopCount} 次`
            : 'Plan → Execute 循环未触发'}
      </div>
    </div>
  )
}
