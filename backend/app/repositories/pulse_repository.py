import json

from backend.app.db import get_connection


def get_pulses(student_id: str):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM pulses WHERE student_id = ? ORDER BY date ASC",
            (student_id,),
        ).fetchall()
    pulses = []
    for row in rows:
        pulse = dict(row)
        pulse["concerns"] = json.loads(pulse.get("concerns") or "[]")
        pulses.append(pulse)
    return pulses


def get_all_pulses():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM pulses ORDER BY student_id, date ASC"
        ).fetchall()
    pulses = []
    for row in rows:
        pulse = dict(row)
        pulse["concerns"] = json.loads(pulse.get("concerns") or "[]")
        pulses.append(pulse)
    return pulses


def get_signals(student_id: str):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM signals WHERE student_id = ? ORDER BY date ASC",
            (student_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_all_signals():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM signals ORDER BY student_id, date ASC"
        ).fetchall()
    return [dict(row) for row in rows]


def create_pulse(payload):
    pulse_id = f"pulse-{payload['student_id']}-{payload['date']}"
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO pulses (pulse_id, student_id, date, wellbeing_level, concerns, optional_note)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                pulse_id,
                payload["student_id"],
                payload["date"],
                int(payload["wellbeing_level"]),
                json.dumps(payload.get("concerns", [])),
                payload.get("optional_note"),
            ),
        )
        connection.commit()
    return get_pulses(payload["student_id"])
