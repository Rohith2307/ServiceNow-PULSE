from backend.app.engines.change_engine import evaluate_student_change
from backend.app.engines.context_engine import resolve_context
from backend.app.repositories.pulse_repository import get_all_pulses, get_pulses, get_signals
from backend.app.repositories.student_repository import get_student, get_students


def get_all_students():
    return get_students()


def get_student_by_id(student_id: str):
    return get_student(student_id)


def get_student_pulses(student_id: str):
    return get_pulses(student_id)


def get_student_trajectory(student_id: str):
    pulses = get_pulses(student_id)
    return {
        "student_id": student_id,
        "count": len(pulses),
        "pulses": pulses,
    }


def get_student_early_warning(student_id: str):
    pulses = get_pulses(student_id)
    signals = get_signals(student_id)

    latest_context = {
        "assessment_period": False,
        "semester_transition": False,
        "major_deadline_flag": False,
        "cohort_stress": 0.4,
    }

    if pulses:
        recent = pulses[-1]
        latest_context["assessment_period"] = bool(recent.get("wellbeing_level", 0) <= 6)

    context_result = resolve_context(
        assessment_period=latest_context["assessment_period"],
        is_semester_transition=False,
        major_deadline_flag=True,
        cohort_stress=0.65,
    )

    result = evaluate_student_change(pulses, signals, context_result)
    result["student_id"] = student_id
    return result
