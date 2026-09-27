def resolve_context(assessment_period: bool, is_semester_transition: bool, major_deadline_flag: bool, cohort_stress: float):
    if assessment_period:
        return {
            "context": "assessment_period",
            "description": "Assessment period",
            "explanation": "Assessment activity is contributing to the current pattern, but the context alone does not confirm a crisis.",
            "interpretation": "contextual_explanation",
        }
    if is_semester_transition:
        return {
            "context": "semester_transition",
            "description": "Semester transition",
            "explanation": "The pattern is occurring during a transition phase, which may explain the recent pressures.",
            "interpretation": "contextual_explanation",
        }
    if major_deadline_flag:
        return {
            "context": "assignment_deadline",
            "description": "Major assignment deadline",
            "explanation": "A major deadline is likely increasing academic pressure and affecting the wellbeing trend.",
            "interpretation": "contextual_explanation",
        }
    if cohort_stress >= 0.5:
        return {
            "context": "high_cohort_stress",
            "description": "High cohort stress",
            "explanation": "Multiple students are reporting similar pressure, which helps explain the wider pattern without identifying an individual diagnosis.",
            "interpretation": "contextual_explanation",
        }
    return {
        "context": "stable_context",
        "description": "Stable context",
        "explanation": "No unusual institutional trigger is evident; the pattern should be interpreted within the broader baseline context.",
        "interpretation": "baseline",
    }
