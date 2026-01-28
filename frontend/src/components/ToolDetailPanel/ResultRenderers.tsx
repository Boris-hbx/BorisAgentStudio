/**
 * ResultRenderers - 结构化数据渲染器
 *
 * 为不同类型的 tool_call.output.result 提供专用渲染
 */

import type { ReactNode } from 'react'
import './ResultRenderers.css'

/** 渲染 goals 列表 */
export function GoalsRenderer({ goals, title = '目标' }: { goals: string[]; title?: string }) {
  return (
    <div className="result-section goals-section">
      <h5 className="section-title">{title}</h5>
      <ul className="goals-list">
        {goals.map((goal, idx) => (
          <li key={idx} className="goal-item">
            <span className="goal-check">✓</span>
            <span className="goal-text">{goal}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 渲染 non_goals 列表 */
export function NonGoalsRenderer({ nonGoals }: { nonGoals: string[] }) {
  return (
    <div className="result-section non-goals-section">
      <h5 className="section-title">非目标</h5>
      <ul className="non-goals-list">
        {nonGoals.map((item, idx) => (
          <li key={idx} className="non-goal-item">
            <span className="non-goal-icon">○</span>
            <span className="non-goal-text">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 风险项 */
interface RiskItem {
  id: string
  risk: string
  level: '高' | '中' | '低' | string
  suggestion?: string
}

/** 渲染 risk_list */
export function RiskListRenderer({ risks }: { risks: RiskItem[] }) {
  const levelColors: Record<string, string> = {
    '高': '#ef4444',
    '中': '#f59e0b',
    '低': '#22c55e',
  }

  return (
    <div className="result-section risks-section">
      <h5 className="section-title">风险清单</h5>
      <div className="risks-list">
        {risks.map((risk) => (
          <div
            key={risk.id}
            className="risk-card"
            style={{ '--risk-color': levelColors[risk.level] || '#6b7280' } as React.CSSProperties}
          >
            <div className="risk-header">
              <span className="risk-id">{risk.id}</span>
              <span className="risk-level" style={{ color: levelColors[risk.level] }}>
                {risk.level}
              </span>
            </div>
            <p className="risk-description">{risk.risk}</p>
            {risk.suggestion && (
              <p className="risk-suggestion">
                <span className="suggestion-label">建议：</span>
                {risk.suggestion}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 响应项 */
interface ResponseItem {
  risk_id: string
  action: '接受' | '拒绝' | '降级' | '部分接受' | string
  solution?: string
  rationale?: string
}

/** 渲染 responses（Challenger/DA 响应） */
export function ResponsesRenderer({
  responses,
  title,
}: {
  responses: ResponseItem[]
  title: string
}) {
  const actionColors: Record<string, string> = {
    '接受': '#22c55e',
    '拒绝': '#ef4444',
    '降级': '#f59e0b',
    '部分接受': '#3b82f6',
  }

  return (
    <div className="result-section responses-section">
      <h5 className="section-title">{title}</h5>
      <table className="responses-table">
        <thead>
          <tr>
            <th>风险</th>
            <th>行动</th>
            <th>解决方案</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((resp) => (
            <tr key={resp.risk_id}>
              <td className="risk-id-cell">{resp.risk_id}</td>
              <td>
                <span
                  className="action-badge"
                  style={{ backgroundColor: actionColors[resp.action] || '#6b7280' }}
                >
                  {resp.action}
                </span>
              </td>
              <td>
                <span className="solution-text">{resp.solution || '-'}</span>
                {resp.rationale && (
                  <span className="rationale-text" title={resp.rationale}>
                    💡
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 检查项 */
interface ChecklistItem {
  item?: string
  goal?: string
  passed?: boolean
  met?: boolean
  note?: string
  evidence?: string
}

/** 渲染 checklist（审查清单或 DoD） */
export function ChecklistRenderer({
  checklist,
  title = '检查清单',
}: {
  checklist: ChecklistItem[]
  title?: string
}) {
  return (
    <div className="result-section checklist-section">
      <h5 className="section-title">{title}</h5>
      <div className="checklist">
        {checklist.map((item, idx) => {
          const passed = item.passed ?? item.met
          const label = item.item || item.goal || `项目 ${idx + 1}`
          const detail = item.note || item.evidence

          return (
            <div key={idx} className={`checklist-item ${passed ? 'passed' : 'failed'}`}>
              <span className="check-icon">{passed ? '✓' : '✗'}</span>
              <span className="check-label">{label}</span>
              {detail && <span className="check-detail">{detail}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 文件列表 */
interface FileItem {
  path?: string
  description?: string
  changes?: string
  lines?: number
}

/** 渲染 files_created / files_modified */
export function FilesRenderer({
  files,
  title,
  type,
}: {
  files: (string | FileItem)[]
  title: string
  type: 'created' | 'modified'
}) {
  const icon = type === 'created' ? '📄' : '✏️'

  return (
    <div className="result-section files-section">
      <h5 className="section-title">{title}</h5>
      <ul className="files-list">
        {files.map((file, idx) => {
          const isString = typeof file === 'string'
          const path = isString ? file : file.path
          const desc = isString ? null : file.description || file.changes
          const lines = isString ? null : file.lines

          return (
            <li key={idx} className="file-item">
              <span className="file-icon">{icon}</span>
              <span className="file-path">{path}</span>
              {lines && <span className="file-lines">{lines} 行</span>}
              {desc && <span className="file-desc">{desc}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** 状态机 */
interface StateMachineItem {
  state: string
  trigger: string
  effect: string
}

/** 渲染 state_machine */
export function StateMachineRenderer({ states }: { states: StateMachineItem[] }) {
  return (
    <div className="result-section state-machine-section">
      <h5 className="section-title">状态机</h5>
      <table className="state-machine-table">
        <thead>
          <tr>
            <th>状态</th>
            <th>触发</th>
            <th>效果</th>
          </tr>
        </thead>
        <tbody>
          {states.map((state, idx) => (
            <tr key={idx}>
              <td className="state-name">{state.state}</td>
              <td className="state-trigger">{state.trigger}</td>
              <td className="state-effect">{state.effect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 设计参数 */
export function DesignParamsRenderer({
  params,
  title,
}: {
  params: Record<string, string | number>
  title: string
}) {
  return (
    <div className="result-section design-params-section">
      <h5 className="section-title">{title}</h5>
      <div className="params-grid">
        {Object.entries(params).map(([key, value]) => (
          <div key={key} className="param-item">
            <span className="param-key">{key}</span>
            <span className="param-value">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 设计原则检查 */
interface DesignPrincipleItem {
  principle: string
  passed: boolean
  note?: string
}

/** 渲染 design_principles_check */
export function DesignPrinciplesRenderer({ principles }: { principles: DesignPrincipleItem[] }) {
  return (
    <div className="result-section principles-section">
      <h5 className="section-title">设计原则检查</h5>
      <div className="principles-list">
        {principles.map((p, idx) => (
          <div key={idx} className={`principle-item ${p.passed ? 'passed' : 'failed'}`}>
            <span className="principle-icon">{p.passed ? '✓' : '⚠️'}</span>
            <span className="principle-name">{p.principle}</span>
            {p.note && <span className="principle-note">{p.note}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Spec 更新列表 */
export function SpecUpdatesRenderer({ updates }: { updates: string[] }) {
  return (
    <div className="result-section spec-updates-section">
      <h5 className="section-title">Spec 更新</h5>
      <ul className="updates-list">
        {updates.map((update, idx) => (
          <li key={idx} className="update-item">
            <span className="update-icon">📝</span>
            <span className="update-text">{update}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 问题陈述 */
export function ProblemStatementRenderer({ statement }: { statement: string }) {
  return (
    <div className="result-section problem-section">
      <h5 className="section-title">问题陈述</h5>
      <p className="problem-text">{statement}</p>
    </div>
  )
}

/** 泛型对象渲染器（fallback） */
export function GenericObjectRenderer({
  data,
  title,
}: {
  data: unknown
  title: string
}) {
  return (
    <div className="result-section generic-section">
      <h5 className="section-title">{title}</h5>
      <pre className="generic-json">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

/** 智能渲染结构化结果 */
export function renderStructuredResult(result: Record<string, unknown>): ReactNode[] {
  const rendered: ReactNode[] = []
  let keyIndex = 0

  // 跳过 display 字段（已在头部显示）
  const entries = Object.entries(result).filter(([key]) => key !== 'display')

  for (const [key, value] of entries) {
    keyIndex++
    const reactKey = `result-${keyIndex}-${key}`

    // 问题陈述
    if (key === 'problem_statement' && typeof value === 'string') {
      rendered.push(<ProblemStatementRenderer key={reactKey} statement={value} />)
      continue
    }

    // 目标
    if (key === 'goals' && Array.isArray(value)) {
      rendered.push(<GoalsRenderer key={reactKey} goals={value as string[]} />)
      continue
    }

    // 非目标
    if (key === 'non_goals' && Array.isArray(value)) {
      rendered.push(<NonGoalsRenderer key={reactKey} nonGoals={value as string[]} />)
      continue
    }

    // 风险列表
    if (key === 'risk_list' && Array.isArray(value)) {
      rendered.push(<RiskListRenderer key={reactKey} risks={value as RiskItem[]} />)
      continue
    }

    // Challenger 响应
    if (key === 'challenger_responses' && Array.isArray(value)) {
      rendered.push(
        <ResponsesRenderer key={reactKey} responses={value as ResponseItem[]} title="Challenger 风险响应" />
      )
      continue
    }

    // Design Authority 响应
    if (key === 'design_authority_responses' && Array.isArray(value)) {
      rendered.push(
        <ResponsesRenderer key={reactKey} responses={value as ResponseItem[]} title="Design Authority 体验响应" />
      )
      continue
    }

    // 审查清单
    if (key === 'checklist' && Array.isArray(value)) {
      rendered.push(<ChecklistRenderer key={reactKey} checklist={value as ChecklistItem[]} title="审查清单" />)
      continue
    }

    // DoD 清单
    if (key === 'dod_checklist' && Array.isArray(value)) {
      rendered.push(<ChecklistRenderer key={reactKey} checklist={value as ChecklistItem[]} title="DoD 验证" />)
      continue
    }

    // 文件创建
    if (key === 'files_created' && Array.isArray(value)) {
      rendered.push(<FilesRenderer key={reactKey} files={value} title="创建的文件" type="created" />)
      continue
    }

    // 文件修改
    if (key === 'files_modified' && Array.isArray(value)) {
      rendered.push(<FilesRenderer key={reactKey} files={value} title="修改的文件" type="modified" />)
      continue
    }

    // 状态机
    if (key === 'state_machine' && Array.isArray(value)) {
      rendered.push(<StateMachineRenderer key={reactKey} states={value as StateMachineItem[]} />)
      continue
    }

    // 设计参数
    if ((key === 'dimensions' || key === 'colors' || key === 'animations') && typeof value === 'object' && value !== null) {
      const titleMap: Record<string, string> = {
        dimensions: '尺寸参数',
        colors: '颜色配置',
        animations: '动画参数',
      }
      rendered.push(
        <DesignParamsRenderer key={reactKey} params={value as Record<string, string | number>} title={titleMap[key]} />
      )
      continue
    }

    // 组件结构
    if (key === 'component_structure' && typeof value === 'object' && value !== null) {
      rendered.push(
        <GenericObjectRenderer key={reactKey} data={value} title="组件结构" />
      )
      continue
    }

    // 设计原则检查
    if (key === 'design_principles_check' && Array.isArray(value)) {
      rendered.push(<DesignPrinciplesRenderer key={reactKey} principles={value as DesignPrincipleItem[]} />)
      continue
    }

    // Spec 更新
    if (key === 'spec_updates' && Array.isArray(value)) {
      rendered.push(<SpecUpdatesRenderer key={reactKey} updates={value as string[]} />)
      continue
    }

    // 自测结果
    if (key === 'self_test' && typeof value === 'object' && value !== null) {
      const selfTest = value as { passed?: boolean; tests_run?: string[]; notes?: string }
      rendered.push(
        <div key={reactKey} className="result-section self-test-section">
          <h5 className="section-title">自测结果</h5>
          <div className={`self-test-status ${selfTest.passed ? 'passed' : 'failed'}`}>
            <span className="status-icon">{selfTest.passed ? '✓' : '✗'}</span>
            <span className="status-text">{selfTest.passed ? '通过' : '失败'}</span>
          </div>
          {selfTest.tests_run && (
            <ul className="tests-run">
              {selfTest.tests_run.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
          {selfTest.notes && <p className="self-test-notes">{selfTest.notes}</p>}
        </div>
      )
      continue
    }

    // 表扬
    if (key === 'commendations' && Array.isArray(value)) {
      rendered.push(
        <div key={reactKey} className="result-section commendations-section">
          <h5 className="section-title">亮点</h5>
          <ul className="commendations-list">
            {(value as string[]).map((c, i) => (
              <li key={i} className="commendation-item">
                <span className="commendation-icon">⭐</span>
                <span className="commendation-text">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )
      continue
    }

    // 裁决
    if (key === 'verdict' && typeof value === 'string') {
      const verdictColors: Record<string, string> = {
        '通过': '#22c55e',
        'approved': '#22c55e',
        '失败': '#ef4444',
        'rejected': '#ef4444',
      }
      rendered.push(
        <div key={reactKey} className="result-section verdict-section">
          <h5 className="section-title">裁决</h5>
          <span className="verdict-badge" style={{ backgroundColor: verdictColors[value] || '#3b82f6' }}>
            {value}
          </span>
        </div>
      )
      continue
    }

    // 摘要
    if (key === 'summary' && typeof value === 'string') {
      rendered.push(
        <div key={reactKey} className="result-section summary-section">
          <h5 className="section-title">摘要</h5>
          <p className="summary-text">{value}</p>
        </div>
      )
      continue
    }

    // findings（审查发现）
    if (key === 'findings' && Array.isArray(value) && value.length > 0) {
      rendered.push(
        <div key={reactKey} className="result-section findings-section">
          <h5 className="section-title">审查发现</h5>
          <ul className="findings-list">
            {(value as Array<{ severity?: string; file?: string; description?: string } | string>).map((f, i) => (
              <li key={i} className="finding-item">
                {typeof f === 'string' ? f : (
                  <>
                    {f.severity && <span className={`severity-badge ${f.severity}`}>{f.severity}</span>}
                    {f.file && <span className="finding-file">{f.file}</span>}
                    {f.description && <span className="finding-desc">{f.description}</span>}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )
      continue
    }

    // 跳过某些技术字段
    if (['session_log_verified', 'next_action'].includes(key)) {
      continue
    }

    // 其他对象/数组 - 使用泛型渲染
    if (typeof value === 'object' && value !== null) {
      // 美化 key 名称
      const title = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      rendered.push(<GenericObjectRenderer key={reactKey} data={value} title={title} />)
    }
  }

  return rendered
}
