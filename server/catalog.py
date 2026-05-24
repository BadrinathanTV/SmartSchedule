import datetime

# 8-dimensional embedding representation (Mocked semantic multimodal vectors)
# [Action, Drama, Comedy, Sci-Fi, Intensity, Mood_Darkness, Pace_Speed, Family_Friendly]

CONTENT_LIBRARY = [
    {
        "id": "movie_01",
        "title": "Midnight in Manhattan",
        "type": "Movie",
        "genre": "Thriller",
        "duration_seconds": 6300, # 1h 45m
        "rating": "R",
        "mood": "Intense",
        "target_demo": "Adults",
        "license_start": "2024-01-01T00:00:00Z",
        "license_end": "2027-12-31T23:59:59Z",
        "geo_allow": ["US", "CA", "GB"],
        "embedding": [0.7, 0.8, 0.1, 0.2, 0.9, 0.9, 0.6, 0.0],
        "scte35_breaks": [1200, 2400, 3600, 4800],
        "description": "A dark, intense thriller set in modern-day New York."
    },
    {
        "id": "movie_02",
        "title": "Galaxy Explorers",
        "type": "Movie",
        "genre": "Sci-Fi",
        "duration_seconds": 7200, # 2h
        "rating": "PG-13",
        "mood": "Adventurous",
        "target_demo": "All",
        "license_start": "2023-05-01T00:00:00Z",
        "license_end": "2028-05-01T00:00:00Z",
        "geo_allow": ["US", "IN", "GB"],
        "embedding": [0.6, 0.5, 0.4, 0.9, 0.6, 0.2, 0.7, 0.6],
        "scte35_breaks": [1500, 3000, 4500, 6000],
        "description": "An epic journey to the edge of the galaxy."
    },
    {
        "id": "movie_03",
        "title": "Family Feast",
        "type": "Movie",
        "genre": "Comedy",
        "duration_seconds": 5400, # 1h 30m
        "rating": "PG",
        "mood": "Lighthearted",
        "target_demo": "All",
        "license_start": "2020-01-01T00:00:00Z",
        "license_end": "2030-01-01T00:00:00Z",
        "geo_allow": ["US", "CA", "IN"],
        "embedding": [0.1, 0.3, 0.9, 0.0, 0.3, 0.1, 0.5, 0.9],
        "scte35_breaks": [1000, 2000, 3000, 4000],
        "description": "A hilarious look at a dysfunctional family holiday."
    },
    {
        "id": "series_01",
        "title": "The Last Detective - S01E01",
        "type": "Series",
        "genre": "Crime",
        "duration_seconds": 2520, # 42m
        "rating": "TV-MA",
        "mood": "Dark",
        "target_demo": "Adults",
        "license_start": "2025-01-01T00:00:00Z",
        "license_end": "2026-01-01T00:00:00Z",
        "geo_allow": ["US"],
        "embedding": [0.5, 0.9, 0.1, 0.0, 0.7, 0.8, 0.4, 0.0],
        "scte35_breaks": [600, 1200, 1800],
        "description": "A gritty crime drama following a seasoned detective."
    },
    {
        "id": "series_02",
        "title": "Kitchen Kings - S03E04",
        "type": "Series",
        "genre": "Cooking",
        "duration_seconds": 1320, # 22m
        "rating": "TV-G",
        "mood": "Energetic",
        "target_demo": "All",
        "license_start": "2022-01-01T00:00:00Z",
        "license_end": "2028-01-01T00:00:00Z",
        "geo_allow": ["US", "CA", "GB", "IN"],
        "embedding": [0.1, 0.2, 0.5, 0.0, 0.5, 0.0, 0.8, 1.0],
        "scte35_breaks": [600],
        "description": "Fast-paced cooking competition."
    },
    {
        "id": "series_03",
        "title": "Morning Cartoon Blocks",
        "type": "Series",
        "genre": "Animation",
        "duration_seconds": 1200, # 20m
        "rating": "TV-Y",
        "mood": "Upbeat",
        "target_demo": "Kids",
        "license_start": "2020-01-01T00:00:00Z",
        "license_end": "2030-01-01T00:00:00Z",
        "geo_allow": ["US", "IN"],
        "embedding": [0.3, 0.1, 0.8, 0.2, 0.4, 0.0, 0.9, 1.0],
        "scte35_breaks": [600],
        "description": "Bright and colorful animated adventures."
    },
    {
        "id": "promo_01",
        "title": "Next Up: Sci-Fi Night",
        "type": "Promo",
        "genre": "Promo",
        "duration_seconds": 30,
        "rating": "G",
        "mood": "Exciting",
        "target_demo": "All",
        "license_start": "2000-01-01T00:00:00Z",
        "license_end": "2099-01-01T00:00:00Z",
        "geo_allow": ["US", "CA", "GB", "IN"],
        "embedding": [0.5, 0.5, 0.5, 0.8, 0.7, 0.3, 0.8, 0.8],
        "scte35_breaks": [],
        "description": "Station ID and promo for upcoming sci-fi movies."
    },
    {
        "id": "promo_02",
        "title": "Local Weather Update",
        "type": "Promo",
        "genre": "News",
        "duration_seconds": 60,
        "rating": "G",
        "mood": "Calm",
        "target_demo": "All",
        "license_start": "2000-01-01T00:00:00Z",
        "license_end": "2099-01-01T00:00:00Z",
        "geo_allow": ["US", "CA", "GB", "IN"],
        "embedding": [0.0, 0.2, 0.0, 0.0, 0.1, 0.1, 0.2, 1.0],
        "scte35_breaks": [],
        "description": "A quick look at the local weather forecast."
    },
    {
        "id": "ad_01",
        "title": "TechBrand Smartphone Ad",
        "type": "Ad",
        "genre": "Ad",
        "duration_seconds": 30,
        "rating": "G",
        "mood": "Sleek",
        "target_demo": "All",
        "license_start": "2000-01-01T00:00:00Z",
        "license_end": "2099-01-01T00:00:00Z",
        "geo_allow": ["US", "CA", "GB", "IN"],
        "embedding": [0.2, 0.1, 0.1, 0.8, 0.5, 0.1, 0.7, 0.8],
        "scte35_breaks": [],
        "description": "Commercial for a new high-tech smartphone."
    },
    {
        "id": "ad_02",
        "title": "Crunchy Snacks Ad",
        "type": "Ad",
        "genre": "Ad",
        "duration_seconds": 15,
        "rating": "G",
        "mood": "Fun",
        "target_demo": "Kids",
        "license_start": "2000-01-01T00:00:00Z",
        "license_end": "2099-01-01T00:00:00Z",
        "geo_allow": ["US", "CA", "GB", "IN"],
        "embedding": [0.1, 0.0, 0.8, 0.0, 0.4, 0.0, 0.8, 1.0],
        "scte35_breaks": [],
        "description": "Fun commercial for a snack food."
    }
]

# A naive genre similarity matrix used as a fallback or explicit scoring feature.
# 1.0 means identical, 0.0 means completely opposite.
GENRE_SIMILARITY_MATRIX = {
    "Thriller": {"Thriller": 1.0, "Sci-Fi": 0.6, "Comedy": 0.1, "Crime": 0.8, "Cooking": 0.1, "Animation": 0.0, "News": 0.3, "Promo": 0.5, "Ad": 0.5},
    "Sci-Fi": {"Thriller": 0.6, "Sci-Fi": 1.0, "Comedy": 0.4, "Crime": 0.4, "Cooking": 0.1, "Animation": 0.6, "News": 0.2, "Promo": 0.5, "Ad": 0.5},
    "Comedy": {"Thriller": 0.1, "Sci-Fi": 0.4, "Comedy": 1.0, "Crime": 0.2, "Cooking": 0.6, "Animation": 0.8, "News": 0.2, "Promo": 0.5, "Ad": 0.5},
    "Crime": {"Thriller": 0.8, "Sci-Fi": 0.4, "Comedy": 0.2, "Crime": 1.0, "Cooking": 0.2, "Animation": 0.1, "News": 0.4, "Promo": 0.5, "Ad": 0.5},
    "Cooking": {"Thriller": 0.1, "Sci-Fi": 0.1, "Comedy": 0.6, "Crime": 0.2, "Cooking": 1.0, "Animation": 0.4, "News": 0.5, "Promo": 0.5, "Ad": 0.5},
    "Animation": {"Thriller": 0.0, "Sci-Fi": 0.6, "Comedy": 0.8, "Crime": 0.1, "Cooking": 0.4, "Animation": 1.0, "News": 0.1, "Promo": 0.5, "Ad": 0.5},
    "News": {"Thriller": 0.3, "Sci-Fi": 0.2, "Comedy": 0.2, "Crime": 0.4, "Cooking": 0.5, "Animation": 0.1, "News": 1.0, "Promo": 0.5, "Ad": 0.5},
    "Promo": {"Thriller": 0.5, "Sci-Fi": 0.5, "Comedy": 0.5, "Crime": 0.5, "Cooking": 0.5, "Animation": 0.5, "News": 0.5, "Promo": 1.0, "Ad": 0.5},
    "Ad": {"Thriller": 0.5, "Sci-Fi": 0.5, "Comedy": 0.5, "Crime": 0.5, "Cooking": 0.5, "Animation": 0.5, "News": 0.5, "Promo": 0.5, "Ad": 1.0}
}

def get_asset(asset_id):
    for asset in CONTENT_LIBRARY:
        if asset["id"] == asset_id:
            return asset
    return None

def get_assets_by_type(asset_type):
    return [a for a in CONTENT_LIBRARY if a["type"] == asset_type]

def cosine_similarity(vec_a, vec_b):
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = sum(a * a for a in vec_a) ** 0.5
    norm_b = sum(b * b for b in vec_b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)
