import math
import json
import os
from server.catalog import get_asset, GENRE_SIMILARITY_MATRIX, cosine_similarity
from server.calendar_brain import get_context, get_genre_score_for_context

# Load Mock XGBoost Model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'xgboost_model.json')
try:
    with open(MODEL_PATH, 'r') as f:
        XGBOOST_MODEL = json.load(f)
except FileNotFoundError:
    XGBOOST_MODEL = None

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

def get_seasonality_score(asset, month, context=None):
    genre = asset.get('genre', '')
    target = asset.get('target_demo', 'All')
    mood = asset.get('mood', '')
    rating = asset.get('rating', 'G')
    
    # If we have a full Calendar Brain context, use it
    if context:
        return min(1.0, get_genre_score_for_context(genre, context) / 2.0)
    
    # Fallback to simple month-based rules
    if month in [5, 6, 7]:
        if target == 'Kids' or genre == 'Animation':
            return 1.0
        if mood == 'Dark' or rating in ['R', 'TV-MA']:
            return 0.2
    if month == 10:
        if genre in ['Thriller', 'Crime', 'Horror'] or mood == 'Dark':
            return 1.0
    if month == 12:
        if genre == 'Comedy' or target == 'Family' or mood == 'Lighthearted':
            return 1.0
    return 0.5


def get_day_of_week_fit(asset, context):
    """Score how well an asset fits the current day of the week."""
    if not context:
        return 0.5
    genre = asset.get('genre', '')
    return min(1.0, get_genre_score_for_context(genre, context) / 2.0)


def get_festival_boost(asset, context):
    """Return festival boost multiplier for the asset."""
    if not context or not context.get('is_festival'):
        return 0.0
    genre = asset.get('genre', '')
    boost = context.get('genre_boosts', {}).get(genre, 1.0)
    return min(1.0, (boost - 1.0) / 1.5)  # Normalize: 1.0=no boost → 0.0, 2.5=max → 1.0

def evaluate_tree(node, features):
    if "leaf_value" in node:
        return node["leaf_value"]
        
    feature_val = features.get(node["feature"], 0.0)
    
    if feature_val < node["split_value"]:
        return evaluate_tree(next(n for n in XGBOOST_MODEL["trees"][0]["nodes"] if n["node_id"] == node["left"]), features)
    else:
        return evaluate_tree(next(n for n in XGBOOST_MODEL["trees"][0]["nodes"] if n["node_id"] == node["right"]), features)

def evaluate_xgboost(features):
    if not XGBOOST_MODEL:
        return 0.0
        
    score = 0.0
    for tree in XGBOOST_MODEL["trees"]:
        root = tree["nodes"][0]
        # Quick hack to search for nodes in the current tree
        def search_node(node_id):
            return next(n for n in tree["nodes"] if n.get("node_id") == node_id)
            
        def eval_node(node):
            if "leaf_value" in node:
                return node["leaf_value"]
            if features.get(node["feature"], 0.0) < node["split_value"]:
                return eval_node(search_node(node["left"]))
            else:
                return eval_node(search_node(node["right"]))
                
        score += eval_node(root)
        
    return score

def predict_transition(asset_a, asset_b, time_slot, cumulative_genre_minutes, month=1, context=None):
    """Returns drop-off probability and feature breakdown using pre-trained mocked XGBoost."""
    S_g = cosine_similarity(asset_a.get('embedding'), asset_b.get('embedding'))
    S_genre = GENRE_SIMILARITY_MATRIX.get(asset_a.get('genre'), {}).get(asset_b.get('genre'), 0.5)
    S_d = demographic_alignment(asset_a.get('target_demo', 'All'), asset_b.get('target_demo', 'All'))
    A_t = time_slot_score(asset_b, time_slot)
    F = min(1.0, math.log1p(cumulative_genre_minutes / 60.0) / 3.0)
    S_season = get_seasonality_score(asset_b, month, context)
    
    # New contextual features
    dow_fit = get_day_of_week_fit(asset_b, context)
    fest_boost = get_festival_boost(asset_b, context)
    
    features = {
        'embedding_similarity': S_g,
        'genre_similarity': S_genre,
        'demographic_alignment': S_d,
        'time_slot_fit': A_t,
        'genre_fatigue': F,
        'seasonality_fit': S_season,
        'day_of_week_fit': dow_fit,
        'festival_boost': fest_boost
    }
    
    # Base heuristic Z (with day-of-week and festival weights)
    z_base = 4.0 * S_g + 2.5 * S_genre + 3.0 * S_d + 2.0 * A_t - 2.5 * F + 3.0 * S_season + 1.5 * dow_fit + 2.0 * fest_boost - 10.0
    
    # Add XGBoost Tree ensemble score
    z_xgboost = evaluate_xgboost(features)
    
    # Final z
    z = z_base + z_xgboost
    
    try:
        drop_off = 1.0 / (1.0 + math.exp(z)) 
    except OverflowError:
        drop_off = 0.0 if z > 0 else 1.0
        
    return {
        'drop_off_probability': round(drop_off, 4),
        'retention_score': round(1.0 - drop_off, 4),
        'features': {k: round(v, 3) for k, v in features.items()}
    }

def expected_watch_duration(asset, retention_score):
    return (asset.get('duration_seconds', 0) / 60.0) * retention_score

import datetime

def predict_sequence(schedule_ids, target_date_iso=None):
    predictions = []
    start_hour = 0
    month = 1
    context = None
    
    if target_date_iso:
        try:
            dt = datetime.datetime.fromisoformat(target_date_iso.replace('Z', '+00:00'))
            start_hour = dt.hour
            month = dt.month
            context = get_context(dt)
        except:
            pass
            
    current_hour = start_hour
    cumulative_genre_minutes = 0
    current_genre = None
    
    assets = [get_asset(aid) for aid in schedule_ids if get_asset(aid)]
    if not assets:
        return []
        
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
            
        trans = predict_transition(asset_a, asset_b, current_hour, cumulative_genre_minutes, month, context)
        trans['asset_id'] = asset_b['id']
        predictions.append(trans)
        
        current_time_seconds += asset_b['duration_seconds']
        
    return predictions
