from backend.app.services.pulse_service import submit_pulse


def create_pulse(payload):
    return submit_pulse(payload)
