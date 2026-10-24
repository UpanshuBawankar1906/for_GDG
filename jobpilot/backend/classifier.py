import os
import asyncio
import json
import httpx
from dotenv import load_dotenv
from datetime import date
from typing import List

load_dotenv()

GEMINI_KEY   = os.environ.get("GEMINI_API_KEY", "")
# Newest first, fallback down the list
GEMINI_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
]
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

SYSTEM_PROMPT = """You are an expert job application email classifier. Classify the given email and return ONLY a raw JSON object (no markdown, no explanation).

Categories:
- "applied"   : Acknowledgement that an application was received, no action yet
- "interview" : Invitation for an interview (any round), or scheduling a call
- "offer"     : Legitimate job offer with salary/CTC, joining date, offer letter
- "rejected"  : Rejection / regret email, they are not moving forward
- "scam"      : Fraudulent email — asks for payment/fee, requests Aadhaar/PAN/bank details 
                upfront, promises unrealistic salary with no interview, uses unofficial 
                email domains (gmail.com/yahoo for MNC HR), extreme urgency

Return this exact JSON:
{
  "category": "<applied|interview|offer|rejected|scam>",
  "company": "<company name, infer from email/subject, or Unknown>",
  "role": "<job role, infer from subject, or Unknown>",
  "confidence": <0.0-1.0>,
  "scam_reasons": ["<reason1>", "<reason2>"],
  "follow_up_due": "<YYYY-MM-DD or null — 7 days after email date if category is applied, else null>",
  "summary": "<one sentence summary of the email>"
}

scam_reasons must be an empty list [] for non-scam emails.
For scam emails list specific red flags found (e.g. "Asks for payment fee", "Requests Aadhaar/PAN", "Gmail domain for MNC HR", "Unrealistic salary promise", "Extreme urgency").
follow_up_due: only set for "applied" category — exactly 7 days after the email date."""


async def classify_email(email: dict) -> dict:
    """Call Gemini to classify one email. Returns enriched dict."""
    prompt = f"""{SYSTEM_PROMPT}

Email to classify:
From: {email['from']}
Date: {email['date']}
Subject: {email['subject']}
Body: {email['body']}"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 512},
    }

    last_error = None
    for model in GEMINI_MODELS:
        url = f"{GEMINI_BASE.format(model=model)}?key={GEMINI_KEY}"
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.post(url, json=payload)
            if r.status_code == 429:
                continue
            if r.status_code != 200:
                last_error = f"{r.status_code}: {r.text[:100]}"
                continue
            raw = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Strip markdown fences if present
            if raw.startswith("```"):
                lines = raw.split("\n")
                raw = "\n".join(lines[1:-1]).strip()
            result = json.loads(raw)
            return {**email, **result}
        except Exception as e:
            last_error = str(e)
            continue

    # Fallback if all models fail
    return {
        **email,
        "category": "applied",
        "company": "Unknown",
        "role": "Unknown",
        "confidence": 0.0,
        "scam_reasons": [],
        "follow_up_due": None,
        "summary": "Classification failed — API error.",
        "_error": str(last_error),
    }


async def classify_inbox(emails: List[dict]) -> List[dict]:
    """Classify all emails concurrently (bounded) to keep latency low."""
    sem = asyncio.Semaphore(5)

    async def run(email: dict) -> dict:
        async with sem:
            return await classify_email(email)

    return await asyncio.gather(*(run(e) for e in emails))
