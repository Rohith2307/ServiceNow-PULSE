from backend.app.repositories.pulse_repository import create_pulse, get_pulses


def submit_pulse(payload):
    created = create_pulse(payload)
    return created[-1]


def get_student_pulses(student_id: str):
    return get_pulses(student_id)
