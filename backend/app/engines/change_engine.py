def _summarise_signal_contributors(signals):
    contributors = []
    for signal in signals or []:
        if not isinstance(signal, dict):
            continue
        if signal.get("attendance_change") is not None and signal.get("attendance_change") < -0.05:
            contributors.append("attendance_decline")
        if signal.get("deadline_change") is not None and signal.get("deadline_change") < -0.05:
            contributors.append("deadline_pressure")
        if signal.get("extension_count", 0) > 0:
            contributors.append("extension_requests")
        if signal.get("support_requests", 0) > 0:
            contributors.append("support_requests")
        if signal.get("academic_pressure") is not None and signal.get("academic_pressure") >= 0.6:
            contributors.append("academic_pressure")
        if signal.get("sleep_concern") is not None and signal.get("sleep_concern") >= 0.6:
            contributors.append("sleep_concern")
        if signal.get("financial_concern") is not None and signal.get("financial_concern") >= 0.6:
            contributors.append("financial_concern")

    unique = []
    for item in contributors:
        if item not in unique:
            unique.append(item)
    return unique


def _calculate_baseline_and_deviation(values):
    if not values:
        return 0.0, 0.0, "Baseline is unavailable because there are no pulse observations."

    baseline_window = values[:-1] if len(values) > 1 else values
    baseline_value = sum(baseline_window) / len(baseline_window) if baseline_window else values[-1]
    current_window = values[-3:] if len(values) >= 3 else values
    current_average = sum(current_window) / len(current_window)
    deviation = current_average - baseline_value
    baseline_summary = (
        f"Baseline wellbeing was {baseline_value:.1f}; the current recent pattern averages {current_average:.1f}; "
        f"deviation is {deviation:+.1f}."
    )
    return baseline_value, round(deviation, 2), baseline_summary


def _assess_evidence_strength(persistence, magnitude, signal_convergence, context_label, values):
    score = 1
    if persistence:
        score += 2
    if magnitude == "meaningful":
        score += 2
    elif magnitude == "moderate":
        score += 1
    if signal_convergence:
        score += 2
    if len(values) >= 5:
        score += 1
    if context_label in {"assessment_period", "assignment_deadline", "semester_transition", "high_cohort_stress"} and not signal_convergence:
        score -= 1

    if score >= 6:
        return "STRONG"
    if score >= 3:
        return "MODERATE"
    return "LIMITED"


def _generate_why_now(direction, persistence, context_label, signal_convergence, energy_signals, values, magnitude):
    if not direction or direction == "stable":
        return "The current pattern remains comparatively stable and has not persisted across repeated check-ins."

    explanations = []
    if persistence:
        explanations.append("The change has persisted across several check-ins.")
    else:
        explanations.append("The recent change is not yet sustained across repeated check-ins.")

    if context_label == "assessment_period":
        explanations.append("The current period is an assessment period, which may explain part of the pattern.")
    elif context_label == "assignment_deadline":
        explanations.append("A major deadline is creating additional academic pressure.")
    elif context_label == "semester_transition":
        explanations.append("The pattern aligns with a semester transition phase.")
    elif context_label == "high_cohort_stress":
        explanations.append("The broader cohort is showing elevated stress, which provides context for the movement.")
    elif context_label == "stable_context":
        explanations.append("There is no unusual institutional trigger visible in the current context.")

    if signal_convergence:
        explanations.append("Multiple independent signals are moving together and reinforcing the same pattern.")
    elif energy_signals:
        explanations.append("Supporting signals are present but not yet strong enough to indicate a strong convergence.")

    if magnitude == "meaningful":
        explanations.append("The change is materially larger than the recent baseline.")
    elif magnitude == "moderate":
        explanations.append("The change is moderate and deserves continued monitoring.")

    if len(values) >= 4:
        explanations.append("The available observation history provides enough data to evaluate the trend over time.")

    return " ".join(explanations)


def _generate_context_explanation(context_label):
    if context_label == "assessment_period":
        return "The current pattern coincides with assessment-period pressure, which helps explain the observed change without proving a clinical cause."
    if context_label == "assignment_deadline":
        return "A major assignment deadline is increasing academic pressure and may be contributing to the recent reduction in wellbeing."
    if context_label == "semester_transition":
        return "The pattern aligns with a semester transition, which can create short-term pressure even when the overall situation remains within the expected baseline."
    if context_label == "high_cohort_stress":
        return "The wider cohort is also experiencing elevated stress, so this pattern should be read in the broader contextual setting."
    if context_label == "stable_context":
        return "No unusual institutional trigger is evident; the pattern should be interpreted in the broader baseline context."
    return "The context is mixed and should be interpreted with caution rather than treated as a direct cause."


def _generate_historical_comparison(values):
    if len(values) < 4:
        return "No meaningful historical comparison is available in the current dataset."

    prior_window = values[:-2]
    recent_window = values[-2:]
    if not prior_window:
        return "No meaningful historical comparison is available in the current dataset."

    prior_mean = sum(prior_window) / len(prior_window)
    recent_mean = sum(recent_window) / len(recent_window)
    if abs(recent_mean - prior_mean) >= 1.5:
        return "A similar movement has appeared in the available history, which makes the current pattern more interpretable."
    return "The current pattern is not clearly repeated in the available historical observations."


def evaluate_student_change(pulses, signals, context):
    context_map = context if isinstance(context, dict) else {}
    context_label = context_map.get("context", "stable_context")

    if not pulses:
        baseline_text = "Baseline is unavailable because there are no pulse observations."
        result = {
            "status": "STABLE",
            "direction": "stable",
            "persistence": False,
            "magnitude": "low",
            "signal_convergence": False,
            "context": context_label,
            "support_signal": "not_required",
            "contributing_signals": [],
            "pattern_type": "STABLE",
            "evidence_strength": "LIMITED",
            "baseline": baseline_text,
            "deviation": 0.0,
            "why_now": "There are not enough recent pulse observations to interpret a meaningful trend.",
            "context_explanation": _generate_context_explanation(context_label),
            "historical_comparison": "No meaningful historical comparison is available in the current dataset.",
            "trajectory_explanation": "Insufficient recent data for a stable interpretation.",
            "why_detected": {
                "trajectory": "insufficient_data",
                "persistence": False,
                "magnitude": "low",
                "context": context_label,
                "contributing_signals": [],
                "pattern_type": "STABLE",
                "evidence_strength": "LIMITED",
                "why_now": "There are not enough recent pulse observations to interpret a meaningful trend.",
                "context_explanation": _generate_context_explanation(context_label),
                "historical_comparison": "No meaningful historical comparison is available in the current dataset.",
            },
            "explanation": "There are no recent wellbeing check-ins to evaluate.",
            "recommended_actions": ["Not right now"],
        }
        return result

    values = [float(p.get("wellbeing_level", 5)) for p in pulses]
    direction = "stable"
    if len(values) >= 3:
        recent_window = values[-3:]
        recent_change = recent_window[-1] - recent_window[0]
        if recent_change <= -1 and recent_window[-1] <= min(recent_window[:-1]):
            direction = "declining"
        elif recent_change >= 1 and recent_window[-1] >= max(recent_window[:-1]):
            direction = "improving"
    elif len(values) >= 2:
        if values[-1] < values[0] - 1:
            direction = "declining"
        elif values[-1] > values[0] + 1:
            direction = "improving"

    persistence = False
    if len(values) >= 3 and direction == "declining":
        prior_steps = [current - previous for previous, current in zip(values[:-1], values[1:])]
        persistence = sum(1 for step in prior_steps if step <= -1) >= 2 and values[-1] <= min(values[-3:])

    magnitude_score = abs(values[0] - values[-1]) if len(values) >= 2 else 0
    if magnitude_score >= 3:
        magnitude = "meaningful"
    elif magnitude_score >= 1.5:
        magnitude = "moderate"
    else:
        magnitude = "low"

    contributing_signals = ["wellbeing_decline"] if direction == "declining" else []
    contributing_signals.extend(_summarise_signal_contributors(signals))
    unique_contributors = []
    for item in contributing_signals:
        if item not in unique_contributors:
            unique_contributors.append(item)
    contributing_signals = unique_contributors

    signal_convergence = False
    non_wellbeing_signals = [item for item in contributing_signals if item != "wellbeing_decline"]
    if len(non_wellbeing_signals) >= 2:
        signal_convergence = True

    baseline_value, deviation, baseline_summary = _calculate_baseline_and_deviation(values)
    historical_comparison = _generate_historical_comparison(values)
    context_explanation = _generate_context_explanation(context_label)
    why_now = _generate_why_now(direction, persistence, context_label, signal_convergence, non_wellbeing_signals, values, magnitude)

    if direction == "declining" and persistence and signal_convergence:
        status = "SUPPORT_SUGGESTED"
        support_signal = "support_suggested"
        recommended_actions = ["Talk to someone", "Academic support", "Explore resources"]
        explanation = (
            "Recent check-ins show a sustained change in wellbeing over several weeks, and the pattern is supported by "
            "multiple signals including academic pressure, attendance decline, and extension requests. The student should be offered support choices."
        )
        pattern_type = "UNUSUAL_PATTERN" if context_label == "stable_context" else "EXPECTED_CONTEXTUAL_CHANGE"
    elif direction == "declining" and persistence:
        status = "EMERGING"
        support_signal = "monitoring"
        recommended_actions = ["Talk to someone", "Explore resources"]
        explanation = (
            "Recent check-ins show a sustained decline in wellbeing over several weeks. The change is meaningful, but the current evidence is not yet strong enough to recommend immediate support action."
        )
        pattern_type = "EMERGING_PATTERN"
    else:
        status = "STABLE"
        support_signal = "not_required"
        recommended_actions = ["Not right now"]
        explanation = (
            "Wellbeing has remained comparatively stable over recent check-ins. There is no sustained multi-week decline or strong convergence of supporting signals."
        )
        pattern_type = "STABLE"

    if direction == "declining" and not persistence:
        explanation = (
            "There is a recent decline in wellbeing, but it is not yet sustained across repeated check-ins. The pattern remains too limited to trigger a strong support signal."
        )
        support_signal = "not_required"
        status = "STABLE"
        pattern_type = "STABLE" if context_label == "stable_context" else "EXPECTED_CONTEXTUAL_CHANGE"

    if context_label == "assessment_period" and direction == "declining" and persistence:
        pattern_type = "EXPECTED_CONTEXTUAL_CHANGE"
    elif context_label in {"semester_transition", "assignment_deadline", "high_cohort_stress"} and direction == "declining" and persistence:
        pattern_type = "EXPECTED_CONTEXTUAL_CHANGE"

    if context_label == "assessment_period":
        explanation = f"{explanation} Context: assessment period. This can explain the pattern without automatically indicating a crisis."
    elif context_label in {"semester_transition", "assignment_deadline", "high_cohort_stress"}:
        explanation = f"{explanation} Context: {context_label}. This helps explain the pattern without defining a diagnosis."
    elif context_label == "stable_context":
        explanation = f"{explanation} Context: stable_context. There is no unusual institutional trigger in the current pattern."

    trajectory_label = direction
    if direction == "declining" and not persistence:
        trajectory_label = "stable"

    evidence_strength = _assess_evidence_strength(persistence, magnitude, signal_convergence, context_label, values)
    if direction == "declining" and context_label in {"assessment_period", "assignment_deadline", "semester_transition", "high_cohort_stress"} and not signal_convergence:
        evidence_strength = "MODERATE" if persistence else "LIMITED"
    if status == "STABLE":
        evidence_strength = "LIMITED"

    if pattern_type == "STABLE" and status != "STABLE":
        pattern_type = "EMERGING_PATTERN"

    result = {
        "status": status,
        "direction": direction,
        "persistence": persistence,
        "magnitude": magnitude,
        "signal_convergence": signal_convergence,
        "context": context_label,
        "support_signal": support_signal,
        "contributing_signals": contributing_signals,
        "pattern_type": pattern_type,
        "evidence_strength": evidence_strength,
        "baseline": baseline_summary,
        "deviation": deviation,
        "why_now": why_now,
        "context_explanation": context_explanation,
        "historical_comparison": historical_comparison,
        "trajectory_explanation": f"The recent trend is {direction} with a {magnitude} change from the baseline.",
        "why_detected": {
            "trajectory": trajectory_label,
            "persistence": persistence,
            "magnitude": magnitude,
            "context": context_label,
            "contributing_signals": contributing_signals,
            "pattern_type": pattern_type,
            "evidence_strength": evidence_strength,
            "why_now": why_now,
            "context_explanation": context_explanation,
            "historical_comparison": historical_comparison,
        },
        "explanation": explanation,
        "recommended_actions": recommended_actions,
    }
    return result
