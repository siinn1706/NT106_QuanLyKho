# app/firestore_service.py
import json
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore
from .config import FIREBASE_SERVICE_ACCOUNT

_app = None
_db = None

def initialize_firestore():
    global _app, _db
    
    if _app is not None:
        return _db
    
    try:
        if FIREBASE_SERVICE_ACCOUNT:
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
        else:
            cred = credentials.ApplicationDefault()
        
        _app = firebase_admin.initialize_app(cred)
        _db = firestore.client()
        print("[INFO] Firestore initialized successfully")
        return _db
    except Exception as e:
        print(f"[ERROR] Failed to initialize Firestore: {e}")
        return None

def get_firestore_db():
    global _db
    if _db is None:
        _db = initialize_firestore()
    return _db

def create_user_profile(
    uid: str,
    email: str,
    username: str,
    full_name: str,
    photo_url: Optional[str] = None
) -> bool:
    db = get_firestore_db()
    if not db:
        print("[WARN] Firestore not available")
        return False
    
    try:
        transaction = db.transaction()
        
        @firestore.transactional
        def create_profile(transaction):
            username_ref = db.collection('usernames').document(username)
            user_ref = db.collection('users').document(uid)
            
            username_doc = username_ref.get(transaction=transaction)
            if username_doc.exists:
                raise ValueError(f"Username '{username}' already exists")
            
            now = firestore.SERVER_TIMESTAMP
            
            user_data = {
                'email': email,
                'username': username,
                'fullName': full_name,
                'photoURL': photo_url,
                'createdAt': now,
                'updatedAt': now
            }
            
            username_data = {
                'uid': uid,
                'email': email
            }
            
            transaction.set(user_ref, user_data)
            transaction.set(username_ref, username_data)
        
        create_profile(transaction)
        print(f"[INFO] Created Firestore profile for user {uid}")
        return True
        
    except ValueError as e:
        print(f"[ERROR] Username conflict: {e}")
        raise
    except Exception as e:
        print(f"[ERROR] Failed to create Firestore profile: {e}")
        return False

def update_user_profile(
    uid: str,
    full_name: Optional[str] = None,
    photo_url: Optional[str] = None
) -> bool:
    db = get_firestore_db()
    if not db:
        print("[WARN] Firestore not available")
        return False
    
    try:
        user_ref = db.collection('users').document(uid)
        
        update_data: Dict[str, Any] = {
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        if full_name is not None:
            update_data['fullName'] = full_name
        
        if photo_url is not None:
            update_data['photoURL'] = photo_url
        
        user_ref.update(update_data)
        print(f"[INFO] Updated Firestore profile for user {uid}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to update Firestore profile: {e}")
        return False

def get_user_profile(uid: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_db()
    if not db:
        return None
    
    try:
        user_ref = db.collection('users').document(uid)
        doc = user_ref.get()
        
        if doc.exists:
            return doc.to_dict()
        return None
        
    except Exception as e:
        print(f"[ERROR] Failed to get Firestore profile: {e}")
        return None

def check_username_exists(username: str) -> bool:
    db = get_firestore_db()
    if not db:
        return False
    
    try:
        username_ref = db.collection('usernames').document(username)
        doc = username_ref.get()
        return doc.exists
    except Exception as e:
        print(f"[ERROR] Failed to check username: {e}")
        return False
