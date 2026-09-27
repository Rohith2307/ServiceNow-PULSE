from backend.app.engines.change_engine import evaluate_student_change


def test_stable_student():
    result = evaluate_student_change(
        pulses=[
            {"wellbeing_level": 8, "date": "2026-W01"},
            {"wellbeing_level": 7, "date": "2026-W02"},
            {"wellbeing_level": 7, "date": "2026-W03"},
        ],
        signals=[],
        context={"context": "stable_context"},
    )
    assert result["status"] == "STABLE"
    assert result["why_detected"]["trajectory"] == "stable"


def test_single_bad_week_is_not_support_suggested():
    result = evaluate_student_change(
        pulses=[
            {"wellbeing_level": 8, "date": "2026-W01"},
            {"wellbeing_level": 8, "date": "2026-W02"},
            {"wellbeing_level": 5, "date": "2026-W03"},
            {"wellbeing_level": 8, "date": "2026-W04"},
        ],
        signals=[{"attendance_change": -0.03}],
        context={"context": "stable_context"},
    )
    assert result["status"] == "STABLE"
    assert result["persistence"] is False


def test_persistent_decline_and_converging_signals():
    result = evaluate_student_change(
        pulses=[
            {"wellbeing_level": 8, "date": "2026-W01"},
            {"wellbeing_level": 6, "date": "2026-W02"},
            {"wellbeing_level": 5, "date": "2026-W03"},
            {"wellbeing_level": 4, "date": "2026-W04"},
        ],
        signals=[
            {"attendance_change": -0.12, "deadline_change": -0.08, "extension_count": 2, "support_requests": 1},
            {"academic_pressure": 0.82, "sleep_concern": 0.7, "financial_concern": 0.2},
        ],
        context={"context": "assessment_period"},
    )
    assert result["status"] == "SUPPORT_SUGGESTED"
    assert result["direction"] == "declining"
    assert result["persistence"] is True
    assert "attendance_decline" in result["contributing_signals"]


def test_single_isolated_negative_signal():
    result = evaluate_student_change(
        pulses=[
            {"wellbeing_level": 7, "date": "2026-W01"},
            {"wellbeing_level": 6, "date": "2026-W02"},
            {"wellbeing_level": 7, "date": "2026-W03"},
        ],
        signals=[{"attendance_change": -0.02}],
        context={"context": "stable_context"},
    )
    assert result["status"] == "STABLE"
    assert result["why_detected"]["persistence"] is False
