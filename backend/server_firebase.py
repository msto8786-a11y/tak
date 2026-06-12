from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Any, Optional
import uuid
from datetime import datetime, timezone
import httpx

# Import Firebase manager
from firebase_client import FirebaseSessionManager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ===== Models =====
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class SessionCreate(BaseModel):
    name: str
    student_name: Optional[str] = ""
    components: List[Any] = []
    wires: List[Any] = []


class SessionUpdate(BaseModel):
    name: Optional[str] = None
    student_name: Optional[str] = None
    components: Optional[List[Any]] = None
    wires: Optional[List[Any]] = None


class SessionSummary(BaseModel):
    id: str
    name: str
    student_name: str = ""
    updated_at: str
    component_count: int = 0
    wire_count: int = 0


class SessionFull(BaseModel):
    id: str
    name: str
    student_name: str = ""
    components: List[Any] = []
    wires: List[Any] = []
    created_at: str
    updated_at: str


# ===== Routes =====
@api_router.get("/")
async def root():
    return {"message": "Industrial Control Lab Simulator API (Firebase)"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    try:
        result = await FirebaseSessionManager.create_status_check(input.client_name)
        status_obj = StatusCheck(
            id=result.get("id"),
            client_name=result.get("client_name"),
            timestamp=datetime.fromisoformat(result.get("timestamp"))
        )
        return status_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    try:
        results = await FirebaseSessionManager.get_status_checks()
        status_checks = [
            StatusCheck(
                id=item.get("id"),
                client_name=item.get("client_name"),
                timestamp=datetime.fromisoformat(item.get("timestamp"))
            )
            for item in results
        ]
        return status_checks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Sessions =====
@api_router.post("/sessions", response_model=SessionFull)
async def create_session(payload: SessionCreate):
    try:
        result = await FirebaseSessionManager.create_session(
            payload.name,
            payload.student_name or "",
            payload.components,
            payload.wires
        )
        return SessionFull(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions():
    try:
        results = await FirebaseSessionManager.list_sessions()
        summaries = [
            SessionSummary(
                id=item["id"],
                name=item.get("name", ""),
                student_name=item.get("student_name", "") or "",
                updated_at=item.get("updated_at", ""),
                component_count=item.get("component_count", 0),
                wire_count=item.get("wire_count", 0),
            )
            for item in results
        ]
        return summaries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/sessions/{session_id}", response_model=SessionFull)
async def get_session(session_id: str):
    try:
        doc = await FirebaseSessionManager.get_session(session_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Session not found")
        return SessionFull(**doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/sessions/{session_id}", response_model=SessionFull)
async def update_session(session_id: str, payload: SessionUpdate):
    try:
        update_fields = payload.model_dump(exclude_unset=True)
        if all(v is None for v in update_fields.values()):
            raise HTTPException(status_code=400, detail="No fields to update")
        
        result = await FirebaseSessionManager.update_session(
            session_id,
            name=update_fields.get("name"),
            student_name=update_fields.get("student_name"),
            components=update_fields.get("components"),
            wires=update_fields.get("wires")
        )
        return SessionFull(**result)
    except HTTPException:
        raise
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Session not found")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    try:
        # First check if session exists
        doc = await FirebaseSessionManager.get_session(session_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        await FirebaseSessionManager.delete_session(session_id)
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Wi-Fi Relay Proxy (optional helper to avoid mixed-content) =====
class RelayCommand(BaseModel):
    base_url: str
    path: str  # e.g. /relay/on/1


@api_router.post("/wifi-relay/forward")
async def forward_relay_command(cmd: RelayCommand):
    url = f"{cmd.base_url}{cmd.path}"
    try:
        async with httpx.AsyncClient(timeout=3.0) as ac:
            r = await ac.get(url)
            return {"status": "ok", "code": r.status_code}
    except Exception as e:
        return {"status": "error", "message": str(e)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
