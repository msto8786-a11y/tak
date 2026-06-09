from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Any, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    return {"message": "Industrial Control Lab Simulator API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# ===== Sessions =====
@api_router.post("/sessions", response_model=SessionFull)
async def create_session(payload: SessionCreate):
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip() or "جلسة بدون اسم",
        "student_name": (payload.student_name or "").strip(),
        "components": payload.components,
        "wires": payload.wires,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    await db.lab_sessions.insert_one(doc)
    doc.pop("_id", None)
    return SessionFull(**doc)


@api_router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions():
    docs = await db.lab_sessions.find(
        {},
        {"_id": 0, "id": 1, "name": 1, "student_name": 1, "updated_at": 1, "components": 1, "wires": 1},
    ).sort("updated_at", -1).to_list(500)
    out = []
    for d in docs:
        out.append(SessionSummary(
            id=d["id"],
            name=d.get("name", ""),
            student_name=d.get("student_name", "") or "",
            updated_at=d.get("updated_at", ""),
            component_count=len(d.get("components", []) or []),
            wire_count=len(d.get("wires", []) or []),
        ))
    return out


@api_router.get("/sessions/{session_id}", response_model=SessionFull)
async def get_session(session_id: str):
    doc = await db.lab_sessions.find_one({"id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionFull(**doc)


@api_router.put("/sessions/{session_id}", response_model=SessionFull)
async def update_session(session_id: str, payload: SessionUpdate):
    update_fields = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.lab_sessions.find_one_and_update(
        {"id": session_id},
        {"$set": update_fields},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionFull(**result)


@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    res = await db.lab_sessions.delete_one({"id": session_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


# ===== Wi-Fi Relay Proxy (optional helper to avoid mixed-content) =====
# Allows the frontend (HTTPS) to call our backend which then forwards
# an HTTP request to the local Wi-Fi relay module. Optional - frontend
# can also call the module directly when served over HTTP.
import httpx


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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
