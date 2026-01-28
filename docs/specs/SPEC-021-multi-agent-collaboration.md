# SPEC-021: Multi-Agent Collaboration Architecture

> Author: Boris Huai
> Draft Date: 2026-01-26
> Status: Draft

---

## 1. Overview

### 1.1 Background

BorisAgentStudio's current architecture supports single-agent session visualization. As Claude Code evolves, supporting multi-agent collaboration becomes essential for:

- Parallel task execution across specialized agents
- Division of labor (architecture, implementation, review)
- Scalable development workflows
- Better task decomposition and quality assurance

### 1.2 Design Goals

1. **Clear Role Separation**: Define distinct responsibilities for each agent type
2. **Orchestrated Workflow**: Architect agent coordinates task flow
3. **Traceable Execution**: Full visibility into sub-agent activities
4. **Extensible Model**: Support future agent types and collaboration patterns
5. **Backward Compatibility**: Extend STD-001, don't replace it

### 1.3 Non-Goals

- Real-time agent-to-agent communication (use message passing instead)
- Dynamic agent creation at runtime (agent types are predefined)
- Replacing the core tool-call model (multi-agent is layered on top)

---

## 2. Architecture Overview

### 2.1 Three-Agent Model

```
                              User Request
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECT AGENT (Orchestrator)                        │
│  Role: Design, Planning, Task Decomposition, Coordination, Integration   │
│  Tools: Read, Glob, Grep, LSP, EnterPlanMode, TaskCreate, Task          │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │ Task (delegate)     │ Task (delegate)     │ Task (review)
           ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ DEVELOPER AGENT  │  │ DEVELOPER AGENT  │  │ REVIEWER AGENT   │
│ (Worker #1)      │  │ (Worker #2)      │  │ (Quality Gate)   │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ Role: Code Impl  │  │ Role: Code Impl  │  │ Role: Code Review│
│ Tools:           │  │ Tools:           │  │ Tools:           │
│ Read, Write,     │  │ Read, Write,     │  │ Read, Grep,      │
│ Edit, Bash       │  │ Edit, Bash       │  │ Bash (test)      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 2.2 Collaboration Mode: Master-Worker

This architecture follows a **Master-Worker** pattern:

- **Master (Architect)**: Receives user request, designs solution, decomposes tasks, coordinates workers, integrates results
- **Workers (Developer/Reviewer)**: Execute delegated tasks, report results back to master

### 2.3 Agent Role Definitions

#### 2.3.1 Architect Agent

| Aspect | Description |
|--------|-------------|
| **Responsibility** | High-level design, task decomposition, coordination |
| **Inputs** | User request, codebase context |
| **Outputs** | Implementation plan, task assignments, final report |
| **Available Tools** | Read, Glob, Grep, LSP, EnterPlanMode, ExitPlanMode, TaskCreate, TaskUpdate, TaskList, Task |
| **Constraints** | Must not directly modify code (delegates to Developer) |
| **Success Criteria** | All sub-tasks completed, review passed |

#### 2.3.2 Developer Agent

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Code implementation based on specifications |
| **Inputs** | Task assignment from Architect (DeveloperInput) |
| **Outputs** | Code changes, implementation summary (DeveloperOutput) |
| **Available Tools** | Read, Write, Edit, Bash, Glob, Grep |
| **Constraints** | Must follow specs provided by Architect |
| **Success Criteria** | Code compiles, basic tests pass |

#### 2.3.3 Reviewer Agent

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Code quality assurance, standards compliance |
| **Inputs** | Code changes from Developer, review criteria |
| **Outputs** | Review verdict, findings list (ReviewerOutput) |
| **Available Tools** | Read, Grep, Bash (for tests/type-check), Glob |
| **Constraints** | Must not modify code (only suggest changes) |
| **Success Criteria** | All critical findings addressed |

---

## 3. Collaboration Workflow

### 3.1 Standard Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                         COLLABORATION WORKFLOW                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. RECEIVE         User submits request to Architect                  │
│     ────────▶                                                          │
│                                                                        │
│  2. ANALYZE         Architect explores codebase, designs solution      │
│     ────────▶       [Read, Glob, Grep, LSP]                           │
│                                                                        │
│  3. PLAN            Architect creates task breakdown                   │
│     ────────▶       [EnterPlanMode, TaskCreate]                       │
│                                                                        │
│  4. DELEGATE        Architect assigns tasks to Developer(s)            │
│     ────────▶       [Task tool with DeveloperInput]                   │
│                     ↓                                                  │
│                     ┌────────────────────────────────┐                │
│                     │  DEVELOPER EXECUTION (parallel) │                │
│                     │  [Read, Write, Edit, Bash]     │                │
│                     └────────────────────────────────┘                │
│                     ↓                                                  │
│  5. COLLECT         Architect receives DeveloperOutput                 │
│     ────────▶                                                          │
│                                                                        │
│  6. REVIEW          Architect submits to Reviewer                      │
│     ────────▶       [Task tool with ReviewerInput]                    │
│                     ↓                                                  │
│                     ┌────────────────────────────────┐                │
│                     │  REVIEWER EXECUTION            │                │
│                     │  [Read, Grep, Bash tests]      │                │
│                     └────────────────────────────────┘                │
│                     ↓                                                  │
│  7. ITERATE         If changes requested → back to step 4              │
│     ────────▶       If approved → continue                            │
│                                                                        │
│  8. COMPLETE        Architect produces final report                    │
│     ────────▶                                                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Parallel Execution

Multiple Developer agents can work in parallel on independent tasks:

```
Architect
    │
    ├─────────┬─────────┬─────────┐
    ▼         ▼         ▼         ▼
Developer1  Developer2  Developer3  Developer4
(Task A)    (Task B)    (Task C)    (Task D)
    │         │         │         │
    └─────────┴─────────┴─────────┘
              │
              ▼
          Architect
          (collect)
```

### 3.3 Review Loop

```
         ┌──────────────────────────────────────┐
         │                                      │
         ▼                                      │
    [Developer]  ──────▶  [Reviewer]           │
         │                    │                 │
         │              verdict?                │
         │                    │                 │
         │         ┌─────────┴─────────┐       │
         │         │                   │       │
         │    [approved]         [changes_requested]
         │         │                   │       │
         │         ▼                   └───────┘
         │    [Complete]
         │
         └── retry with feedback ──────────────┘
```

---

## 4. Data Model

### 4.1 Extended Session Model

```typescript
/**
 * Multi-Agent Session extends the base AgentSession
 */
interface MultiAgentSession extends AgentSession {
  collaboration: CollaborationInfo;
  sub_sessions: SubAgentSession[];
  messages: AgentMessage[];
}

interface CollaborationInfo {
  mode: 'single' | 'multi_agent';
  pattern: 'master_worker' | 'peer_to_peer' | 'pipeline';
  orchestrator: AgentIdentifier;
  participants: AgentIdentifier[];
}

interface AgentIdentifier {
  agent_id: string;
  agent_type: AgentType;
  instance_id?: string;
}

type AgentType = 'architect' | 'developer' | 'reviewer';
```

### 4.2 Sub-Session Model

```typescript
/**
 * SubAgentSession captures a sub-agent's execution
 */
interface SubAgentSession {
  sub_session_id: string;
  parent_session_id: string;
  agent: AgentIdentifier;

  // Task assignment
  task: TaskAssignment;

  // Execution data (same as regular session)
  started_at: string;
  completed_at?: string;
  status: SessionStatus;
  tool_calls: ToolCall[];

  // Agent-type-specific output
  output?: DeveloperOutput | ReviewerOutput;

  // Relation to parent
  triggered_by_call_id: string;  // The Task tool call that created this
}

interface TaskAssignment {
  task_id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];  // task_ids that must complete first
}
```

### 4.3 Agent Input/Output Contracts

#### Developer Input/Output

```typescript
interface DeveloperInput {
  task_id: string;
  task_description: string;
  context: {
    specs: string[];           // Relevant spec file paths
    reference_files: string[]; // Files to read for context
  };
  constraints: {
    scope: string[];           // Files allowed to modify
    testing_required: boolean;
    style_guide?: string;
  };
}

interface DeveloperOutput {
  task_id: string;
  status: 'completed' | 'partial' | 'failed';
  changes: {
    files_created: string[];
    files_modified: string[];
    files_deleted: string[];
  };
  summary: string;
  notes?: string;
  blockers?: string[];
}
```

#### Reviewer Input/Output

```typescript
interface ReviewerInput {
  task_id: string;
  review_scope: {
    files: string[];
    focus_areas?: ('security' | 'performance' | 'style' | 'logic')[];
  };
  criteria: {
    must_pass_tests: boolean;
    must_pass_type_check: boolean;
    custom_checks?: string[];
  };
}

interface ReviewerOutput {
  task_id: string;
  verdict: 'approved' | 'changes_requested' | 'rejected';
  findings: ReviewFinding[];
  verification: {
    tests_passed: boolean;
    type_check_passed: boolean;
    custom_checks?: Record<string, boolean>;
  };
  summary: string;
}

interface ReviewFinding {
  finding_id: string;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  category: 'bug' | 'security' | 'performance' | 'style' | 'logic';
  file: string;
  line?: number;
  description: string;
  suggestion?: string;
}
```

### 4.4 Agent Messages

```typescript
/**
 * Messages between agents (for traceability)
 */
interface AgentMessage {
  message_id: string;
  timestamp: string;
  from_agent: AgentIdentifier;
  to_agent: AgentIdentifier;
  message_type: MessageType;
  content: unknown;
  related_task_id?: string;
}

type MessageType =
  | 'task_assignment'    // Architect → Developer
  | 'task_completion'    // Developer → Architect
  | 'review_request'     // Architect → Reviewer
  | 'review_result'      // Reviewer → Architect
  | 'feedback'           // Any → Any
  | 'status_update';     // Any → Architect
```

---

## 5. Integration with Existing Model

### 5.1 Relation to STD-001

Multi-agent collaboration **extends** STD-001, not replaces it:

| STD-001 Concept | Multi-Agent Extension |
|-----------------|----------------------|
| AgentSession | MultiAgentSession inherits all fields |
| tool_calls[] | Each sub_session has its own tool_calls[] |
| SubagentInfo | Enhanced to reference SubAgentSession |
| phase_annotations | Can span multiple sub_sessions |

### 5.2 Backward Compatibility

Single-agent sessions remain valid:

```typescript
function isMultiAgentSession(session: AgentSession): session is MultiAgentSession {
  return 'collaboration' in session && session.collaboration.mode === 'multi_agent';
}
```

### 5.3 Tool Call Linking

Task tool calls in the main session link to sub_sessions:

```
Main Session
├── tool-001: Read
├── tool-002: Task (→ sub_session_id: "sub-001")
│                   └── SubAgentSession "sub-001"
│                       ├── tool-001: Read
│                       ├── tool-002: Write
│                       └── tool-003: Edit
├── tool-003: Task (→ sub_session_id: "sub-002")
│                   └── SubAgentSession "sub-002"
│                       └── ...
└── tool-004: Read
```

---

## 6. Visualization Implications

See SPEC-023 for detailed visualization design. Key points:

### 6.1 Swimlane View

Each agent gets a swimlane in the timeline:

```
         Time ────────────────────────────────────────────▶

Architect │ ●─────●─────●─────────────────●─────●─────●
          │       │     │                 ▲     │     │
          │       ▼     ▼                 │     ▼     ▼
Developer1│       ●─────●─────●───────────┘
          │
Developer2│             ●─────●─────●─────────────────┘
          │
Reviewer  │                               ●─────●─────┘
```

### 6.2 Agent Overview Cards

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Architect   │  │ Developer   │  │ Reviewer    │
│ ● Active    │  │ ● 2 tasks   │  │ ○ Pending   │
│ 15 calls    │  │ 28 calls    │  │ 0 calls     │
│ 2m 30s      │  │ 4m 15s      │  │ --          │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 6.3 Delegation Detail

When viewing a Task tool call, show the linked sub-session:

```
┌─────────────────────────────────────────────────────────┐
│ #5 Task → Developer                                      │
├─────────────────────────────────────────────────────────┤
│ Input: DeveloperInput                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ task: "Implement Timeline component"                 │ │
│ │ scope: ["frontend/src/components/Timeline/**"]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Sub-Session: sub-001                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ●───●───●───●───●───●  (12 tool calls)              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Output: DeveloperOutput                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ status: completed                                    │ │
│ │ files_created: ["Timeline.tsx", "Timeline.css"]     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Error Handling

### 7.1 Sub-Agent Failures

When a sub-agent fails:

1. SubAgentSession.status = 'failed'
2. SubAgentSession.output.status = 'failed'
3. Architect receives failure notification
4. Architect decides: retry, reassign, or abort

### 7.2 Review Rejection

When Reviewer rejects changes:

1. ReviewerOutput.verdict = 'rejected'
2. Architect creates new Developer task with feedback
3. Iteration counter increments
4. Max iterations configurable (default: 3)

### 7.3 Timeout Handling

| Agent | Default Timeout | Escalation |
|-------|-----------------|------------|
| Developer | 10 minutes | Report partial progress |
| Reviewer | 5 minutes | Skip optional checks |

---

## 8. Future Extensions

### 8.1 Additional Agent Types

| Type | Role |
|------|------|
| Tester | Dedicated test writing and execution |
| Documenter | Documentation generation |
| Security | Security-focused review |
| Optimizer | Performance optimization |

### 8.2 Alternative Patterns

| Pattern | Description |
|---------|-------------|
| Peer-to-Peer | Agents collaborate without central coordinator |
| Pipeline | Each agent's output feeds the next |
| Consensus | Multiple agents vote on decisions |

---

## 9. Related Documents

- [SPEC-003: Claude Code Execution Model](./SPEC-003-claude-code-execution-model.md)
- [SPEC-022: Agent Communication Protocol](./SPEC-022-agent-protocol.md)
- [SPEC-023: Multi-Agent Visualization](./SPEC-023-multi-agent-visualization.md)
- [STD-001: Session Logging Standard](../../standards/data/STD-001-agent-session-logging.md)
- [STD-008: Multi-Agent Logging Standard](../../standards/collaboration/STD-008-multi-agent-logging.md)

---

## 10. Acceptance Criteria

1. [ ] Data model supports multi-agent sessions
2. [ ] Architect can delegate tasks to Developer agents
3. [ ] Developer output is traceable to specific tasks
4. [ ] Reviewer can approve/reject changes
5. [ ] Iteration loop works correctly
6. [ ] Backward compatible with single-agent sessions
7. [ ] TypeScript types defined and compile
8. [ ] Example session data validates correctly
