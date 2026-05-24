import datetime

def check_rights_window(asset, current_datetime):
    if not asset.get('license_start') or not asset.get('license_end'):
        return True
    try:
        start = datetime.datetime.fromisoformat(asset['license_start'].replace('Z', '+00:00'))
        end = datetime.datetime.fromisoformat(asset['license_end'].replace('Z', '+00:00'))
        return start <= current_datetime <= end
    except:
        return True

def check_geo_restriction(asset, region):
    geo_allow = asset.get('geo_allow', [])
    if not geo_allow:
        return True
    return region in geo_allow

def check_rating_timeslot(asset, hour):
    rating = asset.get('rating', 'G')
    if rating in ['R', 'TV-MA']:
        # Only allow late night
        if 6 <= hour < 20:
            return False
    return True

def validate_schedule(schedule_assets, start_hour, region, start_date_iso):
    current_dt = datetime.datetime.fromisoformat(start_date_iso.replace('Z', '+00:00'))
    current_time_seconds = 0
    violations = []
    
    recent_ads = []

    for idx, asset in enumerate(schedule_assets):
        current_hour = (start_hour + int(current_time_seconds / 3600)) % 24
        
        if not check_rights_window(asset, current_dt):
            violations.append({"index": idx, "asset_id": asset['id'], "title": asset.get('title'), "reason": "License expired or not started", "severity": "HIGH"})
        
        if not check_geo_restriction(asset, region):
            violations.append({"index": idx, "asset_id": asset['id'], "title": asset.get('title'), "reason": f"Geo-blocked in {region}", "severity": "HIGH"})
            
        if not check_rating_timeslot(asset, current_hour):
            violations.append({"index": idx, "asset_id": asset['id'], "title": asset.get('title'), "reason": f"Rating {asset.get('rating')} not allowed at {current_hour}:00", "severity": "MEDIUM"})
            
        if asset.get('type') == 'Ad':
            if asset['id'] in recent_ads:
                violations.append({"index": idx, "asset_id": asset['id'], "title": asset.get('title'), "reason": "Ad fatigue (repeated brand)", "severity": "LOW"})
            recent_ads.append(asset['id'])
            if len(recent_ads) > 3:
                recent_ads.pop(0)

        current_time_seconds += asset.get('duration_seconds', 0)
        current_dt += datetime.timedelta(seconds=asset.get('duration_seconds', 0))

    return violations
