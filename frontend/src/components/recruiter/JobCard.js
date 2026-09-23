import React from "react";
import { Card, Button } from "../ui";

export default function JobCard({
  job,
  applicantCount,
  onViewCandidates,
  buttonLabel = "View Candidates",
}) {
  return (
    <Card className="hover:border-ink-300 hover:shadow-raised hover:-translate-y-0.5 transition-all duration-200">

      <div>
        <div className="text-ink-900 text-base font-bold">
          {job.title}
        </div>

        <div className="text-ink-500 text-[13px] mt-1">
          {job.company}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-ink-500 text-[11px] mt-4">
        <span>{job.domain}</span>
        <span>•</span>
        <span>{job.experience}</span>
        <span>•</span>
        <span>{applicantCount} applicants</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {(job.required_skills || [])
          .slice(0, 6)
          .map((skill) => (
            <span key={skill} className="inline-flex items-center px-2 py-1 bg-ink-100 text-ink-600 rounded-md text-[11px]">
              {skill}
            </span>
          ))}
      </div>

      <Button
        variant="primary"
        onClick={onViewCandidates}
        className="w-full mt-[18px] justify-center"
      >
        {buttonLabel}
      </Button>

    </Card>
  );
}
