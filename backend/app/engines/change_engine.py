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


def evaluate_student_change(pulses, signals, context):
    context_map = context if isinstance(context, dict) else {}
    context_label = context_map.get("context", "stable_context")

    if not pulses:
        return {
            "status": "STABLE",
            "direction": "stable",
            "persistence": False,
            "magnitude": "low",
            "signal_convergence": False,
            "context": context_label,
            "support_signal": "not_required",
            "contributing_signals": [],
            "why_detected": {
                "trajectory": "insufficient_data",
                "persistence": False,
                "magnitude": "low",
                "context": context_label,
                "contributing_signals": [],
            },
            "explanation": "There are no recent wellbeing check-ins to evaluate.",
            "recommended_actions": ["Not right now"],
        }

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

    if direction == "declining" and persistence and signal_convergence:
        status = "SUPPORT_SUGGESTED"
        support_signal = "support_suggested"
        recommended_actions = ["Talk to someone", "Academic support", "Explore resources"]
        explanation = (
            "Recent check-ins show a sustained change in wellbeing over several weeks, and the pattern is supported by "
            "multiple signals including academic pressure, attendance decline, and extension requests. The student should be offered support choices."
        )
    elif direction == "declining" and persistence:
        status = "EMERGING"
        support_signal = "monitoring"
        recommended_actions = ["Talk to someone", "Explore resources"]
        explanation = (
            "Recent check-ins show a sustained decline in wellbeing over several weeks. The change is meaningful, but the current evidence is not yet strong enough to recommend immediate support action."
        )
    else:
        status = "STABLE"
        support_signal = "not_required"
        recommended_actions = ["Not right now"]
        explanation = (
            "Wellbeing has remained comparatively stable over recent check-ins. There is no sustained multi-week decline or strong convergence of supporting signals."
        )

    if direction == "declining" and not persistence:
        explanation = (
            "There is a recent decline in wellbeing, but it is not yet sustained across repeated check-ins. The pattern remains too limited to trigger a strong support signal."
        )
        support_signal = "not_required"
        status = "STABLE"

    context_description = context_map.get("description") or context_map.get("explanation") or "No specific contextual trigger detected."
    if context_label == "assessment_period":
        explanation = f"{explanation} Context: assessment period. This can explain the pattern without automatically indicating a crisis."
    elif context_label in {"semester_transition", "assignment_deadline", "high_cohort_stress"}:
        explanation = f"{explanation} Context: {context_label}. This helps explain the pattern without defining a diagnosis."
    elif context_label == "stable_context":
        explanation = f"{explanation} Context: stable_context. There is no unusual institutional trigger in the current pattern."

    trajectory_label = direction
    if direction == "declining" and not persistence:
        trajectory_label = "stable"

    result = {
        "status": status,
        "direction": direction,
        "persistence": persistence,
        "magnitude": magnitude,
        "signal_convergence": signal_convergence,
        "context": context_label,
        "support_signal": support_signal,
        "contributing_signals": contributing_signals,
        "why_detected": {
            "trajectory": trajectory_label,
            "persistence": persistence,
            "magnitude": magnitude,
            "context": context_label,
            "contributing_signals": contributing_signals,
        },
        "explanation": explanation,
        "recommended_actions": recommended_actions,
    }
    return result
