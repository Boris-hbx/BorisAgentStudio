/**
 * InsightConfigPanel - 数据源配置面板
 *
 * 基于 SPEC-034
 */

import { useState, useEffect } from 'react'
import type { InsightTopic, InsightConfig, KeyCompany, TechLeader } from '../../types/insight'

interface InsightConfigPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function InsightConfigPanel({ isOpen, onClose }: InsightConfigPanelProps) {
  const [topics, setTopics] = useState<InsightTopic[]>([])
  const [config, setConfig] = useState<InsightConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    topics: true,
    companies: false,
    leaders: false,
    sources: false,
  })

  // 编辑状态
  const [editingTopic, setEditingTopic] = useState<InsightTopic | null>(null)
  const [editingCompany, setEditingCompany] = useState<KeyCompany | null>(null)
  const [editingLeader, setEditingLeader] = useState<TechLeader | null>(null)
  const [editingSources, setEditingSources] = useState(false)
  const [sourcesText, setSourcesText] = useState('')
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)

  // 加载数据
  useEffect(() => {
    if (!isOpen) return

    async function loadData() {
      setLoading(true)
      try {
        const [topicsRes, configRes] = await Promise.all([
          fetch('/data/insights/topics.json'),
          fetch('/data/insights/config.json'),
        ])

        if (topicsRes.ok) {
          const topicsData = await topicsRes.json()
          setTopics(topicsData.topics || [])
        }

        if (configRes.ok) {
          const configData = await configRes.json()
          setConfig(configData)
          setSourcesText(configData.trusted_sources?.join('\n') || '')
        }
      } catch (err) {
        console.error('Failed to load config:', err)
      }
      setLoading(false)
    }
    loadData()
  }, [isOpen])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // 导出配置
  const exportConfig = (type: 'topics' | 'config') => {
    let data: unknown
    let filename: string

    if (type === 'topics') {
      data = { topics }
      filename = 'topics.json'
    } else {
      data = config
      filename = 'config.json'
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    // 显示成功提示
    setExportSuccess(filename)
    setTimeout(() => setExportSuccess(null), 10000)  // 10秒后自动隐藏
  }

  // 主题编辑
  const toggleTopicEnabled = (topicId: string) => {
    setTopics(prev => prev.map(t =>
      t.id === topicId ? { ...t, enabled: !t.enabled } : t
    ))
  }

  const updateTopic = (topic: InsightTopic) => {
    setTopics(prev => prev.map(t => t.id === topic.id ? topic : t))
    setEditingTopic(null)
  }

  const deleteTopic = (topicId: string) => {
    if (confirm('确定删除该主题？')) {
      setTopics(prev => prev.filter(t => t.id !== topicId))
    }
  }

  const addTopic = () => {
    const newTopic: InsightTopic = {
      id: `topic-${Date.now()}`,
      name: '新主题',
      icon: '📌',
      enabled: false,
      keywords: [],
      github_query: '',
    }
    setTopics(prev => [...prev, newTopic])
    setEditingTopic(newTopic)
  }

  // 公司编辑
  const updateCompany = (company: KeyCompany) => {
    if (!config) return
    const exists = config.key_companies.some(c => c.name === company.name)
    if (exists) {
      setConfig({
        ...config,
        key_companies: config.key_companies.map(c => c.name === company.name ? company : c)
      })
    } else {
      setConfig({
        ...config,
        key_companies: [...config.key_companies, company]
      })
    }
    setEditingCompany(null)
  }

  const deleteCompany = (name: string) => {
    if (!config) return
    setConfig({
      ...config,
      key_companies: config.key_companies.filter(c => c.name !== name)
    })
  }

  // 领袖编辑
  const updateLeader = (leader: TechLeader) => {
    if (!config) return
    const exists = config.tech_leaders.some(l => l.name === leader.name)
    if (exists) {
      setConfig({
        ...config,
        tech_leaders: config.tech_leaders.map(l => l.name === leader.name ? leader : l)
      })
    } else {
      setConfig({
        ...config,
        tech_leaders: [...config.tech_leaders, leader]
      })
    }
    setEditingLeader(null)
  }

  const deleteLeader = (name: string) => {
    if (!config) return
    setConfig({
      ...config,
      tech_leaders: config.tech_leaders.filter(l => l.name !== name)
    })
  }

  // 权威来源编辑
  const saveSources = () => {
    if (!config) return
    const sources = sourcesText.split('\n').map(s => s.trim()).filter(Boolean)
    setConfig({ ...config, trusted_sources: sources })
    setEditingSources(false)
  }

  if (!isOpen) return null

  return (
    <div className="config-panel-overlay" onClick={onClose}>
      <div className="config-panel" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="config-panel-header">
          <h3>
            <span className="header-icon">⚙️</span>
            配置数据源
          </h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="config-loading">加载中...</div>
        ) : (
          <div className="config-panel-content">
            {/* 主题管理 */}
            <div className="config-section">
              <button
                className="section-header"
                onClick={() => toggleSection('topics')}
              >
                <span className="section-icon">📋</span>
                <span className="section-title">主题管理</span>
                <span className={`section-arrow ${expandedSections.topics ? 'expanded' : ''}`}>▼</span>
              </button>
              {expandedSections.topics && (
                <div className="section-content">
                  {topics.map(topic => (
                    <div key={topic.id} className="config-item">
                      {editingTopic?.id === topic.id ? (
                        <TopicEditor
                          topic={editingTopic}
                          onSave={updateTopic}
                          onCancel={() => setEditingTopic(null)}
                        />
                      ) : (
                        <>
                          <span className="item-icon">{topic.icon}</span>
                          <span className="item-name">{topic.name}</span>
                          <div className="item-actions">
                            <button
                              className={`toggle-btn ${topic.enabled ? 'enabled' : ''}`}
                              onClick={() => toggleTopicEnabled(topic.id)}
                            >
                              {topic.enabled ? '✓启用' : '○禁用'}
                            </button>
                            <button className="edit-btn" onClick={() => setEditingTopic(topic)}>编辑</button>
                            <button className="delete-btn" onClick={() => deleteTopic(topic.id)}>删除</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <button className="add-btn" onClick={addTopic}>+ 添加主题</button>
                </div>
              )}
            </div>

            {/* 关键公司 */}
            <div className="config-section">
              <button
                className="section-header"
                onClick={() => toggleSection('companies')}
              >
                <span className="section-icon">🏢</span>
                <span className="section-title">关键公司</span>
                <span className={`section-arrow ${expandedSections.companies ? 'expanded' : ''}`}>▼</span>
              </button>
              {expandedSections.companies && config && (
                <div className="section-content">
                  <div className="tags-list">
                    {config.key_companies.map(company => (
                      <div key={company.name} className="tag-item">
                        {editingCompany?.name === company.name ? (
                          <CompanyEditor
                            company={editingCompany}
                            onSave={updateCompany}
                            onCancel={() => setEditingCompany(null)}
                          />
                        ) : (
                          <>
                            <span className="tag-name">{company.name}</span>
                            <button className="tag-edit" onClick={() => setEditingCompany(company)}>✎</button>
                            <button className="tag-delete" onClick={() => deleteCompany(company.name)}>✕</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="add-btn" onClick={() => setEditingCompany({ name: '', domain: '', focus: [] })}>
                    + 添加
                  </button>
                </div>
              )}
            </div>

            {/* 技术领袖 */}
            <div className="config-section">
              <button
                className="section-header"
                onClick={() => toggleSection('leaders')}
              >
                <span className="section-icon">👤</span>
                <span className="section-title">技术领袖</span>
                <span className={`section-arrow ${expandedSections.leaders ? 'expanded' : ''}`}>▼</span>
              </button>
              {expandedSections.leaders && config && (
                <div className="section-content">
                  <div className="tags-list">
                    {config.tech_leaders.map(leader => (
                      <div key={leader.name} className="tag-item">
                        {editingLeader?.name === leader.name ? (
                          <LeaderEditor
                            leader={editingLeader}
                            onSave={updateLeader}
                            onCancel={() => setEditingLeader(null)}
                          />
                        ) : (
                          <>
                            <span className="tag-name">{leader.name}</span>
                            <span className="tag-sub">@ {leader.company}</span>
                            <button className="tag-edit" onClick={() => setEditingLeader(leader)}>✎</button>
                            <button className="tag-delete" onClick={() => deleteLeader(leader.name)}>✕</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="add-btn" onClick={() => setEditingLeader({ name: '', company: '', title: '' })}>
                    + 添加
                  </button>
                </div>
              )}
            </div>

            {/* 权威来源 */}
            <div className="config-section">
              <button
                className="section-header"
                onClick={() => toggleSection('sources')}
              >
                <span className="section-icon">🔗</span>
                <span className="section-title">权威来源</span>
                <span className={`section-arrow ${expandedSections.sources ? 'expanded' : ''}`}>▼</span>
              </button>
              {expandedSections.sources && config && (
                <div className="section-content">
                  {editingSources ? (
                    <div className="sources-editor">
                      <textarea
                        value={sourcesText}
                        onChange={e => setSourcesText(e.target.value)}
                        placeholder="每行一个域名"
                        rows={8}
                      />
                      <div className="editor-actions">
                        <button className="save-btn" onClick={saveSources}>保存</button>
                        <button className="cancel-btn" onClick={() => setEditingSources(false)}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="sources-preview">
                        {config.trusted_sources.join(', ')}
                      </div>
                      <button className="edit-btn" onClick={() => setEditingSources(true)}>编辑列表</button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 导出按钮 */}
            <div className="config-export">
              <button className="export-btn" onClick={() => exportConfig('topics')}>
                导出 topics.json
              </button>
              <button className="export-btn" onClick={() => exportConfig('config')}>
                导出 config.json
              </button>
            </div>

            {/* 导出成功提示 */}
            {exportSuccess && (
              <div className="export-success">
                <div className="success-header">
                  <span className="success-icon">✅</span>
                  <span className="success-title">{exportSuccess} 已下载</span>
                </div>
                <div className="success-steps">
                  <p>请按以下步骤完成配置更新：</p>
                  <ol>
                    <li>将下载的文件移动到 <code>frontend/public/data/insights/</code></li>
                    <li>执行 <code>/insight</code> 使用新配置刷新数据</li>
                    <li>刷新页面查看结果</li>
                  </ol>
                </div>
                <button
                  className="copy-command-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('/insight')
                    alert('已复制 /insight 命令')
                  }}
                >
                  📋 复制 /insight 命令
                </button>
              </div>
            )}

            {/* 提示 */}
            {!exportSuccess && (
              <div className="config-tip">
                <span className="tip-icon">💡</span>
                <span>下载后请将文件移动到 frontend/public/data/insights/ 目录，然后执行 /insight 刷新数据</span>
              </div>
            )}

            {/* 帮助链接 */}
            <div className="config-help">
              <a href="https://github.com/user/repo/blob/main/docs/insight/README.md" target="_blank" rel="noopener noreferrer">
                📖 查看完整文档
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 主题编辑器
function TopicEditor({
  topic,
  onSave,
  onCancel,
}: {
  topic: InsightTopic
  onSave: (t: InsightTopic) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(topic)

  return (
    <div className="inline-editor">
      <div className="editor-row">
        <input
          type="text"
          value={form.icon}
          onChange={e => setForm({ ...form, icon: e.target.value })}
          placeholder="图标"
          className="icon-input"
        />
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="名称"
          className="name-input"
        />
      </div>
      <div className="editor-row">
        <input
          type="text"
          value={form.keywords.join(', ')}
          onChange={e => setForm({ ...form, keywords: e.target.value.split(',').map(s => s.trim()) })}
          placeholder="关键字（逗号分隔）"
          className="full-input"
        />
      </div>
      <div className="editor-row">
        <input
          type="text"
          value={form.github_query}
          onChange={e => setForm({ ...form, github_query: e.target.value })}
          placeholder="GitHub 查询语句"
          className="full-input"
        />
      </div>
      <div className="editor-actions">
        <button className="save-btn" onClick={() => onSave(form)}>保存</button>
        <button className="cancel-btn" onClick={onCancel}>取消</button>
      </div>
    </div>
  )
}

// 公司编辑器
function CompanyEditor({
  company,
  onSave,
  onCancel,
}: {
  company: KeyCompany
  onSave: (c: KeyCompany) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(company)

  return (
    <div className="inline-editor compact">
      <input
        type="text"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="公司名称"
      />
      <input
        type="text"
        value={form.domain}
        onChange={e => setForm({ ...form, domain: e.target.value })}
        placeholder="域名"
      />
      <input
        type="text"
        value={form.focus.join(', ')}
        onChange={e => setForm({ ...form, focus: e.target.value.split(',').map(s => s.trim()) })}
        placeholder="关注领域"
      />
      <div className="editor-actions">
        <button className="save-btn" onClick={() => onSave(form)}>✓</button>
        <button className="cancel-btn" onClick={onCancel}>✕</button>
      </div>
    </div>
  )
}

// 领袖编辑器
function LeaderEditor({
  leader,
  onSave,
  onCancel,
}: {
  leader: TechLeader
  onSave: (l: TechLeader) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(leader)

  return (
    <div className="inline-editor compact">
      <input
        type="text"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="姓名"
      />
      <input
        type="text"
        value={form.company}
        onChange={e => setForm({ ...form, company: e.target.value })}
        placeholder="公司"
      />
      <input
        type="text"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        placeholder="职位"
      />
      <input
        type="text"
        value={form.twitter || ''}
        onChange={e => setForm({ ...form, twitter: e.target.value })}
        placeholder="Twitter"
      />
      <div className="editor-actions">
        <button className="save-btn" onClick={() => onSave(form)}>✓</button>
        <button className="cancel-btn" onClick={onCancel}>✕</button>
      </div>
    </div>
  )
}
