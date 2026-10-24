from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import json, os, asyncio
from datetime import date, timedelta, datetime

from classifier import classify_inbox

app = FastAPI(title="JobPilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory tracker state ───────────────────────────────────────────────────
# { email_id: classified_email_dict }
_tracker: dict = {}

# ── Pydantic models ───────────────────────────────────────────────────────────

class EmailItem(BaseModel):
    id: int
    date: str
    from_: str  # 'from' is a Python keyword
    subject: str
    body: str

    class Config:
        populate_by_name = True

    @classmethod
    def from_dict(cls, d: dict):
        return cls(
            id=d["id"],
            date=d["date"],
            from_=d["from"],
            subject=d["subject"],
            body=d["body"],
        )


class InboxRequest(BaseModel):
    emails: List[dict]


class UpdateRequest(BaseModel):
    email_id: int
    category: str


# ── Helpers ───────────────────────────────────────────────────────────────────

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "inbox.json")

def _load_sample() -> List[dict]:
    with open(DATA_PATH) as f:
        return json.load(f)

def _get_followups(classified: List[dict]) -> List[dict]:
    """Return emails in 'applied' state where follow_up_due <= today and no reply yet."""
    today = date.today()
    due = []
    for em in classified:
        if em.get("category") == "applied" and em.get("follow_up_due"):
            try:
                due_date = date.fromisoformat(em["follow_up_due"])
                if due_date <= today:
                    due.append({**em, "days_overdue": (today - due_date).days})
            except Exception:
                pass
    return due


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "JobPilot is running 🚀"}


@app.get("/sample-inbox")
def get_sample_inbox():
    """Return the raw sample inbox JSON for the UI to display."""
    return _load_sample()


@app.post("/classify")
async def classify(request: InboxRequest):
    """
    Classify a list of emails using Gemini AI.
    Returns classified emails + scam list + follow-up reminders.
    """
    if not request.emails:
        raise HTTPException(400, "No emails provided.")

    classified = await classify_inbox(request.emails)

    # Store in tracker
    global _tracker
    for em in classified:
        _tracker[em["id"]] = em

    scams      = [e for e in classified if e.get("category") == "scam"]
    followups  = _get_followups(classified)

    # Stats summary
    from collections import Counter
    counts = Counter(e.get("category", "unknown") for e in classified)

    return {
        "classified": classified,
        "scams":      scams,
        "followups":  followups,
        "stats": {
            "total":     len(classified),
            "applied":   counts.get("applied", 0),
            "interview": counts.get("interview", 0),
            "offer":     counts.get("offer", 0),
            "rejected":  counts.get("rejected", 0),
            "scam":      counts.get("scam", 0),
        },
    }


@app.get("/tracker")
def get_tracker():
    """Return current tracker state."""
    if not _tracker:
        return {"classified": [], "scams": [], "followups": [], "stats": {}}
    classified = list(_tracker.values())
    scams     = [e for e in classified if e.get("category") == "scam"]
    followups = _get_followups(classified)
    from collections import Counter
    counts = Counter(e.get("category", "unknown") for e in classified)
    return {
        "classified": classified,
        "scams":      scams,
        "followups":  followups,
        "stats": {
            "total":     len(classified),
            "applied":   counts.get("applied", 0),
            "interview": counts.get("interview", 0),
            "offer":     counts.get("offer", 0),
            "rejected":  counts.get("rejected", 0),
            "scam":      counts.get("scam", 0),
        },
    }


@app.patch("/tracker/update")
def update_category(request: UpdateRequest):
    """Manually override the category of an email."""
    if request.email_id not in _tracker:
        raise HTTPException(404, f"Email {request.email_id} not in tracker.")
    valid = {"applied", "interview", "offer", "rejected", "scam"}
    if request.category not in valid:
        raise HTTPException(400, f"Invalid category. Must be one of: {valid}")
    _tracker[request.email_id]["category"] = request.category
    return {"ok": True, "id": request.email_id, "category": request.category}


@app.delete("/tracker/reset")
def reset_tracker():
    """Clear all tracker state."""
    global _tracker
    _tracker = {}
    return {"ok": True}
