//! REST API routes

use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::path::PathBuf;

/// Shared application state - stores sessions as raw JSON
pub type AppState = Arc<RwLock<HashMap<String, serde_json::Value>>>;

/// Create API routes
pub fn routes() -> Router {
    let mut initial_sessions = HashMap::new();

    // Load sessions from data/sessions/ directory (sync, at startup)
    // Try multiple paths to handle different working directories
    let possible_paths = [
        PathBuf::from("../data/sessions"),           // When running from backend/
        PathBuf::from("data/sessions"),              // When running from project root
        PathBuf::from("C:/Project/boris-workspace/BorisAgentStudio/data/sessions"), // Absolute fallback
    ];

    let sessions_dir = possible_paths
        .iter()
        .find(|p| p.exists())
        .cloned()
        .unwrap_or_else(|| PathBuf::from("../data/sessions"));

    if sessions_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&sessions_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext == "json") {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        if let Ok(session) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(session_id) = session.get("session_id").and_then(|v| v.as_str()) {
                                initial_sessions.insert(session_id.to_string(), session);
                            }
                        }
                    }
                }
            }
        }
    }
    println!("Loaded {} sessions from {:?}", initial_sessions.len(), sessions_dir);

    let state: AppState = Arc::new(RwLock::new(initial_sessions));

    Router::new()
        .route("/sessions", get(list_sessions))
        .route("/sessions/:session_id", get(get_session))
        .with_state(state)
}

/// List all sessions (summary only)
async fn list_sessions(
    State(state): State<AppState>,
) -> Json<serde_json::Value> {
    let sessions = state.read().await;
    let list: Vec<serde_json::Value> = sessions.values().map(|s| {
        // Return summary info only
        serde_json::json!({
            "session_id": s.get("session_id"),
            "task_title": s.get("task_title"),
            "status": s.get("status"),
            "created_at": s.get("created_at"),
        })
    }).collect();
    Json(serde_json::json!({ "sessions": list }))
}

/// Get a specific session (full data)
async fn get_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let sessions = state.read().await;
    sessions
        .get(&session_id)
        .cloned()
        .map(Json)
        .ok_or((axum::http::StatusCode::NOT_FOUND, "Session not found".to_string()))
}
