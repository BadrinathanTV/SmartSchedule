import datetime
from server.catalog import CONTENT_LIBRARY, cosine_similarity
from server.constraints import validate_schedule

def detect_violations(schedule_assets, start_hour, region, start_date_iso):
    return validate_schedule(schedule_assets, start_hour, region, start_date_iso)

def find_replacement(failed_asset, schedule_assets, region, current_dt):
    best_match = None
    best_score = -1
    
    from server.constraints import check_rights_window, check_geo_restriction
    
    for candidate in CONTENT_LIBRARY:
        if candidate['id'] == failed_asset['id']:
            continue
            
        if candidate['type'] != failed_asset['type']:
            continue
            
        if not check_rights_window(candidate, current_dt):
            continue
        if not check_geo_restriction(candidate, region):
            continue
            
        score = cosine_similarity(failed_asset.get('embedding'), candidate.get('embedding'))
        if score > best_score:
            best_score = score
            best_match = candidate
            
    return best_match, best_score

def heal_schedule(schedule_ids, start_hour, region, start_date_iso):
    from server.catalog import get_asset
    
    schedule_assets = [get_asset(aid) for aid in schedule_ids if get_asset(aid)]
    violations = detect_violations(schedule_assets, start_hour, region, start_date_iso)
    
    if not violations:
        return schedule_ids, []
        
    changes_log = []
    healed_ids = list(schedule_ids)
    
    violations.sort(key=lambda x: x['index'], reverse=True)
    
    for v in violations:
        idx = v['index']
        failed_asset = schedule_assets[idx]
        
        current_time_seconds = sum(a.get('duration_seconds', 0) for a in schedule_assets[:idx])
        current_dt = datetime.datetime.fromisoformat(start_date_iso.replace('Z', '+00:00')) + datetime.timedelta(seconds=current_time_seconds)
        
        replacement, score = find_replacement(failed_asset, schedule_assets, region, current_dt)
        
        if replacement:
            healed_ids[idx] = replacement['id']
            changes_log.append({
                "original_id": failed_asset['id'],
                "original_title": failed_asset.get('title'),
                "replacement_id": replacement['id'],
                "replacement_title": replacement.get('title'),
                "reason": v['reason'],
                "similarity_score": round(score, 3)
            })
        else:
            healed_ids.pop(idx)
            changes_log.append({
                "original_id": failed_asset['id'],
                "original_title": failed_asset.get('title'),
                "replacement_id": None,
                "replacement_title": "REMOVED",
                "reason": v['reason'] + " (No valid replacement found)",
                "similarity_score": 0.0
            })
            
    return healed_ids, changes_log
