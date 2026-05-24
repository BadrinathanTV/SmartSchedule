import uvicorn

from server.api import app

PORT = 8000


def main() -> None:
    print(r"""
    ___  ___      _______        _____                      __  __ 
    |  \/  |     /  ___| |      /  __ \                    |  \/  |
    | .  . | __ _\ `--.| |_ ___ | /  \/_ __ _____      __  | .  . |
    | |\/| |/ _` |`--. \ __/ _ \| |   | '__/ _ \ \ /\ / /  | |\/| |
    | |  | | (_| /\__/ / ||  __/| \__/\ | | (_) \ V  V /   | |  | |
    \_|  |_/\__,_\____/ \__\___| \____/_|  \___/ \_/\_/    \_|  |_/
    
    SmartSchedule Backend (FastAPI)
    """)
    print(f"Starting API on http://localhost:{PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)


if __name__ == "__main__":
    main()
