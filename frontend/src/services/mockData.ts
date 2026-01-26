/**
 * Session data service
 *
 * 加载真实的 Claude Code 执行日志
 * Session 文件存储在 data/sessions/ 目录
 */

import type { AgentSession } from '../types/agent'

// 导入真实日志数据
import knowledgeMarkersSession from '../../../data/sessions/2026-01-25-001-knowledge-markers.json'
import contextFlowSession from '../../../data/sessions/2026-01-25-002-context-flow-chart.json'
import layoutOptimizationSession from '../../../data/sessions/2026-01-25-003-layout-optimization.json'
import particlesSkillSession from '../../../data/sessions/2026-01-25-004-interactive-particles-skill.json'
import contextTypeFallbackSession from '../../../data/sessions/2026-01-25-005-context-type-fallback.json'
import responsiveDetailPanelSession from '../../../data/sessions/2026-01-25-006-responsive-detail-panel.json'
import codingStandardsSession from '../../../data/sessions/2026-01-25-007-coding-standards.json'
import loopVisualizationSession from '../../../data/sessions/2026-01-25-008-loop-visualization.json'
import decisionTransparencySession from '../../../data/sessions/2026-01-25-009-decision-transparency.json'
import contextTypeDiffSession from '../../../data/sessions/2026-01-25-010-context-type-differentiation.json'
import std001EvolutionSession from '../../../data/sessions/2026-01-25-011-std001-evolution.json'
import fixV3VisualizationSession from '../../../data/sessions/2026-01-25-012-fix-v3-session-visualization.json'
import hierarchicalVisualizationSession from '../../../data/sessions/2026-01-25-013-implement-spec011-hierarchical-visualization.json'
import headerParticlesSpecSession from '../../../data/sessions/2026-01-25-014-header-particles-spec.json'
import implementHeaderParticlesSession from '../../../data/sessions/2026-01-25-015-implement-header-particles.json'
import projectEnhancementRoadmapSession from '../../../data/sessions/2026-01-26-001-project-enhancement-roadmap.json'
import implementProjectEnhancementsSession from '../../../data/sessions/2026-01-26-002-implement-project-enhancements.json'

/**
 * 可用的 session 列表
 */
export interface SessionListItem {
  session_id: string
  name: string
  description: string
  status: 'success' | 'failed' | 'partial'
}

export const availableSessions: SessionListItem[] = [
  {
    session_id: '2026-01-25-001-knowledge-markers',
    name: 'KnowledgeMarkers 组件开发',
    description: '实现领域知识来源标识组件',
    status: 'success',
  },
  {
    session_id: '2026-01-25-002-context-flow-chart',
    name: 'ContextFlowChart 组件开发',
    description: '实现上下文流转简图组件',
    status: 'success',
  },
  {
    session_id: '2026-01-25-003-layout-optimization',
    name: '布局优化',
    description: '解决内容遮盖问题 - z-index修复 + 右侧抽屉面板',
    status: 'success',
  },
  {
    session_id: '2026-01-25-004-interactive-particles-skill',
    name: '可交互粒子系统 Skill',
    description: '从 Next 项目提取小球交互功能，创建 SPEC-006 和 SKILL-001',
    status: 'success',
  },
  {
    session_id: '2026-01-25-005-context-type-fallback',
    name: '修复上下文类型崩溃',
    description: '添加 fallback 机制解决未知 context type 导致的界面崩溃',
    status: 'success',
  },
  {
    session_id: '2026-01-25-006-responsive-detail-panel',
    name: '响应式详情面板',
    description: '从遮盖式改为挤压式布局，主内容区自适应收缩',
    status: 'success',
  },
  {
    session_id: '2026-01-25-007-coding-standards',
    name: '创建编程规范',
    description: '参考业界最佳实践，创建 TypeScript/React/Rust 编程规范',
    status: 'success',
  },
  {
    session_id: '2026-01-25-008-loop-visualization',
    name: '循环可视化功能',
    description: 'Plan→Execute 循环箭头 + 子代理信息展示（含重试示例）',
    status: 'success',
  },
  {
    session_id: '2026-01-25-009-decision-transparency',
    name: '决策过程透明化',
    description: '用户原始 prompt 展示 + 文件探索决策记录（含选择逻辑）',
    status: 'success',
  },
  {
    session_id: '2026-01-25-010-context-type-differentiation',
    name: '上下文类型区分',
    description: '区分读取/修改/读取并修改三种使用方式，在上下文面板中显示标签',
    status: 'success',
  },
  {
    session_id: '2026-01-25-011-std001-evolution',
    name: 'STD-001 演进至 v3.0',
    description: '工具调用流优先模型，phase_annotations 可选',
    status: 'success',
  },
  {
    session_id: '2026-01-25-012-fix-v3-session-visualization',
    name: '修复 v3.0 可视化',
    description: '适配新数据模型，修复界面显示问题',
    status: 'success',
  },
  {
    session_id: '2026-01-25-013-implement-spec011-hierarchical-visualization',
    name: '实现分层工作流可视化',
    description: '阶段分组视图、可展开节点、工具详情面板',
    status: 'success',
  },
  {
    session_id: '2026-01-25-014-header-particles-spec',
    name: '顶栏粒子效果 Spec',
    description: '设计 SPEC-012 Header Particles 规格文档',
    status: 'success',
  },
  {
    session_id: '2026-01-25-015-implement-header-particles',
    name: '实现顶栏粒子效果',
    description: '粒子引擎、HeaderParticles 组件、集成到 Header',
    status: 'success',
  },
  {
    session_id: '2026-01-26-001-project-enhancement-roadmap',
    name: '项目增强路线图',
    description: '软件工程最佳实践分析，识别需补充的 Standards/Skills/Rules',
    status: 'success',
  },
  {
    session_id: '2026-01-26-002-implement-project-enhancements',
    name: '实施项目增强',
    description: '实施 SPEC-013 全部建议: 5 Standards, 3 Rules, 6 Skills, 6 Specs',
    status: 'success',
  },
]

/**
 * 所有 sessions 的映射
 */
const sessionsMap: Record<string, AgentSession> = {
  '2026-01-25-001-knowledge-markers': knowledgeMarkersSession as unknown as AgentSession,
  '2026-01-25-002-context-flow-chart': contextFlowSession as unknown as AgentSession,
  '2026-01-25-003-layout-optimization': layoutOptimizationSession as unknown as AgentSession,
  '2026-01-25-004-interactive-particles-skill': particlesSkillSession as unknown as AgentSession,
  '2026-01-25-005-context-type-fallback': contextTypeFallbackSession as unknown as AgentSession,
  '2026-01-25-006-responsive-detail-panel': responsiveDetailPanelSession as unknown as AgentSession,
  '2026-01-25-007-coding-standards': codingStandardsSession as unknown as AgentSession,
  '2026-01-25-008-loop-visualization': loopVisualizationSession as unknown as AgentSession,
  '2026-01-25-009-decision-transparency': decisionTransparencySession as unknown as AgentSession,
  '2026-01-25-010-context-type-differentiation': contextTypeDiffSession as unknown as AgentSession,
  '2026-01-25-011-std001-evolution': std001EvolutionSession as unknown as AgentSession,
  '2026-01-25-012-fix-v3-session-visualization': fixV3VisualizationSession as unknown as AgentSession,
  '2026-01-25-013-implement-spec011-hierarchical-visualization': hierarchicalVisualizationSession as unknown as AgentSession,
  '2026-01-25-014-header-particles-spec': headerParticlesSpecSession as unknown as AgentSession,
  '2026-01-25-015-implement-header-particles': implementHeaderParticlesSession as unknown as AgentSession,
  '2026-01-26-001-project-enhancement-roadmap': projectEnhancementRoadmapSession as unknown as AgentSession,
  '2026-01-26-002-implement-project-enhancements': implementProjectEnhancementsSession as unknown as AgentSession,
}

/**
 * 获取可用 session 列表
 */
export function getAvailableSessions(): SessionListItem[] {
  return availableSessions
}

/**
 * 加载默认的 session（选择有 user_prompt 的新版本）
 */
export function loadMockSession(): AgentSession {
  return sessionsMap['2026-01-25-015-implement-header-particles']
}

/**
 * 按 session_id 加载指定的 session
 */
export function loadSessionById(sessionId: string): AgentSession | null {
  return sessionsMap[sessionId] ?? null
}
