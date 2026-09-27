from backend.app.services.student_service import (
    get_all_students,
    get_student_by_id,
    get_student_early_warning,
    get_student_pulses,
    get_student_trajectory,
)
from backend.app.services.support_service import get_support_options


def list_students():
    return get_all_students()


def get_student(student_id: str):
    return get_student_by_id(student_id)


def get_pulses(student_id: str):
    return get_student_pulses(student_id)


def get_trajectory(student_id: str):
    return get_student_trajectory(student_id)


def get_early_warning(student_id: str):
    return get_student_early_warning(student_id)


def get_support_choices(student_id: str):
    early_warning = get_student_early_warning(student_id)
    status = early_warning.get("status", "STABLE")
    return get_support_options(status)
