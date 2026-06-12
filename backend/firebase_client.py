"""
Firebase client for Industrial Control Lab Simulator sessions.
Handles all database operations using Firebase Realtime Database.
"""

import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, db
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

# Load environment variables
load_dotenv()

# Initialize Firebase
FIREBASE_CREDENTIALS_PATH = os.environ.get('FIREBASE_CREDENTIALS_PATH')
FIREBASE_DATABASE_URL = os.environ.get('FIREBASE_DATABASE_URL')

if not FIREBASE_CREDENTIALS_PATH or not FIREBASE_DATABASE_URL:
    raise ValueError("FIREBASE_CREDENTIALS_PATH and FIREBASE_DATABASE_URL must be set in environment variables")

# Initialize Firebase app
try:
    firebase_admin.get_app()
except ValueError:
    # App not initialized yet
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred, {
        'databaseURL': FIREBASE_DATABASE_URL
    })


class FirebaseSessionManager:
    """Manager for lab sessions using Firebase Realtime Database."""
    
    @staticmethod
    async def create_session(name: str, student_name: str, components: List[Any], wires: List[Any]) -> Dict[str, Any]:
        """Create a new session in Firebase."""
        now = datetime.now(timezone.utc).isoformat()
        session_id = str(uuid.uuid4())
        
        session_data = {
            "id": session_id,
            "name": name.strip() or "جلسة بدون اسم",
            "student_name": (student_name or "").strip(),
            "components": components,
            "wires": wires,
            "created_at": now,
            "updated_at": now,
        }
        
        try:
            # Save to Firebase
            db.reference(f"lab_sessions/{session_id}").set(session_data)
            return session_data
        except Exception as e:
            raise Exception(f"Failed to create session: {str(e)}")
    
    @staticmethod
    async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single session by ID."""
        try:
            snapshot = db.reference(f"lab_sessions/{session_id}").get()
            if snapshot:
                return snapshot
            return None
        except Exception as e:
            raise Exception(f"Failed to get session: {str(e)}")
    
    @staticmethod
    async def list_sessions(limit: int = 500) -> List[Dict[str, Any]]:
        """List all sessions, sorted by updated_at descending."""
        try:
            snapshot = db.reference("lab_sessions").order_by_child("updated_at").limit_to_last(limit).get()
            
            if not snapshot:
                return []
            
            sessions = []
            # Firebase returns data as dict, reverse to get newest first
            for session_id, session_data in reversed(snapshot.items()):
                sessions.append({
                    "id": session_data.get("id", session_id),
                    "name": session_data.get("name", ""),
                    "student_name": session_data.get("student_name", "") or "",
                    "updated_at": session_data.get("updated_at", ""),
                    "created_at": session_data.get("created_at", ""),
                    "component_count": len(session_data.get("components", []) or []),
                    "wire_count": len(session_data.get("wires", []) or []),
                    "components": session_data.get("components", []),
                    "wires": session_data.get("wires", []),
                })
            
            return sessions[:limit]
        except Exception as e:
            raise Exception(f"Failed to list sessions: {str(e)}")
    
    @staticmethod
    async def update_session(session_id: str, name: Optional[str] = None, 
                            student_name: Optional[str] = None,
                            components: Optional[List[Any]] = None,
                            wires: Optional[List[Any]] = None) -> Dict[str, Any]:
        """Update a session."""
        try:
            # Get current session
            current = db.reference(f"lab_sessions/{session_id}").get()
            if not current:
                raise Exception("Session not found")
            
            # Prepare update data
            update_data = {**current}
            
            if name is not None:
                update_data["name"] = name.strip() or "جلسة بدون اسم"
            if student_name is not None:
                update_data["student_name"] = (student_name or "").strip()
            if components is not None:
                update_data["components"] = components
            if wires is not None:
                update_data["wires"] = wires
            
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            # Update in Firebase
            db.reference(f"lab_sessions/{session_id}").set(update_data)
            return update_data
        except Exception as e:
            raise Exception(f"Failed to update session: {str(e)}")
    
    @staticmethod
    async def delete_session(session_id: str) -> bool:
        """Delete a session."""
        try:
            db.reference(f"lab_sessions/{session_id}").delete()
            return True
        except Exception as e:
            raise Exception(f"Failed to delete session: {str(e)}")
    
    @staticmethod
    async def create_status_check(client_name: str) -> Dict[str, Any]:
        """Create a status check record."""
        now = datetime.now(timezone.utc).isoformat()
        check_id = str(uuid.uuid4())
        
        check_data = {
            "id": check_id,
            "client_name": client_name,
            "timestamp": now,
        }
        
        try:
            db.reference(f"status_checks/{check_id}").set(check_data)
            return check_data
        except Exception as e:
            raise Exception(f"Failed to create status check: {str(e)}")
    
    @staticmethod
    async def get_status_checks(limit: int = 1000) -> List[Dict[str, Any]]:
        """Retrieve all status checks."""
        try:
            snapshot = db.reference("status_checks").order_by_child("timestamp").limit_to_last(limit).get()
            
            if not snapshot:
                return []
            
            checks = []
            # Reverse to get newest first
            for check_id, check_data in reversed(snapshot.items()):
                checks.append(check_data)
            
            return checks[:limit]
        except Exception as e:
            raise Exception(f"Failed to get status checks: {str(e)}")
