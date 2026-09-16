# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SmartResumeSystem has two parts:
- `frontend/` — a Create React App (React 19, Tailwind, Recharts) with two modes toggled in the header: **Resume Analyser** (candidate uploads a resume, gets a scored analysis) and **Recruiter Portal** (job CRUD + candidate management, JWT-authenticated).
- `backend/app.py` — the single active Flask backend (MongoDB via pymongo, JWT via flask-jwt-extended). It powers both modes.

## Commands

### Backend setup & run
```powershell
cd backend
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
Runs on `http://127.0.0.1:5001`. Requires a `backend/.env` with `MONGO_URI` and `JWT_SECRET_KEY` (not present in the repo — must be created locally).

### Frontend setup & run
```bash
cd frontend
npm install
npm start
```
Runs on `http://localhost:3000`. The frontend's Flask API base URL is hardcoded as `http://127.0.0.1:5001` in [App.js](frontend/src/App.js) and [RecruiterApi.js](frontend/src/services/RecruiterApi.js).

### Frontend tests
```bash
cd frontend
npm test
```
Note: the only test file, `App.test.js`, is unmodified Create React App boilerplate (asserts a "learn react" link that no longer exists) — it currently fails and is not representative of the app.

There is no backend test suite.

## Architecture

### Backend: single-file, pipeline-based (`backend/app.py`)
All routes and logic live in one file. The core resume-analysis pipeline (used by both `/analyze_resume` and the recruiter's `/jobs/<id>/candidates` upload) is a fixed sequence:
1. `extract_text` — pdfplumber PDF → raw text.
2. `detect_domain` — scores text against `DOMAIN_PROFILES` keyword sets (22 domains: Technology, Data & AI, Finance & Banking, Law, Healthcare, Marketing, HR, etc.) to pick the resume's field.
3. `detect_skills` — matches against `SKILLS_DB`, prioritizing the categories relevant to the detected domain (`DOMAIN_CATEGORIES`), then falls back to missing high-priority skills from `DOMAIN_PRIORITY_SKILLS`.
4. `check_sections` — presence of education/experience/projects/skills/summary/certifications/achievements via keyword lookup, paired with static tips from `SECTION_TIPS`.
5. `check_achievements` / `check_repetition` — regex-based detection of quantified, impact-worded bullet points, and overused words.
6. `calculate_score` — weighted 0–100 score: sections (35) + skills (30) + achievements (25) + writing/repetition (10).
7. `generate_suggestions` — rule-based text suggestions from the above signals.
8. `match_job_roles` — scores the resume's skills against `JOB_ROLES` (~50 predefined roles), biased toward the detected domain.

Domain detection happens before skill detection and job matching, since both depend on it.

Routes on top of this pipeline:
- `/register`, `/login` — bcrypt-style password hash (werkzeug) + JWT issuance, `users` collection.
- `/jobs` (GET/POST), `/jobs/<id>` (PUT/DELETE) — recruiter-owned job postings, scoped by `recruiter_id` from the JWT identity, `jobs` collection.
- `/analyze_resume` — public, one-off analysis for the candidate UI (no DB write).
- `/jobs/<id>/candidates` (POST) — recruiter uploads a candidate PDF against a specific job; reuses the same pipeline, then additionally computes job-specific skill match against that job's `required_skills`, and persists the result in `candidates` collection.
- `/jobs/<id>/candidates` (GET) — lists candidates for a job, sorted by `job_match_score`.

MongoDB collections: `users`, `jobs`, `candidates` (database `resume_analyser`).

### Frontend
- [App.js](frontend/src/App.js) holds top-level `mode` state (`candidate` | `recruiter`) and, for candidate mode, the upload/analysis/loading state machine — it posts directly to `/analyze_resume` with `fetch`.
- Candidate mode: `UploadResume` → `Dashboard` (renders score circle, breakdown, skills, suggestions, job matches) using components in `frontend/src/components/`.
- Recruiter mode: `pages/RecruiterDashboard.js` + `components/recruiter/*` (JobsList, JobDetail, CandidateTable, CandidateDrawer, Analytics, FilterBar, Sidebar, Topbar, etc.).
- `services/RecruiterApi.js` centralizes all recruiter-mode HTTP calls: reads the JWT from `localStorage["recruiterToken"]`, attaches it as `Authorization: Bearer <token>`, and force-reloads the app on a 401 (session expiry). Candidate-mode's `/analyze_resume` call bypasses this service and calls `fetch` directly from `App.js`.

### Code that looks active but isn't
- `backend/app_backup*.py`, `backend/app_before_*.py` — superseded snapshots of `app.py` from earlier development stages. Not imported anywhere.
- `backend/job_matcher.py`, `backend/skills.py`, `backend/career_paths.py`, `backend/courses.py` — an earlier, simpler skill-matching approach (uses `pandas` + a separate `data/jobs.csv`). Not imported by `app.py`; `app.py` has its own self-contained versions of this logic (`SKILLS_DB`, `JOB_ROLES`, `match_job_roles`).
- `backend/backend/` — a separate, unused Node/Express backend (`server.js`, port 5000). The React app currently talks only to the Flask backend on port 5001 (see [DEPLOY.md](DEPLOY.md)).
- `smart_resume_system/` at the repo root — an older prototype (PyPDF2-based parser, a sample PDF dataset), superseded by `backend/app.py`.
- Root-level `package.json` and `package-lock.json` are directories (each containing a same-named file inside), not plain files — likely accidental; don't assume `npm` commands work from the repo root.

### Docs
- `README.md` is just a title placeholder. The real setup/run instructions live in [DEPLOY.md](DEPLOY.md).
