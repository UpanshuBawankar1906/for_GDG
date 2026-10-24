"""Cloud Run entrypoint: serves the React build at / and the API at /api."""
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from main import app as api

DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app = FastAPI(title="JobPilot")
app.mount("/api", api)
app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
