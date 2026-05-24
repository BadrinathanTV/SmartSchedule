from server.catalog import get_asset

def run_qc(schedule_ids):
    assets = [get_asset(aid) for aid in schedule_ids if get_asset(aid)]
    errors = []
    warnings = []
    
    if not assets:
        return {"errors": ["Schedule is empty."], "warnings": [], "status": "FAIL"}
        
    for i in range(len(assets)):
        asset = assets[i]
        
        # 1. Metadata check
        if not asset.get('description'):
            warnings.append(f"[{i}] {asset['id']}: Missing description metadata.")
            
        # 2. Sequential checks
        if i > 0:
            prev_asset = assets[i-1]
            
            # Loudness Jump Simulation
            # E.g. Action/Intense to Calm
            if prev_asset.get('mood') == 'Intense' and asset.get('mood') == 'Calm':
                warnings.append(f"[{i}] {asset['id']}: Potential Loudness/Mood jar from previous 'Intense' asset.")
                
            # Rating clash
            high_ratings = ['R', 'TV-MA']
            kids_ratings = ['G', 'TV-Y', 'TV-G']
            if prev_asset.get('rating') in high_ratings and asset.get('rating') in kids_ratings:
                errors.append(f"[{i}] {asset['id']}: Rating clash. {prev_asset.get('rating')} followed directly by {asset.get('rating')}.")
                
            # Ad-to-Ad validation (ensure not same brand back-to-back)
            if prev_asset.get('type') == 'Ad' and asset.get('type') == 'Ad':
                if prev_asset['id'] == asset['id']:
                    errors.append(f"[{i}] {asset['id']}: Back-to-back identical ad insertion is prohibited by policy.")
                    
    status = "FAIL" if errors else ("WARN" if warnings else "PASS")
    return {
        "status": status,
        "errors": errors,
        "warnings": warnings,
        "total_assets_checked": len(assets)
    }
