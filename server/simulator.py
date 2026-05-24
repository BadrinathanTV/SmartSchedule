from server.predictor import predict_sequence, expected_watch_duration
from server.catalog import get_asset
from server.optimizer import calculate_ad_revenue

def simulate_outcomes(schedule_before_ids, schedule_after_ids, target_date_iso=None):
    pred_before = predict_sequence(schedule_before_ids, target_date_iso)
    pred_after = predict_sequence(schedule_after_ids, target_date_iso)
    
    assets_before = [get_asset(aid) for aid in schedule_before_ids if get_asset(aid)]
    assets_after = [get_asset(aid) for aid in schedule_after_ids if get_asset(aid)]
    
    wt_before = sum(expected_watch_duration(assets_before[i], p['retention_score']) for i, p in enumerate(pred_before)) if pred_before else 0
    wt_after = sum(expected_watch_duration(assets_after[i], p['retention_score']) for i, p in enumerate(pred_after)) if pred_after else 0
    
    rev_before = calculate_ad_revenue(assets_before)
    rev_after = calculate_ad_revenue(assets_after)
    
    retention_before = sum(p['retention_score'] for p in pred_before) / len(pred_before) if pred_before else 0
    retention_after = sum(p['retention_score'] for p in pred_after) / len(pred_after) if pred_after else 0
    
    wt_change = ((wt_after - wt_before) / max(wt_before, 1)) * 100
    rev_change = ((rev_after - rev_before) / max(rev_before, 1)) * 100
    ret_change = ((retention_after - retention_before) / max(retention_before, 0.01)) * 100
    
    return {
        "retention_curve_before": [p['retention_score'] for p in pred_before],
        "retention_curve_after": [p['retention_score'] for p in pred_after],
        "total_watch_time_before": round(wt_before, 2),
        "total_watch_time_after": round(wt_after, 2),
        "ad_revenue_before": rev_before,
        "ad_revenue_after": rev_after,
        "delta_summary": {
            "retention_change": f"{'+' if ret_change >= 0 else ''}{ret_change:.1f}%",
            "watch_time_change": f"{'+' if wt_change >= 0 else ''}{wt_change:.1f}%",
            "revenue_change": f"{'+' if rev_change >= 0 else ''}{rev_change:.1f}%"
        }
    }
