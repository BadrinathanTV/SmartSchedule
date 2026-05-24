def parse_intent(text):
    text = text.lower()
    
    filters = {}
    weights = {'retention': 1.0, 'watch_time': 1.0, 'ad_revenue': 1.0}
    constraints = []
    
    if "family" in text or "kids" in text or "children" in text:
        filters['rating_max'] = 'PG'
        constraints.append("Enforce family-safe blocks")
        weights['retention'] = 1.5
        
    if "revenue" in text or "ad" in text or "monetize" in text:
        weights['ad_revenue'] = 2.0
        constraints.append("Maximize ad insertions")
        
    if "binge" in text or "marathon" in text or "retention" in text:
        weights['retention'] = 2.0
        weights['watch_time'] = 1.5
        constraints.append("Optimize for continuous viewing")
        
    if "evening" in text or "night" in text:
        filters['time_slot'] = 'evening'
        
    if "action" in text:
        filters['genre'] = 'Action'
    elif "drama" in text:
        filters['genre'] = 'Drama'
    elif "comedy" in text:
        filters['genre'] = 'Comedy'
        
    return {
        "filters": filters,
        "weights": weights,
        "constraints": constraints,
        "parsed_message": f"Parsed intent: Focus on {'revenue' if weights['ad_revenue'] > 1 else 'retention'}. Constraints applied: {', '.join(constraints) if constraints else 'None'}."
    }
