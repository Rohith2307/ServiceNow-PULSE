from fastapi import APIRouter, HTTPException

from backend.app.api.controllers.student_controller import (
    get_early_warning,
    get_pulses,
    get_student,
    get_support_choices,
    get_trajectory,
    list_students,
)

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("")
async def list_students_route():
    return list_students()


@router.get("/{student_id}")
async def get_student_route(student_id: str):
    student = get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/{student_id}/pulses")
async def get_student_pulses_route(student_id: str):
    pulses = get_pulses(student_id)
    if not pulses:
        raise HTTPException(status_code=404, detail="No pulse data found for this student")
    return pulses


@router.get("/{student_id}/trajectory")
async def get_student_trajectory_route(student_id: str):
    return get_trajectory(student_id)


@router.get("/{student_id}/early-warning")
async def get_student_early_warning_route(student_id: str):
    early_warning = get_early_warning(student_id)
    if not early_warning:
        raise HTTPException(status_code=404, detail="Early-warning result unavailable")
    return early_warning


@router.get("/{student_id}/support-options")
async def get_support_options_route(student_id: str):
    options = get_support_choices(student_id)
    return options
