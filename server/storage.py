from __future__ import annotations

import json
import uuid
from typing import Dict, List, Optional

from .db import fetch_all, fetch_one, execute, json_dump, json_load


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def list_contents() -> List[Dict[str, object]]:
    rows = fetch_all("SELECT * FROM contents ORDER BY title")
    return [_row_to_content(r) for r in rows]


def get_content(content_id: str) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM contents WHERE id = ?", (content_id,))
    return _row_to_content(row) if row else None


def create_content(payload: Dict[str, object]) -> Dict[str, object]:
    content_id = payload.get("id") or _new_id("content")
    payload = {**payload, "id": content_id}
    execute(
        """
        INSERT INTO contents (
            id, title, type, genre, subgenre, mood, rating, duration, description, embedding,
            rights_start, rights_end, regions, seasonal_tags, target_audience, ad_break_count,
            completion_rate, avg_watch_duration, thumbnail_url, status, upload_date, file_size,
            transcoding_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["id"],
            payload["title"],
            payload["type"],
            json_dump(payload["genre"]),
            json_dump(payload["subgenre"]),
            json_dump(payload["mood"]),
            payload["rating"],
            payload["duration"],
            payload["description"],
            json_dump(payload["embedding"]),
            payload["rightsStart"],
            payload["rightsEnd"],
            json_dump(payload["regions"]),
            json_dump(payload["seasonalTags"]),
            json_dump(payload["targetAudience"]),
            payload["adBreakCount"],
            payload["completionRate"],
            payload["avgWatchDuration"],
            payload.get("thumbnailUrl"),
            payload.get("status"),
            payload.get("uploadDate"),
            payload.get("fileSize"),
            payload.get("transcodingStatus"),
        ),
    )
    return payload


def update_content(content_id: str, updates: Dict[str, object]) -> Optional[Dict[str, object]]:
    existing = get_content(content_id)
    if not existing:
        return None
    merged = {**existing, **updates}
    execute(
        """
        UPDATE contents SET
            title = ?,
            type = ?,
            genre = ?,
            subgenre = ?,
            mood = ?,
            rating = ?,
            duration = ?,
            description = ?,
            embedding = ?,
            rights_start = ?,
            rights_end = ?,
            regions = ?,
            seasonal_tags = ?,
            target_audience = ?,
            ad_break_count = ?,
            completion_rate = ?,
            avg_watch_duration = ?,
            thumbnail_url = ?,
            status = ?,
            upload_date = ?,
            file_size = ?,
            transcoding_status = ?
        WHERE id = ?
        """,
        (
            merged["title"],
            merged["type"],
            json_dump(merged["genre"]),
            json_dump(merged["subgenre"]),
            json_dump(merged["mood"]),
            merged["rating"],
            merged["duration"],
            merged["description"],
            json_dump(merged["embedding"]),
            merged["rightsStart"],
            merged["rightsEnd"],
            json_dump(merged["regions"]),
            json_dump(merged["seasonalTags"]),
            json_dump(merged["targetAudience"]),
            merged["adBreakCount"],
            merged["completionRate"],
            merged["avgWatchDuration"],
            merged.get("thumbnailUrl"),
            merged.get("status"),
            merged.get("uploadDate"),
            merged.get("fileSize"),
            merged.get("transcodingStatus"),
            content_id,
        ),
    )
    return merged


def delete_content(content_id: str) -> bool:
    execute("DELETE FROM contents WHERE id = ?", (content_id,))
    return True


def list_channels() -> List[Dict[str, object]]:
    rows = fetch_all("SELECT * FROM channels ORDER BY name")
    return [_row_to_channel(r) for r in rows]


def get_channel(channel_id: str) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM channels WHERE id = ?", (channel_id,))
    return _row_to_channel(row) if row else None


def list_channel_metrics() -> Dict[str, Dict[str, object]]:
    rows = fetch_all("SELECT * FROM channel_metrics")
    data: Dict[str, Dict[str, object]] = {}
    for row in rows:
        channel_id = row["channel_id"]
        data[channel_id] = _row_to_channel_metrics(row)
    return data


def get_channel_metrics(channel_id: str) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM channel_metrics WHERE channel_id = ?", (channel_id,))
    return _row_to_channel_metrics(row) if row else None


def list_week_schedule(channel_id: str) -> List[Dict[str, object]]:
    schedule_rows = fetch_all(
        "SELECT * FROM week_schedules WHERE channel_id = ? ORDER BY date",
        (channel_id,),
    )
    schedules: List[Dict[str, object]] = []
    for schedule_row in schedule_rows:
        schedule_id = schedule_row["id"]
        slot_rows = fetch_all(
            "SELECT * FROM schedule_slots WHERE schedule_id = ? ORDER BY start_time",
            (schedule_id,),
        )
        slots: List[Dict[str, object]] = []
        for slot_row in slot_rows:
            ad_rows = fetch_all(
                "SELECT * FROM ad_breaks WHERE slot_id = ? ORDER BY position",
                (slot_row["id"],),
            )
            slot = _row_to_slot(slot_row)
            slot["adBreaks"] = [_row_to_ad_break(r) for r in ad_rows]
            slots.append(slot)
        schedules.append(
            {
                "day": schedule_row["day"],
                "date": schedule_row["date"],
                "slots": slots,
                "totalHours": schedule_row["total_hours"],
                "avgRetention": schedule_row["avg_retention"],
                "conflicts": schedule_row["conflicts"],
            }
        )
    return schedules


def update_slot(slot_id: str, updates: Dict[str, object]) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM schedule_slots WHERE id = ?", (slot_id,))
    if not row:
        return None
    merged = _row_to_slot(row)
    merged.update(updates)
    execute(
        """
        UPDATE schedule_slots SET
            content_id = ?,
            start_time = ?,
            end_time = ?,
            predicted_retention = ?,
            predicted_dropoff = ?,
            confidence = ?,
            status = ?,
            transition_risk = ?,
            day = ?,
            is_edited = ?
        WHERE id = ?
        """,
        (
            merged["contentId"],
            merged["startTime"],
            merged["endTime"],
            merged["predictedRetention"],
            merged["predictedDropoff"],
            merged["confidence"],
            merged["status"],
            merged["transitionRisk"],
            merged["day"],
            1 if merged.get("isEdited") else 0,
            slot_id,
        ),
    )
    return merged


def create_manual_slot(channel_id: str, slot: Dict[str, object]) -> Dict[str, object]:
    schedule_row = fetch_one(
        "SELECT * FROM week_schedules WHERE channel_id = ? AND date = ?",
        (channel_id, slot["day"]),
    )
    if not schedule_row:
        schedule_id = _new_id("schedule")
        execute(
            "INSERT INTO week_schedules (id, channel_id, day, date, total_hours, avg_retention, conflicts) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                schedule_id,
                channel_id,
                "Custom",
                slot["day"],
                0,
                slot.get("predictedRetention", 0),
                0,
            ),
        )
    else:
        schedule_id = schedule_row["id"]

    slot_id = slot.get("id") or _new_id("slot")
    execute(
        """
        INSERT INTO schedule_slots (
            id, schedule_id, content_id, start_time, end_time, predicted_retention,
            predicted_dropoff, confidence, status, transition_risk, day, is_edited
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            slot_id,
            schedule_id,
            slot["contentId"],
            slot["startTime"],
            slot["endTime"],
            slot["predictedRetention"],
            slot["predictedDropoff"],
            slot["confidence"],
            slot["status"],
            slot["transitionRisk"],
            slot["day"],
            1 if slot.get("isEdited") else 0,
        ),
    )
    for ad in slot.get("adBreaks", []):
        execute(
            """
            INSERT INTO ad_breaks (id, slot_id, position, duration, predicted_impressions, predicted_completion_rate, type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ad.get("id") or _new_id("ad"),
                slot_id,
                ad["position"],
                ad["duration"],
                ad["predictedImpressions"],
                ad["predictedCompletionRate"],
                ad["type"],
            ),
        )
    slot["id"] = slot_id
    return slot


def list_media() -> List[Dict[str, object]]:
    rows = fetch_all("SELECT * FROM media_uploads ORDER BY uploaded_at DESC")
    return [_row_to_media(r) for r in rows]


def get_media(media_id: str) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM media_uploads WHERE id = ?", (media_id,))
    return _row_to_media(row) if row else None


def create_media(payload: Dict[str, object]) -> Dict[str, object]:
    media_id = payload.get("id") or _new_id("media")
    payload = {**payload, "id": media_id}
    execute(
        """
        INSERT INTO media_uploads (
            id, title, file_name, file_size, duration, status, upload_progress,
            transcoding_progress, metadata, uploaded_at, thumbnail_url,
            transcription, transcription_source, analytics_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["id"],
            payload["title"],
            payload["fileName"],
            payload["fileSize"],
            payload["duration"],
            payload["status"],
            payload["uploadProgress"],
            payload["transcodingProgress"],
            json_dump(payload["metadata"]),
            payload["uploadedAt"],
            payload.get("thumbnailUrl"),
            payload.get("transcription"),
            payload.get("transcriptionSource"),
            json_dump(payload.get("analyticsData")) if payload.get("analyticsData") is not None else None,
        ),
    )
    return payload


def create_media_file(payload: Dict[str, object]) -> Dict[str, object]:
    file_id = payload.get("id") or _new_id("mediafile")
    payload = {**payload, "id": file_id}
    execute(
        """
        INSERT INTO media_files (
            id, media_id, file_name, content_type, size, blob, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["id"],
            payload["media_id"],
            payload["file_name"],
            payload.get("content_type"),
            payload.get("size"),
            payload.get("blob"),
            payload.get("created_at"),
        ),
    )
    return payload


def get_media_file(media_id: str) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM media_files WHERE media_id = ?", (media_id,))
    if not row:
        return None
    return {
        "id": row["id"],
        "media_id": row["media_id"],
        "file_name": row["file_name"],
        "content_type": row["content_type"],
        "size": row["size"],
        "blob": row["blob"],
        "created_at": row["created_at"],
    }


def update_media(media_id: str, updates: Dict[str, object]) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM media_uploads WHERE id = ?", (media_id,))
    if not row:
        return None
    merged = _row_to_media(row)
    merged.update({k: v for k, v in updates.items() if v is not None})
    execute(
        """
        UPDATE media_uploads SET
            title = ?,
            file_name = ?,
            file_size = ?,
            duration = ?,
            status = ?,
            upload_progress = ?,
            transcoding_progress = ?,
            metadata = ?,
            uploaded_at = ?,
            thumbnail_url = ?,
            transcription = ?,
            transcription_source = ?,
            analytics_data = ?
        WHERE id = ?
        """,
        (
            merged["title"],
            merged["fileName"],
            merged["fileSize"],
            merged["duration"],
            merged["status"],
            merged["uploadProgress"],
            merged["transcodingProgress"],
            json_dump(merged["metadata"]),
            merged["uploadedAt"],
            merged.get("thumbnailUrl"),
            merged.get("transcription"),
            merged.get("transcriptionSource"),
            json_dump(merged.get("analyticsData")) if merged.get("analyticsData") is not None else None,
            media_id,
        ),
    )
    return merged


def _normalize_media_title(value: str) -> str:
    return " ".join(value.lower().split())


def import_program_analytics(programs: List[Dict[str, object]]) -> Dict[str, object]:
    rows = fetch_all("SELECT * FROM media_uploads")
    media_by_title = {
        _normalize_media_title(row["title"]): _row_to_media(row)
        for row in rows
    }

    updated_programs: List[Dict[str, object]] = []
    unmatched_programs: List[str] = []

    for program in programs:
        title = str(program.get("program_title") or "").strip()
        if not title:
            continue
        normalized = _normalize_media_title(title)
        media = media_by_title.get(normalized)
        if not media:
            unmatched_programs.append(title)
            continue

        analytics_payload = {**program}
        merged = {**media, "analyticsData": analytics_payload}
        update_media(media["id"], {"analyticsData": analytics_payload})
        media_by_title[normalized] = merged
        updated_programs.append({"mediaId": media["id"], "title": media["title"]})

    return {
        "updatedCount": len(updated_programs),
        "updatedPrograms": updated_programs,
        "unmatchedPrograms": unmatched_programs,
    }


def delete_media(media_id: str) -> bool:
    execute("DELETE FROM media_files WHERE media_id = ?", (media_id,))
    execute("DELETE FROM media_uploads WHERE id = ?", (media_id,))
    return True


def list_self_heal_logs() -> List[Dict[str, object]]:
    rows = fetch_all("SELECT * FROM self_heal_logs ORDER BY timestamp DESC")
    return [_row_to_self_heal(r) for r in rows]


def insert_self_heal_log(payload: Dict[str, object]) -> Dict[str, object]:
    log_id = payload.get("id") or _new_id("heal")
    payload = {**payload, "id": log_id}
    execute(
        """
        INSERT INTO self_heal_logs (
            id, timestamp, original_content_id, original_title, replacement_content_id,
            replacement_title, similarity_score, reason, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["id"],
            payload["timestamp"],
            payload["originalContentId"],
            payload["originalTitle"],
            payload["replacementContentId"],
            payload["replacementTitle"],
            payload["similarityScore"],
            payload["reason"],
            payload["status"],
        ),
    )
    return payload


def list_daily_analytics() -> List[Dict[str, object]]:
    rows = fetch_all("SELECT * FROM admin_daily_analytics ORDER BY date DESC")
    return [dict(r) for r in rows]


def list_monthly_summary() -> List[Dict[str, object]]:
    rows = fetch_all("SELECT * FROM admin_monthly_summary ORDER BY month DESC")
    return [dict(r) for r in rows]


def list_users() -> List[Dict[str, object]]:
    rows = fetch_all("SELECT * FROM user_profiles ORDER BY created_at DESC")
    return [_row_to_user(r) for r in rows]


def get_user_by_email(email: str) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM user_profiles WHERE email = ?", (email,))
    return _row_to_user(row) if row else None


def create_user(payload: Dict[str, object]) -> Dict[str, object]:
    user_id = payload.get("id") or _new_id("user")
    payload = {**payload, "id": user_id}
    execute(
        """
        INSERT INTO user_profiles (
            id, email, full_name, role, avatar_url, assigned_channels, is_active, created_at, last_login
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["id"],
            payload["email"],
            payload["full_name"],
            payload["role"],
            payload.get("avatar_url"),
            json_dump(payload.get("assigned_channels", [])),
            1 if payload.get("is_active", True) else 0,
            payload.get("created_at"),
            payload.get("last_login"),
        ),
    )
    return payload


def update_user(user_id: str, updates: Dict[str, object]) -> Optional[Dict[str, object]]:
    row = fetch_one("SELECT * FROM user_profiles WHERE id = ?", (user_id,))
    if not row:
        return None
    merged = _row_to_user(row)
    merged.update({k: v for k, v in updates.items() if v is not None})
    execute(
        """
        UPDATE user_profiles SET
            email = ?,
            full_name = ?,
            role = ?,
            avatar_url = ?,
            assigned_channels = ?,
            is_active = ?,
            created_at = ?,
            last_login = ?
        WHERE id = ?
        """,
        (
            merged["email"],
            merged["full_name"],
            merged["role"],
            merged.get("avatar_url"),
            json_dump(merged.get("assigned_channels", [])),
            1 if merged.get("is_active") else 0,
            merged.get("created_at"),
            merged.get("last_login"),
            user_id,
        ),
    )
    return merged


def _row_to_content(row) -> Dict[str, object]:
    if row is None:
        return {}
    return {
        "id": row["id"],
        "title": row["title"],
        "type": row["type"],
        "genre": json_load(row["genre"]) or [],
        "subgenre": json_load(row["subgenre"]) or [],
        "mood": json_load(row["mood"]) or [],
        "rating": row["rating"],
        "duration": row["duration"],
        "description": row["description"],
        "embedding": json_load(row["embedding"]) or [],
        "rightsStart": row["rights_start"],
        "rightsEnd": row["rights_end"],
        "regions": json_load(row["regions"]) or [],
        "seasonalTags": json_load(row["seasonal_tags"]) or [],
        "targetAudience": json_load(row["target_audience"]) or [],
        "adBreakCount": row["ad_break_count"],
        "completionRate": row["completion_rate"],
        "avgWatchDuration": row["avg_watch_duration"],
        "thumbnailUrl": row["thumbnail_url"],
        "status": row["status"],
        "uploadDate": row["upload_date"],
        "fileSize": row["file_size"],
        "transcodingStatus": row["transcoding_status"],
    }


def _row_to_channel(row) -> Dict[str, object]:
    if row is None:
        return {}
    return {
        "id": row["id"],
        "name": row["name"],
        "targetAudience": row["target_audience"],
        "primaryGenre": row["primary_genre"],
        "ratingLimit": row["rating_limit"],
        "adLoadMinutes": row["ad_load_minutes"],
        "operatingHours": row["operating_hours"],
        "logo": row["logo"],
        "color": row["color"],
        "status": row["status"],
        "viewerCount": row["viewer_count"],
        "retention": row["retention"],
        "growth": row["growth"],
    }


def _row_to_channel_metrics(row) -> Dict[str, object]:
    if row is None:
        return {}
    return {
        "channelId": row["channel_id"],
        "topPrograms": json_load(row["top_programs"]) or [],
        "peakTime": row["peak_time"],
        "audienceCount": row["audience_count"],
        "adWatchTime": row["ad_watch_time"],
        "weeklyRetention": row["weekly_retention"],
        "weeklyGrowth": row["weekly_growth"],
        "avgViewDuration": row["avg_view_duration"],
        "topGenre": row["top_genre"],
        "topRegion": row["top_region"],
        "completionRate": row["completion_rate"],
    }


def _row_to_slot(row) -> Dict[str, object]:
    return {
        "id": row["id"],
        "contentId": row["content_id"],
        "startTime": row["start_time"],
        "endTime": row["end_time"],
        "predictedRetention": row["predicted_retention"],
        "predictedDropoff": row["predicted_dropoff"],
        "confidence": row["confidence"],
        "adBreaks": [],
        "status": row["status"],
        "transitionRisk": row["transition_risk"],
        "day": row["day"],
        "isEdited": bool(row["is_edited"]) if row["is_edited"] is not None else None,
    }


def _row_to_ad_break(row) -> Dict[str, object]:
    return {
        "id": row["id"],
        "position": row["position"],
        "duration": row["duration"],
        "predictedImpressions": row["predicted_impressions"],
        "predictedCompletionRate": row["predicted_completion_rate"],
        "type": row["type"],
    }


def _row_to_media(row) -> Dict[str, object]:
    return {
        "id": row["id"],
        "title": row["title"],
        "fileName": row["file_name"],
        "fileSize": row["file_size"],
        "duration": int(row["duration"]) if row["duration"] is not None else None,
        "status": row["status"],
        "uploadProgress": row["upload_progress"],
        "transcodingProgress": row["transcoding_progress"],
        "metadata": json_load(row["metadata"]) or {},
        "uploadedAt": row["uploaded_at"],
        "thumbnailUrl": row["thumbnail_url"],
        "transcription": row["transcription"],
        "transcriptionSource": row["transcription_source"],
        "analyticsData": json_load(row["analytics_data"]) if "analytics_data" in row.keys() else None,
    }


def _row_to_self_heal(row) -> Dict[str, object]:
    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "originalContentId": row["original_content_id"],
        "originalTitle": row["original_title"],
        "replacementContentId": row["replacement_content_id"],
        "replacementTitle": row["replacement_title"],
        "similarityScore": row["similarity_score"],
        "reason": row["reason"],
        "status": row["status"],
    }


def _row_to_user(row) -> Dict[str, object]:
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "avatar_url": row["avatar_url"],
        "assigned_channels": json_load(row["assigned_channels"]) or [],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "last_login": row["last_login"],
    }
