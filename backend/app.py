
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
import sqlite3
import uuid
import json
import pdfplumber
import re
import io

app = Flask(__name__)
CORS(app)

load_dotenv()

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production-2025")
jwt = JWTManager(app)

# ============================================================
# SQLITE DATABASE SETUP
# ============================================================

DB_PATH = os.path.join(os.path.dirname(__file__), "resume_analyser.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Companies — each recruiter belongs to one company
    c.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            industry TEXT DEFAULT '',
            website TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Recruiters (renamed from users)
    c.execute("""
        CREATE TABLE IF NOT EXISTS recruiters (
            id TEXT PRIMARY KEY,
            company_id TEXT REFERENCES companies(id),
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'recruiter',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Keep legacy users table for backward compat during transition
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'recruiter'
        )
    """)

    # Jobs — owned by recruiter under a company
    c.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            recruiter_id TEXT NOT NULL,
            company_id TEXT DEFAULT '',
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            description TEXT NOT NULL,
            required_skills TEXT DEFAULT '[]',
            experience TEXT DEFAULT '',
            domain TEXT DEFAULT '',
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Candidate accounts (self-registered job seekers)
    c.execute("""
        CREATE TABLE IF NOT EXISTS candidate_accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            phone TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Applications — unified table for self-applied + recruiter-uploaded
    c.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            recruiter_id TEXT NOT NULL,
            candidate_account_id TEXT DEFAULT NULL,
            resume_filename TEXT,
            resume_score INTEGER DEFAULT 0,
            job_match_score REAL DEFAULT 0,
            domain TEXT DEFAULT '',
            skills_found TEXT DEFAULT '[]',
            skills_by_category TEXT DEFAULT '{}',
            missing_skills TEXT DEFAULT '[]',
            matched_job_skills TEXT DEFAULT '[]',
            missing_job_skills TEXT DEFAULT '[]',
            sections TEXT DEFAULT '{}',
            achievements TEXT DEFAULT '[]',
            repetitions TEXT DEFAULT '[]',
            word_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Applied',
            source TEXT DEFAULT 'recruiter_uploaded',
            notes TEXT DEFAULT '',
            applied_at TEXT DEFAULT (datetime('now')),
            invited_at TEXT DEFAULT NULL
        )
    """)

    # Legacy candidates table — keep so existing data still works
    c.execute("""
        CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY,
            recruiter_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            resume_filename TEXT,
            resume_score INTEGER DEFAULT 0,
            job_match_score REAL DEFAULT 0,
            domain TEXT DEFAULT '',
            skills_found TEXT DEFAULT '[]',
            skills_by_category TEXT DEFAULT '{}',
            missing_skills TEXT DEFAULT '[]',
            matched_job_skills TEXT DEFAULT '[]',
            missing_job_skills TEXT DEFAULT '[]',
            sections TEXT DEFAULT '{}',
            achievements TEXT DEFAULT '[]',
            repetitions TEXT DEFAULT '[]',
            word_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Applied'
        )
    """)

    conn.commit()
    conn.close()

init_db()

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "recruiter")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    email = email.lower().strip()

    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            return jsonify({"error": "User with this email already exists"}), 409

        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)

        conn.execute(
            "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, email, password_hash, role)
        )
        conn.commit()
    finally:
        conn.close()

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
        return jsonify({"error": "Email and password are required"}), 400

    email = email.lower().strip()

    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    finally:
        conn.close()

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(
        identity=user["id"],
        additional_claims={
            "role": user["role"],
            "name": user["name"]
        }
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }), 200


@app.route("/jobs", methods=["POST"])
@jwt_required()
def create_job():
    data = request.get_json()

    title = data.get("title")
    company = data.get("company")
    description = data.get("description")
    required_skills = data.get("required_skills", [])
    experience = data.get("experience", "")
    domain = data.get("domain", "")

    if not title or not company or not description:
        return jsonify({
            "error": "Title, company and description are required"
        }), 400

    recruiter_id = get_jwt_identity()
    job_id = str(uuid.uuid4())

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO jobs (id, recruiter_id, title, company, description, required_skills, experience, domain) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (job_id, recruiter_id, title, company, description, json.dumps(required_skills), experience, domain)
        )
        conn.commit()
    finally:
        conn.close()

    return jsonify({
        "message": "Job created successfully",
        "job_id": job_id
    }), 201


@app.route("/jobs", methods=["GET"])
@jwt_required()
def get_jobs():
    recruiter_id = get_jwt_identity()

    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT id, title, company, description, required_skills, experience, domain FROM jobs WHERE recruiter_id = ?",
            (recruiter_id,)
        ).fetchall()
    finally:
        conn.close()

    jobs = []
    for row in rows:
        jobs.append({
            "job_id": row["id"],
            "title": row["title"],
            "company": row["company"],
            "description": row["description"],
            "required_skills": json.loads(row["required_skills"] or "[]"),
            "experience": row["experience"],
            "domain": row["domain"],
        })

    return jsonify({"jobs": jobs}), 200


@app.route("/jobs/<job_id>", methods=["PUT"])
@jwt_required()
def update_job(job_id):
    data = request.get_json()
    recruiter_id = get_jwt_identity()

    allowed_fields = ["title", "company", "description", "required_skills", "experience", "domain"]
    updates = {f: data[f] for f in allowed_fields if f in data}

    if not updates:
        return jsonify({"error": "No valid fields provided for update"}), 400

    # Serialize required_skills to JSON string if present
    if "required_skills" in updates:
        updates["required_skills"] = json.dumps(updates["required_skills"])

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [job_id, recruiter_id]

    conn = get_db()
    try:
        result = conn.execute(
            f"UPDATE jobs SET {set_clause} WHERE id = ? AND recruiter_id = ?",
            values
        )
        conn.commit()
        matched = result.rowcount
    finally:
        conn.close()

    if matched == 0:
        return jsonify({"error": "Job not found or you are not authorized to update it"}), 404

    return jsonify({"message": "Job updated successfully"}), 200


@app.route("/jobs/<job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    recruiter_id = get_jwt_identity()

    conn = get_db()
    try:
        result = conn.execute(
            "DELETE FROM jobs WHERE id = ? AND recruiter_id = ?",
            (job_id, recruiter_id)
        )
        conn.commit()
        deleted = result.rowcount
    finally:
        conn.close()

    if deleted == 0:
        return jsonify({"error": "Job not found or you are not authorized to delete it"}), 404

    return jsonify({"message": "Job deleted successfully"}), 200


# ============================================================
# DOMAIN-GENERAL SKILLS DATABASE
# ============================================================

SKILLS_DB = {
    "technology": [
        "python","javascript","java","c++","c#","typescript","ruby","go","rust",
        "swift","kotlin","php","scala","matlab","dart","react","angular","vue",
        "node.js","express","django","flask","fastapi","html","css","sass",
        "tailwind","bootstrap","next.js","graphql","rest api","redux","git",
        "github","gitlab","jira","selenium","unit testing","microservices",
        "agile","scrum","docker","kubernetes","aws","azure","google cloud",
        "ci/cd","jenkins","terraform","ansible","linux","bash","sql","mongodb",
        "postgresql","mysql","redis","elasticsearch","firebase","dynamodb",
        "sqlite","computer networks","operating systems"
    ],

    "data_ai": [
        "machine learning","deep learning","tensorflow","pytorch","keras",
        "scikit-learn","pandas","numpy","matplotlib","seaborn","nlp",
        "natural language processing","computer vision","data analysis",
        "statistics","tableau","power bi","spark","hadoop","data visualization",
        "predictive modeling","generative ai","large language models","llm",
        "feature engineering","data mining","a/b testing"
    ],

    "finance_banking": [
        "financial analysis","financial modeling","valuation","investment banking",
        "corporate finance","portfolio management","asset management",
        "wealth management","risk management","credit analysis","credit risk",
        "market risk","operational risk","financial risk","derivatives",
        "equity research","fixed income","forex","trading","capital markets",
        "treasury","budgeting","forecasting","cash flow","financial statements",
        "balance sheet","income statement","cash flow statement","ratio analysis",
        "excel","powerpoint","bloomberg","reuters","sap","quickbooks","tally",
        "ifrs","gaap","gst","taxation","auditing","accounting",
        "accounts payable","accounts receivable"
    ],

    "law_legal": [
        "legal research","legal writing","contract drafting","contract review",
        "contract negotiation","litigation","civil litigation","criminal law",
        "corporate law","commercial law","constitutional law","administrative law",
        "intellectual property","ipr","patent law","trademark law","copyright law",
        "employment law","labor law","tax law","family law","real estate law",
        "property law","compliance","regulatory compliance","due diligence",
        "case analysis","case management","legal documentation","dispute resolution",
        "arbitration","mediation","legal drafting","legal advisory",
        "court proceedings","moot court","westlaw","lexisnexis"
    ],

    "healthcare_medical": [
        "patient care","clinical research","clinical trials","medical terminology",
        "patient assessment","diagnosis","treatment planning","healthcare management",
        "hospital management","public health","epidemiology","health education",
        "electronic health records","ehr","medical coding","medical billing",
        "hipaa","healthcare compliance","nursing","phlebotomy","first aid","cpr",
        "patient safety","infection control","health informatics",
        "medical documentation","pharmacology","anatomy","physiology"
    ],

    "pharma_biotech": [
        "pharmacology","pharmaceuticals","drug discovery","drug development",
        "clinical trials","clinical research","gmp","glp","gcp","regulatory affairs",
        "pharmacovigilance","quality control","quality assurance","biotechnology",
        "molecular biology","microbiology","biochemistry","bioinformatics",
        "genomics","cell culture","pcr","chromatography","laboratory",
        "medical writing","fda","ema","ich guidelines"
    ],

    "marketing": [
        "digital marketing","content marketing","social media marketing","seo",
        "sem","search engine optimization","search engine marketing","google ads",
        "meta ads","email marketing","campaign management","brand management",
        "branding","market research","consumer research","content strategy",
        "copywriting","content writing","analytics","google analytics","hubspot",
        "mailchimp","crm","lead generation","conversion optimization",
        "public relations","pr","influencer marketing"
    ],

    "sales_business_development": [
        "sales","business development","lead generation","prospecting",
        "cold calling","account management","key account management",
        "relationship management","customer acquisition","negotiation",
        "sales strategy","pipeline management","sales forecasting","crm",
        "salesforce","hubspot","b2b","b2c","inside sales","field sales",
        "solution selling","upselling","cross-selling","client relationship management"
    ],

    "human_resources": [
        "human resources","hr","recruitment","talent acquisition","talent management",
        "employee relations","performance management","learning and development",
        "training and development","payroll","compensation and benefits",
        "onboarding","workforce planning","hr analytics","employee engagement",
        "labor relations","hr policies","interviewing","sourcing",
        "applicant tracking system","ats","workday","successfactors"
    ],

    "education": [
        "teaching","lesson planning","curriculum development","classroom management",
        "instructional design","assessment","student counseling","academic advising",
        "educational technology","e-learning","learning management system","lms",
        "pedagogy","special education","training","facilitation","research",
        "course development","mentoring","tutoring"
    ],

    "design_creative": [
        "graphic design","ui design","ux design","user experience","user interface",
        "figma","adobe photoshop","photoshop","illustrator","indesign","canva",
        "prototyping","wireframing","design systems","typography","visual design",
        "motion graphics","video editing","animation","illustration","art direction",
        "creative direction","branding","adobe xd"
    ],

    "operations_supply_chain": [
        "operations management","supply chain management","procurement","purchasing",
        "inventory management","warehouse management","logistics","demand planning",
        "supply planning","vendor management","supplier management","order management",
        "process improvement","lean","six sigma","quality management","erp","sap",
        "oracle","power bi","excel","forecasting","distribution","production planning"
    ],

    "project_management_consulting": [
        "project management","program management","stakeholder management",
        "project planning","risk management","change management","resource management",
        "budget management","scope management","agile","scrum","kanban","jira",
        "confluence","microsoft project","pmp","prince2","business analysis",
        "requirements gathering","process mapping","strategy","management consulting",
        "business transformation"
    ],

    "engineering": [
        "mechanical engineering","electrical engineering","electronics engineering",
        "civil engineering","chemical engineering","industrial engineering",
        "automotive engineering","manufacturing","cad","autocad","solidworks",
        "catia","ansys","matlab","simulink","embedded systems","pcb design",
        "circuit design","plc","scada","robotics","automation","quality control",
        "lean manufacturing","six sigma","thermodynamics","fluid mechanics",
        "structural analysis","construction management"
    ],

    "architecture_construction": [
        "architecture","architectural design","autocad","revit","sketchup","lumion",
        "3ds max","bim","building information modeling","structural design",
        "construction management","site management","quantity surveying","estimation",
        "project planning","urban planning","interior design","building codes",
        "sustainable design","civil engineering","cost estimation"
    ],

    "science_research": [
        "research methodology","scientific writing","literature review",
        "experimental design","statistical analysis","laboratory","data collection",
        "data analysis","research methods","scientific computing","mathematics",
        "physics","chemistry","biology","microbiology","biochemistry",
        "molecular biology","research publications","academic research","technical writing"
    ],

    "media_communications": [
        "journalism","reporting","editing","proofreading","content creation",
        "copywriting","storytelling","public relations","communications",
        "media relations","press releases","interviewing","news writing",
        "video production","photography","broadcasting","social media","content strategy",
        "script writing"
    ],

    "hospitality_tourism": [
        "hospitality management","hotel management","front office","guest relations",
        "housekeeping","food and beverage","event management","travel management",
        "tourism","reservation systems","customer service","revenue management",
        "banquet management","restaurant management","travel planning"
    ],

    "real_estate": [
        "real estate","property management","property valuation","real estate sales",
        "leasing","brokerage","asset management","property development",
        "real estate finance","market analysis","site acquisition","due diligence",
        "land acquisition","facility management","commercial real estate",
        "residential real estate"
    ],

    "government_public_sector": [
        "public administration","public policy","policy analysis","government relations",
        "public finance","policy research","governance","regulatory affairs",
        "administration","civil services","public procurement","social welfare",
        "program management","community development"
    ],

    "customer_service": [
        "customer service","customer support","customer success","technical support",
        "help desk","ticketing","call center","client support","complaint resolution",
        "service delivery","communication","problem solving","crm"
    ],

    "environment_agriculture": [
        "environmental science","environmental management","sustainability","esg",
        "climate change","environmental impact","waste management","water management",
        "renewable energy","agriculture","agronomy","soil science","crop management",
        "farm management","food science","forestry","conservation","gis",
        "remote sensing","environmental compliance"
    ],

    "cybersecurity": [
        "cybersecurity","information security","network security","application security",
        "penetration testing","ethical hacking","vulnerability assessment",
        "incident response","siem","soc","security operations","digital forensics",
        "risk assessment","identity and access management","iam","firewalls",
        "cryptography","security compliance","iso 27001"
    ]
}

DOMAIN_PROFILES = {
    "Technology": ["software","developer","programming","technology","application","web","database","cloud","api"],
    "Data & AI": ["data science","data analyst","machine learning","artificial intelligence","analytics","statistics","predictive"],
    "Finance & Banking": ["finance","financial","banking","investment","portfolio","credit","capital markets","valuation","accounting","audit"],
    "Law & Legal": ["law","legal","lawyer","attorney","litigation","court","contract","compliance","arbitration","advocate","paralegal"],
    "Healthcare & Medical": ["healthcare","medical","hospital","patient","clinical","nursing","doctor","medicine","diagnosis"],
    "Pharma & Biotech": ["pharma","pharmaceutical","biotech","clinical trial","drug","laboratory","pharmacology","biotechnology"],
    "Marketing": ["marketing","brand","campaign","seo","digital marketing","advertising","content marketing"],
    "Sales & Business Development": ["sales","business development","account management","customer acquisition","revenue","prospecting"],
    "Human Resources": ["human resources","hr","recruitment","talent acquisition","employee","workforce","payroll"],
    "Education": ["teacher","teaching","education","school","university","curriculum","classroom","student","academic"],
    "Design & Creative": ["designer","design","ui","ux","creative","graphic","illustration","prototype","visual"],
    "Operations & Supply Chain": ["operations","supply chain","procurement","logistics","warehouse","inventory","vendor"],
    "Project Management & Consulting": ["project manager","project management","consulting","business analyst","stakeholder","strategy","transformation"],
    "Engineering": ["engineer","engineering","manufacturing","automation","cad","mechanical","electrical","electronics","civil"],
    "Architecture & Construction": ["architect","architecture","construction","building","revit","bim","site management"],
    "Science & Research": ["research","scientist","laboratory","experiment","scientific","publication","research methodology"],
    "Media & Communications": ["journalism","journalist","media","communications","public relations","reporting","content creator"],
    "Hospitality & Tourism": ["hotel","hospitality","tourism","travel","restaurant","guest relations","event management"],
    "Real Estate": ["real estate","property","leasing","brokerage","property management","realty"],
    "Government & Public Sector": ["government","public administration","public policy","public finance","governance","civil services","policy analyst"],
    "Customer Service": ["customer service","customer support","customer success","help desk","call center","ticketing"],
    "Environment & Agriculture": ["environmental","sustainability","esg","climate","agriculture","agronomy","conservation"],
    "Cybersecurity": ["cybersecurity","information security","penetration testing","security operations","soc","siem","incident response"]
}

DOMAIN_CATEGORIES = {
    "Technology": ["technology"],
    "Data & AI": ["data_ai","technology"],
    "Finance & Banking": ["finance_banking"],
    "Law & Legal": ["law_legal"],
    "Healthcare & Medical": ["healthcare_medical"],
    "Pharma & Biotech": ["pharma_biotech"],
    "Marketing": ["marketing"],
    "Sales & Business Development": ["sales_business_development"],
    "Human Resources": ["human_resources"],
    "Education": ["education"],
    "Design & Creative": ["design_creative"],
    "Operations & Supply Chain": ["operations_supply_chain"],
    "Project Management & Consulting": ["project_management_consulting"],
    "Engineering": ["engineering"],
    "Architecture & Construction": ["architecture_construction","engineering"],
    "Science & Research": ["science_research","data_ai"],
    "Media & Communications": ["media_communications"],
    "Hospitality & Tourism": ["hospitality_tourism","customer_service"],
    "Real Estate": ["real_estate"],
    "Government & Public Sector": ["government_public_sector"],
    "Customer Service": ["customer_service"],
    "Environment & Agriculture": ["environment_agriculture"],
    "Cybersecurity": ["cybersecurity","technology"]
}

DOMAIN_PRIORITY_SKILLS = {
    "Technology": ["python","javascript","sql","git","docker","aws"],
    "Data & AI": ["python","sql","machine learning","pandas","numpy","power bi"],
    "Finance & Banking": ["financial analysis","financial modeling","excel","risk management","valuation","accounting"],
    "Law & Legal": ["legal research","legal writing","contract drafting","litigation","compliance","due diligence"],
    "Healthcare & Medical": ["patient care","clinical research","medical terminology","healthcare management","patient safety"],
    "Pharma & Biotech": ["clinical trials","gmp","regulatory affairs","pharmacovigilance","quality assurance"],
    "Marketing": ["digital marketing","seo","content marketing","google analytics","market research","crm"],
    "Sales & Business Development": ["sales","business development","crm","negotiation","lead generation","account management"],
    "Human Resources": ["recruitment","talent acquisition","employee relations","performance management","hr analytics"],
    "Education": ["teaching","lesson planning","curriculum development","classroom management","instructional design"],
    "Design & Creative": ["figma","graphic design","ui design","ux design","prototyping","photoshop"],
    "Operations & Supply Chain": ["operations management","procurement","supply chain management","inventory management","logistics","excel"],
    "Project Management & Consulting": ["project management","stakeholder management","risk management","agile","business analysis","change management"],
    "Engineering": ["cad","matlab","solidworks","manufacturing","automation","quality control"],
    "Architecture & Construction": ["autocad","revit","bim","construction management","estimation","building codes"],
    "Science & Research": ["research methodology","statistical analysis","experimental design","scientific writing","data analysis"],
    "Media & Communications": ["journalism","content creation","editing","storytelling","public relations","communications"],
    "Hospitality & Tourism": ["hospitality management","customer service","event management","hotel management","revenue management"],
    "Real Estate": ["real estate","property valuation","property management","leasing","market analysis"],
    "Government & Public Sector": ["public administration","policy analysis","governance","public policy","program management"],
    "Customer Service": ["customer service","customer support","customer success","crm","complaint resolution"],
    "Environment & Agriculture": ["sustainability","environmental science","esg","agriculture","gis","environmental management"],
    "Cybersecurity": ["cybersecurity","information security","penetration testing","incident response","siem","risk assessment"]
}

# ============================================================
# JOB ROLES
# ============================================================

JOB_ROLES = {
    "Software Engineer": ["python","java","javascript","sql","git","docker"],
    "Frontend Developer": ["react","javascript","typescript","html","css","git"],
    "Backend Developer": ["python","java","node.js","sql","docker","rest api"],
    "Data Analyst": ["sql","excel","power bi","tableau","data analysis","statistics"],
    "Data Scientist": ["python","machine learning","pandas","numpy","scikit-learn","statistics"],
    "ML Engineer": ["python","machine learning","tensorflow","pytorch","docker","sql"],

    "Financial Analyst": ["financial analysis","excel","financial modeling","forecasting","valuation"],
    "Investment Banking Analyst": ["investment banking","financial modeling","valuation","excel","capital markets"],
    "Risk Analyst": ["risk management","credit risk","financial risk","excel","financial analysis"],
    "Accountant": ["accounting","excel","financial statements","taxation","auditing"],
    "Auditor": ["auditing","accounting","risk management","ifrs","gaap"],
    "Tax Analyst": ["taxation","gst","tax law","accounting","financial statements"],

    "Legal Associate": ["legal research","legal writing","contract drafting","case analysis","litigation"],
    "Corporate Lawyer": ["corporate law","contract drafting","contract negotiation","compliance","due diligence"],
    "Legal Researcher": ["legal research","legal writing","case analysis","legal documentation"],
    "Compliance Analyst": ["compliance","regulatory compliance","risk management","due diligence"],
    "Paralegal": ["legal research","legal documentation","case management","legal writing"],

    "Medical Professional": ["patient care","diagnosis","treatment planning","medical terminology"],
    "Nurse": ["nursing","patient care","patient assessment","infection control","patient safety"],
    "Clinical Researcher": ["clinical research","clinical trials","data analysis","research methodology"],
    "Healthcare Administrator": ["healthcare management","patient safety","healthcare compliance"],

    "Pharmacist": ["pharmacology","pharmaceuticals","patient care","regulatory affairs"],
    "Clinical Research Associate": ["clinical trials","clinical research","gcp","regulatory affairs"],
    "Pharma QA Specialist": ["gmp","quality assurance","quality control","regulatory affairs"],

    "Marketing Specialist": ["digital marketing","content marketing","seo","social media marketing","analytics"],
    "SEO Specialist": ["seo","search engine optimization","google analytics","content strategy"],
    "Brand Manager": ["brand management","branding","market research","campaign management"],
    "Content Strategist": ["content strategy","content marketing","copywriting","content writing"],

    "Sales Executive": ["sales","lead generation","negotiation","crm","customer acquisition"],
    "Business Development Executive": ["business development","lead generation","negotiation","crm"],
    "Account Manager": ["account management","relationship management","crm","negotiation"],
    "Customer Success Manager": ["customer success","customer service","relationship management","crm"],

    "HR Executive": ["human resources","recruitment","employee relations","hr policies"],
    "Talent Acquisition Specialist": ["recruitment","talent acquisition","sourcing","interviewing","ats"],
    "HR Analyst": ["hr analytics","human resources","excel","workforce planning"],

    "Teacher / Educator": ["teaching","lesson planning","classroom management","assessment"],
    "Instructional Designer": ["instructional design","curriculum development","e-learning","lms"],
    "Academic Counselor": ["student counseling","academic advising","mentoring"],

    "UI/UX Designer": ["ui design","ux design","figma","prototyping","wireframing"],
    "Graphic Designer": ["graphic design","photoshop","illustrator","typography","visual design"],
    "Creative Designer": ["visual design","branding","illustration","creative direction"],

    "Operations Manager": ["operations management","process improvement","stakeholder management","excel"],
    "Supply Chain Analyst": ["supply chain management","inventory management","demand planning","logistics"],
    "Procurement Specialist": ["procurement","purchasing","vendor management","supplier management"],
    "Logistics Coordinator": ["logistics","warehouse management","inventory management","distribution"],

    "Project Manager": ["project management","stakeholder management","risk management","project planning"],
    "Business Analyst": ["business analysis","requirements gathering","process mapping","stakeholder management"],
    "Management Consultant": ["management consulting","strategy","business transformation","business analysis"],

    "Mechanical Engineer": ["mechanical engineering","solidworks","ansys","cad","manufacturing"],
    "Electrical Engineer": ["electrical engineering","circuit design","matlab","plc","automation"],
    "Electronics Engineer": ["electronics engineering","pcb design","embedded systems","circuit design"],
    "Civil Engineer": ["civil engineering","structural analysis","autocad","construction management"],

    "Architect": ["architecture","architectural design","autocad","revit","bim"],
    "Construction Manager": ["construction management","site management","estimation","project planning"],

    "Research Scientist": ["research methodology","experimental design","statistical analysis","scientific writing"],
    "Research Analyst": ["research methodology","data analysis","literature review","statistics"],

    "Journalist": ["journalism","reporting","interviewing","news writing","editing"],
    "PR Specialist": ["public relations","communications","media relations","press releases"],
    "Content Creator": ["content creation","storytelling","social media","video production"],

    "Hotel Manager": ["hospitality management","hotel management","guest relations","revenue management"],
    "Event Manager": ["event management","customer service","project management","vendor management"],

    "Real Estate Analyst": ["real estate","market analysis","property valuation","real estate finance"],
    "Property Manager": ["property management","leasing","facility management","customer service"],

    "Public Policy Analyst": ["public policy","policy analysis","policy research","governance"],
    "Public Administration Officer": ["public administration","governance","program management"],

    "Customer Support Specialist": ["customer support","customer service","ticketing","problem solving"],
    "Customer Service Executive": ["customer service","complaint resolution","communication","crm"],

    "Cybersecurity Analyst": ["cybersecurity","information security","siem","incident response","risk assessment"],
    "Security Engineer": ["network security","application security","penetration testing","firewalls"],
    "SOC Analyst": ["soc","siem","incident response","security operations"],

    "Environmental Specialist": ["environmental science","sustainability","environmental management","esg"],
    "Sustainability Analyst": ["sustainability","esg","climate change","environmental impact"],
    "Agriculture Specialist": ["agriculture","agronomy","crop management","soil science"]
}

# ============================================================
# SECTION DETECTION
# ============================================================

SECTION_KEYWORDS = {
    "education": [
        "education","degree","university","college","bachelor","master","phd",
        "b.tech","m.tech","b.sc","m.sc","academic","graduation","cgpa","gpa"
    ],
    "experience": [
        "experience","work history","employment","professional experience",
        "internship","position","role","company","organization","worked at","job",
        "career history"
    ],
    "projects": [
        "projects","portfolio","case study","work samples","built","developed",
        "created","implemented","personal projects","academic projects"
    ],
    "skills": [
        "skills","technologies","tools","expertise","proficiencies",
        "competencies","technical skills","core competencies"
    ],
    "summary": [
        "summary","objective","profile","about me","overview","professional summary"
    ],
    "certifications": [
        "certification","certified","certificate","course","training","license"
    ],
    "achievements": [
        "achievement","awards","award","honor","recognition",
        "accomplishment","won","winner"
    ]
}

SECTION_TIPS = {
    "education": [
        "Include your CGPA/GPA if it is relevant.",
        "Mention relevant coursework for entry-level roles.",
        "Include the institution, degree and graduation year."
    ],
    "experience": [
        "Start each bullet with a strong action verb.",
        "Quantify impact using numbers, percentages or measurable outcomes.",
        "Focus bullets on achievements rather than only responsibilities."
    ],
    "projects": [
        "Add links or evidence of major projects where appropriate.",
        "Mention tools, methods or domain expertise used.",
        "Describe the problem solved and the outcome."
    ],
    "skills": [
        "Group skills by relevant categories.",
        "Remove outdated or irrelevant skills.",
        "Prioritize skills relevant to the target role."
    ],
    "summary": [
        "Keep your summary concise and role-specific.",
        "Tailor it to the position you are applying for.",
        "Mention your strongest relevant expertise."
    ],
    "certifications": [
        "Include the issuing organization and year.",
        "Prioritize recent and relevant certifications."
    ],
    "achievements": [
        "Lead with your strongest achievement.",
        "Quantify achievements where possible."
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
# DOMAIN DETECTION
# ============================================================

def detect_domain(text):
    text_lower = text.lower()
    scores = {}

    for domain, keywords in DOMAIN_PROFILES.items():
        score = 0

        for keyword in keywords:
            pattern = r"(?<!\w)" + re.escape(keyword) + r"(?!\w)"
            occurrences = len(re.findall(pattern, text_lower))

            if occurrences:
                score += 1 + min(occurrences - 1, 2)

        scores[domain] = score

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    if not ranked or ranked[0][1] == 0:
        return "General / Other", scores

    # Avoid weak accidental classification.
    if ranked[0][1] < 2:
        return "General / Other", scores

    return ranked[0][0], scores

# ============================================================
# SKILL DETECTION
# ============================================================

def detect_skills(text, domain):
    text_lower = text.lower()

    relevant_categories = DOMAIN_CATEGORIES.get(domain, list(SKILLS_DB.keys()))

    # Search relevant categories first, then other categories.
    ordered_categories = list(dict.fromkeys(
        relevant_categories + list(SKILLS_DB.keys())
    ))

    found_by_category = {}

    for category in ordered_categories:
        found = []

        for skill in SKILLS_DB.get(category, []):
            pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"

            if re.search(pattern, text_lower):
                found.append(skill)

        if found:
            found_by_category[category] = found

    all_found = []
    for skills in found_by_category.values():
        all_found.extend(skills)

    all_found = list(dict.fromkeys(all_found))

    priority = DOMAIN_PRIORITY_SKILLS.get(domain, [])
    missing = [skill for skill in priority if skill not in all_found]

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
    impact_words = (
        r"increased|decreased|improved|reduced|optimized|boosted|"
        r"accelerated|saved|generated|achieved|led|delivered|"
        r"grew|cut|lowered|raised|enhanced|streamlined"
    )

    measurement = (
        r"(?:"
        r"\d+(?:\.\d+)?\s*%"
        r"|"
        r"\$\s*\d+(?:\.\d+)?\s*(?:k|m|b)?"
        r"|"
        r"\d+(?:\.\d+)?x"
        r"|"
        r"\d+\+?\s*(?:users|clients|customers|projects|teams|members|products|employees)"
        r"|"
        r"\d+\+?\s*(?:hours|days|months|years)"
        r")"
    )

    # Resume PDFs often contain one bullet per line, so line breaks
    # are treated as achievement boundaries.
    sentences = re.split(
        r"(?<=[.!?])\s+|\n+|•",
        text
    )

    achievements = []

    for sentence in sentences:
        sentence = sentence.strip()

        if not sentence or len(sentence.split()) < 5:
            continue

        has_impact = re.search(
            rf"\b(?:{impact_words})\b",
            sentence,
            re.IGNORECASE
        )

        has_measurement = re.search(
            measurement,
            sentence,
            re.IGNORECASE
        )

        if has_impact and has_measurement:
            cleaned = re.sub(r"\s+", " ", sentence).strip()

            if cleaned not in achievements:
                achievements.append(cleaned)

    return achievements[:10]

# ============================================================
# REPETITION DETECTION
# ============================================================

def check_repetition(text):
    words = re.findall(r"\b\w{4,}\b", text.lower())

    counts = {}

    for word in words:
        counts[word] = counts.get(word, 0) + 1

    stop = {
        "with","have","that","this","from","your","been","will",
        "they","their","were","also","into","work","team","used",
        "data","using","based","more","over","about","resume"
    }

    return [
        word
        for word, count in counts.items()
        if count > 5 and word not in stop
    ][:5]

# ============================================================
# JOB ROLE MATCHING
# ============================================================

def match_job_roles(skills_found, domain):
    skill_set = set(s.lower() for s in skills_found)
    scores = {}

    for role, required in JOB_ROLES.items():
        matched = [
            skill for skill in required
            if skill.lower() in skill_set
        ]

        pct = round((len(matched) / len(required)) * 100)

        scores[role] = {
            "match": pct,
            "matched_skills": matched,
            "missing_skills": [
                skill for skill in required
                if skill.lower() not in skill_set
            ]
        }

    domain_terms = {
        "Technology": ["developer","software","engineer"],
        "Data & AI": ["data","ml"],
        "Finance & Banking": ["financial","investment","risk","accountant","auditor","tax"],
        "Law & Legal": ["legal","lawyer","paralegal","compliance"],
        "Healthcare & Medical": ["medical","nurse","healthcare","clinical"],
        "Pharma & Biotech": ["pharmacist","clinical","pharma"],
        "Marketing": ["marketing","seo","brand","content"],
        "Sales & Business Development": ["sales","business development","account","customer"],
        "Human Resources": ["hr","talent"],
        "Education": ["teacher","educator","instructional","academic"],
        "Design & Creative": ["designer","creative"],
        "Operations & Supply Chain": ["operations","supply","procurement","logistics"],
        "Project Management & Consulting": ["project","business analyst","consultant"],
        "Engineering": ["engineer"],
        "Architecture & Construction": ["architect","construction"],
        "Science & Research": ["research","scientist"],
        "Media & Communications": ["journalist","pr","content"],
        "Hospitality & Tourism": ["hotel","event"],
        "Real Estate": ["real estate","property"],
        "Government & Public Sector": ["public","policy"],
        "Customer Service": ["customer"],
        "Environment & Agriculture": ["environmental","sustainability","agriculture"],
        "Cybersecurity": ["cybersecurity","security","soc"]
    }

    preferred = domain_terms.get(domain, [])

    sorted_roles = sorted(
        scores.items(),
        key=lambda item: (
            item[1]["match"],
            any(term in item[0].lower() for term in preferred)
        ),
        reverse=True
    )

    return dict(sorted_roles[:5])

# ============================================================
# SCORE CALCULATION
# ============================================================

def calculate_score(sections, skills_found, achievements, repetitions):
    section_weights = {
        "education": 7,
        "experience": 8,
        "projects": 6,
        "skills": 5,
        "summary": 3,
        "certifications": 3,
        "achievements": 3
    }

    section_score = sum(
        weight for section, weight in section_weights.items()
        if sections.get(section)
    )
    section_score = min(section_score, 35)

    # Skill points remain domain-neutral: detected relevant skills
    # contribute to the same 30-point category.
    skill_score = min(len(skills_found) * 2, 30)

    quantified_patterns = [
        r"\b\d+\s*%",
        r"\$\s*\d+(?:\.\d+)?\s*(?:k|m|b)?",
        r"\b\d+\+?\s*(?:users|clients|customers|projects|teams|members|products|employees)\b",
        r"\b\d+(?:\.\d+)?x\b",
        r"\b\d+\+?\s*(?:hours|days|months|years)\b"
    ]

    impact_patterns = [
        r"increased",r"decreased",r"improved",r"reduced",
        r"optimized",r"boosted",r"accelerated",r"saved",
        r"generated",r"achieved",r"led",r"delivered",
        r"grew",r"cut",r"lowered",r"raised",r"enhanced","streamlined"
    ]

    quantified_count = 0
    impact_count = 0

    for achievement in achievements:
        if any(re.search(p, achievement, re.IGNORECASE) for p in quantified_patterns):
            quantified_count += 1

        if any(re.search(p, achievement, re.IGNORECASE) for p in impact_patterns):
            impact_count += 1

    quantified_score = min(quantified_count * 2, 15)
    impact_score = min(impact_count, 5)

    achievement_section_score = 5 if sections.get("achievements") else 0

    achievement_score = min(
        quantified_score + impact_score + achievement_section_score,
        25
    )

    repetition_penalty = min(len(repetitions) * 2, 10)
    writing_score = max(0, 10 - repetition_penalty)

    score = (
        section_score +
        skill_score +
        achievement_score +
        writing_score
    )

    score = max(0, min(100, score))

    breakdown = {
        "sections": {"score": section_score, "max": 35},
        "skills": {"score": skill_score, "max": 30},
        "achievements": {"score": achievement_score, "max": 25},
        "writing": {"score": writing_score, "max": 10}
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
    score,
    domain
):
    suggestions = []

    if not sections.get("summary"):
        suggestions.append(
            "Add a Professional Summary tailored to the target role."
        )

    if not sections.get("experience"):
        suggestions.append(
            "Add a Work Experience section with roles, dates and measurable contributions."
        )

    if not sections.get("projects"):
        suggestions.append(
            "Add relevant projects, case studies, publications or work samples where applicable."
        )

    if len(achievements) < 3:
        suggestions.append(
            "Add more quantified achievements using percentages, money, users, clients, time saved or other measurable outcomes."
        )

    if missing_skills:
        suggestions.append(
            f"Consider adding relevant {domain} skills if you have experience with: "
            f"{', '.join(missing_skills[:4])}."
        )

    if not sections.get("certifications"):
        suggestions.append(
            "Add relevant certifications, licenses or professional training where applicable."
        )

    if repetitions:
        suggestions.append(
            f"Vary your language — frequently repeated words detected: {', '.join(repetitions)}."
        )

    if len(skills_found) < 5:
        suggestions.append(
            f"Expand the skills section with relevant {domain} competencies."
        )

    if score >= 80:
        suggestions.append(
            "Strong resume. Tailor the content and keywords to each target job."
        )

    return suggestions

# ============================================================
# RESUME ANALYSIS API
# ============================================================

@app.route("/analyze_resume", methods=["POST"])
def analyze_resume():

    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]

    try:
        text = extract_text(file.read())

        if not text.strip():
            return jsonify({
                "error": "Could not extract text. Ensure it is not a scanned image PDF."
            }), 400

        # Domain is detected BEFORE skills and job matching.
        domain, domain_scores = detect_domain(text)

        skills_found, missing_skills, skills_by_category = detect_skills(
            text,
            domain
        )

        sections = check_sections(text)
        section_tips = get_section_tips(sections)

        achievements = check_achievements(text)
        repetitions = check_repetition(text)

        score, breakdown = calculate_score(
            sections,
            skills_found,
            achievements,
            repetitions
        )

        suggestions = generate_suggestions(
            sections,
            skills_found,
            missing_skills,
            achievements,
            repetitions,
            score,
            domain
        )

        job_matches = match_job_roles(
            skills_found,
            domain
        )

        return jsonify({
            "score": score,

            # New domain fields.
            "domain": domain,
            "domain_scores": domain_scores,

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

            "word_count": len(text.split())
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# CANDIDATE / RESUME UPLOAD API
# ============================================================

@app.route("/jobs/<job_id>/candidates", methods=["POST"])
@jwt_required()
def upload_candidate(job_id):

    recruiter_id = get_jwt_identity()

    conn = get_db()
    try:
        job_row = conn.execute(
            "SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?",
            (job_id, recruiter_id)
        ).fetchone()
    finally:
        conn.close()

    if not job_row:
        return jsonify({
            "error": "Job not found or you are not authorized to access it"
        }), 404

    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400

    file = request.files["resume"]

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF resumes are supported"}), 400

    try:
        file_bytes = file.read()

        if not file_bytes:
            return jsonify({"error": "Uploaded resume is empty"}), 400

        text = extract_text(file_bytes)

        if not text.strip():
            return jsonify({
                "error": "Could not extract text. Ensure it is not a scanned image PDF."
            }), 400

        domain, domain_scores = detect_domain(text)
        skills_found, missing_skills, skills_by_category = detect_skills(text, domain)
        sections = check_sections(text)
        achievements = check_achievements(text)
        repetitions = check_repetition(text)
        score, breakdown = calculate_score(sections, skills_found, achievements, repetitions)

        required_skills = json.loads(job_row["required_skills"] or "[]")
        text_lower = text.lower()

        matched_job_skills = [s for s in required_skills if s.lower() in text_lower]
        missing_job_skills = [s for s in required_skills if s.lower() not in text_lower]

        job_match_score = round(
            (len(matched_job_skills) / len(required_skills)) * 100, 2
        ) if required_skills else 0

        candidate_id = str(uuid.uuid4())

        conn = get_db()
        try:
            conn.execute(
                """INSERT INTO candidates
                   (id, recruiter_id, job_id, resume_filename, resume_score, job_match_score,
                    domain, skills_found, skills_by_category, missing_skills,
                    matched_job_skills, missing_job_skills, sections, achievements,
                    repetitions, word_count, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    candidate_id, recruiter_id, job_id, file.filename,
                    score, job_match_score, domain,
                    json.dumps(skills_found), json.dumps(skills_by_category),
                    json.dumps(missing_skills), json.dumps(matched_job_skills),
                    json.dumps(missing_job_skills), json.dumps(sections),
                    json.dumps(achievements), json.dumps(repetitions),
                    len(text.split()), "Applied"
                )
            )
            conn.commit()
        finally:
            conn.close()

        return jsonify({
            "message": "Candidate resume uploaded and analyzed successfully",
            "candidate_id": candidate_id,
            "job_id": job_id,
            "resume_filename": file.filename,
            "resume_score": score,
            "job_match_score": job_match_score,
            "domain": domain,
            "skills_found": skills_found,
            "matched_job_skills": matched_job_skills,
            "missing_job_skills": missing_job_skills,
            "status": "Applied"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# CANDIDATE LIST API
# ============================================================

@app.route("/jobs/<job_id>/candidates", methods=["GET"])
@jwt_required()
def get_candidates(job_id):

    recruiter_id = get_jwt_identity()

    conn = get_db()
    try:
        job_row = conn.execute(
            "SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?",
            (job_id, recruiter_id)
        ).fetchone()

        if not job_row:
            return jsonify({
                "error": "Job not found or you are not authorized to access it"
            }), 404

        rows = conn.execute(
            """SELECT id, job_id, resume_filename, resume_score, job_match_score, domain,
                      skills_found, missing_skills, matched_job_skills,
                      missing_job_skills, sections, achievements, status, word_count
               FROM candidates
               WHERE job_id = ? AND recruiter_id = ?
               ORDER BY job_match_score DESC""",
            (job_id, recruiter_id)
        ).fetchall()
    finally:
        conn.close()

    candidates = []
    for row in rows:
        candidates.append({
            "candidate_id": row["id"],
            "job_id": row["job_id"],
            "resume_filename": row["resume_filename"],
            "resume_score": row["resume_score"],
            "job_match_score": row["job_match_score"],
            "domain": row["domain"],
            "skills_found": json.loads(row["skills_found"] or "[]"),
            "missing_skills": json.loads(row["missing_skills"] or "[]"),
            "matched_job_skills": json.loads(row["matched_job_skills"] or "[]"),
            "missing_job_skills": json.loads(row["missing_job_skills"] or "[]"),
            "sections": json.loads(row["sections"] or "{}"),
            "achievements": json.loads(row["achievements"] or "[]"),
            "status": row["status"],
            "word_count": row["word_count"],
        })

    return jsonify({
        "job_id": job_id,
        "job_title": job_row["title"],
        "company": job_row["company"],
        "candidate_count": len(candidates),
        "candidates": candidates
    }), 200


# ============================================================
# CANDIDATE STATUS UPDATE API
# ============================================================

@app.route("/candidates/<candidate_id>/status", methods=["PUT"])
@jwt_required()
def update_candidate_status(candidate_id):
    recruiter_id = get_jwt_identity()
    data = request.get_json()

    status = data.get("status")
    valid_statuses = ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"]

    if not status or status not in valid_statuses:
        return jsonify({
            "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        }), 400

    conn = get_db()
    try:
        result = conn.execute(
            "UPDATE candidates SET status = ? WHERE id = ? AND recruiter_id = ?",
            (status, candidate_id, recruiter_id)
        )
        conn.commit()
        matched = result.rowcount
    finally:
        conn.close()

    if matched == 0:
        return jsonify({
            "error": "Candidate not found or you are not authorized to update it"
        }), 404

    return jsonify({
        "message": "Candidate status updated successfully",
        "candidate_id": candidate_id,
        "status": status
    }), 200


# ============================================================
# COMPANY ENDPOINTS
# ============================================================

@app.route("/companies", methods=["POST"])
def create_company():
    data = request.get_json()
    name = data.get("name", "").strip()
    industry = data.get("industry", "")
    website = data.get("website", "")

    if not name:
        return jsonify({"error": "Company name is required"}), 400

    company_id = str(uuid.uuid4())
    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM companies WHERE name = ?", (name,)).fetchone()
        if existing:
            return jsonify({"error": "A company with this name already exists"}), 409
        conn.execute(
            "INSERT INTO companies (id, name, industry, website) VALUES (?, ?, ?, ?)",
            (company_id, name, industry, website)
        )
        conn.commit()
    finally:
        conn.close()

    return jsonify({"message": "Company created", "company_id": company_id, "name": name}), 201


@app.route("/companies", methods=["GET"])
def list_companies():
    conn = get_db()
    try:
        rows = conn.execute("SELECT id, name, industry, website FROM companies ORDER BY name").fetchall()
    finally:
        conn.close()
    return jsonify({"companies": [dict(r) for r in rows]}), 200


# ============================================================
# RECRUITER REGISTER / LOGIN (new recruiters table)
# ============================================================

@app.route("/recruiter/register", methods=["POST"])
def recruiter_register():
    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    company_id = data.get("company_id", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    conn = get_db()
    try:
        if conn.execute("SELECT id FROM recruiters WHERE email = ?", (email,)).fetchone():
            return jsonify({"error": "Email already registered"}), 409

        if company_id:
            if not conn.execute("SELECT id FROM companies WHERE id = ?", (company_id,)).fetchone():
                return jsonify({"error": "Company not found"}), 404

        rid = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO recruiters (id, company_id, name, email, password_hash) VALUES (?, ?, ?, ?, ?)",
            (rid, company_id or None, name, email, generate_password_hash(password))
        )
        conn.commit()
    finally:
        conn.close()

    return jsonify({"message": "Recruiter registered", "recruiter_id": rid, "name": name, "email": email}), 201


@app.route("/recruiter/login", methods=["POST"])
def recruiter_login():
    data = request.get_json()
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db()
    try:
        recruiter = conn.execute("SELECT * FROM recruiters WHERE email = ?", (email,)).fetchone()
    finally:
        conn.close()

    if not recruiter or not check_password_hash(recruiter["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(
        identity=recruiter["id"],
        additional_claims={"role": "recruiter", "name": recruiter["name"], "source": "recruiters"}
    )
    return jsonify({
        "message": "Login successful",
        "access_token": token,
        "name": recruiter["name"],
        "email": recruiter["email"],
        "role": "recruiter",
        "company_id": recruiter["company_id"]
    }), 200


# ============================================================
# CANDIDATE ACCOUNT REGISTER / LOGIN
# ============================================================

@app.route("/candidate/register", methods=["POST"])
def candidate_register():
    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    phone = data.get("phone", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    conn = get_db()
    try:
        if conn.execute("SELECT id FROM candidate_accounts WHERE email = ?", (email,)).fetchone():
            return jsonify({"error": "Email already registered"}), 409

        cid = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO candidate_accounts (id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)",
            (cid, name, email, generate_password_hash(password), phone)
        )
        conn.commit()
    finally:
        conn.close()

    return jsonify({"message": "Candidate registered", "candidate_id": cid, "name": name, "email": email}), 201


@app.route("/candidate/login", methods=["POST"])
def candidate_login():
    data = request.get_json()
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db()
    try:
        candidate = conn.execute("SELECT * FROM candidate_accounts WHERE email = ?", (email,)).fetchone()
    finally:
        conn.close()

    if not candidate or not check_password_hash(candidate["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(
        identity=candidate["id"],
        additional_claims={"role": "candidate", "name": candidate["name"], "source": "candidates"}
    )
    return jsonify({
        "message": "Login successful",
        "access_token": token,
        "name": candidate["name"],
        "email": candidate["email"],
        "role": "candidate"
    }), 200


# ============================================================
# PUBLIC JOB BOARD (no auth required)
# ============================================================

@app.route("/jobs/public", methods=["GET"])
def get_public_jobs():
    conn = get_db()
    try:
        rows = conn.execute(
            """SELECT id, title, company, description, required_skills,
                      experience, domain, created_at
               FROM jobs WHERE status = 'active'
               ORDER BY created_at DESC"""
        ).fetchall()
    finally:
        conn.close()

    jobs = []
    for row in rows:
        jobs.append({
            "job_id": row["id"],
            "title": row["title"],
            "company": row["company"],
            "description": row["description"],
            "required_skills": json.loads(row["required_skills"] or "[]"),
            "experience": row["experience"],
            "domain": row["domain"],
            "created_at": row["created_at"],
        })

    return jsonify({"jobs": jobs}), 200


# ============================================================
# CANDIDATE SELF-APPLY
# ============================================================

@app.route("/jobs/<job_id>/apply", methods=["POST"])
@jwt_required()
def candidate_apply(job_id):
    candidate_account_id = get_jwt_identity()

    conn = get_db()
    try:
        job_row = conn.execute(
            "SELECT * FROM jobs WHERE id = ? AND status = 'active'", (job_id,)
        ).fetchone()
    finally:
        conn.close()

    if not job_row:
        return jsonify({"error": "Job not found or no longer active"}), 404

    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400

    file = request.files["resume"]
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF resumes are supported"}), 400

    try:
        file_bytes = file.read()
        if not file_bytes:
            return jsonify({"error": "Uploaded resume is empty"}), 400

        text = extract_text(file_bytes)
        if not text.strip():
            return jsonify({"error": "Could not extract text. Ensure it is not a scanned image PDF."}), 400

        domain, _ = detect_domain(text)
        skills_found, missing_skills, skills_by_category = detect_skills(text, domain)
        sections = check_sections(text)
        achievements = check_achievements(text)
        repetitions = check_repetition(text)
        score, _ = calculate_score(sections, skills_found, achievements, repetitions)

        required_skills = json.loads(job_row["required_skills"] or "[]")
        text_lower = text.lower()
        matched_job_skills = [s for s in required_skills if s.lower() in text_lower]
        missing_job_skills = [s for s in required_skills if s.lower() not in text_lower]
        job_match_score = round(
            (len(matched_job_skills) / len(required_skills)) * 100, 2
        ) if required_skills else 0

        app_id = str(uuid.uuid4())
        conn = get_db()
        try:
            # Prevent duplicate application for same job
            existing = conn.execute(
                "SELECT id FROM applications WHERE job_id = ? AND candidate_account_id = ?",
                (job_id, candidate_account_id)
            ).fetchone()
            if existing:
                return jsonify({"error": "You have already applied to this job"}), 409

            conn.execute(
                """INSERT INTO applications
                   (id, job_id, recruiter_id, candidate_account_id, resume_filename,
                    resume_score, job_match_score, domain, skills_found, skills_by_category,
                    missing_skills, matched_job_skills, missing_job_skills, sections,
                    achievements, repetitions, word_count, status, source)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (app_id, job_id, job_row["recruiter_id"], candidate_account_id,
                 file.filename, score, job_match_score, domain,
                 json.dumps(skills_found), json.dumps(skills_by_category),
                 json.dumps(missing_skills), json.dumps(matched_job_skills),
                 json.dumps(missing_job_skills), json.dumps(sections),
                 json.dumps(achievements), json.dumps(repetitions),
                 len(text.split()), "Applied", "candidate_applied")
            )
            conn.commit()
        finally:
            conn.close()

        return jsonify({
            "message": "Application submitted successfully",
            "application_id": app_id,
            "resume_score": score,
            "job_match_score": job_match_score,
            "status": "Applied"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# RECRUITER — UPLOAD CANDIDATE RESUME (new applications table)
# ============================================================

@app.route("/jobs/<job_id>/applications", methods=["POST"])
@jwt_required()
def upload_application(job_id):
    recruiter_id = get_jwt_identity()

    conn = get_db()
    try:
        job_row = conn.execute(
            "SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?", (job_id, recruiter_id)
        ).fetchone()
    finally:
        conn.close()

    if not job_row:
        return jsonify({"error": "Job not found or you are not authorized"}), 404

    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400

    file = request.files["resume"]
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF resumes are supported"}), 400

    try:
        file_bytes = file.read()
        if not file_bytes:
            return jsonify({"error": "Uploaded resume is empty"}), 400

        text = extract_text(file_bytes)
        if not text.strip():
            return jsonify({"error": "Could not extract text. Ensure it is not a scanned image PDF."}), 400

        domain, _ = detect_domain(text)
        skills_found, missing_skills, skills_by_category = detect_skills(text, domain)
        sections = check_sections(text)
        achievements = check_achievements(text)
        repetitions = check_repetition(text)
        score, _ = calculate_score(sections, skills_found, achievements, repetitions)

        required_skills = json.loads(job_row["required_skills"] or "[]")
        text_lower = text.lower()
        matched_job_skills = [s for s in required_skills if s.lower() in text_lower]
        missing_job_skills = [s for s in required_skills if s.lower() not in text_lower]
        job_match_score = round(
            (len(matched_job_skills) / len(required_skills)) * 100, 2
        ) if required_skills else 0

        app_id = str(uuid.uuid4())
        conn = get_db()
        try:
            conn.execute(
                """INSERT INTO applications
                   (id, job_id, recruiter_id, resume_filename,
                    resume_score, job_match_score, domain, skills_found, skills_by_category,
                    missing_skills, matched_job_skills, missing_job_skills, sections,
                    achievements, repetitions, word_count, status, source)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (app_id, job_id, recruiter_id, file.filename,
                 score, job_match_score, domain,
                 json.dumps(skills_found), json.dumps(skills_by_category),
                 json.dumps(missing_skills), json.dumps(matched_job_skills),
                 json.dumps(missing_job_skills), json.dumps(sections),
                 json.dumps(achievements), json.dumps(repetitions),
                 len(text.split()), "Applied", "recruiter_uploaded")
            )
            conn.commit()
        finally:
            conn.close()

        return jsonify({
            "message": "Resume uploaded and analysed",
            "application_id": app_id,
            "resume_score": score,
            "job_match_score": job_match_score,
            "domain": domain,
            "skills_found": skills_found,
            "matched_job_skills": matched_job_skills,
            "missing_job_skills": missing_job_skills,
            "status": "Applied",
            "source": "recruiter_uploaded"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# RECRUITER — LIST APPLICATIONS FOR A JOB (new table)
# ============================================================

@app.route("/jobs/<job_id>/applications", methods=["GET"])
@jwt_required()
def get_applications(job_id):
    recruiter_id = get_jwt_identity()

    conn = get_db()
    try:
        job_row = conn.execute(
            "SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?", (job_id, recruiter_id)
        ).fetchone()

        if not job_row:
            return jsonify({"error": "Job not found or you are not authorized"}), 404

        rows = conn.execute(
            """SELECT a.id, a.resume_filename, a.resume_score, a.job_match_score, a.domain,
                      a.skills_found, a.missing_skills, a.matched_job_skills, a.missing_job_skills,
                      a.status, a.source, a.notes, a.applied_at, a.invited_at, a.word_count,
                      c.name AS candidate_name, c.email AS candidate_email, c.phone AS candidate_phone
               FROM applications a
               LEFT JOIN candidate_accounts c ON a.candidate_account_id = c.id
               WHERE a.job_id = ? AND a.recruiter_id = ?
               ORDER BY a.job_match_score DESC""",
            (job_id, recruiter_id)
        ).fetchall()
    finally:
        conn.close()

    applications = []
    for row in rows:
        applications.append({
            "candidate_id": row["id"],
            "resume_filename": row["resume_filename"],
            "resume_score": row["resume_score"],
            "job_match_score": row["job_match_score"],
            "domain": row["domain"],
            "skills_found": json.loads(row["skills_found"] or "[]"),
            "missing_skills": json.loads(row["missing_skills"] or "[]"),
            "matched_job_skills": json.loads(row["matched_job_skills"] or "[]"),
            "missing_job_skills": json.loads(row["missing_job_skills"] or "[]"),
            "status": row["status"],
            "source": row["source"],
            "notes": row["notes"],
            "applied_at": row["applied_at"],
            "invited_at": row["invited_at"],
            "word_count": row["word_count"],
            "candidate_name": row["candidate_name"],
            "candidate_email": row["candidate_email"],
            "candidate_phone": row["candidate_phone"],
        })

    return jsonify({
        "job_id": job_id,
        "job_title": job_row["title"],
        "company": job_row["company"],
        "candidate_count": len(applications),
        "candidates": applications
    }), 200


# ============================================================
# APPLICATION STATUS UPDATE (new applications table)
# ============================================================

@app.route("/applications/<app_id>/status", methods=["PUT"])
@jwt_required()
def update_application_status(app_id):
    recruiter_id = get_jwt_identity()
    data = request.get_json()

    status = data.get("status")
    notes = data.get("notes")
    valid_statuses = ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"]

    if not status or status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

    conn = get_db()
    try:
        # Build SET clause explicitly to avoid dict-ordering fragility.
        # invited_at uses a SQLite literal, not a bound parameter.
        set_parts = ["status = ?"]
        values = [status]

        if notes is not None:
            set_parts.append("notes = ?")
            values.append(notes)

        if status == "Interview":
            set_parts.append("invited_at = datetime('now')")

        set_clause = ", ".join(set_parts)
        values += [app_id, recruiter_id]

        result = conn.execute(
            f"UPDATE applications SET {set_clause} WHERE id = ? AND recruiter_id = ?",
            values
        )
        conn.commit()
        matched = result.rowcount
    finally:
        conn.close()

    if matched == 0:
        return jsonify({"error": "Application not found or you are not authorized"}), 404

    return jsonify({"message": "Status updated", "application_id": app_id, "status": status}), 200


# ============================================================
# CANDIDATE — VIEW OWN APPLICATIONS
# ============================================================

@app.route("/candidate/applications", methods=["GET"])
@jwt_required()
def get_my_applications():
    candidate_account_id = get_jwt_identity()

    conn = get_db()
    try:
        rows = conn.execute(
            """SELECT a.id, a.job_id, a.resume_score, a.job_match_score,
                      a.status, a.applied_at, a.invited_at,
                      j.title, j.company, j.domain
               FROM applications a
               JOIN jobs j ON a.job_id = j.id
               WHERE a.candidate_account_id = ?
               ORDER BY a.applied_at DESC""",
            (candidate_account_id,)
        ).fetchall()
    finally:
        conn.close()

    return jsonify({
        "applications": [
            {
                "application_id": row["id"],
                "job_id": row["job_id"],
                "job_title": row["title"],
                "company": row["company"],
                "domain": row["domain"],
                "resume_score": row["resume_score"],
                "job_match_score": row["job_match_score"],
                "status": row["status"],
                "applied_at": row["applied_at"],
                "invited_at": row["invited_at"],
            }
            for row in rows
        ]
    }), 200


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "Resume Analyser API running!",
        "version": "2.0-domain-general"
    })

# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":
    app.run(
        debug=True,
        port=5001
    )
