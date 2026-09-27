def get_support_options(status: str):
    if status == "SUPPORT_SUGGESTED":
        return [
            {"option_id": "option-1", "label": "Talk to someone", "type": "support", "description": "Speak with a support contact or wellbeing adviser.", "student_controlled": True},
            {"option_id": "option-2", "label": "Academic support", "type": "academic", "description": "Ask for extensions, study planning, or academic guidance.", "student_controlled": True},
            {"option_id": "option-3", "label": "Explore resources", "type": "resource", "description": "Review available wellbeing and study support resources.", "student_controlled": True},
            {"option_id": "option-4", "label": "Not right now", "type": "defer", "description": "Choose to revisit support later.", "student_controlled": True},
        ]
    if status == "EMERGING":
        return [
            {"option_id": "option-5", "label": "Explore resources", "type": "resource", "description": "Review available support information.", "student_controlled": True},
            {"option_id": "option-6", "label": "Talk to someone", "type": "support", "description": "Request a wellbeing check-in if needed.", "student_controlled": True},
            {"option_id": "option-7", "label": "Not right now", "type": "defer", "description": "Delay action until the student is ready.", "student_controlled": True},
        ]
    return [
        {"option_id": "option-8", "label": "Not right now", "type": "defer", "description": "Continue monitoring and revisit later if needed.", "student_controlled": True},
    ]
