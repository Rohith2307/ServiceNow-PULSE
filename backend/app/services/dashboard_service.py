from backend.app.engines.cohort_aggregation_engine import aggregate_cohorts
from backend.app.repositories.dashboard_repository import get_all_context_events
from backend.app.repositories.pulse_repository import get_all_pulses, get_all_signals
from backend.app.repositories.student_repository import get_students


def get_overview():
    students = get_students()
    pulses = get_all_pulses()
    cohort_count = len({student["cohort_group"] for student in students})
    return {
        "total_students": len(students),
        "total_pulses": len(pulses),
        "cohort_count": cohort_count,
        "status": "ok",
    }


def get_trends():
    pulses = get_all_pulses()
    return {
        "pulses": len(pulses),
        "trend_summary": "Cohort signals are being tracked for early warnings.",
    }


def get_cohorts():
    students = get_students()
    pulses = get_all_pulses()
    pulses_by_student = {}
    for pulse in pulses:
        pulses_by_student.setdefault(pulse["student_id"], []).append(pulse)
    return aggregate_cohorts(students, pulses_by_student)


def get_context_summary():
    return get_all_context_events()


def get_recommendations():
    return [
        {"cohort": "Second Year Engineering", "recommendation": "Monitor for continued academic pressure and offer support options."},
        {"cohort": "First Year Engineering", "recommendation": "Maintain baseline monitoring."},
    ]
