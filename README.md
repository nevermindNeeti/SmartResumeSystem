# Smart Resume Analyser

AI-powered resume screening and job recommendation system with a React frontend and a Flask backend.  
Uses **SQLite** for storage — no external database, no cloud account, no setup required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 3, react-icons, recharts |
| Backend | Python / Flask, Flask-JWT-Extended, Flask-CORS |
| Database | SQLite (built into Python — zero setup, auto-created on first run) |
| PDF parsing | pdfplumber |
| Auth | JWT (stored in localStorage) |

---

## Prerequisites

- **Python 3.9+**
- **Node.js 18+** and npm

No database account or external service required.

---

## Getting started

```bash
git clone https://github.com/nevermindNeeti/SmartResumeSystem.git
cd SmartResumeSystem
```

---

## Running the app

You need two terminals — one for the backend, one for the frontend.

### Terminal 1 — Backend (Flask)

```bash
cd backend

# Create and activate virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
python app.py
```

The API starts on **http://127.0.0.1:5001**.
A SQLite database file `resume_analyser.db` is created automatically in `backend/` on first run.

Verify it is working: open http://127.0.0.1:5001 in your browser — you should see:
```json
{"status": "Resume Analyser API running!", "version": "2.0-domain-general"}
```

### Terminal 2 — Frontend (React)

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm start
```

The app opens automatically at **http://localhost:3000**.

---

## Viewing the website

| URL | What you see |
|---|---|
| http://localhost:3000 | Resume Analyser — candidate upload & analysis |
| http://localhost:3000 → **Recruiter Portal** button | Recruiter login and dashboard |
| http://127.0.0.1:5001 | Backend health check (JSON) |

---

## How to use

### Candidate — Resume Analysis *(no login required)*

1. Go to **http://localhost:3000**
2. Drop or click to upload a **PDF resume**
3. Click **Analyse Resume**
4. View your score (0–100), skill breakdown, section tips, and top job role matches

### Recruiter Portal

1. Click **Recruiter Portal** in the top-right header
2. First time: create an account (see below), then sign in with your email and password
3. After login you get access to **Jobs**, **Candidates**, and **Analytics** tabs

---

## Recruiter — First-time account setup

The recruiter portal requires an account. Register one using curl or Postman:

```bash
curl -X POST http://127.0.0.1:5001/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"you@example.com","password":"yourpassword","role":"recruiter"}'
```

Then sign in through the UI using those credentials.

### Create a job posting

```bash
# First log in to get your token
curl -X POST http://127.0.0.1:5001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'

# Use the access_token from the response above
curl -X POST http://127.0.0.1:5001/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "title": "Software Engineer",
    "company": "Acme Corp",
    "description": "We are looking for a software engineer.",
    "required_skills": ["python", "react", "sql"],
    "experience": "2-4 years",
    "domain": "Technology"
  }'
```

---

## Configuration

The app works out of the box with no configuration. A `.env` file in `backend/` sets the JWT secret key — it is already pre-configured. To change it:

```bash
# backend/.env
JWT_SECRET_KEY=your-own-secret-string-here
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register a new recruiter account |
| `POST` | `/login` | No | Login — returns a JWT access token |
| `POST` | `/analyze_resume` | No | Analyse a PDF resume (`multipart/form-data`, field: `resume`) |
| `GET` | `/jobs` | JWT | List all jobs for the logged-in recruiter |
| `POST` | `/jobs` | JWT | Create a new job posting |
| `PUT` | `/jobs/<job_id>` | JWT | Update a job posting |
| `DELETE` | `/jobs/<job_id>` | JWT | Delete a job posting |
| `GET` | `/jobs/<job_id>/candidates` | JWT | List candidates for a job (sorted by match score) |
| `POST` | `/jobs/<job_id>/candidates` | JWT | Upload and analyse a candidate resume against a job |
| `PUT` | `/candidates/<candidate_id>/status` | JWT | Update a candidate's pipeline status |

---

## Project Structure

```
SmartResumeSystem/
├── backend/
│   ├── app.py                  # Flask API — all routes, resume analysis logic, SQLite DB
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # JWT secret key (pre-configured)
│   ├── .env.example            # Template for the .env file
│   └── resume_analyser.db      # SQLite database (auto-created on first run)
└── frontend/
    ├── src/
    │   ├── App.js                       # Root — candidate / recruiter mode toggle
    │   ├── components/
    │   │   ├── UploadResume.js          # PDF drag-and-drop upload
    │   │   ├── Dashboard.js             # Analysis results layout (tabs)
    │   │   ├── ScoreCard.js             # Score circle and breakdown bars
    │   │   ├── AnalysisPanel.js         # Skills / Sections / Job Match / Suggestions tabs
    │   │   ├── ui/                      # Shared UI: Button, Card, Badge, Input
    │   │   └── recruiter/               # Recruiter portal components
    │   │       ├── Overview.js          # Dashboard stats overview
    │   │       ├── JobsList.js          # Job cards grid
    │   │       ├── JobDetail.js         # Job detail + candidate table
    │   │       ├── CandidateTable.js    # Ranked candidate list
    │   │       ├── CandidateDrawer.js   # Candidate detail slide-over panel
    │   │       ├── UploadResumes.js     # Multi-resume upload for a job
    │   │       ├── Analytics.js         # Pipeline charts and metrics
    │   │       ├── Sidebar.js           # Navigation sidebar
    │   │       └── Topbar.js            # Top navigation bar
    │   ├── pages/
    │   │   └── RecruiterDashboard.js    # Recruiter login + dashboard page
    │   └── services/
    │       └── RecruiterApi.js          # API client (JWT-authenticated requests)
    ├── tailwind.config.js
    └── package.json
```
