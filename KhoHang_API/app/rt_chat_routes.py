# app/rt_chat_routes.py
"""
REST API routes for realtime user-to-user chat.
Prefix: /rt
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path
import uuid
import aiofiles
import shutil
from collections import defaultdict
from time import time

from .database import (
    get_db, 
    UserModel, 
    RTConversationModel, 
    RTConversationMemberModel,
    RTMessageModel,
    RTMessageReceiptModel,
    RTMessageReactionModel,
    RTPinnedMessageModel,
    DATA_DIR,
    ensure_utc,  # Import timezone utility
    to_utc_iso   # Import ISO string helper
)
from .auth_middleware import get_current_user
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/rt", tags=["realtime-chat"])

UPLOAD_DIR = DATA_DIR / "uploads" / "rt_files"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Rate limiting (in-memory, simple)
_rate_limit_store = defaultdict(list)

def check_rate_limit(user_id: str, limit: int = 10, window: int = 60) -> bool:
    """Simple sliding window rate limiter. Returns True if allowed."""
    now = time()
    timestamps = _rate_limit_store[user_id]
    # Remove expired
    timestamps[:] = [ts for ts in timestamps if now - ts < window]
    if len(timestamps) >= limit:
        return False
    timestamps.append(now)
    return True


# ========== SCHEMAS ==========

class ConversationMemberDTO(BaseModel):
    user_id: str = Field(..., serialization_alias="userId")
    role: str
    joined_at: datetime = Field(..., serialization_alias="joinedAt")
    is_accepted: bool = Field(..., serialization_alias="isAccepted")
    user_email: Optional[str] = Field(None, serialization_alias="userEmail")
    user_display_name: Optional[str] = Field(None, serialization_alias="userDisplayName")
    user_avatar_url: Optional[str] = Field(None, serialization_alias="userAvatarUrl")
    
    model_config = {"populate_by_name": True}

class ConversationDTO(BaseModel):
    id: str
    type: str
    title: Optional[str]
    related_entity_type: Optional[str] = Field(None, serialization_alias="relatedEntityType")
    related_entity_id: Optional[str] = Field(None, serialization_alias="relatedEntityId")
    created_at: datetime = Field(..., serialization_alias="createdAt")
    updated_at: datetime = Field(..., serialization_alias="updatedAt")
    members: List[ConversationMemberDTO]
    last_message: Optional[dict] = Field(None, serialization_alias="lastMessage")
    unread_count: int = Field(0, serialization_alias="unreadCount")
    
    model_config = {"populate_by_name": True}

class MessageReceiptDTO(BaseModel):
    user_id: str = Field(..., serialization_alias="userId")
    delivered_at: Optional[datetime] = Field(None, serialization_alias="deliveredAt")
    read_at: Optional[datetime] = Field(None, serialization_alias="readAt")
    
    model_config = {"populate_by_name": True}


class MessageReactionDTO(BaseModel):
    user_id: str = Field(..., serialization_alias="userId")
    emoji: str
    created_at: datetime = Field(..., serialization_alias="createdAt")
    
    model_config = {"populate_by_name": True}


class MessageDTO(BaseModel):
    id: str
    conversation_id: str = Field(..., serialization_alias="conversationId")
    sender_id: str = Field(..., serialization_alias="senderId")
    client_message_id: str = Field(..., serialization_alias="clientMessageId")
    content: str
    content_type: str = Field(..., serialization_alias="contentType")
    attachments: Optional[list]
    reply_to_id: Optional[str] = Field(None, serialization_alias="replyToId")  # NEW: Reply reference
    created_at: datetime = Field(..., serialization_alias="createdAt")
    edited_at: Optional[datetime] = Field(None, serialization_alias="editedAt")
    deleted_at: Optional[datetime] = Field(None, serialization_alias="deletedAt")
    sender_email: Optional[str] = Field(None, serialization_alias="senderEmail")
    sender_display_name: Optional[str] = Field(None, serialization_alias="senderDisplayName")
    sender_avatar_url: Optional[str] = Field(None, serialization_alias="senderAvatarUrl")
    receipts: Optional[List[MessageReceiptDTO]] = None
    reactions: Optional[List[MessageReactionDTO]] = None
    
    model_config = {"populate_by_name": True}

class CreateDirectConversationRequest(BaseModel):
    email: Optional[EmailStr] = None
    other_user_id: Optional[str] = None

class FileUploadResponse(BaseModel):
    file_id: str
    url: str
    name: str
    size: int
    mime_type: str


# ========== ENDPOINTS ==========

@router.get("/conversations", response_model=List[ConversationDTO], response_model_by_alias=True)
def list_conversations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API: GET /rt/conversations
    Purpose: List all ACCEPTED conversations for current user
    Request (JSON): null
    Response (JSON) [200]: [{ id, type, title, members, last_message, unread_count }]
    Response Errors:
    - 401: { "detail": "Unauthorized" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Only returns accepted conversations (is_accepted=True)
    """
    # Get only ACCEPTED memberships
    memberships = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.user_id == current_user["id"],
        RTConversationMemberModel.is_accepted == True
    ).all()
    
    conv_ids = [m.conversation_id for m in memberships]
    if not conv_ids:
        return []
    
    conversations = db.query(RTConversationModel).filter(
        RTConversationModel.id.in_(conv_ids)
    ).options(
        joinedload(RTConversationModel.members).joinedload(RTConversationMemberModel.user)
    ).order_by(RTConversationModel.updated_at.desc()).all()
    
    result = []
    for conv in conversations:
        # Get last message
        last_msg = db.query(RTMessageModel).filter(
            RTMessageModel.conversation_id == conv.id,
            RTMessageModel.deleted_at.is_(None)
        ).order_by(RTMessageModel.created_at.desc()).first()
        
        # Get unread count
        if last_msg:
            last_read_receipt = db.query(RTMessageReceiptModel).filter(
                RTMessageReceiptModel.user_id == current_user["id"],
                RTMessageReceiptModel.read_at.isnot(None)
            ).join(RTMessageModel).filter(
                RTMessageModel.conversation_id == conv.id
            ).order_by(RTMessageReceiptModel.read_at.desc()).first()
            
            if last_read_receipt:
                last_read_msg = db.query(RTMessageModel).filter(
                    RTMessageModel.id == last_read_receipt.message_id
                ).first()
                last_read_timestamp = last_read_msg.created_at if last_read_msg else None
            else:
                last_read_timestamp = None
            
            if last_read_timestamp:
                unread = db.query(RTMessageModel).filter(
                    RTMessageModel.conversation_id == conv.id,
                    RTMessageModel.sender_id != current_user["id"],
                    RTMessageModel.deleted_at.is_(None),
                    RTMessageModel.created_at > last_read_timestamp
                ).count()
            else:
                unread = db.query(RTMessageModel).filter(
                    RTMessageModel.conversation_id == conv.id,
                    RTMessageModel.sender_id != current_user["id"],
                    RTMessageModel.deleted_at.is_(None)
                ).count()
        else:
            unread = 0
        
        members_dto = [
            ConversationMemberDTO(
                user_id=m.user_id,
                role=m.role,
                joined_at=m.joined_at,
                is_accepted=m.is_accepted,
                user_email=m.user.email if m.user else None,
                user_display_name=m.user.display_name if m.user else None,
                user_avatar_url=m.user.avatar_url if m.user else None
            )
            for m in conv.members
        ]
        
        result.append(ConversationDTO(
            id=conv.id,
            type=conv.type,
            title=conv.title,
            related_entity_type=conv.related_entity_type,
            related_entity_id=conv.related_entity_id,
            created_at=ensure_utc(conv.created_at),
            updated_at=ensure_utc(conv.updated_at),
            members=members_dto,
            last_message={
                "id": last_msg.id,
                "content": last_msg.content,
                "senderId": last_msg.sender_id,
                "createdAt": to_utc_iso(last_msg.created_at)
            } if last_msg else None,
            unread_count=unread
        ))
    
    return result


@router.get("/conversations/pending", response_model=List[ConversationDTO], response_model_by_alias=True)
def list_pending_conversations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API: GET /rt/conversations/pending
    Purpose: List all PENDING/SPAM conversations for current user
    Request (JSON): null
    Response (JSON) [200]: [{ id, type, title, members, last_message, unread_count }]
    Response Errors:
    - 401: { "detail": "Unauthorized" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Only returns pending conversations (is_accepted=False)
    """
    # Get only PENDING memberships
    memberships = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.user_id == current_user["id"],
        RTConversationMemberModel.is_accepted == False
    ).all()
    
    conv_ids = [m.conversation_id for m in memberships]
    if not conv_ids:
        return []
    
    conversations = db.query(RTConversationModel).filter(
        RTConversationModel.id.in_(conv_ids)
    ).options(joinedload(RTConversationModel.members).joinedload(RTConversationMemberModel.user)).all()
    
    result = []
    for conv in conversations:
        # Get last message
        last_msg = db.query(RTMessageModel).filter(
            RTMessageModel.conversation_id == conv.id,
            RTMessageModel.deleted_at.is_(None)
        ).order_by(RTMessageModel.created_at.desc()).first()
        
        # Count unread messages
        unread = db.query(RTMessageModel).filter(
            RTMessageModel.conversation_id == conv.id,
            RTMessageModel.sender_id != current_user["id"],
            RTMessageModel.deleted_at.is_(None),
            ~db.query(RTMessageReceiptModel).filter(
                RTMessageReceiptModel.message_id == RTMessageModel.id,
                RTMessageReceiptModel.user_id == current_user["id"],
                RTMessageReceiptModel.read_at.isnot(None)
            ).exists()
        ).count()
        
        members_dto = [
            ConversationMemberDTO(
                user_id=m.user_id,
                role=m.role,
                joined_at=m.joined_at,
                is_accepted=m.is_accepted,
                user_email=m.user.email if m.user else None,
                user_display_name=m.user.display_name if m.user else None,
                user_avatar_url=m.user.avatar_url if m.user else None
            )
            for m in conv.members
        ]
        
        result.append(ConversationDTO(
            id=conv.id,
            type=conv.type,
            title=conv.title,
            related_entity_type=conv.related_entity_type,
            related_entity_id=conv.related_entity_id,
            created_at=ensure_utc(conv.created_at),
            updated_at=ensure_utc(conv.updated_at),
            members=members_dto,
            last_message={
                "id": last_msg.id,
                "content": last_msg.content,
                "senderId": last_msg.sender_id,
                "createdAt": to_utc_iso(last_msg.created_at)
            } if last_msg else None,
            unread_count=unread
        ))
    
    return result


@router.post("/conversations/direct", response_model=dict)
def create_or_get_direct_conversation(
    request: CreateDirectConversationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API: POST /rt/conversations/direct
    Purpose: Create or get existing direct conversation
    Request (JSON): { email?, other_user_id? }
    Response (JSON) [200]: { conversation_id: "..." }
    Response Errors:
    - 400: { "detail": "..." }
    - 401: { "detail": "Unauthorized" }
    - 404: { "detail": "User not found" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Prevents self-chat; upserts conversation
    """
    if not request.email and not request.other_user_id:
        raise HTTPException(400, "Cần email hoặc other_user_id")
    
    # Resolve other user
    if request.email:
        other_user = db.query(UserModel).filter(UserModel.email == request.email.lower().strip()).first()
        if not other_user:
            raise HTTPException(404, "Không tìm thấy người dùng")
    else:
        other_user = db.query(UserModel).filter(UserModel.id == request.other_user_id).first()
        if not other_user:
            raise HTTPException(404, "Không tìm thấy người dùng")
    
    if other_user.id == current_user["id"]:
        raise HTTPException(400, "Không thể chat với chính bạn")
    
    # Find existing direct conversation
    user_ids = sorted([current_user["id"], other_user.id])
    existing_convs = db.query(RTConversationModel).filter(
        RTConversationModel.type == "direct"
    ).options(joinedload(RTConversationModel.members)).all()
    
    for conv in existing_convs:
        member_ids = sorted([m.user_id for m in conv.members])
        if member_ids == user_ids:
            return {"conversation_id": conv.id}
    
    # Create new
    conv_id = str(uuid.uuid4())
    new_conv = RTConversationModel(
        id=conv_id,
        type="direct",
        title=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_conv)
    
    # Add members: sender is_accepted=True, receiver is_accepted=False (pending)
    for uid in [current_user["id"], other_user.id]:
        is_sender = uid == current_user["id"]
        member = RTConversationMemberModel(
            conversation_id=conv_id,
            user_id=uid,
            role="member",
            joined_at=datetime.now(timezone.utc),
            is_accepted=is_sender  # Sender: True, Receiver: False
        )
        db.add(member)
    
    db.commit()
    
    return {"conversation_id": conv_id}


@router.get("/conversations/{conversation_id}/messages", response_model=dict)
def get_conversation_messages(
    conversation_id: str,
    after: Optional[str] = Query(None),
    before: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API: GET /rt/conversations/{id}/messages?after=&before=&limit=
    Purpose: Get paginated messages for a conversation
    Request (JSON): null
    Response (JSON) [200]: { messages: [...], has_more: bool }
    Response Errors:
    - 401: { "detail": "Unauthorized" }
    - 403: { "detail": "Not a member" }
    - 404: { "detail": "Conversation not found" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Pagination via after/before message id
    """
    conv = db.query(RTConversationModel).filter(RTConversationModel.id == conversation_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    
    is_member = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    if not is_member:
        raise HTTPException(403, "Not a member")
    
    query = db.query(RTMessageModel).filter(
        RTMessageModel.conversation_id == conversation_id,
        RTMessageModel.deleted_at.is_(None)
    ).options(
        joinedload(RTMessageModel.sender),
        joinedload(RTMessageModel.receipts),
        joinedload(RTMessageModel.reactions)
    )
    
    if after:
        after_msg = db.query(RTMessageModel).filter(RTMessageModel.id == after).first()
        if after_msg:
            query = query.filter(RTMessageModel.created_at > after_msg.created_at)
        query = query.order_by(RTMessageModel.created_at.asc())
    elif before:
        before_msg = db.query(RTMessageModel).filter(RTMessageModel.id == before).first()
        if before_msg:
            query = query.filter(RTMessageModel.created_at < before_msg.created_at)
        query = query.order_by(RTMessageModel.created_at.desc())
    else:
        query = query.order_by(RTMessageModel.created_at.desc())
    
    messages = query.limit(limit + 1).all()
    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]
    
    if not after and not before:
        messages = list(reversed(messages))
    
    result_messages = []
    for msg in messages:
        receipts_dto = [
            MessageReceiptDTO(
                user_id=r.user_id,
                delivered_at=r.delivered_at,
                read_at=r.read_at
            )
            for r in msg.receipts
        ]
        
        reactions_dto = [
            MessageReactionDTO(
                user_id=r.user_id,
                emoji=r.emoji,
                created_at=r.created_at
            )
            for r in (msg.reactions if hasattr(msg, 'reactions') and msg.reactions else [])
        ]
        
        result_messages.append(MessageDTO(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            client_message_id=msg.client_message_id,
            content=msg.content,
            content_type=msg.content_type,
            attachments=msg.attachments_json,
            reply_to_id=msg.reply_to_id,  # NEW: Include reply reference
            created_at=ensure_utc(msg.created_at),  # FIX: Ensure UTC timezone
            edited_at=ensure_utc(msg.edited_at),    # FIX: Ensure UTC timezone
            deleted_at=ensure_utc(msg.deleted_at),  # FIX: Ensure UTC timezone
            sender_email=msg.sender.email if msg.sender else None,
            sender_display_name=msg.sender.display_name if msg.sender else None,
            sender_avatar_url=msg.sender.avatar_url if msg.sender else None,
            receipts=receipts_dto,
            reactions=reactions_dto
        ))
    
    return {"messages": [m.model_dump(by_alias=True) for m in result_messages], "has_more": has_more}


@router.post("/conversations/{conversation_id}/accept", response_model=dict)
def accept_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API: POST /rt/conversations/{id}/accept
    Purpose: Accept a pending conversation (move from spam to inbox)
    Request (JSON): null
    Response (JSON) [200]: { success: true }
    Response Errors:
    - 401: { "detail": "Unauthorized" }
    - 404: { "detail": "Conversation not found" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Sets is_accepted=True for current user's membership
    """
    # Check if conversation exists and user is a member
    member = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    
    if not member:
        raise HTTPException(404, "Conversation not found or you are not a member")
    
    # Accept the conversation
    member.is_accepted = True
    db.commit()
    
    return {"success": True}


class RejectConversationRequest(BaseModel):
    delete_history: bool = Field(False, serialization_alias="deleteHistory")
    
    model_config = {"populate_by_name": True}


@router.post("/conversations/{conversation_id}/reject", response_model=dict)
def reject_conversation(
    conversation_id: str,
    request: RejectConversationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API: POST /rt/conversations/{id}/reject
    Purpose: Reject a pending conversation with optional history deletion
    Request (JSON): { "delete_history": true/false }
    Response (JSON) [200]: { success: true }
    Response Errors:
    - 401: { "detail": "Unauthorized" }
    - 404: { "detail": "Conversation not found" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Removes user's membership; if delete_history=true, also deletes all messages and conversation
    """
    # Check if conversation exists and user is a member
    member = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    
    if not member:
        raise HTTPException(404, "Conversation not found or you are not a member")
    
    if request.delete_history:
        # Get all message IDs first (before deletion)
        message_ids = [m.id for m in db.query(RTMessageModel.id).filter(
            RTMessageModel.conversation_id == conversation_id
        ).all()]
        
        # Delete receipts FIRST (using the message_ids list)
        if message_ids:
            db.query(RTMessageReceiptModel).filter(
                RTMessageReceiptModel.message_id.in_(message_ids)
            ).delete(synchronize_session=False)
        
        # Now safe to delete all messages
        db.query(RTMessageModel).filter(
            RTMessageModel.conversation_id == conversation_id
        ).delete(synchronize_session=False)
        
        # Delete all members
        db.query(RTConversationMemberModel).filter(
            RTConversationMemberModel.conversation_id == conversation_id
        ).delete(synchronize_session=False)
        
        # Delete conversation itself
        db.query(RTConversationModel).filter(
            RTConversationModel.id == conversation_id
        ).delete(synchronize_session=False)
    else:
        # Just remove user's membership
        db.delete(member)
    
    db.commit()
    
    return {"success": True}


@router.post("/files", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API: POST /rt/files
    Purpose: Upload file/image for realtime chat
    Request (JSON): multipart/form-data with file
    Response (JSON) [200]: { file_id, url, name, size, mime_type }
    Response Errors:
    - 400: { "detail": "..." }
    - 401: { "detail": "Unauthorized" }
    - 413: { "detail": "File too large" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Max 10MB, allowed extensions: jpg, png, gif, pdf, doc, xls, txt, zip
    """
    if not file.filename:
        raise HTTPException(400, "Filename required")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}{ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    size = 0
    async with aiofiles.open(file_path, 'wb') as f:
        while chunk := await file.read(8192):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                await f.close()
                file_path.unlink(missing_ok=True)
                raise HTTPException(413, "File too large (max 10MB)")
            await f.write(chunk)
    
    print(f"[RT Upload] File saved: {file_path} (exists: {file_path.exists()})")
    
    url = f"/uploads/rt_files/{safe_filename}"
    
    return FileUploadResponse(
        file_id=file_id,
        url=url,
        name=file.filename,
        size=size,
        mime_type=file.content_type or "application/octet-stream"
    )


@router.get("/users/lookup")
def lookup_user_by_email(
    email: EmailStr = Query(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API: GET /users/lookup?email=...
    Purpose: Lookup user by exact email match for chat
    Request (JSON): null
    Response (JSON) [200]: { id, email, username, display_name, avatar_url }
    Response Errors:
    - 401: { "detail": "Unauthorized" }
    - 404: { "detail": "User not found" }
    - 429: { "detail": "Too many requests" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Rate limited 10 req/min per user; exact match only
    """
    if not check_rate_limit(current_user["id"], limit=10, window=60):
        raise HTTPException(429, "Too many requests")
    
    normalized_email = email.lower().strip()
    user = db.query(UserModel).filter(UserModel.email == normalized_email).first()
    
    if not user:
        raise HTTPException(404, "User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url
    }


# ===============================
# Reactions API Endpoints
# ===============================

class ReactionRequest(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=10)


class ReactionResponse(BaseModel):
    message_id: str
    user_id: str
    emoji: str
    created_at: str


@router.post("/messages/{message_id}/reactions", response_model=ReactionResponse)
def add_reaction_to_message(
    message_id: str,
    reaction_req: ReactionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    API: POST /rt/messages/{message_id}/reactions
    Purpose: Add emoji reaction to a realtime chat message
    Request (JSON): { "emoji": "👍" }
    Response (JSON) [200]: { "message_id": "...", "user_id": "...", "emoji": "👍", "created_at": "2026-01-10T..." }
    Response Errors:
    - 400: { "detail": "Invalid emoji" }
    - 403: { "detail": "Not a conversation member" }
    - 404: { "detail": "Message not found" }
    - 409: { "detail": "Reaction already exists" }
    - 500: { "detail": "Internal Server Error" }
    Notes: User can add multiple different emojis; duplicate emoji returns 409
    """
    # Validate message exists
    message = db.query(RTMessageModel).filter(RTMessageModel.id == message_id).first()
    if not message:
        raise HTTPException(404, "Message not found")
    
    # Check user is member of conversation
    membership = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == message.conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    if not membership:
        raise HTTPException(403, "Not a conversation member")
    
    # Check if reaction already exists (duplicate prevention)
    existing = db.query(RTMessageReactionModel).filter(
        RTMessageReactionModel.message_id == message_id,
        RTMessageReactionModel.user_id == current_user["id"],
        RTMessageReactionModel.emoji == reaction_req.emoji
    ).first()
    if existing:
        raise HTTPException(409, "Reaction already exists")
    
    # Create reaction
    reaction = RTMessageReactionModel(
        message_id=message_id,
        user_id=current_user["id"],
        emoji=reaction_req.emoji,
        created_at=datetime.now(timezone.utc)
    )
    db.add(reaction)
    db.commit()
    
    return {
        "message_id": message_id,
        "user_id": current_user["id"],
        "emoji": reaction_req.emoji,
        "created_at": to_utc_iso(reaction.created_at)
    }


@router.delete("/messages/{message_id}/reactions/{emoji}")
def remove_reaction_from_message(
    message_id: str,
    emoji: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    API: DELETE /rt/messages/{message_id}/reactions/{emoji}
    Purpose: Remove user's emoji reaction from a message
    Request (JSON): null
    Response (JSON) [200]: { "message": "Reaction removed" }
    Response Errors:
    - 403: { "detail": "Not a conversation member" }
    - 404: { "detail": "Message not found" or "Reaction not found" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Can only remove own reactions; returns 404 if reaction doesn't exist
    """
    # Validate message exists
    message = db.query(RTMessageModel).filter(RTMessageModel.id == message_id).first()
    if not message:
        raise HTTPException(404, "Message not found")
    
    # Check user is member of conversation
    membership = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == message.conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    if not membership:
        raise HTTPException(403, "Not a conversation member")
    
    # Find and delete reaction
    reaction = db.query(RTMessageReactionModel).filter(
        RTMessageReactionModel.message_id == message_id,
        RTMessageReactionModel.user_id == current_user["id"],
        RTMessageReactionModel.emoji == emoji
    ).first()
    if not reaction:
        raise HTTPException(404, "Reaction not found")
    
    db.delete(reaction)
    db.commit()
    
    return {"message": "Reaction removed"}


@router.get("/messages/{message_id}/reactions", response_model=List[ReactionResponse])
def get_message_reactions(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    API: GET /rt/messages/{message_id}/reactions
    Purpose: Get all reactions for a message
    Request (JSON): null
    Response (JSON) [200]: [{ "message_id": "...", "user_id": "...", "emoji": "👍", "created_at": "..." }, ...]
    Response Errors:
    - 403: { "detail": "Not a conversation member" }
    - 404: { "detail": "Message not found" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Returns array of all reactions with user_id; empty array if no reactions
    """
    # Validate message exists
    message = db.query(RTMessageModel).filter(RTMessageModel.id == message_id).first()
    if not message:
        raise HTTPException(404, "Message not found")
    
    # Check user is member of conversation
    membership = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == message.conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    if not membership:
        raise HTTPException(403, "Not a conversation member")
    
    # Get all reactions for this message
    reactions = db.query(RTMessageReactionModel).filter(
        RTMessageReactionModel.message_id == message_id
    ).all()
    
    return [
        {
            "message_id": r.message_id,
            "user_id": r.user_id,
            "emoji": r.emoji,
            "created_at": to_utc_iso(r.created_at)
        }
        for r in reactions
    ]


# ========== PINNED MESSAGES ENDPOINTS ==========

class PinnedMessageDTO(BaseModel):
    """DTO for pinned message response"""
    message_id: str = Field(..., serialization_alias="messageId")
    conversation_id: str = Field(..., serialization_alias="conversationId")
    pinned_by: str = Field(..., serialization_alias="pinnedBy")
    pinned_at: datetime = Field(..., serialization_alias="pinnedAt")
    message: Optional[MessageDTO] = None
    
    model_config = {"populate_by_name": True}


@router.get("/conversations/{conversation_id}/pinned", response_model=List[PinnedMessageDTO], response_model_by_alias=True)
def get_pinned_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    API: GET /rt/conversations/{conversation_id}/pinned
    Purpose: Get all pinned messages for a conversation
    Request (JSON): null
    Response (JSON) [200]: [{ messageId, conversationId, pinnedBy, pinnedAt, message: MessageDTO }]
    Response Errors:
    - 403: { "detail": "Not a conversation member" }
    - 500: { "detail": "Internal Server Error" }
    Notes: Returns pinned messages ordered by pinnedAt DESC (most recent first)
    """
    membership = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    if not membership:
        raise HTTPException(403, "Not a conversation member")
    
    pinned = db.query(RTPinnedMessageModel).filter(
        RTPinnedMessageModel.conversation_id == conversation_id
    ).options(
        joinedload(RTPinnedMessageModel.message).joinedload(RTMessageModel.sender)
    ).order_by(RTPinnedMessageModel.pinned_at.desc()).all()
    
    result = []
    for p in pinned:
        msg = p.message
        message_dto = None
        if msg:
            message_dto = MessageDTO(
                id=msg.id,
                conversation_id=msg.conversation_id,
                sender_id=msg.sender_id,
                client_message_id=msg.client_message_id,
                content=msg.content if not msg.deleted_at else "Tin nhắn đã bị thu hồi",
                content_type=msg.content_type,
                attachments=msg.attachments_json,
                reply_to_id=msg.reply_to_id,
                created_at=ensure_utc(msg.created_at),
                edited_at=ensure_utc(msg.edited_at),
                deleted_at=ensure_utc(msg.deleted_at),
                sender_email=msg.sender.email if msg.sender else None,
                sender_display_name=msg.sender.display_name if msg.sender else None,
                sender_avatar_url=msg.sender.avatar_url if msg.sender else None
            )
        
        result.append(PinnedMessageDTO(
            message_id=p.message_id,
            conversation_id=p.conversation_id,
            pinned_by=p.pinned_by,
            pinned_at=ensure_utc(p.pinned_at),
            message=message_dto
        ))
    
    return result


@router.post("/conversations/{conversation_id}/pin/{message_id}")
def pin_message(
    conversation_id: str,
    message_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    API: POST /rt/conversations/{conversation_id}/pin/{message_id}
    Purpose: Pin a message in a conversation
    Request (JSON): null
    Response (JSON) [200]: { success: true, pinnedAt: "..." }
    Response Errors:
    - 400: { "detail": "Message already pinned" }
    - 403: { "detail": "Not a conversation member" }
    - 404: { "detail": "Message not found" }
    - 500: { "detail": "Internal Server Error" }
    Notes: WebSocket event msg:pinned will be broadcast to all members
    """
    membership = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    if not membership:
        raise HTTPException(403, "Not a conversation member")
    
    message = db.query(RTMessageModel).filter(
        RTMessageModel.id == message_id,
        RTMessageModel.conversation_id == conversation_id
    ).first()
    if not message:
        raise HTTPException(404, "Message not found")
    
    existing = db.query(RTPinnedMessageModel).filter(
        RTPinnedMessageModel.conversation_id == conversation_id,
        RTPinnedMessageModel.message_id == message_id
    ).first()
    if existing:
        raise HTTPException(400, "Message already pinned")
    
    pinned_at = datetime.now(timezone.utc)
    pinned = RTPinnedMessageModel(
        conversation_id=conversation_id,
        message_id=message_id,
        pinned_by=current_user["id"],
        pinned_at=pinned_at
    )
    db.add(pinned)
    db.commit()
    
    return {"success": True, "pinnedAt": to_utc_iso(pinned_at)}


@router.delete("/conversations/{conversation_id}/pin/{message_id}")
def unpin_message(
    conversation_id: str,
    message_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    API: DELETE /rt/conversations/{conversation_id}/pin/{message_id}
    Purpose: Unpin a message from a conversation
    Request (JSON): null
    Response (JSON) [200]: { success: true }
    Response Errors:
    - 403: { "detail": "Not a conversation member" }
    - 404: { "detail": "Pinned message not found" }
    - 500: { "detail": "Internal Server Error" }
    Notes: WebSocket event msg:unpinned will be broadcast to all members
    """
    membership = db.query(RTConversationMemberModel).filter(
        RTConversationMemberModel.conversation_id == conversation_id,
        RTConversationMemberModel.user_id == current_user["id"]
    ).first()
    if not membership:
        raise HTTPException(403, "Not a conversation member")
    
    pinned = db.query(RTPinnedMessageModel).filter(
        RTPinnedMessageModel.conversation_id == conversation_id,
        RTPinnedMessageModel.message_id == message_id
    ).first()
    if not pinned:
        raise HTTPException(404, "Pinned message not found")
    
    db.delete(pinned)
    db.commit()
    
    return {"success": True}
