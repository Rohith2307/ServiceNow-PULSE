import sqlite3

from backend.app.config.settings import DB_PATH


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS students (
                student_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                year INTEGER NOT NULL,
                program TEXT NOT NULL,
                cohort_group TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS pulses (
                pulse_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                date TEXT NOT NULL,
                wellbeing_level INTEGER NOT NULL,
                concerns TEXT,
                optional_note TEXT,
                FOREIGN KEY(student_id) REFERENCES students(student_id)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS signals (
                signal_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                date TEXT NOT NULL,
                attendance_change REAL,
                deadline_change REAL,
                extension_count INTEGER,
                support_requests INTEGER,
                academic_pressure REAL,
                sleep_concern REAL,
                financial_concern REAL,
                FOREIGN KEY(student_id) REFERENCES students(student_id)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS context_events (
                event_id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_description TEXT,
                assessment_period INTEGER NOT NULL,
                semester_phase TEXT,
                major_deadline_flag INTEGER NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS change_results (
                result_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                date TEXT NOT NULL,
                status TEXT NOT NULL,
                direction TEXT NOT NULL,
                persistence INTEGER NOT NULL,
                magnitude TEXT,
                signal_convergence INTEGER NOT NULL,
                context TEXT,
                support_signal TEXT,
                explanation TEXT,
                recommended_actions TEXT,
                FOREIGN KEY(student_id) REFERENCES students(student_id)
            )
            """
        )
