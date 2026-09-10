import React from "react";

export default function JobCard({
  job,
  applicantCount,
  onViewCandidates,
}) {
  return (
    <div className="rd-job-card">

      <div className="rd-job-card-header">
        <div>
          <div className="rd-job-title">
            {job.title}
          </div>

          <div className="rd-job-company">
            {job.company}
          </div>
        </div>
      </div>

      <div className="rd-job-meta">
        <span>{job.domain}</span>
        <span>•</span>
        <span>{job.experience}</span>
        <span>•</span>
        <span>{applicantCount} applicants</span>
      </div>

      <div className="rd-job-skills">
        {(job.required_skills || [])
          .slice(0, 6)
          .map((skill) => (
            <span
              key={skill}
              className="rd-skill-chip"
            >
              {skill}
            </span>
          ))}
      </div>

      <button
        className="rd-btn-primary rd-job-cta"
        onClick={onViewCandidates}
      >
        View Candidates
      </button>

    </div>
  );
}
