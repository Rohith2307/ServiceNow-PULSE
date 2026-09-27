from collections import defaultdict


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
                "explanation": explanation,
            }
        )

    return results
