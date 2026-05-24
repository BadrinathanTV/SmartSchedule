import math
from server.catalog import get_asset, GENRE_SIMILARITY_MATRIX, cosine_similarity

def demographic_alignment(demo_a, demo_b):
    matrix = {
        "Kids": {"Kids": 1.0, "Teens": 0.5, "Adults": 0.0, "All": 0.8},
        "Teens": {"Kids": 0.5, "Teens": 1.0, "Adults": 0.7, "All": 0.9},
        "Adults": {"Kids": 0.0, "Teens": 0.6, "Adults": 1.0, "All": 0.8},
        "All": {"Kids": 0.8, "Teens": 0.9, "Adults": 0.8, "All": 1.0}
    }
    return matrix.get(demo_a, {}).get(demo_b, 0.5)

def time_slot_score(asset, hour):
    target = asset.get('target_demo', 'All')
    genre = asset.get('genre', '')
    
    if target == 'Kids':
        if 6 <= hour <= 18:
            return 1.0
        return 0.1
    elif target == 'Adults' or asset.get('rating') in ['R', 'TV-MA']:
        if 20 <= hour <= 23 or 0 <= hour <= 4:
            return 1.0
        return 0.3
    
    if genre == 'News':
        if 6 <= hour <= 9 or 17 <= hour <= 20:
            return 1.0
        return 0.6
        
    return 0.8

def predict_transition(asset_a, asset_b, time_slot, cumulative_genre_minutes):
    """Returns drop-off probability and feature breakdown."""
    S_g = cosine_similarity(asset_a.get('embedding'), asset_b.get('embedding'))
    S_genre = GENRE_SIMILARITY_MATRIX.get(asset_a.get('genre'), {}).get(asset_b.get('genre'), 0.5)
    S_d = demographic_alignment(asset_a.get('target_demo', 'All'), asset_b.get('target_demo', 'All'))
    A_t = time_slot_score(asset_b, time_slot)
    F = min(1.0, math.log1p(cumulative_genre_minutes / 60.0) / 3.0)
    
    # Weighted sigmoid for drop-off.
    # Higher z means better match -> lower drop off.
    z = 4.0 * S_g + 2.5 * S_genre + 3.0 * S_d + 2.0 * A_t - 2.5 * F
    
    try:
        drop_off = 1.0 / (1.0 + math.exp(z - 7.5)) # 7.5 is the offset for baseline 50% dropoff
    except OverflowError:
        drop_off = 0.0 if z > 7.5 else 1.0
        
    return {
        'drop_off_probability': round(drop_off, 4),
        'retention_score': round(1.0 - drop_off, 4),
        'features': {
            'embedding_similarity': round(S_g, 3),
            'genre_similarity': round(S_genre, 3),
            'demographic_alignment': round(S_d, 3),
            'time_slot_fit': round(A_t, 3),
            'genre_fatigue': round(F, 3)
        }
    }

def expected_watch_duration(asset, retention_score):
    return (asset.get('duration_seconds', 0) / 60.0) * retention_score

def predict_sequence(schedule_ids, start_hour=0):
    predictions = []
    current_hour = start_hour
    cumulative_genre_minutes = 0
    current_genre = None
    
    assets = [get_asset(aid) for aid in schedule_ids if get_asset(aid)]
    if not assets:
        return []
        
    # First item has no transition drop-off, base retention is 0.95
    predictions.append({
        'asset_id': assets[0]['id'],
        'drop_off_probability': 0.05,
        'retention_score': 0.95,
        'features': None
    })
    
    current_genre = assets[0]['genre']
    cumulative_genre_minutes += assets[0]['duration_seconds'] / 60.0
    current_time_seconds = assets[0]['duration_seconds']
    
    for i in range(1, len(assets)):
        asset_a = assets[i-1]
        asset_b = assets[i]
        
        current_hour = (start_hour + int(current_time_seconds / 3600)) % 24
        
        if asset_b['genre'] == current_genre:
            cumulative_genre_minutes += asset_b['duration_seconds'] / 60.0
        else:
            current_genre = asset_b['genre']
            cumulative_genre_minutes = asset_b['duration_seconds'] / 60.0
            
        trans = predict_transition(asset_a, asset_b, current_hour, cumulative_genre_minutes)
        trans['asset_id'] = asset_b['id']
        predictions.append(trans)
        
        current_time_seconds += asset_b['duration_seconds']
        
    return predictions
