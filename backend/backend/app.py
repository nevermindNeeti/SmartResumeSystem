from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import re
import io

app = Flask(__name__)
CORS(app)

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


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "Resume Analyser API running!"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)