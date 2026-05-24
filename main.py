import http.server
import socketserver
import os
import sys

# Change working directory so that SimpleHTTPRequestHandler serves from static/
web_dir = os.path.join(os.path.dirname(__file__), 'static')
if not os.path.exists(web_dir):
    os.makedirs(web_dir)
os.chdir(web_dir)

# Add the parent directory to sys.path so we can import server package
sys.path.insert(0, os.path.dirname(web_dir))
from server.handler import SmartScheduleHandler

PORT = 8000

def main():
    print(r"""
    ___  ___      _______        _____                      __  __ 
    |  \/  |     /  ___| |      /  __ \                    |  \/  |
    | .  . | __ _\ `--.| |_ ___ | /  \/_ __ _____      __  | .  . |
    | |\/| |/ _` |`--. \ __/ _ \| |   | '__/ _ \ \ /\ / /  | |\/| |
    | |  | | (_| /\__/ / ||  __/| \__/\ | | (_) \ V  V /   | |  | |
    \_|  |_/\__,_\____/ \__\___| \____/_|  \___/ \_/\_/    \_|  |_/
    
    Amagi Smart Scheduler & Playout Simulator (Zero-Dependency)
    """)
    print(f"Starting server on port {PORT}...")
    
    with socketserver.TCPServer(("", PORT), SmartScheduleHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()
            sys.exit(0)

if __name__ == "__main__":
    main()
