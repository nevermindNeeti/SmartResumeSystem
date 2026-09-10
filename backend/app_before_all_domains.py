from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import re
import io

app = Flask(__name__)
CORS(app)


# ============================================================
# SKILLS DATABASE
# ============================================================

SKILLS_DB = {
    "programming": [
        "python", "javascript", "java", "c++", "c#", "typescript",
        "ruby", "go", "rust", "swift", "kotlin", "php", "scala",
        "r", "matlab", "dart"
    ],

    "web": [
        "react", "angular", "vue", "node.js", "express", "django",
        "flask", "fastapi", "html", "css", "sass", "tailwind",
        "bootstrap", "next.js", "graphql", "rest api", "redux"
    ],

    "data": [
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "keras", "scikit-learn", "pandas", "numpy", "matplotlib",
        "nlp", "computer vision", "data analysis", "tableau",
        "power bi", "spark", "hadoop"
    ],

    "database": [
        "sql", "mongodb", "postgresql", "mysql", "redis",
        "elasticsearch", "firebase", "dynamodb", "sqlite"
    ],

    "cloud": [
        "aws", "azure", "google cloud", "docker", "kubernetes",
        "ci/cd", "jenkins", "github actions", "terraform",
        "ansible", "linux", "bash"
    ],

    "tools": [
        "git", "github", "gitlab", "jira", "figma", "agile",
        "scrum", "photoshop", "excel", "microservices",
        "selenium", "unit testing"
    ]
}


ALL_SKILLS = [
    skill
    for category in SKILLS_DB.values()
    for skill in category
]


# ============================================================
# JOB ROLES
# ============================================================

JOB_ROLES = {

    "Frontend Developer": [
        "react", "javascript", "typescript", "html", "css",
        "vue", "angular", "next.js", "redux", "sass",
        "tailwind", "figma", "git"
    ],

    "Backend Developer": [
        "python", "java", "node.js", "sql", "postgresql",
        "mongodb", "docker", "rest api", "express",
        "django", "flask", "redis", "git"
    ],

    "Data Scientist": [
        "python", "machine learning", "deep learning",
        "pandas", "numpy", "scikit-learn", "tensorflow",
        "pytorch", "sql", "tableau", "r", "matplotlib"
    ],

    "Full Stack Developer": [
        "react", "javascript", "node.js", "sql", "mongodb",
        "docker", "git", "html", "css", "rest api",
        "postgresql"
    ],

    "DevOps Engineer": [
        "docker", "kubernetes", "aws", "ci/cd", "linux",
        "bash", "terraform", "jenkins", "git", "ansible",
        "azure"
    ],

    "ML Engineer": [
        "python", "tensorflow", "pytorch", "machine learning",
        "deep learning", "docker", "aws", "sql",
        "scikit-learn", "kubernetes", "git"
    ],

    "Mobile Developer": [
        "swift", "kotlin", "react", "dart", "javascript",
        "git", "firebase", "rest api", "figma"
    ],

    "Data Analyst": [
        "sql", "python", "excel", "tableau", "power bi",
        "pandas", "matplotlib", "r", "data analysis"
    ]
}


# ============================================================
# RESUME SECTION DETECTION
# ============================================================

SECTION_KEYWORDS = {

    "education": [
        "education", "degree", "university", "college",
        "bachelor", "master", "phd", "b.tech", "m.tech",
        "b.sc", "m.sc", "academic", "graduation",
        "cgpa", "gpa"
    ],

    "experience": [
        "experience", "work history", "employment",
        "internship", "position", "role", "company",
        "organization", "worked at", "job"
    ],

    "projects": [
        "projects", "portfolio", "case study", "built",
        "developed", "created", "implemented",
        "personal projects", "academic projects"
    ],

    "skills": [
        "skills", "technologies", "tools", "expertise",
        "proficiencies", "competencies", "technical skills"
    ],

    "summary": [
        "summary", "objective", "profile", "about me",
        "overview", "professional summary"
    ],

    "certifications": [
        "certification", "certified", "certificate",
        "course", "training", "license"
    ],

    "achievements": [
        "achievement", "award", "honor", "recognition",
        "accomplishment", "won", "winner"
    ]
}


# ============================================================
# SECTION IMPROVEMENT TIPS
# ============================================================

SECTION_TIPS = {

    "education": [
        "Include your CGPA/GPA if it's above 7.5 or 3.5.",
        "Mention relevant coursework for entry-level roles.",
        "List certifications under education if you have no separate section."
    ],

    "experience": [
        "Start each bullet with a strong action verb (Led, Built, Optimized, Reduced).",
        "Quantify impact — use numbers, percentages, or time saved.",
        "Keep each role to 3-5 bullet points, focused on achievements not duties."
    ],

    "projects": [
        "Add links to GitHub or live demos for each project.",
        "Mention the tech stack used for every project.",
        "Describe the problem solved, not just the tools used."
    ],

    "skills": [
        "Group skills by category (Languages, Frameworks, Tools).",
        "Remove outdated or irrelevant skills.",
        "Prioritize skills mentioned in the job description."
    ],

    "summary": [
        "Keep your summary to 2-3 sentences max.",
        "Tailor it specifically for each job application.",
        "Include your top skill and years of experience."
    ],

    "certifications": [
        "Include the issuing organization and year.",
        "Prioritize recent and relevant certifications."
    ],

    "achievements": [
        "Lead with your most impressive achievement.",
        "Quantify every achievement where possible."
    ]
}


# ============================================================
# TEXT EXTRACTION
# ============================================================

def extract_text(file_bytes):
    text = ""

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:

        for page in pdf.pages:

            t = page.extract_text()

            if t:
                text += t + "\n"

    return text


# ============================================================
# SKILL DETECTION
# ============================================================

def detect_skills(text):

    text_lower = text.lower()

    found_by_category = {}

    for category, skills in SKILLS_DB.items():

        found = [
            skill
            for skill in skills
            if skill in text_lower
        ]

        if found:
            found_by_category[category] = found

    all_found = [
        skill
        for skills in found_by_category.values()
        for skill in skills
    ]

    missing = [
        skill
        for skill in [
            "python",
            "javascript",
            "sql",
            "react",
            "docker",
            "git",
            "aws",
            "machine learning"
        ]
        if skill not in all_found
    ]

    return all_found, missing, found_by_category


# ============================================================
# SECTION DETECTION
# ============================================================

def check_sections(text):

    text_lower = text.lower()

    present = {}

    for section, keywords in SECTION_KEYWORDS.items():

        present[section] = any(
            keyword in text_lower
            for keyword in keywords
        )

    return present


# ============================================================
# SECTION TIPS
# ============================================================

def get_section_tips(sections):

    tips = {}

    for section, present in sections.items():

        if section in SECTION_TIPS:

            tips[section] = {
                "present": present,
                "tips": SECTION_TIPS[section]
            }

    return tips


# ============================================================
# ACHIEVEMENT / IMPACT DETECTION
# ============================================================

def check_achievements(text):

    patterns = [

        # Percentages
        r'\b\d+\s*%',

        # Money
        r'\$\s*\d+(?:\.\d+)?\s*(?:k|m|b)?',

        # Users / clients / projects etc.
        r'\b\d+\+?\s*(?:users|clients|customers|projects|teams|members|products|employees)\b',

        # Multipliers
        r'\b\d+(?:\.\d+)?x\b',

        # Time
        r'\b\d+\+?\s*(?:hours|days|months|years)\b',

        # Achievement / impact words
        r'\bincreased\b',
        r'\bdecreased\b',
        r'\bimproved\b',
        r'\breduced\b',
        r'\boptimized\b',
        r'\bboosted\b',
        r'\baccelerated\b',
        r'\bsaved\b',
        r'\bgenerated\b',
        r'\bachieved\b',
        r'\bled\b',
        r'\bdelivered\b'
    ]

    matches = []

    for pattern in patterns:

        matches.extend(
            re.findall(
                pattern,
                text,
                re.IGNORECASE
            )
        )

    # Remove duplicates while preserving order
    unique_matches = list(
        dict.fromkeys(matches)
    )

    return unique_matches[:15]


# ============================================================
# REPETITION DETECTION
# ============================================================

def check_repetition(text):

    words = re.findall(
        r'\b\w{4,}\b',
        text.lower()
    )

    counts = {}

    for word in words:

        counts[word] = counts.get(word, 0) + 1

    stop = {
        "with",
        "have",
        "that",
        "this",
        "from",
        "your",
        "been",
        "will",
        "they",
        "their",
        "were",
        "also",
        "into",
        "work",
        "team",
        "used",
        "data",
        "using",
        "based",
        "more",
        "over"
    }

    return [
        word
        for word, count in counts.items()
        if count > 5 and word not in stop
    ][:5]


# ============================================================
# JOB ROLE MATCHING
# ============================================================

def match_job_roles(skills_found):

    scores = {}

    for role, required in JOB_ROLES.items():

        matched = [
            skill
            for skill in required
            if skill in skills_found
        ]

        pct = round(
            (len(matched) / len(required)) * 100
        )

        scores[role] = {

            "match": pct,

            "matched_skills": matched,

            "missing_skills": [
                skill
                for skill in required
                if skill not in skills_found
            ]
        }

    sorted_roles = sorted(
        scores.items(),
        key=lambda x: x[1]["match"],
        reverse=True
    )

    return dict(
        sorted_roles[:5]
    )


# ============================================================
# SCORE CALCULATION
# ============================================================

def calculate_score(
    sections,
    skills_found,
    achievements,
    repetitions
):

    """
    Overall Resume Score = 100 points

    Section Completeness     = 35
    Skills                   = 30
    Achievements & Impact    = 25
    Writing Quality          = 10

    IMPORTANT:
    The final score is ALWAYS the exact sum
    of the four displayed category scores.
    """

    # ========================================================
    # 1. SECTION COMPLETENESS — 35 POINTS
    # ========================================================

    section_weights = {

        "education": 7,

        "experience": 8,

        "projects": 6,

        "skills": 5,

        "summary": 3,

        "certifications": 3,

        "achievements": 3
    }

    section_score = 0

    for section, weight in section_weights.items():

        if sections.get(section):

            section_score += weight

    section_score = min(
        section_score,
        35
    )


    # ========================================================
    # 2. SKILLS — 30 POINTS
    # ========================================================

    skill_score = min(
        len(skills_found) * 2,
        30
    )


    # ========================================================
    # 3. ACHIEVEMENTS & IMPACT — 25 POINTS
    # ========================================================

    quantified_patterns = [

        r'\b\d+\s*%',

        r'\$\s*\d+(?:\.\d+)?\s*(?:k|m|b)?',

        r'\b\d+\+?\s*(?:users|clients|customers|projects|teams|members|products|employees)\b',

        r'\b\d+(?:\.\d+)?x\b',

        r'\b\d+\+?\s*(?:hours|days|months|years)\b'
    ]

    impact_patterns = [

        r'increased',
        r'decreased',
        r'improved',
        r'reduced',
        r'optimized',
        r'boosted',
        r'accelerated',
        r'saved',
        r'generated',
        r'achieved',
        r'led',
        r'delivered'
    ]

    quantified_count = 0
    impact_count = 0

    for achievement in achievements:

        if any(
            re.search(
                pattern,
                achievement,
                re.IGNORECASE
            )
            for pattern in quantified_patterns
        ):
            quantified_count += 1

        if any(
            re.search(
                pattern,
                achievement,
                re.IGNORECASE
            )
            for pattern in impact_patterns
        ):
            impact_count += 1


    # Quantified evidence = up to 15 points
    quantified_score = min(
        quantified_count * 2,
        15
    )

    # Impact language = up to 5 points
    impact_score = min(
        impact_count,
        5
    )

    # Dedicated Achievements section = 5 points
    achievement_section_score = (
        5
        if sections.get("achievements")
        else 0
    )

    achievement_score = min(
        quantified_score
        + impact_score
        + achievement_section_score,
        25
    )


    # ========================================================
    # 4. WRITING QUALITY — 10 POINTS
    # ========================================================

    repetition_penalty = min(
        len(repetitions) * 2,
        10
    )

    writing_score = max(
        0,
        10 - repetition_penalty
    )


    # ========================================================
    # FINAL SCORE
    # ========================================================

    score = (
        section_score
        + skill_score
        + achievement_score
        + writing_score
    )

    # Safety clamp
    score = max(
        0,
        min(100, score)
    )


    # ========================================================
    # BREAKDOWN
    # ========================================================

    breakdown = {

        "sections": {
            "score": section_score,
            "max": 35
        },

        "skills": {
            "score": skill_score,
            "max": 30
        },

        "achievements": {
            "score": achievement_score,
            "max": 25
        },

        "writing": {
            "score": writing_score,
            "max": 10
        }
    }


    return score, breakdown


# ============================================================
# SUGGESTIONS
# ============================================================

def generate_suggestions(
    sections,
    skills_found,
    missing_skills,
    achievements,
    repetitions,
    score
):

    suggestions = []


    # Missing summary
    if not sections.get("summary"):

        suggestions.append(
            "Add a Professional Summary at the top — "
            "recruiters spend only 6 seconds on first scan."
        )


    # Missing experience
    if not sections.get("experience"):

        suggestions.append(
            "Add a Work Experience section with "
            "company names, roles, dates, and bullet achievements."
        )


    # Missing projects
    if not sections.get("projects"):

        suggestions.append(
            "Add a Projects section with GitHub links "
            "and tech stack details."
        )


    # Weak achievement evidence
    if len(achievements) < 3:

        suggestions.append(
            "Add more quantified achievements — use numbers "
            "like '40% faster', '$10K saved', or '5000 users'."
        )


    # Missing important skills
    if missing_skills:

        suggestions.append(
            f"Add high-demand skills you know: "
            f"{', '.join(missing_skills[:4])}."
        )


    # Missing certifications
    if not sections.get("certifications"):

        suggestions.append(
            "Add relevant certifications "
            "(Google, AWS, Coursera) to stand out."
        )


    # Repetition
    if repetitions:

        suggestions.append(
            f"Vary your language — overused words detected: "
            f"{', '.join(repetitions)}."
        )


    # Low number of skills
    if len(skills_found) < 10:

        suggestions.append(
            "Expand your skills section — include more "
            "frameworks, tools, and platforms."
        )


    # Strong resume
    if score >= 80:

        suggestions.append(
            "Excellent resume! Tailor the skills and "
            "summary for each specific job application."
        )


    return suggestions


# ============================================================
# RESUME ANALYSIS API
# ============================================================

@app.route(
    "/analyze_resume",
    methods=["POST"]
)
def analyze_resume():

    # Check upload
    if "resume" not in request.files:

        return jsonify({
            "error": "No file uploaded"
        }), 400


    file = request.files["resume"]


    try:

        # ----------------------------------------------------
        # Extract text
        # ----------------------------------------------------

        text = extract_text(
            file.read()
        )


        if not text.strip():

            return jsonify({
                "error": (
                    "Could not extract text. "
                    "Ensure it's not a scanned image PDF."
                )
            }), 400


        # ----------------------------------------------------
        # Detect skills
        # ----------------------------------------------------

        (
            skills_found,
            missing_skills,
            skills_by_category
        ) = detect_skills(text)


        # ----------------------------------------------------
        # Detect sections
        # ----------------------------------------------------

        sections = check_sections(text)


        # ----------------------------------------------------
        # Section tips
        # ----------------------------------------------------

        section_tips = get_section_tips(
            sections
        )


        # ----------------------------------------------------
        # Achievements
        # ----------------------------------------------------

        achievements = check_achievements(
            text
        )


        # ----------------------------------------------------
        # Repetition
        # ----------------------------------------------------

        repetitions = check_repetition(
            text
        )


        # ----------------------------------------------------
        # Calculate score
        # ----------------------------------------------------

        score, breakdown = calculate_score(
            sections,
            skills_found,
            achievements,
            repetitions
        )


        # ----------------------------------------------------
        # Suggestions
        # ----------------------------------------------------

        suggestions = generate_suggestions(
            sections,
            skills_found,
            missing_skills,
            achievements,
            repetitions,
            score
        )


        # ----------------------------------------------------
        # Job matching
        # ----------------------------------------------------

        job_matches = match_job_roles(
            skills_found
        )


        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

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

            "word_count": len(
                text.split()
            )
        })


    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def health():

    return jsonify({
        "status": "Resume Analyser API running!"
    })


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5001
    )