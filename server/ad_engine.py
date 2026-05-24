from server.catalog import get_asset

def generate_scte35_markers(asset_id, requested_ad_breaks=3, break_duration=120):
    asset = get_asset(asset_id)
    if not asset:
        return {"error": "Asset not found"}
        
    duration = asset.get('duration_seconds', 0)
    
    if duration < 1800:
        return {"error": "Asset too short for automated SCTE-35 insertion"}
        
    # SOTA approach: Avoid inserting ads in the first 10 mins or last 10 mins
    safe_start = 600
    safe_end = duration - 600
    
    if safe_end <= safe_start:
        return {"error": "Safe window too small"}
        
    available_window = safe_end - safe_start
    interval = available_window / (requested_ad_breaks + 1)
    
    markers = []
    for i in range(1, requested_ad_breaks + 1):
        # Insert marker with a bit of "smart" jitter (e.g. rounded to nearest 30s)
        raw_time = safe_start + (interval * i)
        smart_time = round(raw_time / 30.0) * 30
        markers.append({
            "splice_point_seconds": smart_time,
            "duration": break_duration,
            "marker_type": "/scte35/splice_insert"
        })
        
    return {
        "asset_id": asset_id,
        "original_duration": duration,
        "generated_markers": markers,
        "status": "success"
    }
