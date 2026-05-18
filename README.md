# HotSeat

**AI-powered pitch and interview practice. Get grilled before the real thing.**

Paste a GitHub repo or project URL, pick a brutal AI interrogator, survive 12 questions designed to find every weak spot in your pitch or interview answers — then get a scored evaluation report with per-answer breakdown, progress tracking, and a full user profile.

![HotSeat](frontend/public/favicon.png)

---

## What it does

- **Two practice modes** — Project Pitch (paste a repo/URL) or Interview Prep (upload resume + GitHub)
- **Reads your project** — parses your GitHub repo (README, file tree, key config files) or scrapes a deployed project URL
- **Reads your resume** — parses PDF resume and fetches your GitHub profile to build a personalised interview context
- **Grills you in character** — 6 AI personas each with a distinct agenda, tone, and blind spots they'll exploit
- **Scores you honestly** — post-session report with per-dimension scores, per-answer breakdown, specific strengths/weaknesses, and one concrete action item
- **Confidence feedback** — real-time confidence score on every message you send (filler detection, structure, specificity)
- **Tracks your progress** — score trend chart, activity heatmap, streak counter, full session history grouped by project or role
- **User profile** — editable identity card (bio, job title, company, location, LinkedIn, GitHub), GitHub-style activity heatmap, score progress chart
- **Share reports** — generate a public share link for any session report
- **Export to PDF** — download any report with one click

---

## Personas

### Project Pitch

| Persona | Agenda |
|---|---|
| **Investor** | VC who's funded nothing this month. Cares about revenue, moat, and team — not code. |
| **Tech Lead** | 15 years of PRs. Wants to know why you made specific choices and where the tests are. |
| **HR Manager** | 12 years of behavioral interviews. Smells rehearsed answers from a mile away. |
| **Product Manager** | Shipped 20 products, killed 15. Cares about users and whether they'll pay. |

### Interview Prep

| Persona | Agenda |
|---|---|
| **Behavioral** | HR interviewer with 12 years of experience. No buzzwords, no rehearsed answers. |
| **Resume Deep-Dive** | Senior recruiter who goes line by line. Claims, gaps, consistency — nothing slides. |

---

## Tech Stack

**Backend**
- Python · FastAPI · Groq API (`llama-3.3-70b-versatile`)
- Supabase (PostgreSQL + Auth + Row Level Security)
- httpOnly cookie auth · SSRF-guarded URL scraping · Per-user rate limiting
- PDF resume parsing · GitHub profile fetching with retry + backoff
- `user_profiles` table for persistent profile data
- LLM error handling — retries on transient Groq errors, session state rollback on failure, fallback evaluation reports on bad JSON
- Anti-hallucination guardrails — temperature tuning per call type, strict "only use provided context" prompt rules, score range validation (1–10 clamp)

**Frontend**
- React · Vite · React Router
- Browser Web Speech API (TTS + STT)
- Supabase JS client · Axios
- GitHub-style activity heatmap · SVG score progress chart
- `@media print` PDF export

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com) (free)
- A [Supabase](https://supabase.com) project

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_key
GITHUB_TOKEN=your_github_pat       # optional — raises rate limit to 5000 req/hr
DATABASE_URL=your_supabase_db_url
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
FRONTEND_URL=http://localhost:5173
COOKIE_SECURE=false
```

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm run dev
```

Visit `http://localhost:5173`

### Tests

```bash
cd backend
python -m pytest tests/ -v
```

---

## Project Structure

```
hotseat/
├── backend/
│   ├── app/
│   │   ├── routers/        # repo, session, report, interview, user, auth
│   │   ├── services/       # repo_parser, url_scraper, conversation, evaluator,
│   │   │                   # interview_prompt_engine, interview_context_builder,
│   │   │                   # interview_evaluator, resume_parser, groq_client
│   │   ├── models/         # schemas, database
│   │   ├── auth.py         # httpOnly cookie auth via Supabase
│   │   ├── config.py       # pydantic settings
│   │   └── main.py         # FastAPI app, CORS, rate limiter
│   └── tests/
└── frontend/
    └── src/
        ├── pages/          # Home, Session, Report, History, Profile, SharedReport, Auth
        ├── components/     # ChatWindow, ResumeInput, VoiceInput, PersonaSelector, ...
        ├── hooks/          # useSession, useConfidence, useSpeechRecognition, useTTS, ...
        ├── services/       # api.js (axios + fetch SSE)
        └── context/        # AuthContext (Supabase + backend cookie sync)
```

---

## Security

- Auth via Supabase JWT validated server-side on every request — stored in httpOnly cookie, never accessible to JavaScript
- SSRF protection on all URL inputs — scheme validation, private IP blocking, redirect validation
- Per-user rate limiting — 10 req/min on session start, 30 req/min on responses
- Input length caps on all user-supplied fields
- CORS locked to explicit frontend origin
- Row Level Security enabled on all tables (sessions, shared_reports, user_profiles)
- Content-Security-Policy header on all API responses
- Leaderboard names masked to "First L." format — full names never exposed publicly
- `/docs` disabled in production
