from __future__ import annotations

import json
import os
import sqlite3
from typing import Iterable, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "server.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def execute(query: str, params: Iterable[object] = ()) -> None:
    with get_connection() as conn:
        conn.execute(query, params)
        conn.commit()


def fetch_one(query: str, params: Iterable[object] = ()) -> Optional[sqlite3.Row]:
    with get_connection() as conn:
        cur = conn.execute(query, params)
        return cur.fetchone()


def fetch_all(query: str, params: Iterable[object] = ()) -> list[sqlite3.Row]:
    with get_connection() as conn:
        cur = conn.execute(query, params)
        return cur.fetchall()


def init_db() -> None:
    schema = [
        """
        CREATE TABLE IF NOT EXISTS contents (
            id TEXT PRIMARY KEY,
            title TEXT,
            type TEXT,
            genre TEXT,
            subgenre TEXT,
            mood TEXT,
            rating TEXT,
            duration INTEGER,
            description TEXT,
            embedding TEXT,
            rights_start TEXT,
            rights_end TEXT,
            regions TEXT,
            seasonal_tags TEXT,
            target_audience TEXT,
            ad_break_count INTEGER,
            completion_rate REAL,
            avg_watch_duration INTEGER,
            thumbnail_url TEXT,
            status TEXT,
            upload_date TEXT,
            file_size INTEGER,
            transcoding_status TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS channels (
            id TEXT PRIMARY KEY,
            name TEXT,
            target_audience TEXT,
            primary_genre TEXT,
            rating_limit TEXT,
            ad_load_minutes INTEGER,
            operating_hours TEXT,
            logo TEXT,
            color TEXT,
            status TEXT,
            viewer_count INTEGER,
            retention REAL,
            growth REAL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS channel_metrics (
            channel_id TEXT PRIMARY KEY,
            top_programs TEXT,
            peak_time TEXT,
            audience_count INTEGER,
            ad_watch_time INTEGER,
            weekly_retention REAL,
            weekly_growth REAL,
            avg_view_duration INTEGER,
            top_genre TEXT,
            top_region TEXT,
            completion_rate REAL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS week_schedules (
            id TEXT PRIMARY KEY,
            channel_id TEXT,
            day TEXT,
            date TEXT,
            total_hours INTEGER,
            avg_retention REAL,
            conflicts INTEGER
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS schedule_slots (
            id TEXT PRIMARY KEY,
            schedule_id TEXT,
            content_id TEXT,
            start_time TEXT,
            end_time TEXT,
            predicted_retention REAL,
            predicted_dropoff REAL,
            confidence REAL,
            status TEXT,
            transition_risk TEXT,
            day TEXT,
            is_edited INTEGER
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS ad_breaks (
            id TEXT PRIMARY KEY,
            slot_id TEXT,
            position INTEGER,
            duration INTEGER,
            predicted_impressions INTEGER,
            predicted_completion_rate REAL,
            type TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS media_uploads (
            id TEXT PRIMARY KEY,
            title TEXT,
            file_name TEXT,
            file_size INTEGER,
            duration INTEGER,
            status TEXT,
            upload_progress INTEGER,
            transcoding_progress INTEGER,
            metadata TEXT,
            uploaded_at TEXT,
            thumbnail_url TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS media_files (
            id TEXT PRIMARY KEY,
            media_id TEXT,
            file_name TEXT,
            content_type TEXT,
            size INTEGER,
            blob BLOB,
            created_at TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS self_heal_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            original_content_id TEXT,
            original_title TEXT,
            replacement_content_id TEXT,
            replacement_title TEXT,
            similarity_score REAL,
            reason TEXT,
            status TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS admin_daily_analytics (
            id TEXT PRIMARY KEY,
            channel_id TEXT,
            date TEXT,
            total_viewers INTEGER,
            avg_retention REAL,
            total_watch_time_hours REAL,
            ad_impressions INTEGER,
            ad_revenue REAL,
            unique_viewers INTEGER,
            peak_concurrent_viewers INTEGER
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS admin_monthly_summary (
            id TEXT PRIMARY KEY,
            channel_id TEXT,
            month TEXT,
            total_revenue REAL,
            total_viewers INTEGER,
            avg_retention REAL,
            growth_percentage REAL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            role TEXT,
            avatar_url TEXT,
            assigned_channels TEXT,
            is_active INTEGER,
            created_at TEXT,
            last_login TEXT
        )
        """,
    ]

    with get_connection() as conn:
        for stmt in schema:
            conn.execute(stmt)
        conn.commit()


def json_dump(value: object) -> str:
    return json.dumps(value, ensure_ascii=True)


def json_load(value: Optional[str]) -> object:
    if value is None:
        return None
    return json.loads(value)
