"""
Calendar Brain — The Contextual Intelligence Module

Knows every Indian festival, global holiday, IPL season, day-of-week programming
rules, and time-of-day slot preferences. Returns a full scheduling context for
any given datetime.
"""
import datetime

# ─── FESTIVAL & EVENT CALENDAR ─────────────────────────────────────────────────
# Format: (month, day, name, duration_days, genre_boosts, viewership_multiplier)
FESTIVAL_CALENDAR = [
    # Indian Festivals (approximate dates — real dates shift yearly)
    (1,  14, "Makar Sankranti / Pongal",    3,  {"Comedy": 1.4, "Family": 1.5, "Cooking": 1.3},     1.4),
    (1,  26, "Republic Day",                 1,  {"News": 2.0, "Drama": 1.3, "Patriotic": 1.8},      1.6),
    (2,  14, "Valentine's Day",              1,  {"Romance": 1.8, "Comedy": 1.3, "Drama": 1.2},      1.1),
    (3,  14, "Holi",                         2,  {"Comedy": 1.6, "Family": 1.5, "Animation": 1.4},   1.5),
    (3,  25, "IPL Season Start",            60,  {"Sports": 3.0, "Cricket": 3.0},                     1.3),
    (4,  14, "Tamil New Year / Vishu",       2,  {"Family": 1.5, "Comedy": 1.3},                      1.3),
    (5,   1, "Summer Holidays Start",       60,  {"Kids": 1.8, "Animation": 1.8, "Adventure": 1.5, "Sci-Fi": 1.4}, 1.2),
    (7,   1, "Summer Holidays End",          1,  {},                                                   1.0),
    (8,  15, "Independence Day",             1,  {"News": 2.0, "Drama": 1.5, "Patriotic": 1.8},      1.7),
    (8,  26, "Ganesh Chaturthi",             10, {"Family": 1.4, "Comedy": 1.3, "Devotional": 1.5},  1.3),
    (9,  15, "Onam",                         4,  {"Family": 1.5, "Comedy": 1.4, "Cooking": 1.3},     1.3),
    (10,  2, "Gandhi Jayanti",               1,  {"Drama": 1.4, "News": 1.3},                         1.2),
    (10, 12, "Navratri / Durga Puja Start", 10,  {"Family": 1.6, "Comedy": 1.5, "Drama": 1.3},       1.6),
    (10, 24, "Dussehra",                     1,  {"Family": 1.7, "Drama": 1.5, "Action": 1.3},       1.7),
    (10, 31, "Halloween",                    1,  {"Thriller": 1.8, "Horror": 1.9, "Crime": 1.5},     1.2),
    (11, 12, "Diwali",                       5,  {"Family": 2.0, "Comedy": 1.8, "Drama": 1.5, "Animation": 1.5}, 2.0),
    (11, 17, "Chhath Puja",                  2,  {"Family": 1.3, "Devotional": 1.4},                  1.2),
    (12, 25, "Christmas",                    3,  {"Family": 1.8, "Comedy": 1.7, "Animation": 1.6, "Romance": 1.3}, 1.6),
    (12, 31, "New Year's Eve",               2,  {"Comedy": 1.5, "Music": 1.5, "Drama": 1.3},        1.4),
]

# ─── DAY-OF-WEEK PROGRAMMING RULES ─────────────────────────────────────────────
# What genres work best on which day
DAY_OF_WEEK_RULES = {
    0: {  # Monday
        "name": "Monday",
        "type": "weekday",
        "genre_boost": {"News": 1.3, "Drama": 1.2, "Crime": 1.2},
        "viewership_mult": 0.9,
        "programming_hint": "Start-of-week. News-heavy mornings, drama primetime."
    },
    1: {  # Tuesday
        "name": "Tuesday",
        "type": "weekday",
        "genre_boost": {"Drama": 1.2, "Crime": 1.3, "Thriller": 1.2},
        "viewership_mult": 0.9,
        "programming_hint": "Crime/thriller primetime performs well."
    },
    2: {  # Wednesday
        "name": "Wednesday",
        "type": "weekday",
        "genre_boost": {"Comedy": 1.2, "Drama": 1.1, "Cooking": 1.3},
        "viewership_mult": 0.95,
        "programming_hint": "Mid-week. Light comedy and cooking shows do well."
    },
    3: {  # Thursday
        "name": "Thursday",
        "type": "weekday",
        "genre_boost": {"Drama": 1.3, "Thriller": 1.2, "Sci-Fi": 1.2},
        "viewership_mult": 0.95,
        "programming_hint": "Pre-weekend buildup. Cliffhanger episodes."
    },
    4: {  # Friday
        "name": "Friday",
        "type": "weekday",
        "genre_boost": {"Comedy": 1.4, "Action": 1.3, "Thriller": 1.2},
        "viewership_mult": 1.1,
        "programming_hint": "TGIF energy. Action/comedy evenings, movie premieres."
    },
    5: {  # Saturday
        "name": "Saturday",
        "type": "weekend",
        "genre_boost": {"Animation": 1.5, "Comedy": 1.4, "Sci-Fi": 1.3, "Action": 1.3, "Cooking": 1.4},
        "viewership_mult": 1.3,
        "programming_hint": "Family day. Kids mornings, family entertainment evening."
    },
    6: {  # Sunday
        "name": "Sunday",
        "type": "weekend",
        "genre_boost": {"Movie": 1.6, "Comedy": 1.5, "Animation": 1.5, "Drama": 1.3, "Action": 1.4, "Family": 1.5},
        "viewership_mult": 1.4,
        "programming_hint": "Peak leisure. Blockbuster movies, marathons, specials."
    }
}

# ─── TIME-OF-DAY SLOT DEFINITIONS ──────────────────────────────────────────────
TIME_SLOTS = {
    "early_morning":  {"hours": range(4, 7),   "name": "Early Morning",   "genre_boost": {"News": 1.5, "Yoga": 1.3},                              "demo_boost": {"Adults": 1.2}},
    "morning":        {"hours": range(7, 10),  "name": "Morning",         "genre_boost": {"News": 1.4, "Animation": 1.5, "Cooking": 1.3},          "demo_boost": {"Kids": 1.5, "All": 1.2}},
    "late_morning":   {"hours": range(10, 12), "name": "Late Morning",    "genre_boost": {"Drama": 1.3, "Cooking": 1.4, "Comedy": 1.2},            "demo_boost": {"Adults": 1.1}},
    "afternoon":      {"hours": range(12, 15), "name": "Afternoon",       "genre_boost": {"Drama": 1.2, "Comedy": 1.3},                             "demo_boost": {"All": 1.0}},
    "evening":        {"hours": range(15, 18), "name": "Evening",         "genre_boost": {"Animation": 1.4, "Comedy": 1.3, "Sci-Fi": 1.2},         "demo_boost": {"Kids": 1.4, "Teens": 1.3}},
    "primetime":      {"hours": range(18, 22), "name": "Primetime",       "genre_boost": {"Drama": 1.5, "Crime": 1.4, "Thriller": 1.3, "Action": 1.3, "Comedy": 1.2}, "demo_boost": {"Adults": 1.4, "All": 1.3}},
    "late_night":     {"hours": range(22, 24), "name": "Late Night",      "genre_boost": {"Thriller": 1.5, "Crime": 1.4, "Horror": 1.3},            "demo_boost": {"Adults": 1.5}},
    "overnight":      {"hours": range(0, 4),   "name": "Overnight",       "genre_boost": {"News": 1.2},                                             "demo_boost": {"Adults": 1.0}},
}


def get_active_festivals(dt):
    """Returns all festivals active on the given date."""
    active = []
    for month, day, name, duration, genre_boosts, mult in FESTIVAL_CALENDAR:
        fest_start = datetime.date(dt.year, month, day)
        fest_end = fest_start + datetime.timedelta(days=duration)
        if fest_start <= dt.date() <= fest_end:
            active.append({
                "name": name,
                "genre_boosts": genre_boosts,
                "viewership_multiplier": mult
            })
    return active


def get_time_slot(hour):
    """Returns the time slot definition for the given hour."""
    for slot_key, slot_def in TIME_SLOTS.items():
        if hour in slot_def["hours"]:
            return {"key": slot_key, **slot_def}
    return {"key": "afternoon", "name": "Afternoon", "genre_boost": {}, "demo_boost": {}, "hours": range(12, 15)}


def get_context(dt_input):
    """
    Master function: returns the full scheduling context for any datetime.
    
    Args:
        dt_input: datetime object or ISO string
        
    Returns:
        dict with day_of_week, time_slot, active_festivals, combined genre boosts,
        overall viewership multiplier, and programming hints.
    """
    if isinstance(dt_input, str):
        dt = datetime.datetime.fromisoformat(dt_input.replace('Z', '+00:00'))
    else:
        dt = dt_input
        
    dow = dt.weekday()
    day_rule = DAY_OF_WEEK_RULES[dow]
    time_slot = get_time_slot(dt.hour)
    festivals = get_active_festivals(dt)
    
    # Combine all genre boosts
    combined_genre_boost = {}
    
    # Day-of-week boosts
    for genre, mult in day_rule["genre_boost"].items():
        combined_genre_boost[genre] = combined_genre_boost.get(genre, 1.0) * mult
    
    # Time-slot boosts
    for genre, mult in time_slot.get("genre_boost", {}).items():
        combined_genre_boost[genre] = combined_genre_boost.get(genre, 1.0) * mult
    
    # Festival boosts (stack multiplicatively)
    festival_viewership_mult = 1.0
    for fest in festivals:
        for genre, mult in fest["genre_boosts"].items():
            combined_genre_boost[genre] = combined_genre_boost.get(genre, 1.0) * mult
        festival_viewership_mult *= fest["viewership_multiplier"]
    
    # Overall viewership multiplier
    overall_viewership = day_rule["viewership_mult"] * festival_viewership_mult
    
    # Base traffic curve by hour (0-23) — normalized 0.0 to 1.0
    hour_curve = [
        0.05, 0.03, 0.02, 0.02, 0.04, 0.08,  # 0-5 AM
        0.15, 0.25, 0.30, 0.28, 0.22, 0.20,  # 6-11 AM
        0.25, 0.22, 0.18, 0.20, 0.25, 0.35,  # 12-5 PM
        0.55, 0.75, 0.90, 1.00, 0.85, 0.50   # 6-11 PM
    ]
    base_traffic = hour_curve[dt.hour] * overall_viewership
    
    return {
        "datetime": dt.isoformat(),
        "day_of_week": day_rule["name"],
        "day_type": day_rule["type"],
        "time_slot": time_slot["name"],
        "programming_hint": day_rule["programming_hint"],
        "active_festivals": [f["name"] for f in festivals],
        "genre_boosts": {k: round(v, 2) for k, v in sorted(combined_genre_boost.items(), key=lambda x: -x[1])},
        "demo_boosts": time_slot.get("demo_boost", {}),
        "viewership_multiplier": round(overall_viewership, 2),
        "base_traffic_index": round(base_traffic, 3),
        "is_festival": len(festivals) > 0,
        "is_weekend": day_rule["type"] == "weekend"
    }


def get_genre_score_for_context(genre, context):
    """Returns the contextual boost score for a genre given current context."""
    return context.get("genre_boosts", {}).get(genre, 1.0)
