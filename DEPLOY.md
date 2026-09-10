## README content to add


# SmartResumeSystem

## Overview
SmartResumeSystem is a resume analysis app with:
- a React frontend in `frontend/`
- a Python Flask backend in `backend/`
- current frontend API target: `http://127.0.0.1:5001/analyze_resume`

> Note: There is also a nested Node backend at `backend/backend/`, but the main React app currently uses the Flask backend.

## Prerequisites
- Git
- Node.js and npm
- Python 3.10+ (recommended 3.11+)

## Setup

### 1. Install backend dependencies
#### macOS / Linux
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install flask flask-cors pdfplumber
```

#### Windows PowerShell
```powershell
cd backend
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
pip install flask flask-cors pdfplumber
```

#### Windows CMD
```cmd
cd backend
py -3 -m venv venv
venv\Scripts\activate.bat
pip install flask flask-cors pdfplumber
```

> If your Windows setup uses `python` instead of `py`, replace `py -3` with `python`.

### 2. Install frontend dependencies
```bash
cd ../frontend
npm install
```

## Run the app

### Start the backend
#### macOS / Linux
```bash
cd backend
source venv/bin/activate
python backend/app.py
```

#### Windows PowerShell
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python backend/app.py
```

#### Windows CMD
```cmd
cd backend
venv\Scripts\activate.bat
python backend/app.py
```

The backend should run at:
- `http://127.0.0.1:5001`

### Start the frontend
```bash
cd frontend
npm start
```

The frontend should open at:
- `http://localhost:3000`

## Push to GitHub

### If this is a new repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

### If the repo already exists
```bash
git add .
git commit -m "Update README and project files"
git push
```

## Important notes
- Do not commit `venv/` or `node_modules/`.
- Add `venv/` to `.gitignore` if it is not already ignored.
- The React app uses the Flask backend on port `5001` by default.
- If you want to use the nested Node backend instead, update the frontend API URL to `http://localhost:5000/analyze_resume` and run `node backend/backend/server.js`.

```

Use this exact content in your `README.md` so another developer can clone, install, and run without changing the code.