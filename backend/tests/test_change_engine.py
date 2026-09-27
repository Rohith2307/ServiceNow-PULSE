from backend.app.engines.change_engine import evaluate_student_change
from backend.app.engines.cohort_aggregation_engine import aggregate_cohorts


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
    assert result["pattern_type"] == "STABLE"


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
    assert result["pattern_type"] in {"STABLE", "EXPECTED_CONTEXTUAL_CHANGE"}


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
        context={"context": "stable_context"},
    )
    assert result["status"] == "SUPPORT_SUGGESTED"
    assert result["direction"] == "declining"
    assert result["persistence"] is True
    assert "attendance_decline" in result["contributing_signals"]
    assert result["pattern_type"] == "UNUSUAL_PATTERN"
    assert result["evidence_strength"] == "STRONG"


def test_contextual_decline_is_not_unusual_per_se():
    result = evaluate_student_change(
        pulses=[
            {"wellbeing_level": 8, "date": "2026-W01"},
            {"wellbeing_level": 6, "date": "2026-W02"},
            {"wellbeing_level": 5, "date": "2026-W03"},
            {"wellbeing_level": 5, "date": "2026-W04"},
        ],
        signals=[{"academic_pressure": 0.75, "sleep_concern": 0.68}],
        context={"context": "assessment_period"},
    )
    assert result["pattern_type"] == "EXPECTED_CONTEXTUAL_CHANGE"
    assert "assessment period" in (result["why_now"] + result["context_explanation"]).lower()


def test_unusual_pattern_requires_multiple_signals_and_persistence():
    result = evaluate_student_change(
        pulses=[
            {"wellbeing_level": 8, "date": "2026-W01"},
            {"wellbeing_level": 7, "date": "2026-W02"},
            {"wellbeing_level": 5, "date": "2026-W03"},
            {"wellbeing_level": 4, "date": "2026-W04"},
            {"wellbeing_level": 4, "date": "2026-W05"},
        ],
        signals=[
            {"attendance_change": -0.1, "academic_pressure": 0.8, "support_requests": 1},
            {"sleep_concern": 0.76, "extension_count": 2},
        ],
        context={"context": "stable_context"},
    )
    assert result["status"] == "SUPPORT_SUGGESTED"
    assert result["pattern_type"] == "UNUSUAL_PATTERN"
    assert result["evidence_strength"] in {"MODERATE", "STRONG"}
    assert "baseline" in result["baseline"].lower() or result["baseline"]


def test_cohort_pattern_uses_context_and_prevalence():
    results = aggregate_cohorts(
        students=[
            {"student_id": "s1", "cohort_group": "Business"},
            {"student_id": "s2", "cohort_group": "Business"},
            {"student_id": "s3", "cohort_group": "Engineering"},
        ],
        pulses_by_student={
            "s1": [
                {"student_id": "s1", "wellbeing_level": 8},
                {"student_id": "s1", "wellbeing_level": 7},
                {"student_id": "s1", "wellbeing_level": 5},
            ],
            "s2": [
                {"student_id": "s2", "wellbeing_level": 8},
                {"student_id": "s2", "wellbeing_level": 7},
                {"student_id": "s2", "wellbeing_level": 6},
            ],
            "s3": [
                {"student_id": "s3", "wellbeing_level": 8},
                {"student_id": "s3", "wellbeing_level": 8},
                {"student_id": "s3", "wellbeing_level": 7},
            ],
        },
    )
    business = next(item for item in results if item["cohort_name"] == "Business")
    assert business["status"] in {"WATCH", "EMERGING"}
    assert "pattern_type" in business
    assert business["evidence_strength"] in {"LIMITED", "MODERATE", "STRONG"}


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
    assert result["pattern_type"] == "STABLE"
