import http.server
import json
import urllib.parse
from server.catalog import CONTENT_LIBRARY
from server.predictor import predict_sequence
from server.optimizer import simulated_annealing_optimizer, utility
from server.intent_parser import parse_intent
from server.self_heal import heal_schedule
from server.simulator import simulate_outcomes

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
                start_hour = payload.get("start_hour", 0)
                predictions = predict_sequence(schedule, start_hour)
                self.send_json_response({"predictions": predictions})
            elif path == "/api/optimize":
                schedule = payload.get("schedule", [])
                weights = payload.get("weights", {'retention': 1.0, 'watch_time': 1.0, 'ad_revenue': 1.0})
                start_hour = payload.get("start_hour", 0)
                
                initial_utility = utility(schedule, start_hour, weights)
                opt_sched, opt_util, curr_util, log = simulated_annealing_optimizer(schedule, weights, start_hour)
                
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
                start_hour = payload.get("start_hour", 0)
                
                outcomes = simulate_outcomes(schedule_before, schedule_after, start_hour)
                self.send_json_response(outcomes)
            else:
                self.send_error(404, "API endpoint not found")
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path == "/api/assets":
            self.send_json_response(CONTENT_LIBRARY)
        else:
            # Fallback to serving static files
            super().do_GET()
            
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
