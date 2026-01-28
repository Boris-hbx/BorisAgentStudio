/**
 * MiniTrendChart - 迷你趋势图
 *
 * 使用 SVG 绘制 Sparkline 展示 7 天 Star 趋势
 */

import { useState } from 'react'

interface MiniTrendChartProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function MiniTrendChart({
  data,
  width = 80,
  height = 24,
  color = '#22c55e',
}: MiniTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return null
  }

  const padding = 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // 计算点坐标
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    return { x, y, value }
  })

  // 生成折线路径
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')

  // 生成填充区域路径
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`

  return (
    <div className="mini-trend-chart-container">
      <svg
        width={width}
        height={height}
        className="mini-trend-chart"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* 填充区域 */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.1}
        />

        {/* 折线 */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 交互区域和数据点 */}
        {points.map((point, index) => (
          <g key={index}>
            {/* 悬停区域 */}
            <rect
              x={point.x - chartWidth / data.length / 2}
              y={0}
              width={chartWidth / data.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(index)}
            />
            {/* 数据点（悬停时显示） */}
            {hoveredIndex === index && (
              <circle
                cx={point.x}
                cy={point.y}
                r={3}
                fill={color}
              />
            )}
          </g>
        ))}
      </svg>

      {/* 悬停提示 */}
      {hoveredIndex !== null && (
        <div className="mini-trend-tooltip">
          <span className="tooltip-day">D-{data.length - 1 - hoveredIndex}</span>
          <span className="tooltip-value">{points[hoveredIndex].value.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
