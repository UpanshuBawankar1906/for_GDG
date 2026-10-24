# JobPilot — Job Hunt Autopilot

> "Good day! Please surrender your inbox. I promise to judge only the scammers."

Built for **Garbathon 2026 by GDG Ahmedabad — Track 02: Automation**, using Google's Gemini API.

---

## The problem

After a layoff, people apply to 100+ jobs in a few weeks. The inbox then fills with a mix of:

- "Application received" acknowledgements
- Real interview invitations (with dates that are easy to miss)
- Rejections
- Genuine offers
- **Scams**: fake recruiters asking for a "refundable training fee", Aadhaar/PAN numbers, or bank details

Job seekers lose track of where they applied, miss interview slots, forget to follow up, and, worst of all, can fall for scams at the moment they are most vulnerable.

## What JobPilot does

You give JobPilot your inbox as a JSON file. For each email it:

1. **Classifies** it as `applied`, `interview`, `offer`, `rejected` or `scam`.
2. **Extracts** the company, the role, a one-line summary and a confidence score.
3. **Flags scams in red**, with specific reasons such as "Asks for payment fee", "Requests Aadhaar/PAN" or "Gmail domain for MNC HR".
4. **Creates follow-up reminders** for applications with no reply after 7 days.
5. **Shows a tracker board** with one column per status.
6. **Exports the tracker** as CSV or JSON.

Scam detection is a label in the same pipeline, not a separate product. One email goes in and one decision comes out.

## How it works

```
inbox.json  ->  FastAPI backend  ->  Gemini (per email)  ->  tracker + scams + follow-ups  ->  React dashboard
```

- **Backend:** FastAPI ([`backend/main.py`](backend/main.py)). It exposes `/classify`, `/tracker`, `/sample-inbox`, `/tracker/update` and `/tracker/reset`.
- **Classifier:** [`backend/classifier.py`](backend/classifier.py) sends each email to Gemini with a strict JSON-only prompt. It processes 5 emails at a time and falls back across several Gemini models if one is rate-limited or unavailable.
- **Frontend:** React + Vite + Tailwind in [`frontend/`](frontend/). It has the robot greeter, a tracker board, Scam, Follow-up and Stats views, and CSV/JSON export.
- **Google products:** the AI is Gemini through the Google AI Studio API, and the project was developed with Google Antigravity.

## Built with

- **Google Antigravity** and **IBM Bob** were used as AI coding assistants during development.
- **Gemini API (Google AI Studio)** powers the email classification at runtime.
- The app itself is built with FastAPI, React, Vite and Tailwind.

## How to run it

**1. Add your Gemini key.** Create `jobpilot/.env`:

```
GEMINI_API_KEY=your_key_here
```

Get a key at https://aistudio.google.com/app/apikey.

**2. Start the backend** (Terminal 1):

```bash
cd jobpilot/backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**3. Start the frontend** (Terminal 2):

```bash
cd jobpilot/frontend
npm install
npm run dev
```

**4. Open the URL Vite prints** (usually http://localhost:5173). Click **Load sample inbox**, then **Analyse Inbox**.

### Inbox format

```json
[
  {
    "id": 1,
    "date": "2026-10-10",
    "from": "careers@zentech.in",
    "subject": "Application received: Backend Engineer",
    "body": "Thanks for applying. We will get back to you..."
  }
]
```

You can also upload your own `.json` file in the same shape. A sample with 20 emails is in [`data/inbox.json`](data/inbox.json).

## How it helps people

| Who | How JobPilot helps |
|---|---|
| **Laid-off professionals** | One clear view of every application, with no spreadsheet to maintain by hand |
| **Fresh graduates** | Learn to spot fake offers: the red flags are listed, not just a verdict |
| **Anyone applying in bulk** | Never miss an interview invite or a follow-up that is due |
| **Families and mentors** | The export file makes it easy to review someone's progress together |
| **Career centres and placement cells** | One tool can protect many students from recruitment fraud |

**Why this matters:** recruitment scams hit people when they are anxious and out of work. Catching a "pay Rs 4,999 to confirm your joining" email before the victim replies protects both their money and their identity documents.

## Known limits

- **Free-tier quota:** the Gemini free tier has a small daily request limit per model. The 20-email demo inbox uses about 20 requests, so avoid repeated test runs before a demo.
- **Failed classifications:** if every model fails, an email is marked `applied` with confidence 0.0 and a `_error` field. Treat 0% confidence as "not classified".
- **In-memory tracker:** the tracker resets when the backend restarts. Use the CSV/JSON export to keep your data.
- **Not legal or security advice:** the scam check is an AI assessment. When in doubt, verify the company through its official website.

## Security note

Never commit `.env`. It holds your Gemini key and any optional Gmail or Twilio credentials.

## Roadmap

- Read mail directly from Gmail (with consent) instead of a JSON file
- Chat with the bot about your applications, for example "Which companies haven't replied?"
- Calendar invites for interview emails
- Auto-drafted follow-up emails

---

Made for GDG Ahmedabad Garbathon 2026.
