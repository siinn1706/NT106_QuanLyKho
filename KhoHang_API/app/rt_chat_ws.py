# app/rt_chat_ws.py
"""
WebSocket handler for realtime user-to-user chat.
Endpoint: /ws/rt?token=<JWT>
"""

from fastapi import WebSocket, WebSocketDisconnect, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Dict, Set, Optional
from datetime import datetime, timezone
from collections import defaultdict
from time import time
import json
import uuid
import asyncio

from .database import (
    SessionLocal,
    UserModel,
    RTConversationModel,
    RTConversationMemberModel,
    RTMessageModel,
    RTMessageReceiptModel
)
from .security import verify_token


class ConnectionManager:
    def __init__(self):
        # user_id -> set of WebSocket connections
        self.user_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        
        # conversation_id -> set of WebSocket connections (joined rooms)
        self.room_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        
        # WebSocket -> user_id mapping
        self.ws_to_user: Dict[WebSocket, str] = {}
        
        # WebSocket -> set of conversation_ids (rooms this socket joined)
        self.ws_to_rooms: Dict[WebSocket, Set[str]] = defaultdict(set)
        
        # Presence: user_id -> { is_online, last_seen_at }
        self.presence: Dict[str, dict] = {}
        
        # Rate limiting for msg:send (user_id -> list of timestamps)
        self.rate_limit_send: Dict[str, list] = defaultdict(list)
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.user_connections[user_id].add(websocket)
        self.ws_to_user[websocket] = user_id
        self.presence[user_id] = {
            "is_online": True,
            "last_seen_at": datetime.now(timezone.utc).isoformat()
        }
        print(f"[WS] User {user_id} connected")
    
    def disconnect(self, websocket: WebSocket):
        user_id = self.ws_to_user.get(websocket)
        if not user_id:
            return
        
        self.user_connections[user_id].discard(websocket)
        if not self.user_connections[user_id]:
            del self.user_connections[user_id]
            self.presence[user_id] = {
                "is_online": False,
                "last_seen_at": datetime.now(timezone.utc).isoformat()
            }
        
        for room_id in self.ws_to_rooms[websocket]:
            self.room_connections[room_id].discard(websocket)
            if not self.room_connections[room_id]:
                del self.room_connections[room_id]
        
        del self.ws_to_user[websocket]
        del self.ws_to_rooms[websocket]
        print(f"[WS] User {user_id} disconnected")
    
    def join_room(self, websocket: WebSocket, conversation_id: str):
        self.room_connections[conversation_id].add(websocket)
        self.ws_to_rooms[websocket].add(conversation_id)
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send message to all connections of a user."""
        if user_id not in self.user_connections:
            return
        
        data = json.dumps(message)
        dead_sockets = []
        for ws in self.user_connections[user_id]:
            try:
                await ws.send_text(data)
            except Exception as e:
                print(f"[WS] Error sending to user {user_id}: {e}")
                dead_sockets.append(ws)
        
        for ws in dead_sockets:
            self.disconnect(ws)
    
    async def send_to_room(self, conversation_id: str, message: dict, exclude_ws: Optional[WebSocket] = None):
        """Broadcast message to all connections in a room."""
        if conversation_id not in self.room_connections:
            return
        
        data = json.dumps(message)
        dead_sockets = []
        for ws in self.room_connections[conversation_id]:
            if ws == exclude_ws:
                continue
            try:
                await ws.send_text(data)
            except Exception as e:
                print(f"[WS] Error sending to room {conversation_id}: {e}")
                dead_sockets.append(ws)
        
        for ws in dead_sockets:
            self.disconnect(ws)
    
    async def send_to_socket(self, websocket: WebSocket, message: dict):
        """Send message to a specific socket."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"[WS] Error sending to socket: {e}")
            self.disconnect(websocket)
    
    def check_rate_limit_send(self, user_id: str, limit: int = 5, window: int = 1) -> bool:
        """Check if user exceeded send rate limit (5 msg/s)."""
        now = time()
        timestamps = self.rate_limit_send[user_id]
        timestamps[:] = [ts for ts in timestamps if now - ts < window]
        if len(timestamps) >= limit:
            return False
        timestamps.append(now)
        return True


manager = ConnectionManager()


async def handle_client_hello(websocket: WebSocket, user_id: str, data: dict, db: Session):
    """
    Handle client:hello event.
    Expected data: { deviceId, appVersion, lastSync: { conversationId: lastServerMessageId } }
    """
    device_id = data.get("deviceId")
    app_version = data.get("appVersion")
    last_sync = data.get("lastSync", {})
    
    response = {
        "type": "server:hello",
        "reqId": data.get("reqId"),
        "data": {
            "userId": user_id,
            "serverTime": datetime.now(timezone.utc).isoformat(),
            "heartbeatIntervalMs": 30000
        }
    }
    await manager.send_to_socket(websocket, response)


async def handle_conv_join(websocket: WebSocket, user_id: str, data: dict, db: Session):
    """
    Handle conv:join event.
    Expected data: { conversationId }
    """
    conversation_id = data.get("conversationId")
    if not conversation_id:
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": data.get("_reqId"),
            "data": {"code": "INVALID_REQUEST", "message": "conversationId required"}
        })
        return
    
    # Check membership
    is_member = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == user_id
    ).first()
    
    if not is_member:
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": data.get("_reqId"),
            "data": {"code": "FORBIDDEN", "message": "Not a member"}
        })
        return
    
    manager.join_room(websocket, conversation_id)
    print(f"[WS] User {user_id} joined room {conversation_id}")


async def handle_msg_send(websocket: WebSocket, user_id: str, data: dict, db: Session):
    """
    Handle msg:send event.
    Expected data: { conversationId, clientMessageId, content, contentType, attachments?, createdAtClient }
    """
    conversation_id = data.get("conversationId")
    client_message_id = data.get("clientMessageId")
    content = data.get("content", "")
    content_type = data.get("contentType", "text")
    attachments = data.get("attachments")
    created_at_client = data.get("createdAtClient")
    req_id = data.get("_reqId")
    
    if not all([conversation_id, client_message_id]):
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": req_id,
            "data": {"code": "INVALID_REQUEST", "message": "conversationId and clientMessageId required"}
        })
        return
    
    # Rate limit
    if not manager.check_rate_limit_send(user_id):
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": req_id,
            "data": {"code": "RATE_LIMIT", "message": "Too many messages"}
        })
        return
    
    # Check membership
    is_member = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == user_id
    ).first()
    
    if not is_member:
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": req_id,
            "data": {"code": "FORBIDDEN", "message": "Not a member"}
        })
        return
    
    # Validate content length
    if len(content) > 4000:
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": req_id,
            "data": {"code": "INVALID_REQUEST", "message": "Content too long (max 4000 chars)"}
        })
        return
    
    # Check idempotency
    existing_msg = db.query(RTMessageModel).filter(
        RTMessageModel.sender_id == user_id,
        RTMessageModel.client_message_id == client_message_id
    ).first()
    
    if existing_msg:
        # Resend ACK
        await manager.send_to_socket(websocket, {
            "type": "msg:ack",
            "reqId": req_id,
            "data": {
                "conversationId": conversation_id,
                "clientMessageId": client_message_id,
                "serverMessageId": existing_msg.id,
                "createdAtServer": existing_msg.created_at.isoformat()
            }
        })
        return
    
    # Create message
    server_message_id = str(uuid.uuid4())
    created_at_server = datetime.now(timezone.utc)
    
    new_msg = RTMessageModel(
        id=server_message_id,
        conversation_id=conversation_id,
        sender_id=user_id,
        client_message_id=client_message_id,
        content=content,
        content_type=content_type,
        attachments_json=attachments,
        created_at=created_at_server
    )
    db.add(new_msg)
    
    # Create receipts for all members
    members = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id
    ).all()
    
    for member in members:
        receipt = RTMessageReceiptModel(
            message_id=server_message_id,
            user_id=member.user_id,
            delivered_at=None if member.user_id != user_id else created_at_server,
            read_at=None
        )
        db.add(receipt)
    
    # Update conversation updated_at
    conv = db.query(RTConversationModel).filter(RTConversationModel.id == conversation_id).first()
    if conv:
        conv.updated_at = created_at_server
    
    db.commit()
    db.refresh(new_msg)
    
    # Load sender info
    sender = db.query(UserModel).filter(UserModel.id == user_id).first()
    
    # Send ACK to sender
    await manager.send_to_socket(websocket, {
        "type": "msg:ack",
        "reqId": req_id,
        "data": {
            "conversationId": conversation_id,
            "clientMessageId": client_message_id,
            "serverMessageId": server_message_id,
            "createdAtServer": created_at_server.isoformat()
        }
    })
    
    # Broadcast msg:new to room members (exclude sender)
    message_dto = {
        "id": server_message_id,
        "conversationId": conversation_id,
        "senderId": user_id,
        "clientMessageId": client_message_id,
        "content": content,
        "contentType": content_type,
        "attachments": attachments,
        "createdAt": created_at_server.isoformat(),
        "editedAt": None,
        "deletedAt": None,
        "senderEmail": sender.email if sender else None,
        "senderDisplayName": sender.display_name if sender else None,
        "senderAvatarUrl": sender.avatar_url if sender else None
    }
    
    await manager.send_to_room(conversation_id, {
        "type": "msg:new",
        "data": {"message": message_dto}
    }, exclude_ws=websocket)
    
    # Mark delivered for online members
    for member in members:
        if member.user_id == user_id:
            continue
        
        if member.user_id in manager.user_connections:
            # User is online, mark delivered
            receipt = db.query(RTMessageReceiptModel).filter(
                RTMessageReceiptModel.message_id == server_message_id,
                RTMessageReceiptModel.user_id == member.user_id
            ).first()
            if receipt:
                receipt.delivered_at = datetime.now(timezone.utc)
                db.commit()
                
                # Send msg:delivered to sender
                await manager.send_to_user(user_id, {
                    "type": "msg:delivered",
                    "data": {
                        "conversationId": conversation_id,
                        "messageId": server_message_id,
                        "userId": member.user_id,
                        "deliveredAt": receipt.delivered_at.isoformat()
                    }
                })


async def handle_msg_read(websocket: WebSocket, user_id: str, data: dict, db: Session):
    """
    Handle msg:read event.
    Expected data: { conversationId, lastReadMessageId }
    """
    conversation_id = data.get("conversationId")
    last_read_message_id = data.get("lastReadMessageId")
    
    if not all([conversation_id, last_read_message_id]):
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": data.get("reqId"),
            "data": {"code": "INVALID_REQUEST", "message": "conversationId and lastReadMessageId required"}
        })
        return
    
    # Mark all messages up to lastReadMessageId as read
    messages_to_mark = db.query(RTMessageModel).filter(
        RTMessageModel.conversation_id == conversation_id,
        RTMessageModel.id <= last_read_message_id,
        RTMessageModel.sender_id != user_id
    ).all()
    
    read_at = datetime.now(timezone.utc)
    
    for msg in messages_to_mark:
        receipt = db.query(RTMessageReceiptModel).filter(
            RTMessageReceiptModel.message_id == msg.id,
            RTMessageReceiptModel.user_id == user_id
        ).first()
        
        if receipt and not receipt.read_at:
            receipt.read_at = read_at
            
            # Broadcast msg:read to sender
            await manager.send_to_user(msg.sender_id, {
                "type": "msg:read",
                "data": {
                    "conversationId": conversation_id,
                    "messageId": msg.id,
                    "userId": user_id,
                    "readAt": read_at.isoformat()
                }
            })
    
    db.commit()


async def handle_typing(websocket: WebSocket, user_id: str, data: dict, db: Session):
    """
    Handle typing event.
    Expected data: { conversationId, isTyping }
    """
    conversation_id = data.get("conversationId")
    is_typing = data.get("isTyping", False)
    
    if not conversation_id:
        return
    
    # Broadcast to room (exclude sender)
    await manager.send_to_room(conversation_id, {
        "type": "typing",
        "data": {
            "conversationId": conversation_id,
            "userId": user_id,
            "isTyping": is_typing
        }
    }, exclude_ws=websocket)


async def handle_conv_sync(websocket: WebSocket, user_id: str, data: dict, db: Session):
    """
    Handle conv:sync event.
    Expected data: { conversationId, afterMessageId?, limit? }
    """
    conversation_id = data.get("conversationId")
    after_message_id = data.get("afterMessageId")
    limit = data.get("limit", 50)
    req_id = data.get("reqId")
    
    if not conversation_id:
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": req_id,
            "data": {"code": "INVALID_REQUEST", "message": "conversationId required"}
        })
        return
    
    # Check membership
    is_member = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == user_id
    ).first()
    
    if not is_member:
        await manager.send_to_socket(websocket, {
            "type": "error",
            "reqId": req_id,
            "data": {"code": "FORBIDDEN", "message": "Not a member"}
        })
        return
    
    # Get messages
    query = db.query(RTMessageModel).filter(
        RTMessageModel.conversation_id == conversation_id,
        RTMessageModel.deleted_at.is_(None)
    ).options(joinedload(RTMessageModel.sender))
    
    if after_message_id:
        query = query.filter(RTMessageModel.id > after_message_id)
    
    query = query.order_by(RTMessageModel.created_at.asc())
    messages = query.limit(limit + 1).all()
    
    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]
    
    messages_dto = []
    for msg in messages:
        messages_dto.append({
            "id": msg.id,
            "conversationId": msg.conversation_id,
            "senderId": msg.sender_id,
            "clientMessageId": msg.client_message_id,
            "content": msg.content,
            "contentType": msg.content_type,
            "attachments": msg.attachments_json,
            "createdAt": msg.created_at.isoformat(),
            "editedAt": msg.edited_at.isoformat() if msg.edited_at else None,
            "deletedAt": msg.deleted_at.isoformat() if msg.deleted_at else None,
            "senderEmail": msg.sender.email if msg.sender else None,
            "senderDisplayName": msg.sender.display_name if msg.sender else None,
            "senderAvatarUrl": msg.sender.avatar_url if msg.sender else None
        })
    
    await manager.send_to_socket(websocket, {
        "type": "conv:sync:result",
        "reqId": req_id,
        "data": {
            "conversationId": conversation_id,
            "messages": messages_dto,
            "hasMore": has_more
        }
    })


async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket endpoint for realtime chat.
    URL: ws://.../ws/rt?token=<JWT>
    """
    # Validate token
    try:
        payload = verify_token(token)
        if not payload:
            await websocket.close(code=1008, reason="Invalid token")
            return
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
    except Exception as e:
        print(f"[WS] Token validation failed: {e}")
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # Connect
    await manager.connect(websocket, user_id)
    
    # Start heartbeat task
    async def heartbeat():
        try:
            while True:
                await asyncio.sleep(30)
                await manager.send_to_socket(websocket, {"type": "ping"})
        except:
            pass
    
    heartbeat_task = asyncio.create_task(heartbeat())
    
    try:
        while True:
            data_raw = await websocket.receive_text()
            
            try:
                data = json.loads(data_raw)
                event_type = data.get("type")
                req_id = data.get("reqId")
                event_data = data.get("data", {})
                
                db = SessionLocal()
                try:
                    if event_type == "client:hello":
                        await handle_client_hello(websocket, user_id, event_data, db)
                    elif event_type == "conv:join":
                        await handle_conv_join(websocket, user_id, event_data, db)
                    elif event_type == "msg:send":
                        # Pass reqId for acknowledgment
                        event_data["_reqId"] = req_id
                        await handle_msg_send(websocket, user_id, event_data, db)
                    elif event_type == "msg:read":
                        await handle_msg_read(websocket, user_id, event_data, db)
                    elif event_type == "typing":
                        await handle_typing(websocket, user_id, event_data, db)
                    elif event_type == "conv:sync":
                        event_data["_reqId"] = req_id
                        await handle_conv_sync(websocket, user_id, event_data, db)
                    elif event_type == "pong":
                        pass  # Heartbeat response
                    else:
                        await manager.send_to_socket(websocket, {
                            "type": "error",
                            "reqId": req_id,
                            "data": {"code": "UNKNOWN_EVENT", "message": f"Unknown event type: {event_type}"}
                        })
                finally:
                    db.close()
            
            except json.JSONDecodeError:
                await manager.send_to_socket(websocket, {
                    "type": "error",
                    "data": {"code": "INVALID_JSON", "message": "Invalid JSON"}
                })
            except Exception as e:
                print(f"[WS] Error handling event: {e}")
                await manager.send_to_socket(websocket, {
                    "type": "error",
                    "data": {"code": "INTERNAL_ERROR", "message": str(e)}
                })
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] Connection error: {e}")
    finally:
        heartbeat_task.cancel()
        manager.disconnect(websocket)
