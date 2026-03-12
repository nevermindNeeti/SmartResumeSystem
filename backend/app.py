import streamlit as st
import plotly.graph_objects as go
import time
import re
from reportlab.pdfgen import canvas

from resume_parser import extract_text_from_pdf, extract_skills, extract_experience
from job_matcher import match_jobs
from courses import COURSES, CERTIFICATIONS, PRO_SKILLS
from career_paths import CAREER_PATHS

st.set_page_config(page_title="Smart Resume Screening", layout="wide")

# Sidebar
st.sidebar.title("System Dashboard")

st.sidebar.markdown("""
Smart Resume Screening System

""")

st.sidebar.divider()

st.sidebar.subheader("Modules")

st.sidebar.markdown("""
• Resume Parsing  
• Skill Extraction  
• Job Matching  
• Skill Gap Analysis  
• Learning Recommendations  
• Career Path Suggestions
""")

st.sidebar.divider()

st.sidebar.subheader("Built With")

st.sidebar.markdown("""
Python  
Streamlit  
Machine Learning  
Natural Language Processing
""")

st.sidebar.divider()

st.sidebar.subheader("Developed By")

st.sidebar.markdown("""
• Mudra Berde 75 
• Neeti Bole 76  
• Disha Waghavle 77
""")


# -------------------------
# UI Styling
# -------------------------

st.markdown("""
<style>

.stApp{
background:#f5f7fb;
}

/* titles */

h1{
font-size:40px !important;
}

h2{
font-size:30px !important;
}

h3{
font-size:24px !important;
}

/* tabs */

button[data-baseweb="tab"]{
font-size:18px !important;
font-weight:600 !important;
padding:10px 18px !important;
}

button[data-baseweb="tab"][aria-selected="true"]{
border-bottom:3px solid #2563eb !important;
}

/* cards */

.metric-card{
background:white;
padding:20px;
border-radius:10px;
box-shadow:0 2px 8px rgba(0,0,0,0.08);
text-align:center;
}

.skill-card{
background:white;
padding:18px;
border-radius:10px;
box-shadow:0 2px 6px rgba(0,0,0,0.08);
}

.job-card{
background:white;
padding:16px;
border-radius:10px;
box-shadow:0 2px 6px rgba(0,0,0,0.08);
margin-bottom:12px;
}

</style>
""", unsafe_allow_html=True)


# -------------------------
# Header
# -------------------------

st.title("Smart Resume Screening & Job Recommendation System")

st.write(
"Upload your resume to analyze skills, evaluate job compatibility "
"and receive AI-based career recommendations."
)

uploaded_file = st.file_uploader("Upload Resume (PDF)", type=["pdf"])

loader_placeholder = st.empty()

# -------------------------
# PDF Report Generator
# -------------------------

def generate_report(summary, job_title, match_score, skills_found, skills_missing, strength):

    file_path = "resume_analysis_report.pdf"
    c = canvas.Canvas(file_path)

    y = 800

    c.setFont("Helvetica-Bold",20)
    c.drawString(50,y,"Smart Resume Analysis Report")

    y -= 40

    c.setFont("Helvetica",12)
    c.drawString(50,y,f"Recommended Role: {job_title}")

    y -= 20
    c.drawString(50,y,f"Job Match Score: {match_score}%")

    y -= 20
    c.drawString(50,y,f"Resume Strength Score: {strength}%")

    y -= 30
    c.drawString(50,y,f"Skills Detected: {skills_found}")

    y -= 20
    c.drawString(50,y,f"Skills To Improve: {skills_missing}")

    y -= 40

    for line in summary.split("\n"):
        c.drawString(50,y,line)
        y -= 20

    c.save()

    return file_path


# -------------------------
# Resume Processing
# -------------------------

if uploaded_file:

    with loader_placeholder.container():

        st.subheader("Resume Processing")

        progress = st.progress(0)
        status = st.empty()

        steps = [
            "Reading Resume...",
            "Extracting Skills...",
            "Analyzing Experience...",
            "Matching Jobs...",
            "Generating Insights..."
        ]

        for i, step in enumerate(steps):
            status.write(step)
            time.sleep(0.5)
            progress.progress((i + 1) / len(steps))

        status.success("Resume analysis completed")
        time.sleep(0.8)

    loader_placeholder.empty()

    resume_text = extract_text_from_pdf(uploaded_file)
    resume_skills = extract_skills(resume_text)
    experience = extract_experience(resume_text)

    results = match_jobs(resume_skills)

    top_job = results[0]
    top_matches = results[:3]

    skills_found = len(top_job["matched_skills"])
    skills_missing = len(top_job["missing_skills"])

    total_skills = skills_found + skills_missing

    match = re.search(r"\d+", str(experience))
    experience_years = int(match.group()) if match else 0

    skill_score = skills_found / total_skills if total_skills else 0
    experience_score = min(experience_years / 5,1)

    resume_strength = int((skill_score*0.7 + experience_score*0.3)*100)

    summary = f"""
Strong skills detected in {', '.join(top_job['matched_skills'][:3])}.
Developing {', '.join(top_job['missing_skills'][:3])} could improve job compatibility.
Estimated experience: {experience_years} years.
"""

# -------------------------
# Dashboard Cards
# -------------------------

    col1, col2 = st.columns(2)

    with col1:

        st.markdown('<div class="metric-card">', unsafe_allow_html=True)

        st.subheader("Resume Strength")
        st.metric("", f"{resume_strength}%")

        st.caption("Overall evaluation of skills and experience")

        st.markdown('</div>', unsafe_allow_html=True)


    with col2:

        st.markdown('<div class="metric-card">', unsafe_allow_html=True)

        match_score = min(int(top_job["match_score"]),95)

        st.subheader("Top Job Match")
        st.metric("", f"{match_score}%")

        st.caption(f"Best matching role: {top_job['job_title']}")

        st.markdown('</div>', unsafe_allow_html=True)


# -------------------------
# Tabs
# -------------------------

    tab1, tab2, tab3, tab4 = st.tabs([
        "Job Match Overview",
        "Skill & Resume Evaluation",
        "Learning Recommendations",
        "Career Development"
    ])


# -------------------------
# TAB 1
# -------------------------

    with tab1:

        st.subheader("Top Job Matches")

        for job in top_matches:

            score = min(int(job["match_score"]),95)

            st.markdown(f"""
            <div class="job-card">
            <b>{job['job_title']}</b>
            <span style="float:right;background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:6px">
            {score}% Match
            </span>
            </div>
            """, unsafe_allow_html=True)

            st.progress(score/100)

            st.caption(
                f"Key matching skills: {', '.join(job['matched_skills'][:3])}"
            )


# -------------------------
# TAB 2
# -------------------------

    with tab2:

        col1, col2 = st.columns(2)

        with col1:

            st.markdown('<div class="skill-card">', unsafe_allow_html=True)

            st.subheader("Skills Detected")

            for skill in top_job["matched_skills"]:
                st.write("✔", skill)

            st.markdown('</div>', unsafe_allow_html=True)


        with col2:

            st.markdown('<div class="skill-card">', unsafe_allow_html=True)

            st.subheader("Skills to Improve")

            improvement_skills = top_job["missing_skills"]

            if not improvement_skills and top_job["job_title"] in PRO_SKILLS:
                improvement_skills = PRO_SKILLS[top_job["job_title"]]

            for skill in improvement_skills:
                st.write("•", skill)

            st.markdown('</div>', unsafe_allow_html=True)


        st.subheader("Skill Coverage")

        fig = go.Figure(data=[go.Pie(
            labels=["Matched Skills","Skills To Improve"],
            values=[len(top_job["matched_skills"]),len(improvement_skills)],
            hole=0.6
        )])

        st.plotly_chart(fig)

        st.subheader("Resume Evaluation Summary")

        st.info(summary)


        report = generate_report(
            summary,
            top_job["job_title"],
            match_score,
            skills_found,
            skills_missing,
            resume_strength
        )

        with open(report,"rb") as f:

            st.download_button(
                label="Download Resume Analysis Report (PDF)",
                data=f,
                file_name="resume_analysis_report.pdf",
                mime="application/pdf"
            )


# -------------------------
# TAB 3
# -------------------------

    with tab3:

        st.subheader("Recommended Learning")

        for skill in improvement_skills:

            if skill in COURSES:

                st.write(f"**{skill}**")
                st.write(COURSES[skill])


# -------------------------
# TAB 4
# -------------------------

    with tab4:

        st.subheader("Recommended Certifications")

        certs = CERTIFICATIONS.get(top_job["job_title"], [])

        for cert in certs:
            st.write("•", cert)

        st.subheader("Career Path")

        paths = CAREER_PATHS.get(top_job["job_title"], [])

        if paths:
            st.write(" → ".join(paths))

        st.info(
            f"To grow in the {top_job['job_title']} role, focus on advanced skills, certifications and practical experience."
           )