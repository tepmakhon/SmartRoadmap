"""Run tests in disposable, transaction-isolated PostgreSQL schemas."""

import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.config import settings

environment = os.environ.copy()
environment["TEST_DATABASE_URL"] = settings.DATABASE_URL
raise SystemExit(subprocess.call([sys.executable, "-m", "pytest", "-q"], env=environment))
