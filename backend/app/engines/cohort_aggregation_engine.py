from collections import defaultdict


def _calculate_evidence_strength(pattern_status, prevalence, signal_count, context):
    score = 1
    if pattern_status == "EMERGING":
        score += 2
    if prevalence >= 40:
        score += 2
    if signal_count >= 2:
        score += 2
    if context in {"assessment_period", "assignment_deadline", "semester_transition", "high_cohort_stress"} and signal_count < 2:
        score -= 1

    if score >= 5:
        return "STRONG"
    if score >= 3:
        return "MODERATE"
    return "LIMITED"


def _build_cohort_pattern_type(status, context, prevalence, signal_count):
    if status == "STABLE":
        return "STABLE"
    if context in {"assessment_period", "assignment_deadline", "semester_transition", "high_cohort_stress"} and prevalence < 50 and signal_count < 2:
        return "EXPECTED_CONTEXTUAL_CHANGE"
    if status == "WATCH":
        return "EMERGING_PATTERN"
    return "UNUSUAL_PATTERN" if prevalence >= 35 or signal_count >= 2 else "EMERGING_PATTERN"


def aggregate_cohorts(students, pulses_by_student):
    grouped = defaultdict(list)
    for student in students:
        grouped[student["cohort_group"]].append(student["student_id"])

    results = []
    for cohort_name, student_ids in grouped.items():
        cohort_pulses = []
        for student_id in student_ids:
            cohort_pulses.extend(pulses_by_student.get(student_id, []))

        if not cohort_pulses:
            results.append(
                {
                    "cohort_name": cohort_name,
                    "status": "STABLE",
                    "wellbeing_trend": "stable",
                    "prevalence": 0.0,
                    "sample_size": 0,
                    "concerns": [],
                    "context": "stable_context",
                    "what_changed": ["No pulse data available for this cohort yet."],
                    "pattern_type": "STABLE",
                    "evidence_strength": "LIMITED",
                    "baseline": "Baseline is unavailable because there are no pulse observations.",
                    "deviation": 0.0,
                    "why_now": "There is not enough information to assess a cohort-level pattern yet.",
                    "context_explanation": "No unusual institutional trigger is evident; the pattern should be interpreted within the broader baseline context.",
                    "historical_comparison": "No meaningful historical comparison is available in the current dataset.",
                    "explanation": "No pulse data is available for this cohort yet.",
                }
            )
            continue

        wellbeing_values = [pulse["wellbeing_level"] for pulse in cohort_pulses]
        start_value = wellbeing_values[0]
        latest_value = wellbeing_values[-1]
        delta = latest_value - start_value
        trend_text = "declining" if delta < -1 else "improving" if delta > 1 else "stable"

        concern_counts = defaultdict(int)
        for pulse in cohort_pulses:
            for concern in pulse.get("concerns", []):
                concern_counts[concern] += 1

        unique_students = len({pulse["student_id"] for pulse in cohort_pulses})
        prevalence = (sum(1 for value in wellbeing_values if value <= 5) / len(wellbeing_values)) * 100
        top_concern = None
        if concern_counts:
            top_concern = max(concern_counts.items(), key=lambda item: item[1])[0]

        baseline_value = sum(wellbeing_values[:-1]) / len(wellbeing_values[:-1]) if len(wellbeing_values) > 1 else wellbeing_values[0]
        current_average = sum(wellbeing_values[-3:]) / min(3, len(wellbeing_values))
        deviation = round(current_average - baseline_value, 2)
        signal_count = max(len(concern_counts), 1)

        if delta <= -1 and prevalence >= 25:
            status = "EMERGING"
            context = "assessment_period" if top_concern in {"academic pressure", "sleep"} else "stable_context"
            what_changed = [
                "Wellbeing is declining across the cohort.",
                f"{round(prevalence, 1)}% of recorded pulse entries are at or below the lower wellbeing threshold.",
                f"The strongest recurring concern is {top_concern or 'general academic stress'}.",
            ]
            explanation = (
                f"This cohort is showing a sustained dip in wellbeing. Around {round(prevalence, 1)}% of recorded pulse entries are lower than baseline, and {top_concern or 'academic pressure'} is a recurring concern."
            )
        elif delta <= -0.5:
            status = "WATCH"
            context = "assessment_period" if top_concern in {"academic pressure", "sleep"} else "stable_context"
            what_changed = [
                "There is an early warning pattern forming in this cohort.",
                "The direction is down, but the signal has not yet converged strongly enough to indicate a clear emerging pattern.",
            ]
            explanation = (
                "The cohort is showing an early decline in wellbeing and should be monitored closely, particularly in the current assessment context."
            )
        else:
            status = "STABLE"
            context = "stable_context"
            what_changed = ["The cohort is broadly stable.", "No strong repeated decline is emerging yet."]
            explanation = "Current wellbeing patterns remain broadly stable for this cohort."

        pattern_type = _build_cohort_pattern_type(status, context, prevalence, signal_count)
        evidence_strength = _calculate_evidence_strength(status, prevalence, signal_count, context)
        baseline_summary = (
            f"Baseline wellbeing was {baseline_value:.1f}; the current cohort average is {current_average:.1f}; deviation is {deviation:+.1f}."
        )
        if status == "STABLE":
            pattern_type = "STABLE"
            evidence_strength = "LIMITED"
        why_now = (
            "The cohort trend has moved away from its earlier baseline and is being interpreted alongside the current context."
            if status != "STABLE"
            else "The cohort remains stable and no repeated decline is currently visible."
        )
        context_explanation = (
            "The current pattern coincides with assessment-period pressure, which helps explain the observed change without proving a causal mechanism."
            if context == "assessment_period"
            else "No unusual institutional trigger is evident; the pattern should be interpreted within the broader baseline context."
        )
        historical_comparison = (
            "A similar pattern has appeared in earlier observations within the available history."
            if len(wellbeing_values) >= 4 and delta <= -1
            else "The current pattern is not clearly repeated in the available historical observations."
        )

        results.append(
            {
                "cohort_name": cohort_name,
                "status": status,
                "wellbeing_trend": trend_text,
                "prevalence": round(prevalence, 2),
                "sample_size": unique_students,
                "concerns": sorted(concern_counts.keys())[:5],
                "context": context,
                "what_changed": what_changed,
                "pattern_type": pattern_type,
                "evidence_strength": evidence_strength,
                "baseline": baseline_summary,
                "deviation": deviation,
                "why_now": why_now,
                "context_explanation": context_explanation,
                "historical_comparison": historical_comparison,
                "explanation": explanation,
            }
        )

    return results
