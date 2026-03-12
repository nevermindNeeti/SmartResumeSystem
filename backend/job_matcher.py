import pandas as pd


def match_jobs(resume_skills):

    # Load job dataset
    jobs = pd.read_csv("data/jobs.csv")

    results = []

    for _, row in jobs.iterrows():

        job_title = row["job_title"]

        # convert skills string to list
        job_skills = row["skills"].split(",")

        # find matched skills
        matched_skills = list(set(resume_skills) & set(job_skills))

        # find missing skills
        missing_skills = list(set(job_skills) - set(resume_skills))

        # calculate match score
        score = (len(matched_skills) / len(job_skills)) * 100

        results.append({
            "job_title": job_title,
            "match_score": round(score, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        })

    # sort jobs by best score
    results = sorted(results, key=lambda x: x["match_score"], reverse=True)

    return results