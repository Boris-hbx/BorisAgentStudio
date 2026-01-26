//! Data models for Agent Step visualization.
//!
//! These fields are IMMUTABLE as defined in CLAUDE.md:
//! - step_id
//! - step_name
//! - status
//! - input / output
//! - context_link
//! - skill_source
//! - domain_knowledge_source
//! - domain_matching_score

use serde::{Deserialize, Serialize};

/// Step execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum StepStatus {
    Pending,
    Running,
    Success,
    Failed,
    Skipped,
}

/// Core workflow step names (IMMUTABLE order):
/// 需求输入 → 任务拆解 → 代码生成 → 环境执行 → 调试修复 → 结果验证 → 记忆沉淀
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum StepName {
    RequirementInput,
    TaskDecomposition,
    CodeGeneration,
    EnvironmentExecution,
    DebugFix,
    ResultVerification,
    MemoryConsolidation,
}

/// Domain knowledge attached to a step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainKnowledge {
    pub id: String,
    pub name: String,
    pub content: String,
    pub relevance_score: f64,
}

/// Skill/capability used in a step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub source: String,
}

/// Core step model for Code Agent execution visualization.
/// All fields here are required per CLAUDE.md specification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStep {
    pub step_id: String,
    pub step_name: StepName,
    pub status: StepStatus,
    pub input: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_link: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skill_source: Option<Skill>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub domain_knowledge_source: Option<Vec<DomainKnowledge>>,
    #[serde(default)]
    pub domain_matching_score: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
}

/// A complete agent execution session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSession {
    pub session_id: String,
    pub steps: Vec<AgentStep>,
    pub created_at: String,
    pub updated_at: String,
}
