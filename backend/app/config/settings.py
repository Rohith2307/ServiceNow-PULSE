from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = PROJECT_ROOT / "backend"
DATA_DIR = BACKEND_DIR / "data"
DB_PATH = DATA_DIR / "pulse.db"

DATA_DIR.mkdir(parents=True, exist_ok=True)
