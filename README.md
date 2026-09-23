# Smart Resume Analyser

AI-powered resume screening and job recommendation system.  
React frontend · Flask backend · SQLite database (zero setup — auto-created on first run).

---

## Quick Start (copy-paste commands)

> **Two terminals required** — one for backend, one for frontend.

### Terminal 1 — Backend

```bash
cd SmartResumeSystem/backend

# First time only: create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows PowerShell

# First time only: install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

✅ Backend is running at **http://127.0.0.1:5001**

Confirm it's up — open http://127.0.0.1:5001 in your browser. You should see:
```json
{"status": "Resume Analyser API running!", "version": "2.0-domain-general"}
```

---

### Terminal 2 — Frontend

```bash
cd SmartResumeSystem/frontend

# First time only: install npm packages
npm install

# Start the React dev server
npm start
```

✅ Website opens automatically at **http://localhost:3000**

---

## Viewing the website

| URL | What you see |
|---|---|
| **http://localhost:3000** | Resume Analyser — upload & analyse a PDF resume (no login) |
| **http://localhost:3000** → *Recruiter Portal* button (top right) | Recruiter login page |
| **http://127.0.0.1:5001** | Backend health check JSON |

---

## Using the app

### Candidate — Resume Analysis *(no login required)*

1. Go to **http://localhost:3000**
2. Drop or click to upload a **PDF resume**
3. Click **Analyse Resume**
4. View your score (0–100), skill breakdown, section checklist, and top job role matches

---

### Recruiter Portal

#### Step 1 — Create a recruiter account (one-time only)

Run this in your terminal while the backend is running:

```bash
curl -X POST http://127.0.0.1:5001/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"you@example.com","password":"yourpassword","role":"recruiter"}'
```

#### Step 2 — Sign in

1. Click **Recruiter Portal** in the top-right header
2. Enter your email and password
3. You're in!

#### What you can do inside the recruiter dashboard:

- **Overview** — stats snapshot (total jobs, total candidates, average match score)
- **Jobs** — create job postings, view all jobs, click a job to open candidates
- **Candidates** — browse all jobs and jump to their candidate lists
- **Analytics** — pipeline funnel and skill gap charts

#### Creating a job

Inside the dashboard → Jobs tab → click **+ Create Job**.  
Fill in title, company, domain, experience range, description, and required skills.

#### Uploading a resume against a job

Open a job → scroll to **Upload Resumes** → select one or more PDF files → click **Upload Resumes**.  
Each resume is parsed, scored, and ranked by job match immediately.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 3, react-icons, recharts |
| Backend | Python / Flask, Flask-JWT-Extended, Flask-CORS |
| Database | SQLite (built into Python — zero setup) |
| PDF parsing | pdfplumber |
| Auth | JWT (stored in localStorage) |

---

## Configuration

The app works out of the box with no configuration changes.  
The file `backend/.env` contains the JWT secret key — it is pre-configured.

To use a custom secret:
```
# backend/.env
JWT_SECRET_KEY=your-own-secret-string-here
```

---

## API Reference

### Auth & Account

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register a new recruiter (legacy) |
| `POST` | `/login` | No | Login — returns JWT token |
| `POST` | `/recruiter/register` | No | Register recruiter (new table) |
| `POST` | `/recruiter/login` | No | Login recruiter (new table) |
| `POST` | `/candidate/register` | No | Register candidate account |
| `POST` | `/candidate/login` | No | Login candidate |

### Jobs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/jobs/public` | No | Public job board (all active jobs) |
| `GET` | `/jobs` | JWT | List recruiter's own jobs |
| `POST` | `/jobs` | JWT | Create a job posting |
| `PUT` | `/jobs/<job_id>` | JWT | Update a job posting |
| `DELETE` | `/jobs/<job_id>` | JWT | Delete a job posting |

### Candidates (legacy table)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/jobs/<job_id>/candidates` | JWT | List candidates for a job |
| `POST` | `/jobs/<job_id>/candidates` | JWT | Upload & analyse a candidate resume |
| `PUT` | `/candidates/<candidate_id>/status` | JWT | Update candidate pipeline status |

### Applications (new table)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/jobs/<job_id>/applications` | JWT | List applications (includes candidate name/email) |
| `POST` | `/jobs/<job_id>/applications` | JWT | Recruiter uploads a resume to applications table |
| `PUT` | `/applications/<app_id>/status` | JWT | Update status + notes (auto-sets invited_at on Interview) |
| `POST` | `/jobs/<job_id>/apply` | JWT (candidate) | Candidate self-applies with resume |
| `GET` | `/candidate/applications` | JWT (candidate) | Candidate views own applications |

### Companies

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/companies` | No | List all companies |
| `POST` | `/companies` | No | Create a company |

### Resume Analysis

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/analyze_resume` | No | Analyse a PDF (`multipart/form-data`, field: `resume`) |

---

## Project Structure

```
SmartResumeSystem/
├── backend/
│   ├── app.py                    # Flask API — all routes, resume analysis logic, SQLite init
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # JWT secret key (pre-configured, do not commit)
│   ├── .env.example              # Template for the .env file
│   └── resume_analyser.db        # SQLite database (auto-created on first run)
│
└── frontend/
    ├── public/
    │   └── index.html            # HTML template with Ubuntu font import
    ├── src/
    │   ├── App.js                # Root — candidate / recruiter mode toggle
    │   ├── index.css             # Global styles + Tailwind directives
    │   ├── components/
    │   │   ├── UploadResume.js   # PDF drag-and-drop upload
    │   │   ├── Dashboard.js      # Analysis results layout (tabbed)
    │   │   ├── ScoreCard.js      # Score ring and breakdown bars
    │   │   ├── AnalysisPanel.js  # Skills / Sections / Job Match / Suggestions tabs
    │   │   ├── ui/               # Shared UI: Button, Card, Badge, Input
    │   │   └── recruiter/
    │   │       ├── Overview.js         # Stats overview
    │   │       ├── JobsList.js         # Job card grid + Create Job button
    │   │       ├── JobDetail.js        # Job detail + candidate table
    │   │       ├── CandidateTable.js   # Ranked candidate rows
    │   │       ├── CandidateDrawer.js  # Candidate slide-over panel + status control
    │   │       ├── UploadResumes.js    # Multi-resume upload for a job
    │   │       ├── CreateJobModal.js   # Create Job form modal
    │   │       ├── FilterBar.js        # Candidate filter controls
    │   │       ├── Analytics.js        # Pipeline charts
    │   │       ├── Sidebar.js          # Navigation sidebar
    │   │       └── Topbar.js           # Top bar
    │   ├── pages/
    │   │   └── RecruiterDashboard.js   # Login + dashboard page
    │   └── services/
    │       └── RecruiterApi.js         # JWT-authenticated API client
    ├── tailwind.config.js        # Custom tokens: brand-*, ink-*, shadow-card/raised
    └── package.json
```

---

## Database

SQLite file: `backend/resume_analyser.db` — created automatically on first run.

Tables:
- `users` — legacy recruiter accounts (used by `/register` + `/login`)
- `recruiters` — new recruiter accounts (used by `/recruiter/register` + `/recruiter/login`)
- `companies` — company registry
- `jobs` — job postings (owned by recruiter)
- `candidates` — legacy resume uploads (used by `/jobs/<id>/candidates`)
- `applications` — new unified table (recruiter-uploaded + candidate self-applied)
- `candidate_accounts` — candidate accounts (used by `/candidate/register`)

To reset the database (start fresh):
```bash
rm backend/resume_analyser.db
python backend/app.py   # recreates it automatically
```

---

## Common Issues

| Problem | Fix |
|---|---|
| `Cannot connect to backend` | Make sure `python app.py` is running in `backend/` on port 5001 |
| `npm start` fails | Run `npm install` inside the `frontend/` folder first |
| Login says "Invalid email or password" | Register first using the `curl` command in the Recruiter section above |
| PDF parse error | Use a text-based PDF (not a scanned image). Re-export from Word/Google Docs |
| Port 5001 already in use | Kill the existing process: `lsof -ti:5001 \| xargs kill` |
| Port 3000 already in use | React will ask to use another port — press `Y` |
