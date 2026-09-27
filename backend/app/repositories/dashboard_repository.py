from backend.app.db import get_connection


def get_all_context_events():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM context_events ORDER BY date ASC"
        ).fetchall()
    return [dict(row) for row in rows]


def get_all_change_results():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM change_results ORDER BY date DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def get_dashboard_context():
    events = get_all_context_events()
    if not events:
        return []
    return events
