"""
AI Recommendation Engine

Scores every asset in the catalog and recommends the best next items to
schedule based on:
  1. Calendar context (day, time, festivals)
  2. Live audience demand (which genres are trending)
  3. Transition quality (flow from the last scheduled item)
  4. Freshness (avoid repeats)
"""
from server.catalog import CONTENT_LIBRARY, cosine_similarity
from server.calendar_brain import get_context, get_genre_score_for_context
from server.audience_sim import get_live_audience
from server.predictor import predict_transition
import datetime


def recommend_next(current_schedule_ids, target_datetime, region="US", top_n=5):
    """
    Returns the top N recommended assets to schedule next.
    
    Args:
        current_schedule_ids: list of asset IDs already in the schedule
        target_datetime: ISO datetime string for when the next slot starts
        region: geo region
        top_n: number of recommendations to return
    """
    from server.catalog import get_asset
    from server.constraints import check_rights_window, check_geo_restriction, check_rating_timeslot
    
    if isinstance(target_datetime, str):
        dt = datetime.datetime.fromisoformat(target_datetime.replace('Z', '+00:00'))
    else:
        dt = target_datetime
    
    # Calculate when the next slot actually starts (after current schedule ends)
    total_duration = 0
    for aid in current_schedule_ids:
        asset = get_asset(aid)
        if asset:
            total_duration += asset.get('duration_seconds', 0)
    next_slot_dt = dt + datetime.timedelta(seconds=total_duration)
    
    # Get context and audience for the next slot
    context = get_context(next_slot_dt)
    audience = get_live_audience(next_slot_dt)
    
    # Get the last asset in the schedule for transition scoring
    last_asset = None
    if current_schedule_ids:
        last_asset = get_asset(current_schedule_ids[-1])
    
    # Score every candidate
    scored = []
    existing_ids = set(current_schedule_ids)
    
    cumulative_genre_minutes = 0
    if last_asset:
        # Count how many minutes of the same genre are already in schedule
        for aid in current_schedule_ids:
            a = get_asset(aid)
            if a and a.get('genre') == (last_asset.get('genre') if last_asset else ''):
                cumulative_genre_minutes += a.get('duration_seconds', 0) / 60.0
    
    for candidate in CONTENT_LIBRARY:
        # Skip already scheduled
        if candidate['id'] in existing_ids:
            continue
            
        # Skip promos and ads (user schedules content, not filler)
        if candidate.get('type') in ['Promo', 'Ad']:
            continue
        
        # Compliance pre-filter
        if not check_rights_window(candidate, next_slot_dt):
            continue
        if not check_geo_restriction(candidate, region):
            continue
        if not check_rating_timeslot(candidate, next_slot_dt.hour):
            continue
        
        # ── SCORING ─────────────────────────────────────────────
        
        # 1. Context Fit (day + time + festival boost for this genre)
        genre = candidate.get('genre', '')
        context_score = context["genre_boosts"].get(genre, 1.0)
        # Normalize to 0-1 range (boosts typically range from 1.0 to ~3.0)
        context_fit = min(1.0, (context_score - 1.0) / 2.0 + 0.3)
        
        # 2. Audience Demand (what % of the live audience wants this genre)
        demand_pct = audience["genre_demand"].get(genre, 0.0)
        audience_demand = min(1.0, demand_pct / 25.0)  # 25%+ demand = max score
        
        # 3. Transition Quality (embedding similarity + demographic alignment)
        transition_score = 0.5
        reasons = []
        if last_asset:
            trans = predict_transition(last_asset, candidate, next_slot_dt.hour, cumulative_genre_minutes, next_slot_dt.month)
            transition_score = trans['retention_score']
        
        # 4. Freshness (penalize if genre already heavily scheduled)
        genre_count = sum(1 for aid in current_schedule_ids if get_asset(aid) and get_asset(aid).get('genre') == genre)
        freshness = max(0.1, 1.0 - (genre_count * 0.2))
        
        # 5. Demo alignment with time slot
        demo = candidate.get('target_demo', 'All')
        demo_boost = context.get("demo_boosts", {}).get(demo, 1.0)
        demo_fit = min(1.0, demo_boost / 1.5)
        
        # ── WEIGHTED FINAL SCORE ────────────────────────────────
        final_score = (
            0.30 * context_fit +
            0.25 * audience_demand +
            0.20 * transition_score +
            0.15 * freshness +
            0.10 * demo_fit
        )
        
        # Build reasoning
        reasoning_parts = []
        if context_score > 1.2:
            reasoning_parts.append(f"{genre} is boosted {context_score:.1f}x for {context['time_slot']} on {context['day_of_week']}")
        if context["is_festival"]:
            reasoning_parts.append(f"Festival boost: {', '.join(context['active_festivals'])}")
        if demand_pct > 15:
            reasoning_parts.append(f"{genre} has {demand_pct:.0f}% live audience demand")
        if transition_score > 0.7:
            reasoning_parts.append(f"Smooth transition from previous ({transition_score:.0%} retention)")
        if freshness < 0.5:
            reasoning_parts.append(f"⚠ Genre fatigue warning ({genre_count} already scheduled)")
        
        scored.append({
            "asset_id": candidate['id'],
            "title": candidate.get('title'),
            "genre": genre,
            "type": candidate.get('type'),
            "rating": candidate.get('rating'),
            "duration_minutes": round(candidate.get('duration_seconds', 0) / 60),
            "target_demo": candidate.get('target_demo'),
            "final_score": round(final_score, 3),
            "breakdown": {
                "context_fit": round(context_fit, 3),
                "audience_demand": round(audience_demand, 3),
                "transition_quality": round(transition_score, 3),
                "freshness": round(freshness, 3),
                "demo_fit": round(demo_fit, 3)
            },
            "reasoning": " | ".join(reasoning_parts) if reasoning_parts else f"{genre} is a solid choice for {context['time_slot']}"
        })
    
    # Sort by score, return top N
    scored.sort(key=lambda x: -x["final_score"])
    
    return {
        "recommendations": scored[:top_n],
        "context_summary": f"{context['day_of_week']} {context['time_slot']}" + (f" • {'  '.join(context['active_festivals'])}" if context['active_festivals'] else ""),
        "total_candidates_scored": len(scored)
    }
