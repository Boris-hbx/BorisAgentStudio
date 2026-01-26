//! Boris Agent Studio Backend
//!
//! Code Agent visualization API server built with Axum.

mod api;
mod models;
mod services;
mod websocket;

use axum::{
    routing::get,
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .init();

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .nest("/api/v1", api::routes())
        .route("/ws", get(websocket::handler))
        .layer(cors);

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    tracing::info!("Boris Agent Studio backend listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "name": "Boris Agent Studio",
        "version": "0.1.0",
        "status": "running",
        "docs": "/api/v1"
    }))
}

async fn health() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "healthy"
    }))
}
