from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId
import os
import certifi
import pdfplumber
import re
import io

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())

db = client["resume_analyser"]

users_collection = db["users"]
jobs_collection = db["jobs"]
candidates_collection = db["candidates"]

print("MongoDB connected successfully!")

app = Flask(__name__)
CORS(app)
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["resume_analyser"]

users_collection = db["users"]
jobs_collection = db["jobs"]
candidates_collection = db["candidates"]

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "recruiter")

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email and password are required"
        }), 400

    email = email.lower().strip()

    existing_user = users_collection.find_one({"email": email})

    if existing_user:
        return jsonify({
            "error": "User with this email already exists"
        }), 409

    password_hash = generate_password_hash(password)

    user = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role
    }

    users_collection.insert_one(user)

    return jsonify({
        "message": "Registration successful",
        "name": name,
        "email": email,
        "role": role
    }), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    email = email.lower().strip()

    user = users_collection.find_one({
        "email": email
    })

    if not user:
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    access_token = create_access_token(
        identity=str(user["_id"])
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "recruiter")
    }), 200


@app.route("/jobs", methods=["GET"])
@jwt_required()
def get_jobs():
    recruiter_id = get_jwt_identity()

    jobs = list(jobs_collection.find(
        {"recruiter_id": recruiter_id},
        {"_id": 1, "title": 1, "company": 1, "description": 1,
         "required_skills": 1, "experience": 1, "domain": 1}
    ))

    for job in jobs:
        job["job_id"] = str(job.pop("_id"))

    return jsonify({
        "jobs": jobs
    }), 200

@app.route("/jobs/<job_id>", methods=["PUT"])
@jwt_required()
def update_job(job_id):
    data = request.get_json()
    recruiter_id = get_jwt_identity()

    allowed_fields = [
        "title",
        "company",
        "description",
        "required_skills",
        "experience",
        "domain"
    ]

    updates = {}

    for field in allowed_fields:
        if field in data:
            updates[field] = data[field]

    if not updates:
        return jsonify({
            "error": "No valid fields provided for update"
        }), 400

    result = jobs_collection.update_one(
        {
            "_id": ObjectId(job_id),
            "recruiter_id": recruiter_id
        },
        {
            "$set": updates
        }
    )

    if result.matched_count == 0:
        return jsonify({
            "error": "Job not found or you are not authorized to update it"
        }), 404

    return jsonify({
        "message": "Job updated successfully"
    }), 200

SKILLS_DB = {
    "programming": ["python", "javascript", "java", "c++", "c#", "typescript", "ruby", "go", "rust", "swift", "kotlin", "php", "scala", "r", "matlab", "dart"],
    "web": ["react", "angular", "vue", "node.js", "express", "django", "flask", "fastapi", "html", "css", "sass", "tailwind", "bootstrap", "next.js", "graphql", "rest api", "redux"],
    "data": ["machine learning", "deep learning", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "matplotlib", "nlp", "computer vision", "data analysis", "tableau", "power bi", "spark", "hadoop"],
    "database": ["sql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "firebase", "dynamodb", "sqlite"],
    "cloud": ["aws", "azure", "google cloud", "docker", "kubernetes", "ci/cd", "jenkins", "github actions", "terraform", "ansible", "linux", "bash"],
    "tools": ["git", "github", "gitlab", "jira", "figma", "agile", "scrum", "photoshop", "excel", "microservices", "selenium", "unit testing"]
}

ALL_SKILLS = [skill for category in SKILLS_DB.values() for skill in category]

JOB_ROLES = {
    "Frontend Developer": ["react", "javascript", "typescript", "html", "css", "vue", "angular", "next.js", "redux", "sass", "tailwind", "figma", "git"],
    "Backend Developer": ["python", "java", "node.js", "sql", "postgresql", "mongodb", "docker", "rest api", "express", "django", "flask", "redis", "git"],
    "Data Scientist": ["python", "machine learning", "deep learning", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "sql", "tableau", "r", "matplotlib"],
    "Full Stack Developer": ["react", "javascript", "node.js", "sql", "mongodb", "docker", "git", "html", "css", "rest api", "postgresql"],
    "DevOps Engineer": ["docker", "kubernetes", "aws", "ci/cd", "linux", "bash", "terraform", "jenkins", "git", "ansible", "azure"],
    "ML Engineer": ["python", "tensorflow", "pytorch", "machine learning", "deep learning", "docker", "aws", "sql", "scikit-learn", "kubernetes", "git"],
    "Mobile Developer": ["swift", "kotlin", "react", "dart", "javascript", "git", "firebase", "rest api", "figma"],
    "Data Analyst": ["sql", "python", "excel", "tableau", "power bi", "pandas", "matplotlib", "r", "data analysis"],
}

SECTION_KEYWORDS = {
    "education": ["education", "degree", "university", "college", "bachelor", "master", "phd", "b.tech", "m.tech", "b.sc", "m.sc", "academic", "graduation", "cgpa", "gpa"],
    "experience": ["experience", "work history", "employment", "internship", "position", "role", "company", "organization", "worked at", "job"],
    "projects": ["projects", "portfolio", "case study", "built", "developed", "created", "implemented", "personal projects", "academic projects"],
    "skills": ["skills", "technologies", "tools", "expertise", "proficiencies", "competencies", "technical skills"],
    "summary": ["summary", "objective", "profile", "about me", "overview", "professional summary"],
    "certifications": ["certification", "certified", "certificate", "course", "training", "license"],
    "achievements": ["achievement", "award", "honor", "recognition", "accomplishment", "won", "winner"],
}

SECTION_TIPS = {
    "education": [
        "Include your CGPA/GPA if it's above 7.5 or 3.5.",
        "Mention relevant coursework for entry-level roles.",
        "List certifications under education if you have no separate section.",
    ],
    "experience": [
        "Start each bullet with a strong action verb (Led, Built, Optimized, Reduced).",
        "Quantify impact — use numbers, percentages, or time saved.",
        "Keep each role to 3-5 bullet points, focused on achievements not duties.",
    ],
    "projects": [
        "Add links to GitHub or live demos for each project.",
        "Mention the tech stack used for every project.",
        "Describe the problem solved, not just the tools used.",
    ],
    "skills": [
        "Group skills by category (Languages, Frameworks, Tools).",
        "Remove outdated or irrelevant skills.",
        "Prioritize skills mentioned in the job description.",
    ],
    "summary": [
        "Keep your summary to 2-3 sentences max.",
        "Tailor it specifically for each job application.",
        "Include your top skill and years of experience.",
    ],
    "certifications": [
        "Include the issuing organization and year.",
        "Prioritize recent and relevant certifications.",
    ],
    "achievements": [
        "Lead with your most impressive achievement.",
        "Quantify every achievement where possible.",
    ],
}


def extract_text(file_bytes):
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    return text


def detect_skills(text):
    text_lower = text.lower()
    found_by_category = {}
    for category, skills in SKILLS_DB.items():
        found = [s for s in skills if s in text_lower]
        if found:
            found_by_category[category] = found
    all_found = [s for skills in found_by_category.values() for s in skills]
    missing = [s for s in ["python", "javascript", "sql", "react", "docker", "git", "aws", "machine learning"] if s not in all_found]
    return all_found, missing, found_by_category


def check_sections(text):
    text_lower = text.lower()
    present = {}
    for section, keywords in SECTION_KEYWORDS.items():
        present[section] = any(kw in text_lower for kw in keywords)
    return present


def get_section_tips(sections):
    tips = {}
    for section, present in sections.items():
        if section in SECTION_TIPS:
            tips[section] = {"present": present, "tips": SECTION_TIPS[section]}
    return tips


def check_achievements(text):
    patterns = [r'\d+\s*%', r'\$\s*\d+', r'\d+\+?\s*(users|clients|customers|projects|teams|members)', r'\d+x\s', r'increased|decreased|improved|reduced|optimized|boosted']
    matches = []
    for p in patterns:
        matches.extend(re.findall(p, text, re.IGNORECASE))
    return list(set(matches))[:8]


def check_repetition(text):
    words = re.findall(r'\b\w{4,}\b', text.lower())
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    stop = {"with", "have", "that", "this", "from", "your", "been", "will", "they", "their", "were", "also", "into", "work", "team", "used", "data", "using", "based", "more", "over"}
    return [w for w, c in counts.items() if c > 5 and w not in stop][:5]


def match_job_roles(skills_found):
    scores = {}
    for role, required in JOB_ROLES.items():
        matched = [s for s in required if s in skills_found]
        pct = round((len(matched) / len(required)) * 100)
        scores[role] = {"match": pct, "matched_skills": matched, "missing_skills": [s for s in required if s not in skills_found]}
    sorted_roles = sorted(scores.items(), key=lambda x: x[1]["match"], reverse=True)
    return dict(sorted_roles[:5])


def calculate_score(sections, skills_found, achievements, repetitions):
    score = 0
    breakdown = {}

    # Sections (35 pts)
    core_sections = {"education": 8, "experience": 15, "projects": 8, "skills": 4}
    section_score = sum(v for k, v in core_sections.items() if sections.get(k))
    breakdown["sections"] = {"score": section_score, "max": 35}
    score += section_score

    # Bonus sections (5 pts)
    bonus = sum(3 for k in ["summary", "certifications", "achievements"] if sections.get(k))
    breakdown["sections"]["score"] = min(35, section_score + bonus)
    score += min(5, bonus)

    # Skills (30 pts)
    skill_score = min(30, len(skills_found) * 2)
    breakdown["skills"] = {"score": skill_score, "max": 30}
    score += skill_score

    # Achievements (25 pts)
    ach_score = min(25, len(achievements) * 5)
    breakdown["achievements"] = {"score": ach_score, "max": 25}
    score += ach_score

    # Repetition penalty (10 pts)
    rep_penalty = min(10, len(repetitions) * 2)
    breakdown["writing"] = {"score": 10 - rep_penalty, "max": 10}
    score -= rep_penalty

    return max(0, min(100, score)), breakdown


def generate_suggestions(sections, skills_found, missing_skills, achievements, repetitions, score):
    suggestions = []
    if not sections.get("summary"):
        suggestions.append("Add a Professional Summary at the top — recruiters spend only 6 seconds on first scan.")
    if not sections.get("experience"):
        suggestions.append("Add a Work Experience section with company names, roles, dates, and bullet achievements.")
    if not sections.get("projects"):
        suggestions.append("Add a Projects section with GitHub links and tech stack details.")
    if len(achievements) < 3:
        suggestions.append("Add more quantified achievements — use numbers like '40% faster', '$10K saved', '5000 users'.")
    if missing_skills:
        suggestions.append(f"Add high-demand skills you know: {', '.join(missing_skills[:4])}.")
    if not sections.get("certifications"):
        suggestions.append("Add relevant certifications (Google, AWS, Coursera) to stand out.")
    if repetitions:
        suggestions.append(f"Vary your language — overused words detected: {', '.join(repetitions)}.")
    if len(skills_found) < 10:
        suggestions.append("Expand your skills section — include more frameworks, tools, and platforms.")
    if score >= 80:
        suggestions.append("Excellent resume! Tailor the skills and summary for each specific job application.")
    return suggestions


@app.route("/analyze_resume", methods=["POST"])
def analyze_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["resume"]
    try:
        text = extract_text(file.read())
        if not text.strip():
            return jsonify({"error": "Could not extract text. Ensure it's not a scanned image PDF."}), 400

        skills_found, missing_skills, skills_by_category = detect_skills(text)
        sections = check_sections(text)
        section_tips = get_section_tips(sections)
        achievements = check_achievements(text)
        repetitions = check_repetition(text)
        score, breakdown = calculate_score(sections, skills_found, achievements, repetitions)
        suggestions = generate_suggestions(sections, skills_found, missing_skills, achievements, repetitions, score)
        job_matches = match_job_roles(skills_found)

        return jsonify({
            "score": score,
            "breakdown": breakdown,
            "skills_found": skills_found,
            "skills_by_category": skills_by_category,
            "missing_skills": missing_skills,
            "sections": sections,
            "section_tips": section_tips,
            "achievements": achievements,
            "repetitions": repetitions,
            "suggestions": suggestions,
            "job_matches": job_matches,
            "word_count": len(text.split()),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# CANDIDATE LIST / UPLOAD API
# ============================================================

@app.route("/jobs/<job_id>/candidates", methods=["GET"])
@jwt_required()
def get_candidates(job_id):
    recruiter_id = get_jwt_identity()

    job = jobs_collection.find_one(
        {
            "_id": ObjectId(job_id),
            "recruiter_id": recruiter_id
        }
    )

    if not job:
        return jsonify({
            "error": "Job not found or you are not authorized to access it"
        }), 404

    candidates = list(candidates_collection.find(
        {
            "recruiter_id": recruiter_id,
            "job_id": job_id
        }
    ))

    for candidate in candidates:
        candidate["candidate_id"] = str(candidate.pop("_id"))

    return jsonify({
        "job_id": job_id,
        "candidates": candidates
    }), 200


@app.route("/jobs/<job_id>/candidates", methods=["POST"])
@jwt_required()
def upload_candidate(job_id):
    recruiter_id = get_jwt_identity()

    job = jobs_collection.find_one(
        {
            "_id": ObjectId(job_id),
            "recruiter_id": recruiter_id
        }
    )

    if not job:
        return jsonify({
            "error": "Job not found or you are not authorized to access it"
        }), 404

    if "resume" not in request.files:
        return jsonify({
            "error": "No resume file uploaded"
        }), 400

    file = request.files["resume"]

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({
            "error": "Only PDF resumes are supported"
        }), 400

    try:
        file_bytes = file.read()

        if not file_bytes:
            return jsonify({
                "error": "Uploaded resume is empty"
            }), 400

        text = extract_text(file_bytes)

        if not text.strip():
            return jsonify({
                "error": "Could not extract text. Ensure it is not a scanned image PDF."
            }), 400

        skills_found, missing_skills, skills_by_category = detect_skills(text)
        sections = check_sections(text)
        achievements = check_achievements(text)
        repetitions = check_repetition(text)
        score, breakdown = calculate_score(
            sections,
            skills_found,
            achievements,
            repetitions
        )

        required_skills = job.get("required_skills", [])
        text_lower = text.lower()

        matched_job_skills = [
            skill for skill in required_skills
            if skill.lower() in text_lower
        ]

        missing_job_skills = [
            skill for skill in required_skills
            if skill.lower() not in text_lower
        ]

        if required_skills:
            job_match_score = round(
                (len(matched_job_skills) / len(required_skills)) * 100,
                2
            )
        else:
            job_match_score = 0

        candidate = {
            "recruiter_id": recruiter_id,
            "job_id": job_id,
            "resume_filename": file.filename,
            "resume_score": score,
            "job_match_score": job_match_score,
            "skills_found": skills_found,
            "skills_by_category": skills_by_category,
            "missing_skills": missing_skills,
            "matched_job_skills": matched_job_skills,
            "missing_job_skills": missing_job_skills,
            "sections": sections,
            "achievements": achievements,
            "repetitions": repetitions,
            "word_count": len(text.split()),
            "status": "Applied"
        }

        result = candidates_collection.insert_one(candidate)

        return jsonify({
            "message": "Candidate resume uploaded and analyzed successfully",
            "candidate_id": str(result.inserted_id),
            "job_id": job_id,
            "resume_filename": file.filename,
            "resume_score": score,
            "job_match_score": job_match_score,
            "skills_found": skills_found,
            "matched_job_skills": matched_job_skills,
            "missing_job_skills": missing_job_skills,
            "status": "Applied"
        }), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# ============================================================
# UPDATE CANDIDATE STATUS API
# ============================================================

@app.route("/candidates/<candidate_id>/status", methods=["PUT"])
@jwt_required()
def update_candidate_status(candidate_id):

    recruiter_id = get_jwt_identity()

    data = request.get_json()
    new_status = data.get("status")

    allowed_statuses = [
        "Applied",
        "Screening",
        "Shortlisted",
        "Interview",
        "Selected",
        "Rejected"
    ]

    if new_status not in allowed_statuses:
        return jsonify({
            "error": "Invalid status",
            "allowed_statuses": allowed_statuses
        }), 400

    result = candidates_collection.update_one(
        {
            "_id": ObjectId(candidate_id),
            "recruiter_id": recruiter_id
        },
        {
            "$set": {
                "status": new_status
            }
        }
    )

    if result.matched_count == 0:
        return jsonify({
            "error": "Candidate not found or you are not authorized to update this candidate"
        }), 404

    return jsonify({
        "message": "Candidate status updated successfully",
        "candidate_id": candidate_id,
        "status": new_status
    }), 200

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "Resume Analyser API running!"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)

