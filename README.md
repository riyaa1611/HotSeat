# HotSeat

AI pitch practice platform. Paste a GitHub repo URL, pick a brutal AI interviewer persona, get grilled on your project, and receive a scored evaluation report.

## Personas

- **Investor** — VC who's funded nothing this month. Cares about revenue, not code.
- **Tech Lead** — 15 years of PRs. Will ask where your tests are.
- **HR Manager** — 12 years of behavioral interviews. Smells rehearsed answers.
- **Product Manager** — Shipped 20 products, killed 15. Cares about users, not architecture.

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env .env.local  # edit with your real GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### Tests

```bash
cd backend
python -m pytest tests/ -v
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Get free at console.groq.com |
| `GITHUB_TOKEN` | No | Raises GitHub API rate limit to 5000 req/hr |

## Deploy

**Backend → Render**
1. Create new Web Service, connect repo, set root dir to `backend/`
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add env var: `GROQ_API_KEY`

**Frontend → Vercel**
1. Import repo, set root dir to `frontend/`
2. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`
