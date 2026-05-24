from __future__ import annotations

import datetime
import math
from typing import List, Dict, Optional

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .seed import seed_db
from .models import (
    Content,
    ContentUpdate,
    ChannelConfig,
    ChannelMetrics,
    WeekSchedule,
    MediaUpload,
    SelfHealingLog,
    NLIntent,
    IntentRequest,
    SimulationRequest,
    SimulationResult,
    TransitionHotspot,
    SelfHealRequest,
    MediaCreateRequest,
    MediaUpdateRequest,
    UserCreateRequest,
    UserUpdateRequest,
    LoginRequest,
    SignupRequest,
)
from . import storage

app = FastAPI(title="SmartSchedule Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    seed_db()


@app.get("/api/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/content", response_model=List[Content])
def list_content() -> List[Dict[str, object]]:
    return storage.list_contents()


@app.get("/api/content/{content_id}", response_model=Content)
def get_content(content_id: str) -> Dict[str, object]:
    content = storage.get_content(content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content


@app.post("/api/content", response_model=Content)
def create_content(payload: Content) -> Dict[str, object]:
    return storage.create_content(payload.model_dump())


@app.patch("/api/content/{content_id}", response_model=Content)
def patch_content(content_id: str, payload: ContentUpdate) -> Dict[str, object]:
    updated = storage.update_content(content_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Content not found")
    return updated


@app.delete("/api/content/{content_id}")
def delete_content(content_id: str) -> Dict[str, str]:
    storage.delete_content(content_id)
    return {"status": "deleted"}


@app.get("/api/channels", response_model=List[ChannelConfig])
def list_channels() -> List[Dict[str, object]]:
    return storage.list_channels()


@app.get("/api/channels/{channel_id}", response_model=ChannelConfig)
def get_channel(channel_id: str) -> Dict[str, object]:
    channel = storage.get_channel(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channel


@app.get("/api/channel-metrics/{channel_id}", response_model=ChannelMetrics)
def get_channel_metrics(channel_id: str) -> Dict[str, object]:
    metrics = storage.get_channel_metrics(channel_id)
    if not metrics:
        raise HTTPException(status_code=404, detail="Channel metrics not found")
    return metrics


@app.get("/api/week-schedule", response_model=List[WeekSchedule])
def get_week_schedule(channel_id: str = Query("channel-001")) -> List[Dict[str, object]]:
    return storage.list_week_schedule(channel_id)


@app.post("/api/week-schedule/slot")
def create_schedule_slot(
    payload: Dict[str, object],
    channel_id: str = Query("channel-001"),
) -> Dict[str, object]:
    if "contentId" not in payload:
        raise HTTPException(status_code=400, detail="contentId is required")
    return storage.create_manual_slot(channel_id, payload)


@app.patch("/api/week-schedule/slot/{slot_id}")
def update_schedule_slot(slot_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    updated = storage.update_slot(slot_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Slot not found")
    return updated


@app.post("/api/intent/parse", response_model=NLIntent)
def parse_intent(payload: IntentRequest) -> Dict[str, object]:
    text = payload.text.lower()
    action = "simulate"
    if any(word in text for word in ["create", "build", "schedule"]):
        action = "create"
    elif any(word in text for word in ["modify", "change", "adjust"]):
        action = "modify"
    elif any(word in text for word in ["optimize", "improve"]):
        action = "optimize"

    constraints: List[str] = []
    goals: List[str] = []
    if "holiday" in text:
        constraints.append("seasonal:holiday")
    if "family" in text:
        constraints.append("audience:families")
    if "pg" in text:
        constraints.append("rating:TV-PG")
    if "morning" in text:
        constraints.append("time:morning")
    if "prime time" in text or "primetime" in text:
        constraints.append("time:primetime")

    if "retention" in text:
        goals.append("maximize:retention")
    if "watch time" in text:
        goals.append("maximize:watch_time")
    if "ad" in text:
        goals.append("maximize:ad_revenue")

    return {
        "raw": payload.text,
        "parsed": {
            "action": action,
            "constraints": constraints,
            "goals": goals,
        },
        "confidence": 0.87,
    }


@app.post("/api/simulate", response_model=SimulationResult)
def simulate_schedule(payload: SimulationRequest) -> Dict[str, object]:
    slots = payload.slots
    if not slots:
        raise HTTPException(status_code=400, detail="No slots provided")

    total_retention = sum(slot.predictedRetention for slot in slots)
    total_dropoff = sum(slot.predictedDropoff for slot in slots)
    predicted_retention = total_retention / len(slots)
    predicted_exits = total_dropoff / len(slots)

    ad_breaks = sum(len(slot.adBreaks) for slot in slots)
    predicted_ad_revenue = ad_breaks * 1200 + len(slots) * 250

    contents = {c["id"]: c for c in storage.list_contents()}
    hotspots: List[TransitionHotspot] = []
    for slot in slots:
        if slot.transitionRisk == "high":
            content = contents.get(slot.contentId)
            title = content["title"] if content else "Unknown"
            hotspots.append(
                TransitionHotspot(
                    slotId=slot.id,
                    contentTitle=title,
                    timeRange=f"{slot.startTime}-{slot.endTime}",
                    risk="high",
                    predictedDropoff=slot.predictedDropoff,
                    suggestedFix="Consider moving to earlier slot or pairing with similar genre",
                )
            )

    return {
        "scheduleId": payload.scheduleId,
        "predictedRetention": round(predicted_retention, 2),
        "predictedExits": round(predicted_exits, 2),
        "predictedAdRevenue": round(predicted_ad_revenue, 2),
        "transitionHotpots": [h.model_dump() for h in hotspots],
        "optimizationSuggestions": [
            "Consider extending high-retention blocks.",
            "Review high-risk transitions for genre alignment.",
            "Increase midroll density during peak demand slots.",
        ],
    }


@app.get("/api/self-heal/logs", response_model=List[SelfHealingLog])
def get_self_heal_logs() -> List[Dict[str, object]]:
    return storage.list_self_heal_logs()


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


@app.post("/api/self-heal")
def self_heal(payload: SelfHealRequest) -> Dict[str, object]:
    contents = storage.list_contents()
    original = next((c for c in contents if c["id"] == payload.contentId), None)
    if not original:
        raise HTTPException(status_code=404, detail="Original content not found")

    constraints = payload.constraints or {}
    best_match: Optional[Dict[str, object]] = None
    best_score = -1.0

    for candidate in contents:
        if candidate["id"] == original["id"]:
            continue
        if constraints.get("rating") and candidate["rating"] != constraints["rating"]:
            continue
        if constraints.get("genre") and constraints["genre"] not in candidate["genre"]:
            continue
        score = _cosine_similarity(original["embedding"], candidate["embedding"])
        if score > best_score:
            best_score = score
            best_match = candidate

    if not best_match:
        raise HTTPException(status_code=404, detail="No suitable replacement found")

    log_entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "originalContentId": original["id"],
        "originalTitle": original["title"],
        "replacementContentId": best_match["id"],
        "replacementTitle": best_match["title"],
        "similarityScore": round(best_score, 2),
        "reason": constraints.get("reason", "Auto replacement"),
        "status": "completed",
    }
    stored = storage.insert_self_heal_log(log_entry)
    return {"replacement": best_match, "log": stored}


@app.get("/api/media", response_model=List[MediaUpload])
def list_media() -> List[Dict[str, object]]:
    return storage.list_media()


@app.post("/api/media", response_model=MediaUpload)
def create_media(payload: MediaCreateRequest) -> Dict[str, object]:
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    media = {
        "title": payload.title,
        "fileName": payload.fileName,
        "fileSize": payload.fileSize,
        "duration": payload.duration,
        "status": "processing",
        "uploadProgress": 100,
        "transcodingProgress": 0,
        "metadata": payload.metadata.model_dump(),
        "uploadedAt": now,
    }
    return storage.create_media(media)


def _split_list(value: Optional[str]) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


@app.post("/api/media/upload", response_model=MediaUpload)
async def upload_media(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: str = Form(''),
    genre: str = Form(''),
    rating: str = Form('TV-G'),
    targetAudience: str = Form(''),
    transcription: Optional[str] = Form(None),
    regions: str = Form(''),
    tags: str = Form(''),
) -> Dict[str, object]:
    file_bytes = await file.read()
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    metadata = {
        "description": description,
        "genre": _split_list(genre),
        "rating": rating,
        "transcription": transcription,
        "targetAudience": _split_list(targetAudience),
        "regions": _split_list(regions),
        "tags": _split_list(tags),
    }
    media = {
        "title": title or file.filename,
        "fileName": file.filename,
        "fileSize": len(file_bytes),
        "duration": 0,
        "status": "ready",
        "uploadProgress": 100,
        "transcodingProgress": 100,
        "metadata": metadata,
        "uploadedAt": now,
    }
    created = storage.create_media(media)
    storage.create_media_file({
        "media_id": created["id"],
        "file_name": file.filename,
        "content_type": file.content_type,
        "size": len(file_bytes),
        "blob": file_bytes,
        "created_at": now,
    })
    return created


@app.patch("/api/media/{media_id}", response_model=MediaUpload)
def update_media(media_id: str, payload: MediaUpdateRequest) -> Dict[str, object]:
    updated = storage.update_media(media_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Media not found")
    return updated


@app.delete("/api/media/{media_id}")
def delete_media(media_id: str) -> Dict[str, str]:
    storage.delete_media(media_id)
    return {"status": "deleted"}


@app.get("/api/admin/daily-analytics")
def get_daily_analytics() -> List[Dict[str, object]]:
    return storage.list_daily_analytics()


@app.get("/api/admin/monthly-summary")
def get_monthly_summary() -> List[Dict[str, object]]:
    return storage.list_monthly_summary()


@app.get("/api/admin/users")
def get_users() -> List[Dict[str, object]]:
    return storage.list_users()


@app.post("/api/admin/users")
def create_user(payload: UserCreateRequest) -> Dict[str, object]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    user = {
        "email": payload.email,
        "full_name": payload.full_name,
        "role": payload.role,
        "assigned_channels": payload.assigned_channels or [],
        "is_active": True,
        "created_at": now,
        "last_login": None,
    }
    return storage.create_user(user)


@app.patch("/api/admin/users/{user_id}")
def update_user(user_id: str, payload: UserUpdateRequest) -> Dict[str, object]:
    updated = storage.update_user(user_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> Dict[str, object]:
    user = storage.get_user_by_email(payload.email)
    if not user or not user.get("is_active"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    updated = storage.update_user(
        user["id"],
        {"last_login": datetime.datetime.now(datetime.timezone.utc).isoformat()},
    )
    return {"user": updated or user}


@app.post("/api/auth/signup")
def signup(payload: SignupRequest) -> Dict[str, object]:
    existing = storage.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    user = {
        "email": payload.email,
        "full_name": payload.full_name,
        "role": payload.role,
        "assigned_channels": [],
        "is_active": True,
        "created_at": now,
        "last_login": None,
    }
    return {"user": storage.create_user(user)}
