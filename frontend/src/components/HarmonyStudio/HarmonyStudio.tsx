/**
 * HarmonyStudio - UI 卡片格式转换展示
 *
 * 功能：
 * - 展示 UI 卡片图像到 Vue 代码的转换样例
 * - 三种视图：输入图片、提取数据、渲染效果
 * - 样例切换
 */

import { useState } from 'react'
import { harmonySamples, type CardTransformSample } from '../../services/harmonySamples'
import './HarmonyStudio.css'

type ViewTab = 'input' | 'data' | 'output'

export function HarmonyStudio() {
  const [selectedSample, setSelectedSample] = useState<CardTransformSample>(harmonySamples[0])
  const [activeTab, setActiveTab] = useState<ViewTab>('input')

  const handleSampleSelect = (sample: CardTransformSample) => {
    setSelectedSample(sample)
    setActiveTab('input')
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'input':
        return (
          <div className="harmony-preview-content">
            <div className="harmony-image-container">
              <img
                src={selectedSample.inputImage}
                alt={`${selectedSample.name} - 输入图片`}
                className="harmony-preview-image"
              />
            </div>
            <div className="harmony-preview-caption">
              原始 UI 设计稿 (输入图片)
            </div>
          </div>
        )
      case 'data':
        return (
          <div className="harmony-preview-content">
            <div className="harmony-code-container">
              <pre className="harmony-json">
                {JSON.stringify(selectedSample.outputData, null, 2)}
              </pre>
            </div>
            <div className="harmony-preview-caption">
              提取的结构化数据 (JSON)
            </div>
          </div>
        )
      case 'output':
        return (
          <div className="harmony-preview-content">
            <div className="harmony-image-container">
              <img
                src={selectedSample.outputScreenshot}
                alt={`${selectedSample.name} - 渲染效果`}
                className="harmony-preview-image"
              />
            </div>
            <div className="harmony-preview-caption">
              Vue 模板渲染效果
            </div>
          </div>
        )
    }
  }

  return (
    <div className="harmony-studio">
      {/* 头部标题 */}
      <div className="harmony-header">
        <div className="harmony-title">
          <span className="harmony-icon">🎨</span>
          <h2>HarmonyStudio</h2>
        </div>
        <p className="harmony-subtitle">UI 卡片格式转换</p>
      </div>

      {/* 样例选择器 */}
      <div className="harmony-samples">
        <div className="harmony-samples-label">选择样例</div>
        <div className="harmony-samples-grid">
          {harmonySamples.map((sample) => (
            <button
              key={sample.id}
              className={`harmony-sample-btn ${selectedSample.id === sample.id ? 'active' : ''}`}
              onClick={() => handleSampleSelect(sample)}
              title={sample.description}
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* 样例描述 */}
      <div className="harmony-sample-desc">
        {selectedSample.description}
      </div>

      {/* Tab 切换 */}
      <div className="harmony-tabs">
        <button
          className={`harmony-tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          <span className="tab-icon">📷</span>
          <span className="tab-label">输入图片</span>
        </button>
        <button
          className={`harmony-tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">提取数据</span>
        </button>
        <button
          className={`harmony-tab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          <span className="tab-icon">🖼️</span>
          <span className="tab-label">渲染效果</span>
        </button>
      </div>

      {/* 预览区 */}
      <div className="harmony-preview">
        {renderTabContent()}
      </div>

      {/* 底部信息 */}
      <div className="harmony-footer">
        <div className="harmony-workflow">
          <span className="workflow-step">图片</span>
          <span className="workflow-arrow">→</span>
          <span className="workflow-step active">LLM 分析</span>
          <span className="workflow-arrow">→</span>
          <span className="workflow-step">数据 + HTML</span>
          <span className="workflow-arrow">→</span>
          <span className="workflow-step">渲染</span>
        </div>
      </div>
    </div>
  )
}
