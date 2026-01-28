# SPEC-022: Agent Communication Protocol

> Author: Boris Huai
> Draft Date: 2026-01-26
> Status: Draft

---

## 1. Overview

This document defines the communication protocol between agents in a multi-agent collaboration session. It specifies message formats, task assignment conventions, and review workflows.

### 1.1 Design Principles

1. **Structured Contracts**: All agent communication uses typed interfaces
2. **Traceable**: Every message has an ID and timestamp
3. **Idempotent**: Messages can be retried without side effects
4. **Self-Describing**: Messages include type information for validation

---

## 2. Message Protocol

### 2.1 Base Message Structure

All inter-agent messages follow this base structure:

```typescript
interface AgentMessage {
  message_id: string;           // UUID v4
  timestamp: string;            // ISO8601
  sequence_number: number;      // Ordering within session

  from_agent: AgentIdentifier;
  to_agent: AgentIdentifier;

  message_type: MessageType;
  payload: MessagePayload;

  correlation_id?: string;      // Links related messages
  reply_to?: string;            // message_id being replied to
}

interface AgentIdentifier {
  agent_id: string;
  agent_type: 'architect' | 'developer' | 'reviewer';
  instance_id?: string;
}

type MessageType =
  | 'task_assignment'
  | 'task_progress'
  | 'task_completion'
  | 'review_request'
  | 'review_result'
  | 'feedback'
  | 'status_query'
  | 'status_response'
  | 'abort'
  | 'acknowledgment';
```

### 2.2 Message Type Definitions

#### 2.2.1 Task Assignment

Sent from Architect to Developer when delegating work.

```typescript
interface TaskAssignmentMessage {
  message_type: 'task_assignment';
  payload: {
    task: DeveloperInput;
    priority: 'high' | 'medium' | 'low';
    deadline?: string;          // ISO8601 soft deadline
    max_iterations?: number;    // Default: 3
  };
}

interface DeveloperInput {
  task_id: string;
  task_description: string;

  context: {
    specs: ContextFile[];
    reference_files: ContextFile[];
    previous_attempts?: AttemptSummary[];
  };

  constraints: {
    scope: string[];            // Glob patterns of modifiable files
    testing_required: boolean;
    must_not_break: string[];   // Existing functionality to preserve
    style_guide?: string;       // Path to style guide
  };

  acceptance_criteria: string[];
}

interface ContextFile {
  path: string;
  reason: string;               // Why this file is relevant
  sections?: string[];          // Specific sections/functions
}

interface AttemptSummary {
  attempt_number: number;
  outcome: string;
  feedback: string;
}
```

#### 2.2.2 Task Progress

Sent from Developer to Architect during long-running tasks.

```typescript
interface TaskProgressMessage {
  message_type: 'task_progress';
  payload: {
    task_id: string;
    progress_percent: number;   // 0-100
    current_step: string;
    files_modified_so_far: string[];
    estimated_remaining?: string; // Duration estimate
    blockers?: string[];
  };
}
```

#### 2.2.3 Task Completion

Sent from Developer to Architect when task is done.

```typescript
interface TaskCompletionMessage {
  message_type: 'task_completion';
  payload: DeveloperOutput;
}

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

  self_review: {
    tests_run: boolean;
    tests_passed: boolean;
    type_check_passed: boolean;
    known_issues?: string[];
  };

  blockers?: string[];          // Reasons for partial/failed
  suggestions?: string[];       // Ideas for improvement
}

interface FileChange {
  path: string;
  change_type: 'created' | 'modified' | 'deleted';
  lines_added?: number;
  lines_removed?: number;
  description?: string;
}
```

#### 2.2.4 Review Request

Sent from Architect to Reviewer to request code review.

```typescript
interface ReviewRequestMessage {
  message_type: 'review_request';
  payload: ReviewerInput;
}

interface ReviewerInput {
  review_id: string;
  task_id: string;              // Links to original task

  scope: {
    files: string[];
    focus_areas: FocusArea[];
    ignore_patterns?: string[]; // Files to skip
  };

  criteria: {
    must_pass_tests: boolean;
    must_pass_type_check: boolean;
    must_pass_lint?: boolean;
    custom_checks?: CustomCheck[];
  };

  context: {
    task_description: string;
    acceptance_criteria: string[];
    previous_reviews?: ReviewSummary[];
  };
}

type FocusArea =
  | 'security'
  | 'performance'
  | 'style'
  | 'logic'
  | 'error_handling'
  | 'test_coverage';

interface CustomCheck {
  name: string;
  command: string;              // Bash command to run
  expected_exit_code: number;
}

interface ReviewSummary {
  review_number: number;
  verdict: string;
  key_findings: string[];
}
```

#### 2.2.5 Review Result

Sent from Reviewer to Architect with review outcome.

```typescript
interface ReviewResultMessage {
  message_type: 'review_result';
  payload: ReviewerOutput;
}

interface ReviewerOutput {
  review_id: string;
  task_id: string;

  verdict: 'approved' | 'changes_requested' | 'rejected';

  findings: ReviewFinding[];

  verification: {
    tests: VerificationResult;
    type_check: VerificationResult;
    lint?: VerificationResult;
    custom: Record<string, VerificationResult>;
  };

  summary: string;

  // For changes_requested/rejected
  required_changes?: RequiredChange[];

  // For approved
  commendations?: string[];     // What was done well
}

interface ReviewFinding {
  finding_id: string;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  category: 'bug' | 'security' | 'performance' | 'style' | 'logic' | 'test';

  location: {
    file: string;
    line_start?: number;
    line_end?: number;
    code_snippet?: string;
  };

  description: string;
  rationale: string;
  suggestion?: string;

  // For tracking fix status
  fixed_in_iteration?: number;
}

interface VerificationResult {
  passed: boolean;
  output?: string;
  error?: string;
}

interface RequiredChange {
  change_id: string;
  priority: 'must_fix' | 'should_fix' | 'consider';
  related_findings: string[];   // finding_ids
  description: string;
}
```

#### 2.2.6 Feedback

Generic feedback message for any agent-to-agent communication.

```typescript
interface FeedbackMessage {
  message_type: 'feedback';
  payload: {
    feedback_type: 'clarification' | 'correction' | 'guidance' | 'question';
    subject: string;
    content: string;
    action_required: boolean;
    related_task_id?: string;
  };
}
```

#### 2.2.7 Abort

Sent to terminate a task or session.

```typescript
interface AbortMessage {
  message_type: 'abort';
  payload: {
    scope: 'task' | 'session';
    target_id: string;          // task_id or session_id
    reason: string;
    cleanup_required: boolean;
  };
}
```

---

## 3. Task Assignment Protocol

### 3.1 Assignment Sequence

```
Architect                          Developer
    │                                   │
    │  1. task_assignment               │
    │  ─────────────────────────────▶  │
    │                                   │
    │  2. acknowledgment                │
    │  ◀─────────────────────────────  │
    │                                   │
    │  3. task_progress (optional)      │
    │  ◀─────────────────────────────  │ (repeat)
    │                                   │
    │  4. task_completion               │
    │  ◀─────────────────────────────  │
    │                                   │
```

### 3.2 Assignment Rules

1. **Scope Validation**: Developer must only modify files within `constraints.scope`
2. **Context Loading**: Developer should read all `context.reference_files` before starting
3. **Progress Reporting**: For tasks > 2 minutes, send progress every 30 seconds
4. **Completion**: Always send task_completion, even if failed

### 3.3 Parallel Assignment

Architect can assign multiple tasks simultaneously:

```typescript
// Architect creates parallel assignments
const assignments = [
  createTaskAssignment('task-1', developer1),
  createTaskAssignment('task-2', developer2),
  createTaskAssignment('task-3', developer3),
];

// Wait for all completions
const results = await Promise.all(
  assignments.map(a => waitForCompletion(a.task_id))
);
```

### 3.4 Task Dependencies

Tasks can have dependencies:

```typescript
interface TaskDependency {
  task_id: string;
  depends_on: string[];         // task_ids that must complete first
  dependency_type: 'hard' | 'soft';
}

// Hard dependency: Must wait for completion
// Soft dependency: Can start but may need results
```

---

## 4. Review Protocol

### 4.1 Review Sequence

```
Architect            Reviewer              Developer
    │                    │                      │
    │ review_request     │                      │
    │ ───────────────▶  │                      │
    │                    │                      │
    │ review_result      │                      │
    │ ◀───────────────  │                      │
    │                    │                      │
    │  [if changes_requested]                  │
    │                    │                      │
    │ task_assignment (with feedback)          │
    │ ─────────────────────────────────────▶  │
    │                    │                      │
    │ task_completion    │                      │
    │ ◀─────────────────────────────────────  │
    │                    │                      │
    │ review_request (iteration 2)             │
    │ ───────────────▶  │                      │
    │                    │                      │
    │ review_result      │                      │
    │ ◀───────────────  │                      │
    │                    │                      │
```

### 4.2 Review Verdict Rules

| Verdict | Condition | Next Action |
|---------|-----------|-------------|
| `approved` | No critical/major findings, all verifications pass | Proceed to completion |
| `changes_requested` | Has fixable findings | Create revision task |
| `rejected` | Fundamental issues, needs redesign | Return to planning |

### 4.3 Iteration Limits

```typescript
interface ReviewIteration {
  iteration_number: number;
  max_iterations: number;       // Default: 3
  escalation_on_max: 'abort' | 'force_approve' | 'human_review';
}
```

### 4.4 Finding Severity Guidelines

| Severity | Definition | Example |
|----------|------------|---------|
| Critical | Security vulnerability, data loss risk | SQL injection, unhandled null |
| Major | Functional bug, significant issue | Wrong algorithm, missing validation |
| Minor | Code quality issue, minor bug | Style violation, redundant code |
| Suggestion | Improvement opportunity | Better naming, optimization |

---

## 5. Error Handling

### 5.1 Message Delivery Failures

```typescript
interface MessageDeliveryError {
  original_message_id: string;
  error_type: 'timeout' | 'rejected' | 'malformed';
  retry_count: number;
  max_retries: number;          // Default: 3
  next_retry_at?: string;
}
```

### 5.2 Task Execution Failures

```typescript
interface TaskExecutionError {
  task_id: string;
  error_type: 'timeout' | 'exception' | 'scope_violation' | 'resource_limit';
  error_message: string;
  recoverable: boolean;
  suggested_action: 'retry' | 'reassign' | 'abort' | 'manual';
}
```

### 5.3 Recovery Strategies

| Error Type | Strategy |
|------------|----------|
| Timeout | Retry with extended timeout |
| Scope Violation | Reject, provide correct scope |
| Resource Limit | Split task into smaller parts |
| Exception | Log, retry once, then abort |

---

## 6. Message Validation

### 6.1 Schema Validation

All messages must pass JSON Schema validation before processing.

### 6.2 Required Fields

| Field | Validation |
|-------|------------|
| message_id | UUID v4 format |
| timestamp | ISO8601 format |
| from_agent | Known agent in session |
| to_agent | Known agent in session |
| message_type | Enum member |
| payload | Type-specific schema |

### 6.3 Semantic Validation

- task_assignment: task_id must be unique
- task_completion: task_id must match active assignment
- review_result: review_id must match active request

---

## 7. Logging and Traceability

### 7.1 Message Log Format

All messages are logged to the session:

```typescript
// In MultiAgentSession
messages: AgentMessage[];

// Each message is stored with metadata
interface LoggedMessage extends AgentMessage {
  logged_at: string;
  processing_duration_ms: number;
  validation_errors?: string[];
}
```

### 7.2 Correlation Chain

Related messages share a `correlation_id`:

```
task_assignment (msg-001, correlation: corr-001)
    └── acknowledgment (msg-002, correlation: corr-001, reply_to: msg-001)
    └── task_progress (msg-003, correlation: corr-001)
    └── task_completion (msg-004, correlation: corr-001)
```

---

## 8. Related Documents

- [SPEC-021: Multi-Agent Collaboration Architecture](./SPEC-021-multi-agent-collaboration.md)
- [SPEC-023: Multi-Agent Visualization](./SPEC-023-multi-agent-visualization.md)
- [STD-008: Multi-Agent Logging Standard](../../standards/collaboration/STD-008-multi-agent-logging.md)

---

## 9. Appendix: Message Examples

### A.1 Task Assignment Example

```json
{
  "message_id": "msg-001-abc123",
  "timestamp": "2026-01-26T10:00:00Z",
  "sequence_number": 1,
  "from_agent": {
    "agent_id": "architect-main",
    "agent_type": "architect"
  },
  "to_agent": {
    "agent_id": "developer-01",
    "agent_type": "developer",
    "instance_id": "inst-001"
  },
  "message_type": "task_assignment",
  "payload": {
    "task": {
      "task_id": "task-001",
      "task_description": "Implement Timeline component with D3.js",
      "context": {
        "specs": [
          { "path": "docs/specs/SPEC-002.md", "reason": "Visual design spec" }
        ],
        "reference_files": [
          { "path": "frontend/src/types/agent.ts", "reason": "Type definitions" }
        ]
      },
      "constraints": {
        "scope": ["frontend/src/components/Timeline/**"],
        "testing_required": true
      },
      "acceptance_criteria": [
        "Renders tool calls as nodes",
        "Supports click selection",
        "Tests pass"
      ]
    },
    "priority": "high"
  }
}
```

### A.2 Review Result Example

```json
{
  "message_id": "msg-010-def456",
  "timestamp": "2026-01-26T10:15:00Z",
  "sequence_number": 10,
  "from_agent": {
    "agent_id": "reviewer-main",
    "agent_type": "reviewer"
  },
  "to_agent": {
    "agent_id": "architect-main",
    "agent_type": "architect"
  },
  "message_type": "review_result",
  "correlation_id": "corr-review-001",
  "payload": {
    "review_id": "review-001",
    "task_id": "task-001",
    "verdict": "changes_requested",
    "findings": [
      {
        "finding_id": "find-001",
        "severity": "major",
        "category": "bug",
        "location": {
          "file": "frontend/src/components/Timeline/Timeline.tsx",
          "line_start": 45
        },
        "description": "Missing null check for empty tool_calls array",
        "suggestion": "Add early return if tool_calls.length === 0"
      }
    ],
    "verification": {
      "tests": { "passed": true },
      "type_check": { "passed": true }
    },
    "summary": "Good implementation, one bug needs fixing",
    "required_changes": [
      {
        "change_id": "change-001",
        "priority": "must_fix",
        "related_findings": ["find-001"],
        "description": "Fix null check issue"
      }
    ]
  }
}
```
