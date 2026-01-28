# STD-008: Multi-Agent Session Logging Standard

> Author: Boris Huai
> Draft Date: 2026-01-26
> Version: 1.0
> Status: Draft

---

## 1. Purpose

This standard extends STD-001 (Agent Session Logging Standard) to support multi-agent collaboration sessions. It defines how to record, structure, and link data from multiple cooperating agents.

### 1.1 Relationship to STD-001

| Aspect | STD-001 | STD-008 |
|--------|---------|---------|
| Scope | Single agent | Multiple agents |
| Session Type | AgentSession | MultiAgentSession |
| Tool Calls | Flat array | Per-agent arrays + links |
| New Concepts | - | SubAgentSession, AgentMessage |

STD-008 is a **superset** of STD-001. Single-agent sessions remain valid.

---

## 2. File Naming

### 2.1 Multi-Agent Session Files

```
{date}-{sequence}-{task-summary}-multi.json
```

Examples:
- `2026-01-26-001-implement-timeline-multi.json`
- `2026-01-26-005-refactor-api-multi.json`

### 2.2 Detection Rule

```typescript
function isMultiAgentSession(filename: string): boolean {
  return filename.endsWith('-multi.json');
}
```

---

## 3. Data Structure

### 3.1 MultiAgentSession

Extends `AgentSession` from STD-001:

```typescript
interface MultiAgentSession extends AgentSession {
  // === Multi-Agent Specific ===

  /**
   * Collaboration metadata
   */
  collaboration: {
    mode: 'multi_agent';
    pattern: 'master_worker' | 'peer_to_peer' | 'pipeline';
    orchestrator: AgentIdentifier;
    participants: AgentIdentifier[];
  };

  /**
   * Sub-agent execution sessions
   */
  sub_sessions: SubAgentSession[];

  /**
   * Inter-agent messages
   */
  messages: AgentMessage[];

  /**
   * Extended summary
   */
  summary: MultiAgentSessionSummary;
}

interface AgentIdentifier {
  agent_id: string;
  agent_type: 'architect' | 'developer' | 'reviewer';
  instance_id?: string;
}
```

### 3.2 SubAgentSession

Records a sub-agent's execution:

```typescript
interface SubAgentSession {
  sub_session_id: string;
  parent_session_id: string;
  agent: AgentIdentifier;

  // Trigger
  triggered_by_call_id: string;   // Task tool call in parent

  // Task assignment
  task: {
    task_id: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  };

  // Execution
  started_at: string;
  completed_at?: string;
  status: SessionStatus;
  tool_calls: ToolCall[];

  // Output (agent-type specific)
  output?: DeveloperOutput | ReviewerOutput;
}
```

### 3.3 AgentMessage

Inter-agent communication:

```typescript
interface AgentMessage {
  message_id: string;
  timestamp: string;
  sequence_number: number;

  from_agent: AgentIdentifier;
  to_agent: AgentIdentifier;

  message_type: MessageType;
  payload: unknown;

  correlation_id?: string;
  reply_to?: string;
}

type MessageType =
  | 'task_assignment'
  | 'task_progress'
  | 'task_completion'
  | 'review_request'
  | 'review_result'
  | 'feedback'
  | 'abort'
  | 'acknowledgment';
```

### 3.4 DeveloperOutput

```typescript
interface DeveloperOutput {
  task_id: string;
  status: 'completed' | 'partial' | 'failed';

  changes: {
    files_created: FileChange[];
    files_modified: FileChange[];
    files_deleted: string[];
  };

  summary: string;
  implementation_notes?: string;

  self_review?: {
    tests_run: boolean;
    tests_passed: boolean;
    type_check_passed: boolean;
  };

  blockers?: string[];
}

interface FileChange {
  path: string;
  lines_added?: number;
  lines_removed?: number;
  description?: string;
}
```

### 3.5 ReviewerOutput

```typescript
interface ReviewerOutput {
  review_id: string;
  task_id: string;

  verdict: 'approved' | 'changes_requested' | 'rejected';

  findings: ReviewFinding[];

  verification: {
    tests_passed: boolean;
    type_check_passed: boolean;
    custom_checks?: Record<string, boolean>;
  };

  summary: string;
  required_changes?: RequiredChange[];
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

interface RequiredChange {
  change_id: string;
  priority: 'must_fix' | 'should_fix' | 'consider';
  related_findings: string[];
  description: string;
}
```

### 3.6 MultiAgentSessionSummary

Extended summary:

```typescript
interface MultiAgentSessionSummary extends SessionSummary {
  // Per-agent statistics
  agents: {
    architect: AgentSummary;
    developers: AgentSummary[];
    reviewer?: AgentSummary;
  };

  // Task tracking
  tasks: {
    total: number;
    completed: number;
    failed: number;
  };

  // Review iterations
  review_iterations: number;
  final_verdict?: 'approved' | 'rejected';
}

interface AgentSummary {
  agent_id: string;
  agent_type: string;
  tool_calls_count: number;
  duration_ms: number;
  status: 'completed' | 'failed' | 'in_progress';
}
```

---

## 4. Linking Conventions

### 4.1 Task Tool Call to SubSession

When the orchestrator uses the `Task` tool, link to the resulting sub-session:

```typescript
// In main session tool_calls
{
  call_id: "tool-005",
  tool_name: "Task",
  tool_category: "interaction",
  // ... other fields ...
  subagent_info: {
    subagent_type: "developer",
    sub_session_id: "sub-001",    // Links to sub_sessions[]
    tool_uses: 12,
    tokens_used: 15000
  }
}

// In sub_sessions[]
{
  sub_session_id: "sub-001",
  triggered_by_call_id: "tool-005",  // Back-link
  // ...
}
```

### 4.2 Message to Task

Messages reference tasks:

```typescript
{
  message_type: "task_assignment",
  payload: {
    task: { task_id: "task-001", /* ... */ }
  },
  // ...
}
```

### 4.3 Review to Sub-Session

Review results link to the reviewed sub-session:

```typescript
{
  message_type: "review_result",
  payload: {
    task_id: "task-001",          // Links to sub_session.task.task_id
    verdict: "approved"
  }
}
```

---

## 5. Recording Guidelines

### 5.1 When to Use Multi-Agent Logging

| Scenario | Logging Type |
|----------|--------------|
| Single Task tool call | STD-001 with SubagentInfo |
| Multiple Task calls, sequential | STD-008 |
| Parallel Task calls | STD-008 |
| Task with review cycle | STD-008 |

### 5.2 Recording Sequence

1. Create main session with collaboration metadata
2. Record orchestrator tool_calls
3. When Task tool starts, create SubAgentSession
4. Record sub-agent tool_calls in SubAgentSession
5. When Task completes, finalize SubAgentSession
6. Record inter-agent messages
7. Compute summary statistics

### 5.3 Message Recording

Record messages at these events:

| Event | Message Type |
|-------|--------------|
| Architect assigns task | task_assignment |
| Developer acknowledges | acknowledgment |
| Developer reports progress | task_progress |
| Developer completes | task_completion |
| Architect requests review | review_request |
| Reviewer returns results | review_result |
| Any agent aborts | abort |

---

## 6. Validation Rules

### 6.1 Required Fields

Multi-agent sessions must have:

- `collaboration` object with all fields
- At least one `sub_session`
- `messages` array (may be empty for simple cases)

### 6.2 Consistency Checks

```typescript
function validateMultiAgentSession(session: MultiAgentSession): ValidationResult {
  const errors: string[] = [];

  // All sub_sessions must have valid triggered_by_call_id
  for (const sub of session.sub_sessions) {
    const triggerCall = session.tool_calls.find(
      c => c.call_id === sub.triggered_by_call_id
    );
    if (!triggerCall || triggerCall.tool_name !== 'Task') {
      errors.push(`sub_session ${sub.sub_session_id} has invalid trigger`);
    }
  }

  // All Task tool calls must have corresponding sub_session
  for (const call of session.tool_calls) {
    if (call.tool_name === 'Task' && call.subagent_info?.sub_session_id) {
      const sub = session.sub_sessions.find(
        s => s.sub_session_id === call.subagent_info.sub_session_id
      );
      if (!sub) {
        errors.push(`Task call ${call.call_id} references missing sub_session`);
      }
    }
  }

  // Messages must reference valid agents
  for (const msg of session.messages) {
    const validAgents = [
      session.collaboration.orchestrator.agent_id,
      ...session.collaboration.participants.map(p => p.agent_id)
    ];
    if (!validAgents.includes(msg.from_agent.agent_id)) {
      errors.push(`Message ${msg.message_id} from unknown agent`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 7. Example

### 7.1 Minimal Multi-Agent Session

```json
{
  "session_id": "2026-01-26-001-implement-feature-multi",
  "task_title": "Implement user authentication",
  "user_prompt": "Add login functionality",
  "created_at": "2026-01-26T10:00:00Z",
  "completed_at": "2026-01-26T10:15:00Z",
  "status": "success",

  "agent": {
    "model_id": "claude-opus-4-5-20251101"
  },

  "collaboration": {
    "mode": "multi_agent",
    "pattern": "master_worker",
    "orchestrator": {
      "agent_id": "architect-main",
      "agent_type": "architect"
    },
    "participants": [
      { "agent_id": "developer-01", "agent_type": "developer" },
      { "agent_id": "reviewer-01", "agent_type": "reviewer" }
    ]
  },

  "tool_calls": [
    {
      "call_id": "tool-001",
      "tool_name": "Read",
      "tool_category": "perception",
      "started_at": "2026-01-26T10:00:05Z",
      "ended_at": "2026-01-26T10:00:06Z",
      "duration_ms": 1000,
      "input": { "params": { "file_path": "SPEC-021.md" } },
      "output": { "status": "success" }
    },
    {
      "call_id": "tool-002",
      "tool_name": "Task",
      "tool_category": "interaction",
      "started_at": "2026-01-26T10:00:30Z",
      "ended_at": "2026-01-26T10:05:00Z",
      "duration_ms": 270000,
      "input": {
        "params": {
          "subagent_type": "developer",
          "prompt": "Implement auth component"
        }
      },
      "output": { "status": "success" },
      "subagent_info": {
        "subagent_type": "developer",
        "sub_session_id": "sub-001",
        "tool_uses": 8
      }
    },
    {
      "call_id": "tool-003",
      "tool_name": "Task",
      "tool_category": "interaction",
      "started_at": "2026-01-26T10:05:30Z",
      "ended_at": "2026-01-26T10:08:00Z",
      "duration_ms": 150000,
      "input": {
        "params": {
          "subagent_type": "reviewer",
          "prompt": "Review auth implementation"
        }
      },
      "output": { "status": "success" },
      "subagent_info": {
        "subagent_type": "reviewer",
        "sub_session_id": "sub-002",
        "tool_uses": 5
      }
    }
  ],

  "sub_sessions": [
    {
      "sub_session_id": "sub-001",
      "parent_session_id": "2026-01-26-001-implement-feature-multi",
      "agent": { "agent_id": "developer-01", "agent_type": "developer" },
      "triggered_by_call_id": "tool-002",
      "task": {
        "task_id": "task-001",
        "description": "Implement auth component",
        "priority": "high"
      },
      "started_at": "2026-01-26T10:00:30Z",
      "completed_at": "2026-01-26T10:05:00Z",
      "status": "success",
      "tool_calls": [
        {
          "call_id": "sub-tool-001",
          "tool_name": "Read",
          "tool_category": "perception",
          "started_at": "2026-01-26T10:00:35Z",
          "ended_at": "2026-01-26T10:00:36Z",
          "duration_ms": 500,
          "input": { "params": { "file_path": "types/user.ts" } },
          "output": { "status": "success" }
        },
        {
          "call_id": "sub-tool-002",
          "tool_name": "Write",
          "tool_category": "action",
          "started_at": "2026-01-26T10:01:00Z",
          "ended_at": "2026-01-26T10:01:30Z",
          "duration_ms": 30000,
          "input": { "params": { "file_path": "components/Auth.tsx" } },
          "output": { "status": "success" }
        }
      ],
      "output": {
        "task_id": "task-001",
        "status": "completed",
        "changes": {
          "files_created": [{ "path": "components/Auth.tsx", "lines_added": 45 }],
          "files_modified": [],
          "files_deleted": []
        },
        "summary": "Implemented authentication component"
      }
    },
    {
      "sub_session_id": "sub-002",
      "parent_session_id": "2026-01-26-001-implement-feature-multi",
      "agent": { "agent_id": "reviewer-01", "agent_type": "reviewer" },
      "triggered_by_call_id": "tool-003",
      "task": {
        "task_id": "review-001",
        "description": "Review auth implementation",
        "priority": "high"
      },
      "started_at": "2026-01-26T10:05:30Z",
      "completed_at": "2026-01-26T10:08:00Z",
      "status": "success",
      "tool_calls": [
        {
          "call_id": "rev-tool-001",
          "tool_name": "Read",
          "tool_category": "perception",
          "started_at": "2026-01-26T10:05:35Z",
          "ended_at": "2026-01-26T10:05:36Z",
          "duration_ms": 500,
          "input": { "params": { "file_path": "components/Auth.tsx" } },
          "output": { "status": "success" }
        },
        {
          "call_id": "rev-tool-002",
          "tool_name": "Bash",
          "tool_category": "action",
          "started_at": "2026-01-26T10:06:00Z",
          "ended_at": "2026-01-26T10:06:30Z",
          "duration_ms": 30000,
          "input": { "params": { "command": "npm test" } },
          "output": { "status": "success" }
        }
      ],
      "output": {
        "review_id": "review-001",
        "task_id": "task-001",
        "verdict": "approved",
        "findings": [],
        "verification": {
          "tests_passed": true,
          "type_check_passed": true
        },
        "summary": "Code looks good, all tests pass"
      }
    }
  ],

  "messages": [
    {
      "message_id": "msg-001",
      "timestamp": "2026-01-26T10:00:30Z",
      "sequence_number": 1,
      "from_agent": { "agent_id": "architect-main", "agent_type": "architect" },
      "to_agent": { "agent_id": "developer-01", "agent_type": "developer" },
      "message_type": "task_assignment",
      "payload": {
        "task": {
          "task_id": "task-001",
          "task_description": "Implement auth component"
        },
        "priority": "high"
      }
    },
    {
      "message_id": "msg-002",
      "timestamp": "2026-01-26T10:05:00Z",
      "sequence_number": 2,
      "from_agent": { "agent_id": "developer-01", "agent_type": "developer" },
      "to_agent": { "agent_id": "architect-main", "agent_type": "architect" },
      "message_type": "task_completion",
      "payload": {
        "task_id": "task-001",
        "status": "completed"
      }
    },
    {
      "message_id": "msg-003",
      "timestamp": "2026-01-26T10:05:30Z",
      "sequence_number": 3,
      "from_agent": { "agent_id": "architect-main", "agent_type": "architect" },
      "to_agent": { "agent_id": "reviewer-01", "agent_type": "reviewer" },
      "message_type": "review_request",
      "payload": {
        "review_id": "review-001",
        "task_id": "task-001",
        "files": ["components/Auth.tsx"]
      }
    },
    {
      "message_id": "msg-004",
      "timestamp": "2026-01-26T10:08:00Z",
      "sequence_number": 4,
      "from_agent": { "agent_id": "reviewer-01", "agent_type": "reviewer" },
      "to_agent": { "agent_id": "architect-main", "agent_type": "architect" },
      "message_type": "review_result",
      "payload": {
        "review_id": "review-001",
        "verdict": "approved"
      }
    }
  ],

  "summary": {
    "total_duration_ms": 900000,
    "tool_calls_count": 3,
    "files_created": ["components/Auth.tsx"],
    "files_modified": [],
    "agents": {
      "architect": {
        "agent_id": "architect-main",
        "agent_type": "architect",
        "tool_calls_count": 3,
        "duration_ms": 420000,
        "status": "completed"
      },
      "developers": [
        {
          "agent_id": "developer-01",
          "agent_type": "developer",
          "tool_calls_count": 8,
          "duration_ms": 270000,
          "status": "completed"
        }
      ],
      "reviewer": {
        "agent_id": "reviewer-01",
        "agent_type": "reviewer",
        "tool_calls_count": 5,
        "duration_ms": 150000,
        "status": "completed"
      }
    },
    "tasks": {
      "total": 1,
      "completed": 1,
      "failed": 0
    },
    "review_iterations": 1,
    "final_verdict": "approved"
  }
}
```

---

## 8. Migration

### 8.1 From STD-001 Sessions

Single-agent sessions can be viewed as multi-agent with:

```typescript
function asMultiAgent(session: AgentSession): MultiAgentSession {
  return {
    ...session,
    collaboration: {
      mode: 'single',               // Indicates original was single-agent
      pattern: 'master_worker',
      orchestrator: { agent_id: 'main', agent_type: 'architect' },
      participants: []
    },
    sub_sessions: [],
    messages: []
  };
}
```

### 8.2 Backward Compatibility

Parsers should handle both formats:

```typescript
function parseSession(json: unknown): AgentSession | MultiAgentSession {
  if (json.collaboration && json.collaboration.mode === 'multi_agent') {
    return parseMultiAgentSession(json);
  }
  return parseAgentSession(json);
}
```

---

## 9. Related Documents

- [STD-001: Agent Session Logging Standard](../data/STD-001-agent-session-logging.md)
- [SPEC-021: Multi-Agent Collaboration Architecture](../../docs/specs/SPEC-021-multi-agent-collaboration.md)
- [SPEC-022: Agent Communication Protocol](../../docs/specs/SPEC-022-agent-protocol.md)
- [SPEC-023: Multi-Agent Visualization](../../docs/specs/SPEC-023-multi-agent-visualization.md)

---

## 10. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-26 | Initial version |
