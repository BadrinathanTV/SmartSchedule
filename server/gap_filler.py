from server.catalog import CONTENT_LIBRARY, get_asset

def fill_schedule_gaps(schedule_ids, target_duration_seconds):
    current_duration = 0
    for aid in schedule_ids:
        asset = get_asset(aid)
        if asset:
            current_duration += asset.get('duration_seconds', 0)
            
    gap = target_duration_seconds - current_duration
    
    if gap <= 0:
        return {
            "status": "NO_GAP_OR_OVERFLOW",
            "gap_seconds": gap,
            "filler_items": [],
            "final_schedule": schedule_ids
        }
        
    # Get promos/ads that can be used for filling
    fillers = [a for a in CONTENT_LIBRARY if a.get('type') in ['Promo', 'Ad']]
    # Sort by duration descending
    fillers.sort(key=lambda x: x['duration_seconds'], reverse=True)
    
    added_fillers = []
    remaining_gap = gap
    
    # Simple Greedy Knapsack for gap filling
    while remaining_gap > 0:
        found = False
        for filler in fillers:
            if filler['duration_seconds'] <= remaining_gap:
                added_fillers.append(filler['id'])
                remaining_gap -= filler['duration_seconds']
                found = True
                break
        
        if not found:
            break # Can't fill the rest
            
    new_schedule = schedule_ids + added_fillers
    
    return {
        "status": "SUCCESS" if remaining_gap == 0 else "PARTIAL_FILL",
        "original_gap": gap,
        "remaining_gap": remaining_gap,
        "filler_items": added_fillers,
        "final_schedule": new_schedule
    }
