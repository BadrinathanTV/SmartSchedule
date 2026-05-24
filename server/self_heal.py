import datetime
from server.catalog import CONTENT_LIBRARY, cosine_similarity
from server.constraints import validate_schedule

def detect_violations(schedule_assets, start_hour, region, start_date_iso):
    return validate_schedule(schedule_assets, start_hour, region, start_date_iso)

def find_replacement(failed_asset, schedule_assets, region, current_dt):
    best_match = None
    best_score = -1
    
    from server.constraints import check_rights_window, check_geo_restriction, check_rating_timeslot
    
    for candidate in CONTENT_LIBRARY:
        if candidate['id'] == failed_asset['id']:
            continue
            
        if candidate['type'] != failed_asset['type']:
            continue

        # Don't pick something already in the schedule
        existing_ids = {a['id'] for a in schedule_assets}
        if candidate['id'] in existing_ids:
            continue
            
        if not check_rights_window(candidate, current_dt):
            continue
        if not check_geo_restriction(candidate, region):
            continue
        if not check_rating_timeslot(candidate, current_dt.hour):
            continue
            
        score = cosine_similarity(failed_asset.get('embedding'), candidate.get('embedding'))
        if score > best_score:
            best_score = score
            best_match = candidate
            
    return best_match, best_score

def full_qc_scan(schedule_ids, start_date_iso, region):
    """Run a comprehensive QC scan that returns per-asset results."""
    from server.catalog import get_asset
    from server.constraints import check_rights_window, check_geo_restriction, check_rating_timeslot

    schedule_assets = [get_asset(aid) for aid in schedule_ids if get_asset(aid)]
    
    if not schedule_assets:
        return {"checks": [], "summary": {"total": 0, "passed": 0, "warnings": 0, "errors": 0}}

    current_dt = datetime.datetime.fromisoformat(start_date_iso.replace('Z', '+00:00'))
    checks = []
    recent_ads = []
    total_errors = 0
    total_warnings = 0

    for idx, asset in enumerate(schedule_assets):
        current_hour = current_dt.hour
        asset_checks = []

        # 1. License / Rights Window
        rights_ok = check_rights_window(asset, current_dt)
        asset_checks.append({
            "check": "License Rights Window",
            "status": "PASS" if rights_ok else "FAIL",
            "detail": f"Valid until {asset.get('license_end', 'N/A')}" if rights_ok else "License expired or not yet active"
        })
        if not rights_ok:
            total_errors += 1

        # 2. Geo Restriction
        geo_ok = check_geo_restriction(asset, region)
        asset_checks.append({
            "check": "Geo Restriction",
            "status": "PASS" if geo_ok else "FAIL",
            "detail": f"Allowed in {region}" if geo_ok else f"Blocked in {region}. Allowed: {', '.join(asset.get('geo_allow', []))}"
        })
        if not geo_ok:
            total_errors += 1

        # 3. Rating / Timeslot
        rating_ok = check_rating_timeslot(asset, current_hour)
        asset_checks.append({
            "check": "Rating vs Timeslot",
            "status": "PASS" if rating_ok else "FAIL",
            "detail": f"{asset.get('rating', 'G')} is fine at {current_hour}:00" if rating_ok else f"{asset.get('rating')} content not allowed between 6:00-20:00"
        })
        if not rating_ok:
            total_errors += 1

        # 4. Ad Fatigue
        if asset.get('type') == 'Ad':
            ad_ok = asset['id'] not in recent_ads
            asset_checks.append({
                "check": "Ad Fatigue",
                "status": "PASS" if ad_ok else "WARN",
                "detail": "No repeat within window" if ad_ok else "Same ad repeated within 3 slots"
            })
            if not ad_ok:
                total_warnings += 1
            recent_ads.append(asset['id'])
            if len(recent_ads) > 3:
                recent_ads.pop(0)

        # 5. Metadata Completeness
        has_desc = bool(asset.get('description'))
        has_emb = bool(asset.get('embedding'))
        meta_ok = has_desc and has_emb
        asset_checks.append({
            "check": "Metadata Completeness",
            "status": "PASS" if meta_ok else "WARN",
            "detail": "All metadata present" if meta_ok else f"Missing: {', '.join(f for f, v in [('description', has_desc), ('embedding', has_emb)] if not v)}"
        })
        if not meta_ok:
            total_warnings += 1

        # 6. Sequential Mood Jar
        if idx > 0:
            prev = schedule_assets[idx - 1]
            mood_jar = (prev.get('mood') == 'Intense' and asset.get('mood') == 'Calm') or \
                       (prev.get('mood') == 'Dark' and asset.get('mood') in ['Upbeat', 'Lighthearted'])
            asset_checks.append({
                "check": "Mood Transition",
                "status": "PASS" if not mood_jar else "WARN",
                "detail": f"Smooth transition from '{prev.get('mood')}'" if not mood_jar else f"Jarring mood shift: {prev.get('mood')} → {asset.get('mood')}"
            })
            if mood_jar:
                total_warnings += 1

            # 7. Rating clash 
            high = ['R', 'TV-MA']
            kids = ['G', 'TV-Y', 'TV-G']
            clash = prev.get('rating') in high and asset.get('rating') in kids
            asset_checks.append({
                "check": "Rating Adjacency",
                "status": "PASS" if not clash else "FAIL",
                "detail": "No rating clash" if not clash else f"Unsafe transition: {prev.get('rating')} → {asset.get('rating')}"
            })
            if clash:
                total_errors += 1

        overall = "FAIL" if any(c['status'] == 'FAIL' for c in asset_checks) else \
                  "WARN" if any(c['status'] == 'WARN' for c in asset_checks) else "PASS"

        checks.append({
            "index": idx,
            "asset_id": asset['id'],
            "title": asset.get('title'),
            "genre": asset.get('genre'),
            "rating": asset.get('rating'),
            "timeslot_hour": current_hour,
            "overall": overall,
            "checks": asset_checks
        })

        current_dt += datetime.timedelta(seconds=asset.get('duration_seconds', 0))
    
    passed = sum(1 for c in checks if c['overall'] == 'PASS')
    return {
        "checks": checks,
        "summary": {
            "total": len(checks),
            "passed": passed,
            "warnings": total_warnings,
            "errors": total_errors
        }
    }


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
