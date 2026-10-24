const KEY = import.meta.env.VITE_GEMINI_API_KEY
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest']

const SYSTEM_PROMPT = `You are an expert job application email classifier. Classify the given email and return ONLY a raw JSON object (no markdown, no explanation).

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
follow_up_due: only set for "applied" category — exactly 7 days after the email date.`

async function classifyEmail(email) {
  const prompt = `${SYSTEM_PROMPT}

Email to classify:
From: ${email.from}
Date: ${email.date}
Subject: ${email.subject}
Body: ${email.body}`

  let lastError = null
  for (const name of MODELS) {
    try {
      const r = await fetch(`${BASE}/${name}:generateContent?key=${KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        }),
      })
      if (!r.ok) { lastError = `${name} ${r.status}`; continue }
      const data = await r.json()
      let raw = data.candidates[0].content.parts[0].text.trim()
      if (raw.startsWith('```')) raw = raw.split('\n').slice(1, -1).join('\n').trim()
      return { ...email, ...JSON.parse(raw) }
    } catch (e) {
      lastError = String(e)
    }
  }
  return {
    ...email, category: 'applied', company: 'Unknown', role: 'Unknown',
    confidence: 0, scam_reasons: [], follow_up_due: null,
    summary: `Classification failed — ${lastError}`, _error: lastError,
  }
}

export async function classifyInbox(emails) {
  const results = new Array(emails.length)
  let next = 0
  const worker = async () => {
    while (next < emails.length) {
      const i = next++
      results[i] = await classifyEmail(emails[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, emails.length) }, worker))

  const today = new Date().toISOString().slice(0, 10)
  const count = (c) => results.filter(e => e.category === c).length
  return {
    classified: results,
    scams: results.filter(e => e.category === 'scam'),
    followups: results
      .filter(e => e.category === 'applied' && e.follow_up_due && e.follow_up_due <= today)
      .map(e => ({ ...e, days_overdue: Math.floor((Date.parse(today) - Date.parse(e.follow_up_due)) / 86400000) })),
    stats: {
      total: results.length, applied: count('applied'), interview: count('interview'),
      offer: count('offer'), rejected: count('rejected'), scam: count('scam'),
    },
  }
}
