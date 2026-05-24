import random
import copy
import math
from server.catalog import get_asset
from server.predictor import predict_sequence, expected_watch_duration

def calculate_ad_revenue(schedule_assets):
    revenue = 0
    for asset in schedule_assets:
        if asset['type'] == 'Ad':
            revenue += 10
        revenue += len(asset.get('scte35_breaks', [])) * 50
    return revenue

def utility(schedule_ids, target_date_iso, weights):
    predictions = predict_sequence(schedule_ids, target_date_iso)
    if not predictions:
        return 0.0
    
    avg_retention = sum(p['retention_score'] for p in predictions) / len(predictions)
    
    watch_time = 0.0
    assets = [get_asset(aid) for aid in schedule_ids if get_asset(aid)]
    for i, p in enumerate(predictions):
        watch_time += expected_watch_duration(assets[i], p['retention_score'])
        
    ad_revenue = calculate_ad_revenue(assets)
    
    norm_retention = avg_retention * 100 
    norm_watch_time = min(watch_time / 60.0, 100) 
    norm_revenue = min(ad_revenue / 1000.0 * 100, 100)
    
    return weights.get('retention', 1.0) * norm_retention + \
           weights.get('watch_time', 1.0) * norm_watch_time + \
           weights.get('ad_revenue', 1.0) * norm_revenue

def simulated_annealing_optimizer(schedule_ids, weights, target_date_iso=None, temp=100.0, cooling=0.95, min_temp=1.0):
    # Save the global random state to prevent side effects in other modules
    original_state = random.getstate()
    random.seed(42)  # Enforce local deterministic seeding for stable trajectories
    
    current_schedule = list(schedule_ids)
    current_utility = utility(current_schedule, target_date_iso, weights)
    best_schedule = list(current_schedule)
    best_utility = current_utility
    
    reasoning_log = []
    reasoning_log.append(f"Starting SA optimization (Stabilized trajectory). Initial utility: {current_utility:.2f}")
    
    iterations = 0
    while temp > min_temp:
        iterations += 1
        if len(current_schedule) < 2:
            break
            
        idx1 = random.randint(0, len(current_schedule) - 1)
        idx2 = min(max(idx1 + random.choice([-1, 1]), 0), len(current_schedule) - 1)
        
        if idx1 == idx2:
            continue
            
        candidate = list(current_schedule)
        candidate[idx1], candidate[idx2] = candidate[idx2], candidate[idx1]
        
        candidate_utility = utility(candidate, target_date_iso, weights)
        
        if candidate_utility > current_utility:
            current_schedule = candidate
            current_utility = candidate_utility
            if candidate_utility > best_utility:
                best_schedule = list(candidate)
                best_utility = candidate_utility
            
            if iterations % 5 == 0:
                asset_a_title = get_asset(current_schedule[idx2])['title']
                asset_b_title = get_asset(current_schedule[idx1])['title']
                reasoning_log.append(f"Swapped '{asset_a_title}' and '{asset_b_title}'. Utility increased to {current_utility:.2f}.")
                
        else:
            acceptance_probability = math.exp((candidate_utility - current_utility) / temp)
            if random.random() < acceptance_probability:
                current_schedule = candidate
                current_utility = candidate_utility
                
        temp *= cooling
        
    reasoning_log.append(f"Finished after {iterations} iterations. Final utility: {best_utility:.2f}")
    
    # Restore the original global random state
    random.setstate(original_state)
    
    return best_schedule, best_utility, current_utility, reasoning_log
