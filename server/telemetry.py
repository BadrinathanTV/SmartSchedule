import sqlite3
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'telemetry.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS heartbeats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            asset_id TEXT,
            watched_percentage REAL
        )
    ''')
    conn.commit()
    conn.close()

def record_heartbeat(asset_id, watched_percentage):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    c.execute('INSERT INTO heartbeats (timestamp, asset_id, watched_percentage) VALUES (?, ?, ?)', 
              (timestamp, asset_id, watched_percentage))
    conn.commit()
    conn.close()

def get_retention_stats():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        SELECT asset_id, AVG(watched_percentage) as avg_retention, COUNT(*) as views
        FROM heartbeats
        GROUP BY asset_id
    ''')
    stats = [{"asset_id": row[0], "avg_retention": row[1], "views": row[2]} for row in c.fetchall()]
    conn.close()
    return stats

init_db()
