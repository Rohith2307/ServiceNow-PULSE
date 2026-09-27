from backend.app.services.dashboard_service import (
    get_cohorts,
    get_context_summary,
    get_overview,
    get_recommendations,
    get_trends,
)


def dashboard_overview():
    return get_overview()


def dashboard_trends():
    return get_trends()


def dashboard_cohorts():
    return get_cohorts()


def dashboard_context():
    return get_context_summary()


def dashboard_recommendations():
    return get_recommendations()
