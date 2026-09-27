import json
from pathlib import Path

from backend.app.db import get_connection


DEMO_STUDENTS = [
    {"student_id": "Aisha-202", "name": "Aisha", "year": 2, "program": "Engineering", "cohort_group": "Second Year Engineering"},
    {"student_id": "Priya-101", "name": "Priya", "year": 1, "program": "Engineering", "cohort_group": "First Year Engineering"},
    {"student_id": "Daniel-303", "name": "Daniel", "year": 3, "program": "Engineering", "cohort_group": "Third Year Engineering"},
    {"student_id": "Liam-214", "name": "Liam", "year": 2, "program": "Business", "cohort_group": "Second Year Business"},
    {"student_id": "Nina-118", "name": "Nina", "year": 1, "program": "Science", "cohort_group": "First Year Science"},
    {"student_id": "Sofia-401", "name": "Sofia", "year": 4, "program": "Health Sciences", "cohort_group": "Fourth Year Health Sciences"},
    {"student_id": "Marcus-221", "name": "Marcus", "year": 2, "program": "Engineering", "cohort_group": "Second Year Engineering"},
]

DEMO_PULSES = [
    {"pulse_id": "pulse-Aisha-1", "student_id": "Aisha-202", "date": "2026-W01", "wellbeing_level": 8, "concerns": ["academic pressure"], "optional_note": "Feeling steady."},
    {"pulse_id": "pulse-Aisha-2", "student_id": "Aisha-202", "date": "2026-W02", "wellbeing_level": 6, "concerns": ["academic pressure"], "optional_note": "Coursework feels heavier."},
    {"pulse_id": "pulse-Aisha-3", "student_id": "Aisha-202", "date": "2026-W03", "wellbeing_level": 5, "concerns": ["academic pressure", "sleep"], "optional_note": "Difficult week and sleep is affected."},
    {"pulse_id": "pulse-Aisha-4", "student_id": "Aisha-202", "date": "2026-W04", "wellbeing_level": 4, "concerns": ["academic pressure", "sleep"], "optional_note": "Very stretched and tired."},
    {"pulse_id": "pulse-Priya-1", "student_id": "Priya-101", "date": "2026-W01", "wellbeing_level": 7, "concerns": ["orientation"], "optional_note": "Adapting well."},
    {"pulse_id": "pulse-Priya-2", "student_id": "Priya-101", "date": "2026-W02", "wellbeing_level": 7, "concerns": ["orientation"], "optional_note": "Still settling in."},
    {"pulse_id": "pulse-Priya-3", "student_id": "Priya-101", "date": "2026-W03", "wellbeing_level": 6, "concerns": ["workload"], "optional_note": "A bit overloaded."},
    {"pulse_id": "pulse-Daniel-1", "student_id": "Daniel-303", "date": "2026-W01", "wellbeing_level": 8, "concerns": [], "optional_note": "Stable."},
    {"pulse_id": "pulse-Daniel-2", "student_id": "Daniel-303", "date": "2026-W02", "wellbeing_level": 8, "concerns": [], "optional_note": "Doing well."},
    {"pulse_id": "pulse-Daniel-3", "student_id": "Daniel-303", "date": "2026-W03", "wellbeing_level": 7, "concerns": ["time management"], "optional_note": "A little pressured."},
    {"pulse_id": "pulse-Liam-1", "student_id": "Liam-214", "date": "2026-W01", "wellbeing_level": 6, "concerns": ["financial stress"], "optional_note": "Managing but tired."},
    {"pulse_id": "pulse-Liam-2", "student_id": "Liam-214", "date": "2026-W02", "wellbeing_level": 5, "concerns": ["financial stress"], "optional_note": "Escalating worries."},
    {"pulse_id": "pulse-Nina-1", "student_id": "Nina-118", "date": "2026-W01", "wellbeing_level": 7, "concerns": ["social adjustment"], "optional_note": "Settling in."},
    {"pulse_id": "pulse-Nina-2", "student_id": "Nina-118", "date": "2026-W02", "wellbeing_level": 7, "concerns": ["social adjustment"], "optional_note": "Fine."},
    {"pulse_id": "pulse-Sofia-1", "student_id": "Sofia-401", "date": "2026-W01", "wellbeing_level": 8, "concerns": [], "optional_note": "Focused."},
    {"pulse_id": "pulse-Sofia-2", "student_id": "Sofia-401", "date": "2026-W02", "wellbeing_level": 7, "concerns": ["time pressure"], "optional_note": "Busy but okay."},
    {"pulse_id": "pulse-Marcus-1", "student_id": "Marcus-221", "date": "2026-W01", "wellbeing_level": 8, "concerns": [], "optional_note": "Calm."},
    {"pulse_id": "pulse-Marcus-2", "student_id": "Marcus-221", "date": "2026-W02", "wellbeing_level": 6, "concerns": ["academic pressure"], "optional_note": "Course load increasing."},
    {"pulse_id": "pulse-Marcus-3", "student_id": "Marcus-221", "date": "2026-W03", "wellbeing_level": 5, "concerns": ["academic pressure", "sleep"], "optional_note": "Struggling to keep up."},
]

DEMO_SIGNALS = [
    {"signal_id": "signal-Aisha-1", "student_id": "Aisha-202", "date": "2026-W02", "attendance_change": -0.08, "deadline_change": -0.05, "extension_count": 1, "support_requests": 0, "academic_pressure": 0.82, "sleep_concern": 0.74, "financial_concern": 0.15},
    {"signal_id": "signal-Aisha-2", "student_id": "Aisha-202", "date": "2026-W03", "attendance_change": -0.12, "deadline_change": -0.08, "extension_count": 2, "support_requests": 1, "academic_pressure": 0.91, "sleep_concern": 0.82, "financial_concern": 0.2},
    {"signal_id": "signal-Aisha-3", "student_id": "Aisha-202", "date": "2026-W04", "attendance_change": -0.15, "deadline_change": -0.10, "extension_count": 3, "support_requests": 1, "academic_pressure": 0.95, "sleep_concern": 0.88, "financial_concern": 0.25},
    {"signal_id": "signal-Priya-1", "student_id": "Priya-101", "date": "2026-W03", "attendance_change": -0.04, "deadline_change": -0.02, "extension_count": 0, "support_requests": 0, "academic_pressure": 0.44, "sleep_concern": 0.2, "financial_concern": 0.1},
    {"signal_id": "signal-Daniel-1", "student_id": "Daniel-303", "date": "2026-W03", "attendance_change": -0.02, "deadline_change": -0.01, "extension_count": 0, "support_requests": 0, "academic_pressure": 0.35, "sleep_concern": 0.22, "financial_concern": 0.08},
    {"signal_id": "signal-Liam-1", "student_id": "Liam-214", "date": "2026-W02", "attendance_change": -0.05, "deadline_change": -0.02, "extension_count": 1, "support_requests": 0, "academic_pressure": 0.59, "sleep_concern": 0.28, "financial_concern": 0.81},
    {"signal_id": "signal-Nina-1", "student_id": "Nina-118", "date": "2026-W02", "attendance_change": -0.03, "deadline_change": -0.01, "extension_count": 0, "support_requests": 0, "academic_pressure": 0.36, "sleep_concern": 0.21, "financial_concern": 0.18},
    {"signal_id": "signal-Sofia-1", "student_id": "Sofia-401", "date": "2026-W02", "attendance_change": -0.04, "deadline_change": -0.02, "extension_count": 0, "support_requests": 0, "academic_pressure": 0.29, "sleep_concern": 0.18, "financial_concern": 0.11},
    {"signal_id": "signal-Marcus-1", "student_id": "Marcus-221", "date": "2026-W02", "attendance_change": -0.07, "deadline_change": -0.04, "extension_count": 1, "support_requests": 0, "academic_pressure": 0.75, "sleep_concern": 0.68, "financial_concern": 0.12},
]

DEMO_CONTEXT_EVENTS = [
    {"event_id": "ctx-1", "date": "2026-W02", "event_type": "assessment_period", "event_description": "Mid-semester assessment block", "assessment_period": 1, "semester_phase": "midterm", "major_deadline_flag": 1},
    {"event_id": "ctx-2", "date": "2026-W03", "event_type": "assignment_deadline", "event_description": "Design project deadline", "assessment_period": 1, "semester_phase": "assessment", "major_deadline_flag": 1},
    {"event_id": "ctx-3", "date": "2026-W04", "event_type": "semester_transition", "event_description": "Semester shift into final project weeks", "assessment_period": 1, "semester_phase": "transition", "major_deadline_flag": 1},
]


def seed_demo_data():
    connection = get_connection()
    try:
        student_count = connection.execute("SELECT COUNT(*) FROM students").fetchone()[0]
        if student_count == 0:
            for student in DEMO_STUDENTS:
                connection.execute(
                    """
                    INSERT INTO students (student_id, name, year, program, cohort_group)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (student["student_id"], student["name"], student["year"], student["program"], student["cohort_group"]),
                )

            for pulse in DEMO_PULSES:
                connection.execute(
                    """
                    INSERT INTO pulses (pulse_id, student_id, date, wellbeing_level, concerns, optional_note)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        pulse["pulse_id"],
                        pulse["student_id"],
                        pulse["date"],
                        pulse["wellbeing_level"],
                        json.dumps(pulse["concerns"]),
                        pulse["optional_note"],
                    ),
                )

            for signal in DEMO_SIGNALS:
                connection.execute(
                    """
                    INSERT INTO signals (
                        signal_id,
                        student_id,
                        date,
                        attendance_change,
                        deadline_change,
                        extension_count,
                        support_requests,
                        academic_pressure,
                        sleep_concern,
                        financial_concern
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        signal["signal_id"],
                        signal["student_id"],
                        signal["date"],
                        signal["attendance_change"],
                        signal["deadline_change"],
                        signal["extension_count"],
                        signal["support_requests"],
                        signal["academic_pressure"],
                        signal["sleep_concern"],
                        signal["financial_concern"],
                    ),
                )

            for event in DEMO_CONTEXT_EVENTS:
                connection.execute(
                    """
                    INSERT OR IGNORE INTO context_events (
                        event_id,
                        date,
                        event_type,
                        event_description,
                        assessment_period,
                        semester_phase,
                        major_deadline_flag
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        event["event_id"],
                        event["date"],
                        event["event_type"],
                        event["event_description"],
                        int(event["assessment_period"]),
                        event["semester_phase"],
                        int(event["major_deadline_flag"]),
                    ),
                )

        connection.commit()
    finally:
        connection.close()
