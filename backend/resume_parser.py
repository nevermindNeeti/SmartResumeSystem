import PyPDF2
import re
from skills import SKILLS


def extract_text_from_pdf(file):

    reader = PyPDF2.PdfReader(file)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text

    return text


def extract_skills(resume_text):

    resume_text = resume_text.lower()

    detected_skills = []

    for skill in SKILLS:
        if skill in resume_text:
            detected_skills.append(skill)

    return detected_skills


def extract_experience(resume_text):

    experience_patterns = re.findall(r"\d+\+?\s+years?", resume_text.lower())

    if experience_patterns:
        return experience_patterns[0]

    return "Experience not detected"