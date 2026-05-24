import urllib.request
import json
import random
from server.catalog import load_catalog, save_catalog

def generate_pseudo_embedding(genres):
    # [Action, Drama, Comedy, Sci-Fi, Intensity, Mood_Darkness, Pace_Speed, Family_Friendly]
    emb = [0.1, 0.1, 0.1, 0.1, 0.2, 0.2, 0.5, 0.5]
    
    if 'Action' in genres:
        emb[0] = 0.9; emb[4] = 0.8; emb[6] = 0.8
    if 'Drama' in genres:
        emb[1] = 0.9; emb[4] = 0.6; emb[5] = 0.7
    if 'Comedy' in genres:
        emb[2] = 0.9; emb[5] = 0.1; emb[7] = 0.9
    if 'Science-Fiction' in genres or 'Sci-Fi' in genres:
        emb[3] = 0.9
    if 'Horror' in genres or 'Thriller' in genres:
        emb[4] = 0.9; emb[5] = 0.9; emb[7] = 0.0
    if 'Children' in genres or 'Family' in genres:
        emb[5] = 0.0; emb[7] = 1.0; emb[4] = 0.3
        
    return [round(x + random.uniform(-0.1, 0.1), 3) for x in emb]

def fetch_tvmaze_shows():
    print("[SYSTEM] Fetching real-world TV shows from TVMaze API...")
    url = "https://api.tvmaze.com/shows"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        print(f"[ERROR] Failed to fetch data: {e}")
        return

    library = load_catalog()
    existing_ids = {a['id'] for a in library}
    
    count = 0
    for show in data[:30]: # Grab top 30
        show_id = f"tvmaze_{show['id']}"
        if show_id in existing_ids:
            continue
            
        genres = show.get('genres', [])
        primary_genre = genres[0] if genres else "Drama"
        runtime_mins = show.get('averageRuntime') or show.get('runtime') or 60
        
        # Map TVMaze rating to standard rating roughly
        rating = "TV-14"
        mood = "Neutral"
        target_demo = "Adults"
        
        if 'Children' in genres or 'Family' in genres:
            rating = "TV-G"
            mood = "Lighthearted"
            target_demo = "Kids"
        elif 'Comedy' in genres:
            mood = "Upbeat"
            target_demo = "All"
        elif 'Horror' in genres or 'Thriller' in genres:
            rating = "TV-MA"
            mood = "Dark"
        
        asset = {
            "id": show_id,
            "title": show['name'],
            "type": "Series",
            "genre": primary_genre,
            "duration_seconds": runtime_mins * 60,
            "rating": rating,
            "mood": mood,
            "target_demo": target_demo,
            "license_start": "2020-01-01T00:00:00Z",
            "license_end": "2030-12-31T23:59:59Z",
            "geo_allow": ["US", "UK", "IN", "CA"],
            "embedding": generate_pseudo_embedding(genres),
            "scte35_breaks": [int(runtime_mins * 60 / 3), int(runtime_mins * 60 * 2 / 3)],
            "description": show.get('summary', '').replace('<p>', '').replace('</p>', '').replace('<b>', '').replace('</b>', '')[:150] + "..."
        }
        
        library.append(asset)
        count += 1
        
    save_catalog(library)
    print(f"[SUCCESS] Imported {count} real-world shows into library!")

if __name__ == "__main__":
    fetch_tvmaze_shows()
