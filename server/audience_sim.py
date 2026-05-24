"""
Live Audience Traffic Simulator

Generates realistic, dynamic viewership patterns based on time-of-day,
day-of-week, season, and festivals. Provides per-genre audience demand
that fluctuates every few seconds with Gaussian noise.
"""
import math
import random
import time
import datetime
from server.calendar_brain import get_context

# Base viewer count (simulated channel with ~500K average viewers)
BASE_VIEWERS = 500_000

# Genre demand profiles — base weights that shift with context
GENRE_BASE_DEMAND = {
    "Drama": 0.18,
    "Comedy": 0.15,
    "Thriller": 0.10,
    "Crime": 0.09,
    "Action": 0.08,
    "Sci-Fi": 0.07,
    "Animation": 0.08,
    "News": 0.06,
    "Cooking": 0.04,
    "Horror": 0.03,
    "Romance": 0.04,
    "Family": 0.05,
    "Ad": 0.02,
    "Promo": 0.01,
}

def _gaussian_noise(mean=1.0, std=0.15):
    """Generate Gaussian noise for realistic fluctuation."""
    return max(0.3, random.gauss(mean, std))


def get_live_audience(target_datetime=None):
    """
    Returns a snapshot of the current live audience state.
    
    If target_datetime is None, uses the actual current time.
    Otherwise simulates for the given datetime.
    """
    if target_datetime is None:
        dt = datetime.datetime.now(datetime.timezone.utc)
    elif isinstance(target_datetime, str):
        dt = datetime.datetime.fromisoformat(target_datetime.replace('Z', '+00:00'))
    else:
        dt = target_datetime

    context = get_context(dt)
    
    # Calculate live viewer count
    base = BASE_VIEWERS * context["base_traffic_index"]
    noise = _gaussian_noise(1.0, 0.12)
    live_viewers = int(base * noise)
    
    # Calculate per-genre demand with context boosts
    genre_demand = {}
    total_weight = 0.0
    
    for genre, base_weight in GENRE_BASE_DEMAND.items():
        boost = context["genre_boosts"].get(genre, 1.0)
        genre_noise = _gaussian_noise(1.0, 0.08)
        weighted = base_weight * boost * genre_noise
        genre_demand[genre] = weighted
        total_weight += weighted
    
    # Normalize to percentages
    genre_percentages = {}
    for genre, weight in genre_demand.items():
        genre_percentages[genre] = round((weight / total_weight) * 100, 1)
    
    # Sort by demand (highest first)
    sorted_demand = dict(sorted(genre_percentages.items(), key=lambda x: -x[1]))
    
    # Top trending genres (top 3)
    trending = list(sorted_demand.keys())[:3]
    
    # Engagement score (0-100) based on traffic index
    engagement = min(100, int(context["base_traffic_index"] * 100))
    
    return {
        "timestamp": dt.isoformat(),
        "live_viewers": live_viewers,
        "live_viewers_formatted": _format_viewers(live_viewers),
        "engagement_score": engagement,
        "genre_demand": sorted_demand,
        "trending_genres": trending,
        "context": {
            "day": context["day_of_week"],
            "time_slot": context["time_slot"],
            "festivals": context["active_festivals"],
            "is_festival": context["is_festival"],
            "is_weekend": context["is_weekend"],
            "programming_hint": context["programming_hint"],
            "viewership_multiplier": context["viewership_multiplier"]
        }
    }


def get_audience_history(target_datetime=None, hours=24):
    """Returns hourly audience data for the past N hours for charting."""
    if target_datetime is None:
        dt = datetime.datetime.now(datetime.timezone.utc)
    elif isinstance(target_datetime, str):
        dt = datetime.datetime.fromisoformat(target_datetime.replace('Z', '+00:00'))
    else:
        dt = target_datetime
    
    history = []
    for h in range(hours):
        past_dt = dt - datetime.timedelta(hours=hours - h)
        snapshot = get_live_audience(past_dt)
        history.append({
            "hour": past_dt.strftime("%H:%M"),
            "viewers": snapshot["live_viewers"],
            "engagement": snapshot["engagement_score"],
            "top_genre": snapshot["trending_genres"][0] if snapshot["trending_genres"] else "N/A"
        })
    
    return history


def _format_viewers(count):
    """Format viewer count for display (e.g., 1.2M, 450K)."""
    if count >= 1_000_000:
        return f"{count / 1_000_000:.1f}M"
    elif count >= 1_000:
        return f"{count / 1_000:.0f}K"
    return str(count)
