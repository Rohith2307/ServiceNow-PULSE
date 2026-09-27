from backend.app.engines.context_engine import resolve_context


def test_assessment_period_context():
    result = resolve_context(
        assessment_period=True,
        is_semester_transition=False,
        major_deadline_flag=True,
        cohort_stress=0.65,
    )
    assert result["context"] == "assessment_period"


def test_normal_period_context():
    result = resolve_context(
        assessment_period=False,
        is_semester_transition=False,
        major_deadline_flag=False,
        cohort_stress=0.30,
    )
    assert result["context"] in {"stable_context", "normal_period"}
