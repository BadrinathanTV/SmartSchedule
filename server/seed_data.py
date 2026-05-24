from __future__ import annotations

import random
from typing import List, Dict

from .models import AdBreak, ScheduleSlot


def seed_contents() -> List[Dict[str, object]]:
    return [
        {
            "id": "content-001",
            "title": "Northern Exposure",
            "type": "series",
            "genre": ["Drama", "Mystery"],
            "subgenre": ["Thriller", "Crime"],
            "mood": ["Tense", "Atmospheric"],
            "rating": "TV-14",
            "duration": 42,
            "description": "A remote Alaskan town harbors dark secrets beneath its serene surface.",
            "embedding": [0.82, 0.45, 0.33, 0.67, 0.89, 0.12, 0.78, 0.56],
            "rightsStart": "2024-01-01",
            "rightsEnd": "2026-12-31",
            "regions": ["US", "CA", "UK"],
            "seasonalTags": ["winter", "holiday"],
            "targetAudience": ["adults 25-54"],
            "adBreakCount": 4,
            "completionRate": 78,
            "avgWatchDuration": 32,
            "status": "available",
        },
        {
            "id": "content-002",
            "title": "Family Matters",
            "type": "series",
            "genre": ["Comedy", "Family"],
            "subgenre": ["Sitcom", "Slapstick"],
            "mood": ["Light", "Upbeat"],
            "rating": "TV-G",
            "duration": 22,
            "description": "Wacky family adventures in suburban Chicago.",
            "embedding": [0.22, 0.89, 0.67, 0.12, 0.34, 0.91, 0.23, 0.45],
            "rightsStart": "2024-01-01",
            "rightsEnd": "2025-06-30",
            "regions": ["US", "CA", "MX"],
            "seasonalTags": ["summer"],
            "targetAudience": ["families", "kids 6-12"],
            "adBreakCount": 3,
            "completionRate": 72,
            "avgWatchDuration": 18,
            "status": "scheduled",
        },
        {
            "id": "content-003",
            "title": "The Grand Hotel",
            "type": "series",
            "genre": ["Drama", "Romance"],
            "subgenre": ["Period", "Mystery"],
            "mood": ["Romantic", "Dramatic"],
            "rating": "TV-PG",
            "duration": 45,
            "description": "Romance and intrigue at a luxurious coastal hotel in 1920s Spain.",
            "embedding": [0.56, 0.78, 0.45, 0.34, 0.67, 0.89, 0.45, 0.23],
            "rightsStart": "2024-03-01",
            "rightsEnd": "2026-03-01",
            "regions": ["US", "UK", "EU"],
            "seasonalTags": ["spring"],
            "targetAudience": ["adults 35-54", "seniors"],
            "adBreakCount": 5,
            "completionRate": 81,
            "avgWatchDuration": 38,
            "status": "available",
        },
        {
            "id": "content-004",
            "title": "Christmas in Evergreen",
            "type": "movie",
            "genre": ["Romance", "Holiday"],
            "subgenre": ["Christmas", "Rom-Com"],
            "mood": ["Heartwarming", "Festive"],
            "rating": "TV-G",
            "duration": 84,
            "description": "A small-town romance blossoms during the holiday season.",
            "embedding": [0.12, 0.95, 0.23, 0.67, 0.45, 0.78, 0.34, 0.56],
            "rightsStart": "2024-10-01",
            "rightsEnd": "2025-01-31",
            "regions": ["US", "CA"],
            "seasonalTags": ["christmas", "winter", "holiday"],
            "targetAudience": ["adults 25-54", "families"],
            "adBreakCount": 6,
            "completionRate": 85,
            "avgWatchDuration": 72,
            "status": "live",
        },
        {
            "id": "content-005",
            "title": "Winter Wonderland",
            "type": "special",
            "genre": ["Holiday", "Music"],
            "subgenre": ["Christmas", "Musical"],
            "mood": ["Festive", "Joyful"],
            "rating": "TV-G",
            "duration": 90,
            "description": "Musical performances celebrating the holiday season.",
            "embedding": [0.23, 0.87, 0.12, 0.78, 0.56, 0.67, 0.45, 0.89],
            "rightsStart": "2024-11-01",
            "rightsEnd": "2025-01-15",
            "regions": ["US", "CA", "UK"],
            "seasonalTags": ["christmas", "winter"],
            "targetAudience": ["all ages"],
            "adBreakCount": 5,
            "completionRate": 76,
            "avgWatchDuration": 65,
            "status": "scheduled",
        },
        {
            "id": "content-006",
            "title": "Tech Innovators",
            "type": "series",
            "genre": ["Documentary", "Tech"],
            "subgenre": ["Business", "Science"],
            "mood": ["Inspiring", "Informative"],
            "rating": "TV-PG",
            "duration": 48,
            "description": "Behind the scenes of Silicon Valley breakthrough.",
            "embedding": [0.78, 0.34, 0.89, 0.23, 0.12, 0.45, 0.67, 0.89],
            "rightsStart": "2024-01-01",
            "rightsEnd": "2025-12-31",
            "regions": ["US", "UK", "EU", "APAC"],
            "seasonalTags": [],
            "targetAudience": ["adults 18-49", "professionals"],
            "adBreakCount": 4,
            "completionRate": 68,
            "avgWatchDuration": 35,
            "status": "available",
        },
        {
            "id": "content-007",
            "title": "Kitchen Championship",
            "type": "series",
            "genre": ["Reality", "Food"],
            "subgenre": ["Competition", "Cooking"],
            "mood": ["Exciting", "Competitive"],
            "rating": "TV-PG",
            "duration": 42,
            "description": "Top chefs compete for culinary glory.",
            "embedding": [0.45, 0.67, 0.34, 0.89, 0.56, 0.23, 0.78, 0.12],
            "rightsStart": "2024-01-01",
            "rightsEnd": "2026-06-30",
            "regions": ["US", "CA", "UK", "AU"],
            "seasonalTags": [],
            "targetAudience": ["adults 25-54"],
            "adBreakCount": 5,
            "completionRate": 74,
            "avgWatchDuration": 30,
            "status": "available",
        },
        {
            "id": "content-008",
            "title": "Nature Unleashed",
            "type": "series",
            "genre": ["Documentary", "Nature"],
            "subgenre": ["Wildlife", "Adventure"],
            "mood": ["Awe-inspiring", "Dramatic"],
            "rating": "TV-G",
            "duration": 50,
            "description": "Stunning footage of Earth most powerful natural phenomena.",
            "embedding": [0.67, 0.23, 0.45, 0.78, 0.89, 0.34, 0.12, 0.56],
            "rightsStart": "2024-01-01",
            "rightsEnd": "2027-12-31",
            "regions": ["global"],
            "seasonalTags": [],
            "targetAudience": ["all ages", "nature lovers"],
            "adBreakCount": 4,
            "completionRate": 82,
            "avgWatchDuration": 42,
            "status": "available",
        },
    ]


def seed_channels() -> List[Dict[str, object]]:
    return [
        {
            "id": "channel-001",
            "name": "Holiday Hits FAST",
            "targetAudience": "families, adults 25-54",
            "primaryGenre": "Holiday",
            "ratingLimit": "TV-PG",
            "adLoadMinutes": 12,
            "operatingHours": "06:00-24:00",
            "color": "#10b981",
            "status": "active",
            "viewerCount": 456000,
            "retention": 78,
            "growth": 12,
        },
        {
            "id": "channel-002",
            "name": "Action Cinema",
            "targetAudience": "adults 18-49",
            "primaryGenre": "Action",
            "ratingLimit": "TV-14",
            "adLoadMinutes": 10,
            "operatingHours": "00:00-24:00",
            "color": "#f59e0b",
            "status": "active",
            "viewerCount": 389000,
            "retention": 72,
            "growth": 8,
        },
        {
            "id": "channel-003",
            "name": "Family Fun",
            "targetAudience": "families, all ages",
            "primaryGenre": "Family",
            "ratingLimit": "TV-G",
            "adLoadMinutes": 8,
            "operatingHours": "06:00-22:00",
            "color": "#ec4899",
            "status": "active",
            "viewerCount": 312000,
            "retention": 81,
            "growth": -2,
        },
        {
            "id": "channel-004",
            "name": "Documentary Central",
            "targetAudience": "adults 35-65",
            "primaryGenre": "Documentary",
            "ratingLimit": "TV-PG",
            "adLoadMinutes": 9,
            "operatingHours": "00:00-24:00",
            "color": "#6366f1",
            "status": "active",
            "viewerCount": 267000,
            "retention": 85,
            "growth": 15,
        },
        {
            "id": "channel-005",
            "name": "Sports Highlights",
            "targetAudience": "sports fans 18-49",
            "primaryGenre": "Sports",
            "ratingLimit": "TV-PG",
            "adLoadMinutes": 11,
            "operatingHours": "06:00-24:00",
            "color": "#14b8a6",
            "status": "maintenance",
            "viewerCount": 189000,
            "retention": 68,
            "growth": -5,
        },
    ]


def seed_channel_metrics() -> Dict[str, Dict[str, object]]:
    return {
        "channel-001": {
            "channelId": "channel-001",
            "topPrograms": [
                {
                    "id": "p1",
                    "title": "Christmas in Evergreen",
                    "rating": 4.8,
                    "viewers": 456000,
                    "retention": 85,
                    "genre": "Holiday",
                    "airTime": "11:00 AM",
                },
                {
                    "id": "p2",
                    "title": "Winter Wonderland",
                    "rating": 4.6,
                    "viewers": 389000,
                    "retention": 82,
                    "genre": "Holiday",
                    "airTime": "12:30 PM",
                },
                {
                    "id": "p3",
                    "title": "The Grand Hotel",
                    "rating": 4.5,
                    "viewers": 312000,
                    "retention": 78,
                    "genre": "Drama",
                    "airTime": "09:00 AM",
                },
                {
                    "id": "p4",
                    "title": "Nature Unleashed",
                    "rating": 4.4,
                    "viewers": 298000,
                    "retention": 81,
                    "genre": "Documentary",
                    "airTime": "10:00 AM",
                },
                {
                    "id": "p5",
                    "title": "Kitchen Championship",
                    "rating": 4.3,
                    "viewers": 267000,
                    "retention": 74,
                    "genre": "Reality",
                    "airTime": "08:00 AM",
                },
            ],
            "peakTime": "07:00 PM - 10:00 PM",
            "audienceCount": 456000,
            "adWatchTime": 45,
            "weeklyRetention": 78,
            "weeklyGrowth": 12,
            "avgViewDuration": 42,
            "topGenre": "Holiday",
            "topRegion": "United States (78%)",
            "completionRate": 82,
        }
    }


def seed_media_uploads() -> List[Dict[str, object]]:
    return [
        {
            "id": "media-001",
            "title": "Christmas in Evergreen",
            "fileName": "christmas_evergreen_1080p.mp4",
            "fileSize": 2456000000,
            "duration": 5040,
            "status": "ready",
            "uploadProgress": 100,
            "transcodingProgress": 100,
            "metadata": {
                "description": "A small-town romance blossoms during the holiday season.",
                "genre": ["Romance", "Holiday"],
                "rating": "TV-G",
                "transcription": "Generated automatically",
                "targetAudience": ["families", "adults 25-54"],
                "regions": ["US", "CA"],
                "tags": ["christmas", "winter", "romance", "holiday"],
            },
            "uploadedAt": "2024-12-15 14:30:00",
        },
        {
            "id": "media-002",
            "title": "Winter Wonderland Special",
            "fileName": "winter_wonderland_2024.mp4",
            "fileSize": 3120000000,
            "duration": 5400,
            "status": "processing",
            "uploadProgress": 100,
            "transcodingProgress": 67,
            "metadata": {
                "description": "Musical performances celebrating the holiday season.",
                "genre": ["Holiday", "Music"],
                "rating": "TV-G",
                "targetAudience": ["all ages"],
                "regions": ["US", "CA", "UK"],
                "tags": ["christmas", "music", "special"],
            },
            "uploadedAt": "2024-12-18 09:15:00",
        },
        {
            "id": "media-003",
            "title": "Nature Documentary EP 1",
            "fileName": "nature_ep01_4k.mp4",
            "fileSize": 5600000000,
            "duration": 3000,
            "status": "ready",
            "uploadProgress": 100,
            "transcodingProgress": 100,
            "metadata": {
                "description": "Stunning footage of Earth most powerful natural phenomena.",
                "genre": ["Documentary", "Nature"],
                "rating": "TV-G",
                "targetAudience": ["all ages", "nature lovers"],
                "regions": ["global"],
                "tags": ["nature", "wildlife", "documentary"],
            },
            "uploadedAt": "2024-12-10 11:45:00",
        },
        {
            "id": "media-004",
            "title": "Tech Innovators S1E01",
            "fileName": "tech_innovators_s01e01.mp4",
            "fileSize": 1890000000,
            "duration": 2880,
            "status": "error",
            "uploadProgress": 100,
            "transcodingProgress": 45,
            "metadata": {
                "description": "Behind the scenes of Silicon Valley breakthrough.",
                "genre": ["Documentary", "Tech"],
                "rating": "TV-PG",
                "targetAudience": ["adults 18-49"],
                "regions": ["US", "EU"],
                "tags": ["tech", "documentary", "business"],
            },
            "uploadedAt": "2024-12-12 16:20:00",
        },
    ]


def seed_self_heal_logs() -> List[Dict[str, object]]:
    return [
        {
            "id": "heal-001",
            "timestamp": "2024-12-20 14:23:45",
            "originalContentId": "content-004",
            "originalTitle": "Christmas in Evergreen",
            "replacementContentId": "content-005",
            "replacementTitle": "Winter Wonderland",
            "similarityScore": 0.89,
            "reason": "Rights window expired during scheduled broadcast",
            "status": "completed",
        },
        {
            "id": "heal-002",
            "timestamp": "2024-12-20 08:45:12",
            "originalContentId": "content-005",
            "originalTitle": "Winter Wonderland",
            "replacementContentId": "content-004",
            "replacementTitle": "Christmas in Evergreen",
            "similarityScore": 0.91,
            "reason": "Technical issue: asset unavailable",
            "status": "completed",
        },
    ]


def seed_users() -> List[Dict[str, object]]:
    return [
        {
            "id": "user-admin-001",
            "email": "admin@example.com",
            "full_name": "Admin User",
            "role": "admin",
            "avatar_url": None,
            "assigned_channels": ["channel-001", "channel-002"],
            "is_active": True,
            "created_at": "2024-12-01T09:00:00Z",
            "last_login": "2024-12-20T08:00:00Z",
        },
        {
            "id": "user-emp-001",
            "email": "employee@example.com",
            "full_name": "Scheduler Employee",
            "role": "employee",
            "avatar_url": None,
            "assigned_channels": ["channel-001"],
            "is_active": True,
            "created_at": "2024-12-05T09:00:00Z",
            "last_login": "2024-12-19T10:00:00Z",
        },
    ]


def seed_daily_analytics() -> List[Dict[str, object]]:
    return [
        {
            "id": "daily-001",
            "channel_id": "channel-001",
            "date": "2024-12-23",
            "total_viewers": 456000,
            "avg_retention": 78.4,
            "total_watch_time_hours": 9200,
            "ad_impressions": 1250000,
            "ad_revenue": 235000,
            "unique_viewers": 312000,
            "peak_concurrent_viewers": 180000,
        },
        {
            "id": "daily-002",
            "channel_id": "channel-002",
            "date": "2024-12-23",
            "total_viewers": 389000,
            "avg_retention": 72.1,
            "total_watch_time_hours": 7800,
            "ad_impressions": 980000,
            "ad_revenue": 198000,
            "unique_viewers": 250000,
            "peak_concurrent_viewers": 140000,
        },
    ]


def seed_monthly_summary() -> List[Dict[str, object]]:
    return [
        {
            "id": "month-001",
            "channel_id": "channel-001",
            "month": "2024-12",
            "total_revenue": 980000,
            "total_viewers": 14500000,
            "avg_retention": 79.8,
            "growth_percentage": 12.4,
        },
        {
            "id": "month-002",
            "channel_id": "channel-002",
            "month": "2024-12",
            "total_revenue": 760000,
            "total_viewers": 12100000,
            "avg_retention": 72.5,
            "growth_percentage": 8.1,
        },
    ]


def build_week_schedule(contents: List[Dict[str, object]]) -> List[Dict[str, object]]:
    random.seed(42)
    content_ids = [c["id"] for c in contents]

    def generate_day_slots(date: str) -> List[ScheduleSlot]:
        slots: List[ScheduleSlot] = []
        current_time = 6
        for i in range(8):
            content_id = content_ids[i % len(content_ids)]
            content = next(c for c in contents if c["id"] == content_id)
            start_time = f"{current_time:02d}:00"
            end_hour = current_time + max(1, int((content["duration"] + 59) / 60))
            end_time = f"{end_hour:02d}:00"
            slot_id = f"slot-{date}-{i}"
            ad_break = AdBreak(
                id=f"ad-{date}-{i}-1",
                position=15,
                duration=180,
                predictedImpressions=150000 + random.randint(0, 90000),
                predictedCompletionRate=80 + random.randint(0, 10),
                type="midroll",
            )
            slots.append(
                ScheduleSlot(
                    id=slot_id,
                    contentId=content_id,
                    startTime=start_time,
                    endTime=end_time,
                    predictedRetention=float(content["completionRate"] - random.randint(0, 9)),
                    predictedDropoff=float(100 - content["completionRate"] + random.randint(0, 9)),
                    confidence=round(0.8 + random.random() * 0.15, 2),
                    adBreaks=[ad_break],
                    status="scheduled",
                    transitionRisk="low" if i % 3 == 0 else "medium" if i % 3 == 1 else "high",
                    day=date,
                )
            )
            current_time = end_hour
            if current_time >= 24:
                current_time = 0
        return slots

    def generate_holiday_slots(date: str) -> List[ScheduleSlot]:
        holiday_ids = ["content-004", "content-005"]
        slots: List[ScheduleSlot] = []
        current_time = 6
        for i in range(6):
            content_id = holiday_ids[i % len(holiday_ids)]
            content = next(c for c in contents if c["id"] == content_id)
            start_time = f"{current_time:02d}:00"
            end_hour = current_time + max(1, int((content["duration"] + 59) / 60))
            end_time = f"{end_hour:02d}:00"
            slot_id = f"slot-{date}-{i}"
            ad_break = AdBreak(
                id=f"ad-{date}-{i}-1",
                position=20,
                duration=180,
                predictedImpressions=350000 + random.randint(0, 100000),
                predictedCompletionRate=88 + random.randint(0, 8),
                type="midroll",
            )
            slots.append(
                ScheduleSlot(
                    id=slot_id,
                    contentId=content_id,
                    startTime=start_time,
                    endTime=end_time,
                    predictedRetention=float(85 + random.randint(0, 4)),
                    predictedDropoff=float(15 - random.randint(0, 4)),
                    confidence=round(0.9 + random.random() * 0.08, 2),
                    adBreaks=[ad_break],
                    status="scheduled",
                    transitionRisk="low",
                    day=date,
                )
            )
            current_time = end_hour
            if current_time >= 24:
                break
        return slots

    return [
        {
            "day": "Monday",
            "date": "2024-12-23",
            "totalHours": 18,
            "avgRetention": 74,
            "conflicts": 0,
            "slots": [slot.model_dump() for slot in generate_day_slots("2024-12-23")],
        },
        {
            "day": "Tuesday",
            "date": "2024-12-24",
            "totalHours": 18,
            "avgRetention": 76,
            "conflicts": 1,
            "slots": [slot.model_dump() for slot in generate_day_slots("2024-12-24")],
        },
        {
            "day": "Wednesday",
            "date": "2024-12-25",
            "totalHours": 18,
            "avgRetention": 85,
            "conflicts": 0,
            "slots": [slot.model_dump() for slot in generate_holiday_slots("2024-12-25")],
        },
    ]
