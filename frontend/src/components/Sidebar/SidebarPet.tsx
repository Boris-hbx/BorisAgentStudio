/**
 * SidebarPet - 侧边栏跟随小宠物
 *
 * 基于 SKILL-009 设计，实现一个可交互的小宠物：
 * - 跟随鼠标 Y 坐标移动
 * - 点击可切换侧边栏折叠/展开
 * - 呼吸效果动画
 * - 颜色与深色主题协调
 *
 * @see SKILL-009-sidebar-pet.json
 * @see SPEC-026-sidebar-pet-implementation.md
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import './SidebarPet.css'

interface SidebarPetProps {
  /** 侧边栏是否折叠 */
  collapsed: boolean
  /** 切换折叠状态的回调 */
  onToggle: () => void
}

type PetState = 'idle' | 'active' | 'following' | 'excited'

/** 配置常量 */
const CONFIG = {
  // 尺寸
  WIDTH: 16,
  HEIGHT: 56,
  EYE_SIZE: 6,
  EYE_GAP: 8,

  // 位置
  SIDEBAR_WIDTH_EXPANDED: 168,
  SIDEBAR_WIDTH_COLLAPSED: 56,
  TOP_OFFSET: 36, // Header 高度（紧凑版）
  BOTTOM_OFFSET: 60, // 距离底部

  // 行为
  ACTIVE_ZONE_WIDTH: 120, // 激活区域宽度
  CLOSE_DISTANCE: 15, // 判定为"靠近"的距离
  GENTLE_EASING: 0.08, // 缓慢跟随系数
  RUSH_EASING: 0.25, // 急速跟随系数
  RETURN_DELAY: 800, // 回归延迟 (ms)
  RETURN_EASING: 0.03, // 回归缓动系数
}

export function SidebarPet({ collapsed, onToggle }: SidebarPetProps) {
  const [petState, setPetState] = useState<PetState>('idle')
  const [currentY, setCurrentY] = useState<number>(0)

  const petRef = useRef<HTMLDivElement>(null)
  const targetYRef = useRef<number>(0)
  const animationRef = useRef<number>(0)
  const returnTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const isActiveRef = useRef(false)

  // 计算初始 Y 位置（屏幕中央）
  const getDefaultY = useCallback(() => {
    const viewportHeight = window.innerHeight
    return (viewportHeight - CONFIG.TOP_OFFSET - CONFIG.BOTTOM_OFFSET) / 2
  }, [])

  // 初始化位置
  useEffect(() => {
    setCurrentY(getDefaultY())
    targetYRef.current = getDefaultY()
  }, [getDefaultY])

  // 动画循环
  useEffect(() => {
    const animate = () => {
      const distance = Math.abs(targetYRef.current - currentY)

      if (isActiveRef.current) {
        // 根据距离选择缓动系数
        const easing = distance > CONFIG.CLOSE_DISTANCE
          ? CONFIG.RUSH_EASING
          : CONFIG.GENTLE_EASING

        setCurrentY((prev) => {
          const newY = prev + (targetYRef.current - prev) * easing
          return Math.round(newY * 10) / 10 // 保留一位小数，减少渲染
        })

        // 更新状态
        if (distance > CONFIG.CLOSE_DISTANCE) {
          setPetState('excited')
        } else {
          setPetState('following')
        }
      } else if (petState === 'idle') {
        // 回归到默认位置
        const defaultY = getDefaultY()
        if (Math.abs(defaultY - currentY) > 1) {
          setCurrentY((prev) => {
            const newY = prev + (defaultY - prev) * CONFIG.RETURN_EASING
            return Math.round(newY * 10) / 10
          })
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [currentY, petState, getDefaultY])

  // 鼠标事件处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const sidebarWidth = collapsed
        ? CONFIG.SIDEBAR_WIDTH_COLLAPSED
        : CONFIG.SIDEBAR_WIDTH_EXPANDED

      // 检查是否在激活区域内
      const isInActiveZone = e.clientX < sidebarWidth + CONFIG.ACTIVE_ZONE_WIDTH

      if (isInActiveZone) {
        isActiveRef.current = true
        clearTimeout(returnTimerRef.current)

        // 计算目标 Y（限制在可移动范围内）
        const minY = 0
        const maxY = window.innerHeight - CONFIG.TOP_OFFSET - CONFIG.BOTTOM_OFFSET - CONFIG.HEIGHT
        const mouseY = e.clientY - CONFIG.TOP_OFFSET - CONFIG.HEIGHT / 2
        targetYRef.current = Math.max(minY, Math.min(maxY, mouseY))

        if (petState === 'idle') {
          setPetState('active')
        }
      }
    }

    const handleMouseLeave = () => {
      // 延迟回归
      returnTimerRef.current = setTimeout(() => {
        isActiveRef.current = false
        setPetState('idle')
      }, CONFIG.RETURN_DELAY)
    }

    // 监听 document 的鼠标移动
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(returnTimerRef.current)
    }
  }, [collapsed, petState])

  // 点击处理
  const handleClick = useCallback(() => {
    onToggle()
  }, [onToggle])

  // 计算左侧位置 - 小宠物在紫色线条右侧
  const leftPosition = collapsed
    ? CONFIG.SIDEBAR_WIDTH_COLLAPSED + 1
    : CONFIG.SIDEBAR_WIDTH_EXPANDED + 1

  return (
    <div
      ref={petRef}
      className={`sidebar-pet ${petState} ${collapsed ? 'sidebar-collapsed' : ''}`}
      style={{
        left: `${leftPosition}px`,
        top: `${CONFIG.TOP_OFFSET + currentY}px`,
      }}
      onClick={handleClick}
      role="button"
      aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="pet-body">
        <div className="pet-eye" />
        <div className="pet-eye" />
        <div className="pet-eye" />
      </div>
    </div>
  )
}
