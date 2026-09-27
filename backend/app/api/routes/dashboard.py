from fastapi import APIRouter

from backend.app.api.controllers.dashboard_controller import (
    dashboard_cohorts,
    dashboard_context,
    dashboard_overview,
    dashboard_recommendations,
    dashboard_trends,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview")
async def overview():
    return dashboard_overview()


@router.get("/trends")
async def trends():
    return dashboard_trends()


@router.get("/cohorts")
async def cohorts():
    return dashboard_cohorts()


@router.get("/context")
async def context():
    return dashboard_context()


@router.get("/recommendations")
async def recommendations():
    return dashboard_recommendations()
