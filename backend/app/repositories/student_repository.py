from backend.app.db import get_connection


def get_students():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM students ORDER BY cohort_group, name"
        ).fetchall()
    return [dict(row) for row in rows]


def get_student(student_id: str):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM students WHERE student_id = ?",
            (student_id,),
        ).fetchone()
    return dict(row) if row else None


def save_change_result(result):
    with get_connection() as connection:
        connection.execute(
            """
            INSERT OR REPLACE INTO change_results (
                result_id,
                student_id,
                date,
                status,
                direction,
                persistence,
                magnitude,
                signal_convergence,
                context,
                support_signal,
                explanation,
                recommended_actions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"result-{result['student_id']}-{result['date']}",
                result["student_id"],
                result["date"],
                result["status"],
                result["direction"],
                1 if result["persistence"] else 0,
                result["magnitude"],
                1 if result["signal_convergence"] else 0,
                result["context"],
                result["support_signal"],
                result["explanation"],
                ";".join(result["recommended_actions"]),
            ),
        )
        connection.commit()
