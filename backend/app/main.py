from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes.dashboard import router as dashboard_router
from backend.app.api.routes.pulses import router as pulse_router
from backend.app.api.routes.students import router as student_router
from backend.app.data.seed_data import seed_demo_data
from backend.app.db import init_db

init_db()
seed_demo_data()

app = FastAPI(title="PULSE Early Warning API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:4174",
        "http://127.0.0.1:4174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "message": "PULSE backend is running"}


app.include_router(student_router)
app.include_router(pulse_router)
app.include_router(dashboard_router)
