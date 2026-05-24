import http.server
import json
import urllib.parse
from server.catalog import CONTENT_LIBRARY
from server.predictor import predict_sequence
from server.optimizer import simulated_annealing_optimizer, utility
from server.intent_parser import parse_intent
from server.self_heal import heal_schedule, full_qc_scan
from server.simulator import simulate_outcomes
from server.qc_engine import run_qc
from server.ad_engine import generate_scte35_markers
from server.gap_filler import fill_schedule_gaps
from server.telemetry import record_heartbeat, get_retention_stats
import server.train as ai_trainer
from server.audience_sim import get_live_audience, get_audience_history
from server.recommender import recommend_next
from server.calendar_brain import get_context

class SmartScheduleHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith("/api/"):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                payload = json.loads(post_data) if post_data else {}
            except json.JSONDecodeError:
                self.send_error(400, "Invalid JSON payload")
                return

            if path == "/api/predict":
                schedule = payload.get("schedule", [])
                target_date_iso = payload.get("target_date_iso", None)
                predictions = predict_sequence(schedule, target_date_iso)
                self.send_json_response({"predictions": predictions})
            elif path == "/api/optimize":
                schedule = payload.get("schedule", [])
                weights = payload.get("weights", {'retention': 1.0, 'watch_time': 1.0, 'ad_revenue': 1.0})
                target_date_iso = payload.get("target_date_iso", None)
                
                initial_utility = utility(schedule, target_date_iso, weights)
                opt_sched, opt_util, curr_util, log = simulated_annealing_optimizer(schedule, weights, target_date_iso)
                
                self.send_json_response({
                    "optimized_schedule": opt_sched,
                    "utility_before": initial_utility,
                    "utility_after": opt_util,
                    "reasoning_log": log
                })
            elif path == "/api/parse-intent":
                text = payload.get("text", "")
                result = parse_intent(text)
                self.send_json_response(result)
            elif path == "/api/self-heal":
                schedule = payload.get("schedule", [])
                datetime_str = payload.get("datetime", "2025-01-01T00:00:00Z")
                region = payload.get("region", "US")
                
                healed_schedule, logs = heal_schedule(schedule, 0, region, datetime_str)
                self.send_json_response({
                    "healed_schedule": healed_schedule,
                    "changes_log": logs
                })
            elif path == "/api/simulate":
                schedule_before = payload.get("schedule_before", [])
                schedule_after = payload.get("schedule_after", [])
                target_date_iso = payload.get("target_date_iso", None)
                
                outcomes = simulate_outcomes(schedule_before, schedule_after, target_date_iso)
                self.send_json_response(outcomes)
            elif path == "/api/qc":
                schedule = payload.get("schedule", [])
                datetime_str = payload.get("datetime", "2025-01-01T12:00:00Z")
                region = payload.get("region", "US")
                result = full_qc_scan(schedule, datetime_str, region)
                self.send_json_response(result)
            elif path == "/api/scte35":
                asset_id = payload.get("asset_id")
                breaks = payload.get("requested_ad_breaks", 3)
                result = generate_scte35_markers(asset_id, breaks)
                self.send_json_response(result)
            elif path == "/api/fill-gaps":
                schedule = payload.get("schedule", [])
                target_duration = payload.get("target_duration_seconds", 3600)
                result = fill_schedule_gaps(schedule, target_duration)
                self.send_json_response(result)
            elif path == "/api/telemetry/heartbeat":
                asset_id = payload.get("asset_id")
                watched_percentage = payload.get("watched_percentage", 0.0)
                record_heartbeat(asset_id, watched_percentage)
                self.send_json_response({"status": "recorded"})
            elif path == "/api/retrain":
                result = ai_trainer.retrain_model()
                self.send_json_response(result)
            elif path == "/api/recommend":
                schedule = payload.get("schedule", [])
                target_date_iso = payload.get("target_date_iso", None)
                region = payload.get("region", "US")
                top_n = payload.get("top_n", 5)
                result = recommend_next(schedule, target_date_iso, region, top_n)
                self.send_json_response(result)
            else:
                self.send_error(404, "API endpoint not found")
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        qs = urllib.parse.parse_qs(parsed_path.query)
        
        if path == "/api/assets":
            self.send_json_response(CONTENT_LIBRARY)
        elif path == "/api/audience/live":
            dt_param = qs.get('datetime', [None])[0]
            result = get_live_audience(dt_param)
            self.send_json_response(result)
        elif path == "/api/audience/history":
            dt_param = qs.get('datetime', [None])[0]
            hours = int(qs.get('hours', ['24'])[0])
            result = get_audience_history(dt_param, hours)
            self.send_json_response(result)
        elif path == "/api/context":
            dt_param = qs.get('datetime', [None])[0]
            if dt_param:
                result = get_context(dt_param)
            else:
                import datetime
                result = get_context(datetime.datetime.now(datetime.timezone.utc))
            self.send_json_response(result)
        else:
            super().do_GET()
            
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
