//! WebSocket handlers for real-time step updates

use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};

/// WebSocket event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event", content = "data")]
pub enum WsEvent {
    #[serde(rename = "step_update")]
    StepUpdate(serde_json::Value),
    #[serde(rename = "session_complete")]
    SessionComplete { session_id: String },
    #[serde(rename = "subscribed")]
    Subscribed { session_id: String },
    #[serde(rename = "error")]
    Error { message: String },
}

/// Incoming WebSocket message types
#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
enum WsCommand {
    #[serde(rename = "subscribe")]
    Subscribe { session_id: String },
    #[serde(rename = "ping")]
    Ping,
}

/// WebSocket upgrade handler
pub async fn handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

/// Handle individual WebSocket connection
async fn handle_socket(socket: WebSocket) {
    let (mut sender, mut receiver) = socket.split();

    tracing::info!("WebSocket client connected");

    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                match serde_json::from_str::<WsCommand>(&text) {
                    Ok(WsCommand::Subscribe { session_id }) => {
                        let response = WsEvent::Subscribed { session_id };
                        let json = serde_json::to_string(&response).unwrap();
                        if sender.send(Message::Text(json.into())).await.is_err() {
                            break;
                        }
                    }
                    Ok(WsCommand::Ping) => {
                        if sender.send(Message::Pong(vec![].into())).await.is_err() {
                            break;
                        }
                    }
                    Err(e) => {
                        let response = WsEvent::Error {
                            message: format!("Invalid message: {}", e),
                        };
                        let json = serde_json::to_string(&response).unwrap();
                        let _ = sender.send(Message::Text(json.into())).await;
                    }
                }
            }
            Ok(Message::Close(_)) => break,
            Err(e) => {
                tracing::error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    tracing::info!("WebSocket client disconnected");
}
