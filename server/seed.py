from __future__ import annotations

import datetime
import json
from typing import List, Dict

from .db import execute, fetch_one, json_dump
from .seed_data import (
    seed_contents,
    seed_channels,
    seed_channel_metrics,
    seed_media_uploads,
    seed_self_heal_logs,
    seed_users,
    seed_daily_analytics,
    seed_monthly_summary,
    build_week_schedule,
)


def _table_empty(table: str) -> bool:
    row = fetch_one(f"SELECT COUNT(*) AS count FROM {table}")
    return row is not None and row["count"] == 0


def seed_db() -> None:
    contents = seed_contents()
    if _table_empty("contents"):
        for c in contents:
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
                    c["id"],
                    c["title"],
                    c["type"],
                    json_dump(c["genre"]),
                    json_dump(c["subgenre"]),
                    json_dump(c["mood"]),
                    c["rating"],
                    c["duration"],
                    c["description"],
                    json_dump(c["embedding"]),
                    c["rightsStart"],
                    c["rightsEnd"],
                    json_dump(c["regions"]),
                    json_dump(c["seasonalTags"]),
                    json_dump(c["targetAudience"]),
                    c["adBreakCount"],
                    c["completionRate"],
                    c["avgWatchDuration"],
                    c.get("thumbnailUrl"),
                    c.get("status"),
                    c.get("uploadDate"),
                    c.get("fileSize"),
                    c.get("transcodingStatus"),
                ),
            )

    if _table_empty("channels"):
        for ch in seed_channels():
            execute(
                """
                INSERT INTO channels (
                    id, name, target_audience, primary_genre, rating_limit, ad_load_minutes,
                    operating_hours, logo, color, status, viewer_count, retention, growth
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ch["id"],
                    ch["name"],
                    ch["targetAudience"],
                    ch["primaryGenre"],
                    ch["ratingLimit"],
                    ch["adLoadMinutes"],
                    ch["operatingHours"],
                    ch.get("logo"),
                    ch.get("color"),
                    ch["status"],
                    ch.get("viewerCount"),
                    ch.get("retention"),
                    ch.get("growth"),
                ),
            )

    if _table_empty("channel_metrics"):
        metrics = seed_channel_metrics()
        for channel_id, data in metrics.items():
            execute(
                """
                INSERT INTO channel_metrics (
                    channel_id, top_programs, peak_time, audience_count, ad_watch_time, weekly_retention,
                    weekly_growth, avg_view_duration, top_genre, top_region, completion_rate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    channel_id,
                    json_dump(data["topPrograms"]),
                    data["peakTime"],
                    data["audienceCount"],
                    data["adWatchTime"],
                    data["weeklyRetention"],
                    data["weeklyGrowth"],
                    data["avgViewDuration"],
                    data["topGenre"],
                    data["topRegion"],
                    data["completionRate"],
                ),
            )

    if _table_empty("week_schedules"):
        schedule_list = build_week_schedule(contents)
        for entry in schedule_list:
            schedule_id = f"schedule-{entry['date']}"
            execute(
                """
                INSERT INTO week_schedules (
                    id, channel_id, day, date, total_hours, avg_retention, conflicts
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    schedule_id,
                    "channel-001",
                    entry["day"],
                    entry["date"],
                    entry["totalHours"],
                    entry["avgRetention"],
                    entry["conflicts"],
                ),
            )
            for slot in entry["slots"]:
                execute(
                    """
                    INSERT INTO schedule_slots (
                        id, schedule_id, content_id, start_time, end_time, predicted_retention,
                        predicted_dropoff, confidence, status, transition_risk, day, is_edited
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        slot["id"],
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
                for ad in slot["adBreaks"]:
                    execute(
                        """
                        INSERT INTO ad_breaks (
                            id, slot_id, position, duration, predicted_impressions, predicted_completion_rate, type
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            ad["id"],
                            slot["id"],
                            ad["position"],
                            ad["duration"],
                            ad["predictedImpressions"],
                            ad["predictedCompletionRate"],
                            ad["type"],
                        ),
                    )

    if _table_empty("media_uploads"):
        for media in seed_media_uploads():
            execute(
                """
                INSERT INTO media_uploads (
                    id, title, file_name, file_size, duration, status, upload_progress,
                    transcoding_progress, metadata, uploaded_at, thumbnail_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    media["id"],
                    media["title"],
                    media["fileName"],
                    media["fileSize"],
                    media["duration"],
                    media["status"],
                    media["uploadProgress"],
                    media["transcodingProgress"],
                    json_dump(media["metadata"]),
                    media["uploadedAt"],
                    media.get("thumbnailUrl"),
                ),
            )

    if _table_empty("self_heal_logs"):
        for log in seed_self_heal_logs():
            execute(
                """
                INSERT INTO self_heal_logs (
                    id, timestamp, original_content_id, original_title, replacement_content_id,
                    replacement_title, similarity_score, reason, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    log["id"],
                    log["timestamp"],
                    log["originalContentId"],
                    log["originalTitle"],
                    log["replacementContentId"],
                    log["replacementTitle"],
                    log["similarityScore"],
                    log["reason"],
                    log["status"],
                ),
            )

    if _table_empty("user_profiles"):
        for user in seed_users():
            execute(
                """
                INSERT INTO user_profiles (
                    id, email, full_name, role, avatar_url, assigned_channels, is_active, created_at, last_login
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    user["email"],
                    user["full_name"],
                    user["role"],
                    user.get("avatar_url"),
                    json_dump(user.get("assigned_channels", [])),
                    1 if user.get("is_active", True) else 0,
                    user.get("created_at"),
                    user.get("last_login"),
                ),
            )

    if _table_empty("admin_daily_analytics"):
        for row in seed_daily_analytics():
            execute(
                """
                INSERT INTO admin_daily_analytics (
                    id, channel_id, date, total_viewers, avg_retention, total_watch_time_hours,
                    ad_impressions, ad_revenue, unique_viewers, peak_concurrent_viewers
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    row["id"],
                    row["channel_id"],
                    row["date"],
                    row["total_viewers"],
                    row["avg_retention"],
                    row["total_watch_time_hours"],
                    row["ad_impressions"],
                    row["ad_revenue"],
                    row["unique_viewers"],
                    row["peak_concurrent_viewers"],
                ),
            )

    if _table_empty("admin_monthly_summary"):
        for row in seed_monthly_summary():
            execute(
                """
                INSERT INTO admin_monthly_summary (
                    id, channel_id, month, total_revenue, total_viewers, avg_retention, growth_percentage
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    row["id"],
                    row["channel_id"],
                    row["month"],
                    row["total_revenue"],
                    row["total_viewers"],
                    row["avg_retention"],
                    row["growth_percentage"],
                ),
            )
