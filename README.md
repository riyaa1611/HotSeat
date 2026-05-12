# HotSeat

**AI-powered pitch practice. Get grilled before the real thing.**

Paste a GitHub repo or project URL, pick a brutal AI interrogator, survive 12 questions designed to find every weak spot in your pitch — then get a scored evaluation report across 5 dimensions.

![HotSeat](frontend/public/favicon.png)

---

## What it does

- **Reads your project** — parses your GitHub repo (README, file tree, key config files) or scrapes a deployed project URL
- **Grills you in character** — 4 AI personas each with a distinct agenda, tone, and blind spots they'll exploit
- **Scores you honestly** — post-session report with per-dimension scores, specific strengths/weaknesses, and one concrete action item
- **Remembers your history** — track improvement across sessions, grouped by project with trend charts

---

## Personas

| Persona | Agenda |
|---|---|
| **Investor** | VC who's funded nothing this month. Cares about revenue, moat, and team — not code. |
| **Tech Lead** | 15 years of PRs. Wants to know why you made specific choices and where the tests are. |
| **HR Manager** | 12 years of behavioral interviews. Smells rehearsed answers from a mile away. |
| **Product Manager** | Shipped 20 products, killed 15. Cares about users and whether they'll pay. |

---

## Tech Stack

**Backend**
- Python · FastAPI · Groq API (`llama-3.3-70b-versatile`)
- Supabase (PostgreSQL + Auth + Row Level Security)
- httpOnly cookie auth · SSRF-guarded URL scraping · Per-user rate limiting

**Frontend**
- React · Vite · React Router
- Browser Web Speech API (TTS + STT)
- Supabase JS client · Axios

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

36 tests, all passing.

---

## Project Structure

```
hotseat/
├── backend/
│   ├── app/
│   │   ├── routers/        # parse-repo, session, report, auth
│   │   ├── services/       # repo_parser, url_scraper, conversation, evaluator, groq_client
│   │   ├── models/         # schemas, database
│   │   ├── auth.py         # httpOnly cookie auth via Supabase
│   │   ├── config.py       # pydantic settings
│   │   └── main.py         # FastAPI app, CORS, rate limiter
│   └── tests/              # 36 async tests
└── frontend/
    └── src/
        ├── pages/          # Landing, Auth, Home, Session, Report, History, SharedReport
        ├── components/     # ChatWindow, VoiceInput, Timer, PersonaSelector, ...
        ├── hooks/          # useSession, useSpeechRecognition, useTTS, ...
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
- Row Level Security enabled on the sessions table
- `/docs` disabled in production
