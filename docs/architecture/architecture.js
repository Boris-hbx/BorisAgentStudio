/**
 * BorisAgentStudio - Architecture Diagram Visualization
 *
 * Uses D3.js v7 for layered architecture visualization.
 */

(function() {
  'use strict';

  // Embedded architecture data (to work with file:// protocol)
  const ARCHITECTURE_DATA = {
    "nodes": [
      {
        "id": "layer-spec",
        "name": "规范层 (Specification)",
        "layer": "spec",
        "type": "layer",
        "description": "项目规范、标准和约定，指导 Agent 和开发者的行为"
      },
      {
        "id": "spec-claude-md",
        "name": "CLAUDE.md",
        "layer": "spec",
        "type": "file",
        "description": "项目核心指令文件，定义 Agent 权限和工程哲学",
        "path": "CLAUDE.md",
        "parent": "layer-spec"
      },
      {
        "id": "spec-specs",
        "name": "specs/",
        "layer": "spec",
        "type": "module",
        "description": "功能规格文档 (20个 SPEC)",
        "path": "docs/specs/",
        "parent": "layer-spec"
      },
      {
        "id": "spec-standards",
        "name": "standards/",
        "layer": "spec",
        "type": "module",
        "description": "标准与规范 (7个 STD)",
        "path": "standards/",
        "parent": "layer-spec"
      },
      {
        "id": "spec-rules",
        "name": "rules/",
        "layer": "spec",
        "type": "module",
        "description": "项目规则定义 (5个 RULE)",
        "path": "rules/",
        "parent": "layer-spec"
      },
      {
        "id": "spec-skills",
        "name": "skills/",
        "layer": "spec",
        "type": "module",
        "description": "Agent 技能定义 (7个 SKILL)",
        "path": "skills/",
        "parent": "layer-spec"
      },
      {
        "id": "layer-frontend",
        "name": "前端层 (Frontend)",
        "layer": "frontend",
        "type": "layer",
        "description": "React + D3.js 前端应用，提供可视化界面"
      },
      {
        "id": "fe-timeline",
        "name": "Timeline",
        "layer": "frontend",
        "type": "module",
        "description": "工具调用时序图：Timeline, ToolCallFlow, TimelineNode, LoopArrow, ContextMarkers",
        "path": "frontend/src/components/Timeline/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-detail",
        "name": "DetailPanel",
        "layer": "frontend",
        "type": "module",
        "description": "步骤响应式详情面板",
        "path": "frontend/src/components/DetailPanel/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-tool-detail",
        "name": "ToolDetailPanel",
        "layer": "frontend",
        "type": "module",
        "description": "工具调用详情面板",
        "path": "frontend/src/components/ToolDetailPanel/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-layout",
        "name": "Layout",
        "layer": "frontend",
        "type": "module",
        "description": "布局组件：Header, StatusBar, HeaderParticles",
        "path": "frontend/src/components/Layout/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-context",
        "name": "ContextFlow",
        "layer": "frontend",
        "type": "module",
        "description": "上下文流转图",
        "path": "frontend/src/components/ContextFlow/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-phase",
        "name": "PhaseGroup",
        "layer": "frontend",
        "type": "module",
        "description": "分层工作流：PhaseGroupList, PhaseNode",
        "path": "frontend/src/components/PhaseGroup/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-search",
        "name": "SessionSearch",
        "layer": "frontend",
        "type": "module",
        "description": "Session 搜索过滤",
        "path": "frontend/src/components/SessionSearch/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-diff",
        "name": "CodeDiff",
        "layer": "frontend",
        "type": "module",
        "description": "代码差异可视化",
        "path": "frontend/src/components/CodeDiff/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-particles",
        "name": "Particles",
        "layer": "frontend",
        "type": "module",
        "description": "粒子系统引擎：engine, renderer, particle, config",
        "path": "frontend/src/lib/particles/",
        "parent": "layer-frontend"
      },
      {
        "id": "fe-types",
        "name": "Types",
        "layer": "frontend",
        "type": "module",
        "description": "TypeScript 类型定义",
        "path": "frontend/src/types/",
        "parent": "layer-frontend"
      },
      {
        "id": "layer-backend",
        "name": "后端层 (Backend)",
        "layer": "backend",
        "type": "layer",
        "description": "Rust Axum 后端服务，提供 REST API 和 WebSocket"
      },
      {
        "id": "be-api",
        "name": "REST API",
        "layer": "backend",
        "type": "module",
        "description": "API 路由：/sessions, /sessions/:id",
        "path": "backend/src/api/",
        "parent": "layer-backend"
      },
      {
        "id": "be-websocket",
        "name": "WebSocket",
        "layer": "backend",
        "type": "module",
        "description": "WebSocket 处理，实时推送更新",
        "path": "backend/src/websocket/",
        "parent": "layer-backend"
      },
      {
        "id": "be-models",
        "name": "Models",
        "layer": "backend",
        "type": "module",
        "description": "数据模型定义",
        "path": "backend/src/models/",
        "parent": "layer-backend"
      },
      {
        "id": "be-services",
        "name": "Services",
        "layer": "backend",
        "type": "module",
        "description": "业务逻辑层",
        "path": "backend/src/services/",
        "parent": "layer-backend"
      },
      {
        "id": "layer-data",
        "name": "数据层 (Data)",
        "layer": "data",
        "type": "layer",
        "description": "数据存储：Session 日志、能力快照、截图"
      },
      {
        "id": "data-sessions",
        "name": "sessions/",
        "layer": "data",
        "type": "module",
        "description": "Agent Session 日志文件 (JSON)",
        "path": "data/sessions/",
        "parent": "layer-data"
      },
      {
        "id": "data-snapshots",
        "name": "snapshots/",
        "layer": "data",
        "type": "module",
        "description": "能力快照",
        "path": "data/capability-snapshots/",
        "parent": "layer-data"
      },
      {
        "id": "data-changelog",
        "name": "changelog.md",
        "layer": "data",
        "type": "file",
        "description": "能力变更日志",
        "path": "data/capability-changelog.md",
        "parent": "layer-data"
      },
      {
        "id": "data-prtsc",
        "name": "PrtSc/",
        "layer": "data",
        "type": "module",
        "description": "用户截图",
        "path": "data/PrtSc/",
        "parent": "layer-data"
      }
    ],
    "links": [
      {
        "source": "spec-claude-md",
        "target": "layer-frontend",
        "type": "uses",
        "label": "指导开发"
      },
      {
        "source": "spec-claude-md",
        "target": "layer-backend",
        "type": "uses",
        "label": "指导开发"
      },
      {
        "source": "spec-specs",
        "target": "layer-frontend",
        "type": "uses",
        "label": "定义功能"
      },
      {
        "source": "spec-standards",
        "target": "data-sessions",
        "type": "uses",
        "label": "STD-001 定义格式"
      },
      {
        "source": "fe-timeline",
        "target": "be-api",
        "type": "api_call",
        "label": "GET /sessions"
      },
      {
        "source": "fe-timeline",
        "target": "be-websocket",
        "type": "data_flow",
        "label": "实时更新"
      },
      {
        "source": "fe-detail",
        "target": "fe-timeline",
        "type": "uses",
        "label": "联动"
      },
      {
        "source": "fe-tool-detail",
        "target": "fe-timeline",
        "type": "uses",
        "label": "联动"
      },
      {
        "source": "fe-layout",
        "target": "fe-particles",
        "type": "uses",
        "label": "Header 动画"
      },
      {
        "source": "fe-context",
        "target": "fe-timeline",
        "type": "uses",
        "label": "联动高亮"
      },
      {
        "source": "fe-search",
        "target": "be-api",
        "type": "api_call",
        "label": "搜索 Session"
      },
      {
        "source": "be-api",
        "target": "data-sessions",
        "type": "data_flow",
        "label": "读取 Session"
      },
      {
        "source": "be-api",
        "target": "be-models",
        "type": "uses",
        "label": "数据结构"
      },
      {
        "source": "be-api",
        "target": "be-services",
        "type": "uses",
        "label": "业务逻辑"
      },
      {
        "source": "be-websocket",
        "target": "data-sessions",
        "type": "data_flow",
        "label": "监听变更"
      },
      {
        "source": "spec-rules",
        "target": "data-snapshots",
        "type": "uses",
        "label": "RULE-001 触发审视"
      }
    ]
  };

  // Configuration
  const config = {
    layers: {
      spec: { color: '#a855f7', order: 0 },
      frontend: { color: '#3b82f6', order: 1 },
      backend: { color: '#f97316', order: 2 },
      data: { color: '#22c55e', order: 3 }
    },
    layout: {
      layerHeight: 160,
      layerGap: 30,
      nodeWidth: 110,
      nodeHeight: 44,
      nodeGap: 16,
      padding: { top: 40, right: 40, bottom: 40, left: 40 }
    },
    animation: {
      duration: 300
    }
  };

  // State
  let svg, g, zoom;
  let nodes = [];
  let links = [];
  let nodePositions = new Map();

  // Initialize
  function init() {
    // Use embedded data
    nodes = ARCHITECTURE_DATA.nodes;
    links = ARCHITECTURE_DATA.links;

    // Setup SVG
    setupSVG();

    // Calculate positions
    calculatePositions();

    // Render
    render();

    // Setup controls
    setupControls();
  }

  // Setup SVG with zoom
  function setupSVG() {
    const container = document.querySelector('.canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg = d3.select('#architecture-svg')
      .attr('width', width)
      .attr('height', height);

    // Add defs for arrowhead marker
    const defs = svg.append('defs');

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', config.layers.data.color);

    // Create main group for zoom/pan
    g = svg.append('g')
      .attr('class', 'main-group');

    // Setup zoom behavior
    zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial transform to center the diagram
    const totalWidth = getTotalWidth();
    const totalHeight = getTotalHeight();
    const initialScale = Math.min(
      (width - 80) / totalWidth,
      (height - 80) / totalHeight,
      1
    );
    const initialX = (width - totalWidth * initialScale) / 2;
    const initialY = (height - totalHeight * initialScale) / 2;
    svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));
  }

  // Calculate total width needed
  function getTotalWidth() {
    const layerNodes = {};
    nodes.filter(n => n.type !== 'layer').forEach(node => {
      if (!layerNodes[node.layer]) layerNodes[node.layer] = [];
      layerNodes[node.layer].push(node);
    });

    let maxWidth = 0;
    Object.values(layerNodes).forEach(layerNodeList => {
      const width = layerNodeList.length * (config.layout.nodeWidth + config.layout.nodeGap);
      if (width > maxWidth) maxWidth = width;
    });

    return maxWidth + config.layout.padding.left + config.layout.padding.right;
  }

  // Calculate total height needed
  function getTotalHeight() {
    const numLayers = Object.keys(config.layers).length;
    return config.layout.padding.top +
           numLayers * config.layout.layerHeight +
           (numLayers - 1) * config.layout.layerGap +
           config.layout.padding.bottom;
  }

  // Calculate node positions
  function calculatePositions() {
    const { layerHeight, layerGap, nodeWidth, nodeHeight, nodeGap, padding } = config.layout;

    // Group nodes by layer
    const layerNodes = {};
    nodes.forEach(node => {
      if (node.type === 'layer') return;
      if (!layerNodes[node.layer]) layerNodes[node.layer] = [];
      layerNodes[node.layer].push(node);
    });

    // Calculate layer widths
    const layerWidths = {};
    Object.entries(layerNodes).forEach(([layer, nodeList]) => {
      layerWidths[layer] = nodeList.length * (nodeWidth + nodeGap) - nodeGap;
    });

    const maxWidth = Math.max(...Object.values(layerWidths), 600);

    // Position nodes
    Object.entries(layerNodes).forEach(([layer, nodeList]) => {
      const layerConfig = config.layers[layer];
      const y = padding.top + layerConfig.order * (layerHeight + layerGap);
      const layerWidth = layerWidths[layer];
      const startX = padding.left + (maxWidth - layerWidth) / 2;

      nodeList.forEach((node, i) => {
        const x = startX + i * (nodeWidth + nodeGap);
        nodePositions.set(node.id, {
          x: x + nodeWidth / 2,
          y: y + layerHeight / 2,
          width: nodeWidth,
          height: nodeHeight,
          layer: layer
        });
      });
    });

    // Position layer backgrounds
    Object.entries(config.layers).forEach(([layer, layerConfig]) => {
      const y = padding.top + layerConfig.order * (layerHeight + layerGap);
      nodePositions.set(`layer-${layer}`, {
        x: padding.left,
        y: y,
        width: maxWidth,
        height: layerHeight,
        layer: layer
      });
    });
  }

  // Render the visualization
  function render() {
    renderLayers();
    renderLinks();
    renderNodes();
  }

  // Render layer backgrounds
  function renderLayers() {
    const layers = Object.entries(config.layers);

    const layerGroups = g.selectAll('.layer-group')
      .data(layers)
      .enter()
      .append('g')
      .attr('class', 'layer-group');

    layerGroups.each(function([layerName, layerConfig]) {
      const group = d3.select(this);
      const pos = nodePositions.get(`layer-${layerName}`);

      group.append('rect')
        .attr('class', 'layer-bg')
        .attr('x', pos.x)
        .attr('y', pos.y)
        .attr('width', pos.width)
        .attr('height', pos.height)
        .style('stroke', layerConfig.color);

      // Layer label
      const layerNode = nodes.find(n => n.id === `layer-${layerName}`);
      if (layerNode) {
        group.append('text')
          .attr('class', 'layer-label')
          .attr('x', pos.x + 16)
          .attr('y', pos.y + 24)
          .text(layerNode.name)
          .style('fill', layerConfig.color);
      }
    });
  }

  // Render links
  function renderLinks() {
    const linkData = links.map(link => {
      const source = nodePositions.get(link.source);
      const target = nodePositions.get(link.target);
      if (!source || !target) return null;
      return { ...link, sourcePos: source, targetPos: target };
    }).filter(Boolean);

    const linkGroup = g.append('g')
      .attr('class', 'links-group');

    linkGroup.selectAll('.link')
      .data(linkData)
      .enter()
      .append('path')
      .attr('class', d => `link ${d.type}`)
      .attr('d', d => generateLinkPath(d))
      .attr('data-source', d => d.source)
      .attr('data-target', d => d.target);

    // Link labels
    linkGroup.selectAll('.link-label')
      .data(linkData.filter(d => d.label))
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('x', d => (d.sourcePos.x + d.targetPos.x) / 2)
      .attr('y', d => (d.sourcePos.y + d.targetPos.y) / 2 - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.label);
  }

  // Generate curved link path
  function generateLinkPath(link) {
    const source = link.sourcePos;
    const target = link.targetPos;

    const sourceLayerOrder = config.layers[source.layer].order;
    const targetLayerOrder = config.layers[target.layer].order;

    let sy, ty;

    if (sourceLayerOrder < targetLayerOrder) {
      sy = source.y + source.height / 2;
      ty = target.y - target.height / 2;
    } else if (sourceLayerOrder > targetLayerOrder) {
      sy = source.y - source.height / 2;
      ty = target.y + target.height / 2;
    } else {
      sy = source.y;
      ty = target.y;
    }

    const sx = source.x;
    const tx = target.x;
    const midY = (sy + ty) / 2;

    if (sourceLayerOrder === targetLayerOrder) {
      const controlOffset = 40;
      return `M ${sx} ${sy} C ${sx} ${sy - controlOffset}, ${tx} ${ty - controlOffset}, ${tx} ${ty}`;
    } else {
      return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
    }
  }

  // Render nodes
  function renderNodes() {
    const nodeData = nodes.filter(n => n.type !== 'layer');

    const nodeGroup = g.append('g')
      .attr('class', 'nodes-group');

    const nodeElements = nodeGroup.selectAll('.node')
      .data(nodeData)
      .enter()
      .append('g')
      .attr('class', d => `node ${d.layer}`)
      .attr('transform', d => {
        const pos = nodePositions.get(d.id);
        return `translate(${pos.x}, ${pos.y})`;
      })
      .on('mouseenter', handleNodeMouseEnter)
      .on('mouseleave', handleNodeMouseLeave)
      .on('click', handleNodeClick);

    // Node shape
    nodeElements.each(function(d) {
      const node = d3.select(this);
      const pos = nodePositions.get(d.id);

      if (d.type === 'file') {
        node.append('circle')
          .attr('class', 'node-circle')
          .attr('r', 22);
      } else {
        node.append('rect')
          .attr('class', 'node-rect')
          .attr('x', -pos.width / 2)
          .attr('y', -pos.height / 2)
          .attr('width', pos.width)
          .attr('height', pos.height);
      }
    });

    // Node labels
    nodeElements.append('text')
      .attr('class', 'node-label')
      .text(d => truncateText(d.name, 12));
  }

  // Truncate text
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 1) + '…';
  }

  // Handle node mouse enter
  function handleNodeMouseEnter(event, d) {
    const node = d3.select(this);
    node.classed('highlighted', true);

    // Highlight connected links
    g.selectAll('.link')
      .classed('highlighted', function() {
        const linkSource = d3.select(this).attr('data-source');
        const linkTarget = d3.select(this).attr('data-target');
        return linkSource === d.id || linkTarget === d.id;
      });

    // Show link labels for connected links
    g.selectAll('.link-label')
      .classed('visible', function() {
        const label = d3.select(this).text();
        return links.some(l =>
          (l.source === d.id || l.target === d.id) && l.label === label
        );
      });

    showTooltip(event, d);
  }

  // Handle node mouse leave
  function handleNodeMouseLeave() {
    d3.select(this).classed('highlighted', false);
    g.selectAll('.link').classed('highlighted', false);
    g.selectAll('.link-label').classed('visible', false);
    hideTooltip();
  }

  // Handle node click
  function handleNodeClick(event, d) {
    if (d.path) {
      console.log('Path:', d.path);
    }
  }

  // Show tooltip
  function showTooltip(event, d) {
    const tooltip = document.getElementById('tooltip');

    let html = `<div class="tooltip-title">${d.name}</div>`;
    if (d.description) {
      html += `<div class="tooltip-desc">${d.description}</div>`;
    }
    if (d.path) {
      html += `<div class="tooltip-path">${d.path}</div>`;
    }

    tooltip.innerHTML = html;
    tooltip.classList.add('visible');

    const x = event.pageX + 15;
    const y = event.pageY + 15;
    const tooltipRect = tooltip.getBoundingClientRect();
    const maxX = window.innerWidth - tooltipRect.width - 20;
    const maxY = window.innerHeight - tooltipRect.height - 20;

    tooltip.style.left = Math.min(x, maxX) + 'px';
    tooltip.style.top = Math.min(y, maxY) + 'px';
  }

  // Hide tooltip
  function hideTooltip() {
    document.getElementById('tooltip').classList.remove('visible');
  }

  // Setup controls
  function setupControls() {
    document.getElementById('btn-reset').addEventListener('click', () => {
      const container = document.querySelector('.canvas-container');
      const width = container.clientWidth;
      const height = container.clientHeight;
      const totalWidth = getTotalWidth();
      const totalHeight = getTotalHeight();
      const initialScale = Math.min(
        (width - 80) / totalWidth,
        (height - 80) / totalHeight,
        1
      );
      const initialX = (width - totalWidth * initialScale) / 2;
      const initialY = (height - totalHeight * initialScale) / 2;

      svg.transition()
        .duration(config.animation.duration)
        .call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));
    });

    document.getElementById('btn-expand').addEventListener('click', () => {
      svg.transition()
        .duration(config.animation.duration)
        .call(zoom.scaleBy, 1.5);
    });

    document.getElementById('btn-collapse').addEventListener('click', () => {
      svg.transition()
        .duration(config.animation.duration)
        .call(zoom.scaleBy, 0.67);
    });
  }

  // Handle resize
  window.addEventListener('resize', () => {
    const container = document.querySelector('.canvas-container');
    svg.attr('width', container.clientWidth)
       .attr('height', container.clientHeight);
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
