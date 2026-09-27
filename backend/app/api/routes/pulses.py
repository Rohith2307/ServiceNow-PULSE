from fastapi import APIRouter, HTTPException

from backend.app.api.controllers.pulse_controller import create_pulse
from backend.app.schemas.student import PulseCreate

router = APIRouter(prefix="/api", tags=["pulses"])


@router.post("/pulses")
async def post_pulse(payload: PulseCreate):
    if not payload.student_id:
        raise HTTPException(status_code=400, detail="student_id is required")
    return create_pulse(payload.model_dump())
