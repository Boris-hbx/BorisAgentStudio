# SPEC-023: Multi-Agent Visualization Design

> Author: Boris Huai
> Draft Date: 2026-01-26
> Status: Draft

---

## 1. Overview

This document specifies the visualization design for multi-agent collaboration sessions in BorisAgentStudio. It extends the existing tool-call timeline visualization to support multiple concurrent agents.

### 1.1 Design Goals

1. **Clear Agent Identity**: Visually distinguish different agent types
2. **Temporal Clarity**: Show parallel and sequential execution
3. **Hierarchical Drill-down**: Navigate from overview to details
4. **Backward Compatibility**: Support single-agent sessions unchanged

### 1.2 Key Challenges

| Challenge | Solution |
|-----------|----------|
| Multiple parallel timelines | Swimlane view |
| Delegation relationships | Visual connectors |
| Dense information | Progressive disclosure |
| Agent state tracking | Status indicators |

---

## 2. Layout Architecture

### 2.1 Page Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                       │
│ Session Selector | Import | [Multi-Agent Badge]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ StatusBar                                                                    │
│ Progress | Duration | Status | Tool Calls | [Agent Count: 3]                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────┬──────────────────┐  │
│  │ Main Visualization Area                           │ Detail Panel     │  │
│  │                                                    │ (420px)          │  │
│  │ ┌──────────────────────────────────────────────┐ │                   │  │
│  │ │ Agent Overview Cards (fixed height: 100px)   │ │ Context-sensitive │  │
│  │ │ [Architect] [Developer×2] [Reviewer]         │ │ - Agent Details   │  │
│  │ └──────────────────────────────────────────────┘ │ - Task Details    │  │
│  │                                                    │ - Tool Details   │  │
│  │ ┌──────────────────────────────────────────────┐ │ - Message Log    │  │
│  │ │ Swimlane Timeline (scrollable)               │ │                   │  │
│  │ │                                               │ │                   │  │
│  │ │ Architect   ●─●─●─────────────────●─●─●      │ │                   │  │
│  │ │                 ╲                 ╱          │ │                   │  │
│  │ │ Developer1      ●─●─●─●─●─●─●─●─●            │ │                   │  │
│  │ │                     ╲                        │ │                   │  │
│  │ │ Developer2          ●─●─●─●─●                │ │                   │  │
│  │ │                                 ╲            │ │                   │  │
│  │ │ Reviewer                        ●─●─●        │ │                   │  │
│  │ │                                               │ │                   │  │
│  │ └──────────────────────────────────────────────┘ │                   │  │
│  │                                                    │                   │  │
│  └───────────────────────────────────────────────────┴──────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Hierarchy

```
MultiAgentView/
├── AgentOverview/
│   ├── AgentCard.tsx
│   └── AgentStatusIndicator.tsx
├── SwimlaneTi meline/
│   ├── SwimlaneContainer.tsx
│   ├── AgentSwimlane.tsx
│   ├── ToolCallNode.tsx (reuse existing)
│   ├── DelegationConnector.tsx
│   └── TimeAxis.tsx
├── DetailPanel/
│   ├── AgentDetailView.tsx
│   ├── TaskDetailView.tsx
│   ├── ToolDetailView.tsx (reuse existing)
│   └── MessageLogView.tsx
└── CollaborationFlow/
    ├── FlowOverview.tsx
    └── FlowNode.tsx
```

---

## 3. Agent Overview Cards

### 3.1 Card Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Agent Overview                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │ 🏛 Architect   │  │ 👨‍💻 Developer  │  │ 🔍 Reviewer    │                │
│  │                │  │    (×2)        │  │                │                │
│  │ ● Active       │  │ ● 2 active     │  │ ○ Idle         │                │
│  │                │  │                │  │                │                │
│  │ 15 calls       │  │ 34 calls       │  │ 0 calls        │                │
│  │ 2m 30s         │  │ 4m 15s         │  │ --             │                │
│  │                │  │                │  │                │                │
│  │ Tasks: 3/3 ✓   │  │ Tasks: 2/2 ✓   │  │ Pending: 1     │                │
│  └────────────────┘  └────────────────┘  └────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Card States

| State | Visual | Description |
|-------|--------|-------------|
| Active | Green dot, highlighted border | Currently executing |
| Idle | Gray dot | Waiting for work |
| Completed | Checkmark | Finished all tasks |
| Error | Red dot | Encountered error |

### 3.3 Card Interactions

| Action | Behavior |
|--------|----------|
| Click | Select agent, filter timeline to show only this agent |
| Hover | Show tooltip with agent details |
| Double-click | Open agent detail panel |

---

## 4. Swimlane Timeline

### 4.1 Swimlane Structure

```
     Time Axis
     │
     │    0s       30s       60s       90s      120s      150s
     ├────┼─────────┼─────────┼─────────┼─────────┼─────────┼────▶
     │
     │   Architect Lane (height: 60px)
─────┼───┌──────────────────────────────────────────────────────────
     │   │  ●──●──●                              ●──●──●
     │   │  R  G  R                              R  R  W
     │   │      ╲                               ╱
─────┼───└───────╲─────────────────────────────╱────────────────────
     │            ╲                           ╱
     │   Developer1 Lane (height: 60px)     ╱
─────┼───┌─────────╲───────────────────────╱────────────────────────
     │   │          ●──●──●──●──●──●──●──●
     │   │          R  R  W  E  W  B  R  W
     │   │                          ╲
─────┼───└───────────────────────────╲──────────────────────────────
     │                                ╲
     │   Developer2 Lane (height: 60px)╲
─────┼───┌─────────────────────────────╲────────────────────────────
     │   │                              ●──●──●──●──●
     │   │                              R  R  W  E  W
─────┼───└──────────────────────────────────────────────────────────
     │
     │   Reviewer Lane (height: 60px)
─────┼───┌──────────────────────────────────────────────────────────
     │   │                                        ●──●──●
     │   │                                        R  B  R
─────┼───└──────────────────────────────────────────────────────────
     │
     ▼
```

### 4.2 Lane Design

```typescript
interface SwimlaneConfig {
  lane_height: number;          // Default: 60px
  lane_padding: number;         // Default: 8px
  lane_gap: number;             // Default: 4px

  colors: {
    architect: '#8b5cf6';       // Purple
    developer: '#3b82f6';       // Blue
    reviewer: '#22c55e';        // Green
  };

  node_radius: number;          // Default: 8px
  connector_width: number;      // Default: 2px
}
```

### 4.3 Tool Call Nodes

Reuse existing `TimelineNode` with agent-aware styling:

```
┌──────────────────────────────────────────────────────────────────┐
│ Tool Call Node Variants                                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Perception:  ●     (Blue fill)                                  │
│                                                                   │
│  Action:      ◆     (Orange fill)                                │
│                                                                   │
│  Interaction: ◉     (Purple fill, hollow center)                 │
│               └── Task tool shows delegation arrow               │
│                                                                   │
│  Planning:    ▲     (Green fill)                                 │
│                                                                   │
│  Failed:      ✕     (Red X overlay)                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 Delegation Connectors

When Architect uses Task tool to delegate:

```
Architect:  ──●─────────────────────────────────●──
              │ Task                            ▲
              │ (delegation)                    │ (completion)
              ╲                                 ╱
Developer:    ●──●──●──●──●──●──●──●──●──●──●──●
              └─────────── sub-session ─────────┘
```

Connector styles:
- **Delegation**: Dashed line, downward arrow
- **Completion**: Dotted line, upward arrow
- **Hover**: Highlight both ends and connector

---

## 5. Detail Panel

### 5.1 Context-Sensitive Views

The detail panel shows different content based on selection:

| Selection | Panel Content |
|-----------|---------------|
| None | Session overview |
| Agent Card | Agent details |
| Tool Node | Tool call details |
| Delegation Connector | Task assignment details |
| Swimlane (agent row) | Sub-session summary |

### 5.2 Agent Detail View

```
┌─────────────────────────────────────────┐
│ 🏛 Architect Agent                       │
├─────────────────────────────────────────┤
│                                          │
│ Status: ● Active                         │
│ Instance: architect-main                 │
│                                          │
│ ─────────────────────────────────────── │
│ Statistics                               │
│ ─────────────────────────────────────── │
│ Tool Calls: 15                           │
│ Duration: 2m 30s                         │
│ Tasks Assigned: 3                        │
│ Reviews Requested: 1                     │
│                                          │
│ ─────────────────────────────────────── │
│ Task Assignments                         │
│ ─────────────────────────────────────── │
│ ✓ task-001: Implement Timeline           │
│   → Developer1 (completed)               │
│ ✓ task-002: Add styles                   │
│   → Developer2 (completed)               │
│ ● task-003: Review round 2               │
│   → Developer1 (in progress)             │
│                                          │
│ ─────────────────────────────────────── │
│ Tool Call Breakdown                      │
│ ─────────────────────────────────────── │
│ ████████░░ Read: 8                       │
│ ██░░░░░░░░ Glob: 2                       │
│ ██░░░░░░░░ Task: 3                       │
│ ██░░░░░░░░ Grep: 2                       │
│                                          │
└─────────────────────────────────────────┘
```

### 5.3 Task Detail View

```
┌─────────────────────────────────────────┐
│ Task: task-001                          │
├─────────────────────────────────────────┤
│                                          │
│ Implement Timeline component             │
│                                          │
│ ─────────────────────────────────────── │
│ Assignment                               │
│ ─────────────────────────────────────── │
│ From: Architect                          │
│ To: Developer1                           │
│ Priority: High                           │
│ Status: Completed ✓                      │
│                                          │
│ ─────────────────────────────────────── │
│ Input                                    │
│ ─────────────────────────────────────── │
│ Description:                             │
│ ┌─────────────────────────────────────┐ │
│ │ Implement Timeline component with   │ │
│ │ D3.js for tool call visualization   │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Scope: frontend/src/components/**        │
│                                          │
│ ─────────────────────────────────────── │
│ Output                                   │
│ ─────────────────────────────────────── │
│ Files Created:                           │
│ + Timeline.tsx                           │
│ + Timeline.css                           │
│                                          │
│ Files Modified:                          │
│ ~ App.tsx (+5, -0)                       │
│ ~ index.ts (+1, -0)                      │
│                                          │
│ ─────────────────────────────────────── │
│ Sub-Session                              │
│ ─────────────────────────────────────── │
│ Duration: 1m 45s                         │
│ Tool Calls: 12                           │
│ [View Tool Calls →]                      │
│                                          │
└─────────────────────────────────────────┘
```

### 5.4 Message Log View

```
┌─────────────────────────────────────────┐
│ Message Log                              │
├─────────────────────────────────────────┤
│                                          │
│ [Filter: All ▼] [Search: ___________]   │
│                                          │
│ ─────────────────────────────────────── │
│                                          │
│ 10:00:05 task_assignment                │
│ Architect → Developer1                   │
│ ┌─────────────────────────────────────┐ │
│ │ Task: Implement Timeline component  │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ 10:00:06 acknowledgment                 │
│ Developer1 → Architect                   │
│                                          │
│ 10:01:30 task_progress                  │
│ Developer1 → Architect                   │
│ ┌─────────────────────────────────────┐ │
│ │ Progress: 50%, Creating components  │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ 10:02:45 task_completion                │
│ Developer1 → Architect                   │
│ ┌─────────────────────────────────────┐ │
│ │ Status: completed                    │ │
│ │ Files: +2 created, +2 modified      │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ 10:02:50 review_request                 │
│ Architect → Reviewer                     │
│                                          │
│ 10:03:30 review_result                  │
│ Reviewer → Architect                     │
│ ┌─────────────────────────────────────┐ │
│ │ Verdict: approved ✓                  │ │
│ └─────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

---

## 6. Collaboration Flow Overview

For quick understanding of the collaboration structure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Collaboration Flow                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌─────────────┐                                     │
│                         │  Architect  │                                     │
│                         │  (main)     │                                     │
│                         └──────┬──────┘                                     │
│                                │                                             │
│              ┌─────────────────┼─────────────────┐                          │
│              │                 │                 │                          │
│              ▼                 ▼                 ▼                          │
│       ┌────────────┐    ┌────────────┐    ┌────────────┐                   │
│       │ Developer  │    │ Developer  │    │  Reviewer  │                   │
│       │ (task-001) │    │ (task-002) │    │ (review-1) │                   │
│       │ ✓ 12 calls │    │ ✓ 8 calls  │    │ ✓ 5 calls  │                   │
│       └────────────┘    └────────────┘    └────────────┘                   │
│                                                                              │
│   Legend: ─ delegation  ✓ completed  ● in progress  ○ pending              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Color Scheme

### 7.1 Agent Colors

| Agent Type | Primary | Secondary | Background |
|------------|---------|-----------|------------|
| Architect | `#8b5cf6` | `#a78bfa` | `#f5f3ff` |
| Developer | `#3b82f6` | `#60a5fa` | `#eff6ff` |
| Reviewer | `#22c55e` | `#4ade80` | `#f0fdf4` |

### 7.2 Status Colors

| Status | Color |
|--------|-------|
| Active | `#22c55e` |
| Idle | `#9ca3af` |
| Completed | `#3b82f6` |
| Error | `#ef4444` |
| Warning | `#f59e0b` |

### 7.3 Message Type Colors

| Type | Color |
|------|-------|
| task_assignment | `#3b82f6` |
| task_completion | `#22c55e` |
| review_request | `#f59e0b` |
| review_result | `#8b5cf6` |
| feedback | `#6b7280` |
| abort | `#ef4444` |

---

## 8. Interaction Design

### 8.1 Selection Model

```typescript
type SelectionType =
  | { type: 'none' }
  | { type: 'agent'; agentId: string }
  | { type: 'tool_call'; callId: string; sessionId: string }
  | { type: 'task'; taskId: string }
  | { type: 'message'; messageId: string }
  | { type: 'delegation'; fromCallId: string; toSessionId: string };
```

### 8.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate between lanes |
| ←/→ | Navigate between nodes in lane |
| Enter | Select/expand current item |
| Escape | Clear selection |
| Tab | Cycle through panels |
| 1-4 | Quick select agent by index |

### 8.3 Filtering

```typescript
interface TimelineFilter {
  agents: string[];             // Show only these agents
  tool_categories: ToolCategory[];
  time_range?: {
    start: number;
    end: number;
  };
  status?: ('success' | 'failed')[];
  search_query?: string;
}
```

---

## 9. Responsive Behavior

### 9.1 Breakpoints

| Width | Layout Adjustment |
|-------|-------------------|
| ≥ 1600px | Full layout, all lanes visible |
| 1200-1600px | Compact cards, scrollable lanes |
| 900-1200px | Detail panel becomes bottom drawer |
| < 900px | Single column, agent tabs |

### 9.2 Mobile Adaptations

- Agent cards: Horizontal scroll
- Timeline: Vertical orientation (agents stacked)
- Detail panel: Full-screen modal

---

## 10. Animation and Transitions

### 10.1 Lane Animations

| Event | Animation |
|-------|-----------|
| Node appears | Fade in + scale |
| Selection change | Highlight pulse |
| Delegation | Line draw animation |
| Lane expand/collapse | Height transition |

### 10.2 Timing

```css
--animation-fast: 150ms;
--animation-normal: 300ms;
--animation-slow: 500ms;
--easing-default: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 11. Accessibility

### 11.1 ARIA Labels

- Lanes have `role="row"` with agent name label
- Nodes have `role="button"` with tool description
- Connectors have `aria-label` describing delegation

### 11.2 Screen Reader Support

- Announce agent transitions
- Describe delegation relationships
- Provide summary statistics on request

---

## 12. Implementation Notes

### 12.1 D3.js Integration

```typescript
// Swimlane layout
const swimlaneScale = d3.scaleBand()
  .domain(agents.map(a => a.agent_id))
  .range([0, containerHeight])
  .padding(0.1);

// Time scale
const timeScale = d3.scaleLinear()
  .domain([0, sessionDuration])
  .range([0, containerWidth]);

// Node positioning
const nodePosition = (call: ToolCall, agentId: string) => ({
  x: timeScale(call.started_at),
  y: swimlaneScale(agentId) + swimlaneScale.bandwidth() / 2
});
```

### 12.2 Performance Considerations

- Virtualize swimlanes for sessions > 100 calls
- Debounce selection changes
- Use requestAnimationFrame for connector updates
- Lazy load sub-session details

---

## 13. Related Documents

- [SPEC-021: Multi-Agent Collaboration Architecture](./SPEC-021-multi-agent-collaboration.md)
- [SPEC-022: Agent Communication Protocol](./SPEC-022-agent-protocol.md)
- [SPEC-002: Visualization Design](./SPEC-002-visualization-design.md)
- [SPEC-011: Hierarchical Workflow Visualization](./SPEC-011-hierarchical-workflow-visualization.md)
- [STD-006: Accessibility Standards](../../standards/accessibility/STD-006-accessibility.md)

---

## 14. Acceptance Criteria

1. [ ] Swimlane view renders multiple agent timelines
2. [ ] Agent cards show correct statistics
3. [ ] Delegation connectors visualize Task tool relationships
4. [ ] Detail panel responds to selection context
5. [ ] Message log displays chronological messages
6. [ ] Filtering works across agents
7. [ ] Keyboard navigation functional
8. [ ] Responsive on tablet/mobile
9. [ ] Animations smooth at 60fps
10. [ ] Passes accessibility audit
