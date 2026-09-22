import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { recruiterApi } from "../../services/RecruiterApi";
import JobCard from "./JobCard";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import { SkeletonCard } from "./Skeleton";
import { Button } from "../ui";

const jobsGridCls = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]";

export default function JobsList({
  jobs,
  jobsLoading,
  jobsError,
  onRefresh,
  onSelectJob,
}) {
  const [candidateCounts, setCandidateCounts] = useState({});
  const [showCreateNotice, setShowCreateNotice] = useState(false);

  useEffect(() => {
    if (!jobs || jobs.length === 0) return;

    let cancelled = false;

    Promise.all(
      jobs.map((job) =>
        recruiterApi
          .getCandidates(job.job_id)
          .then((res) => [
            job.job_id,
            (res.candidates || []).length,
          ])
          .catch(() => [job.job_id, 0])
      )
    ).then((results) => {
      if (!cancelled) {
        setCandidateCounts(
          Object.fromEntries(results)
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [jobs]);

  if (jobsLoading) {
    return (
      <div className={jobsGridCls}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (jobsError) {
    return (
      <ErrorState
        message={jobsError}
        onRetry={onRefresh}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="font-display text-xl font-bold text-ink-900 m-0">Jobs</h2>

        <Button variant="primary" onClick={() => setShowCreateNotice(true)}>
          + Create Job
        </Button>
      </div>

      {showCreateNotice && (
        <div className="relative bg-blue-50 border border-blue-200 text-blue-800 px-4 pr-10 py-3.5 rounded-lg text-xs mb-[18px]">
          To create a job, use the API directly:{" "}
          <code className="bg-blue-800/10 px-1.5 py-0.5 rounded">POST /jobs</code> with{" "}
          <code className="bg-blue-800/10 px-1.5 py-0.5 rounded">title</code>,{" "}
          <code className="bg-blue-800/10 px-1.5 py-0.5 rounded">company</code>,{" "}
          <code className="bg-blue-800/10 px-1.5 py-0.5 rounded">description</code>, and optionally{" "}
          <code className="bg-blue-800/10 px-1.5 py-0.5 rounded">required_skills</code>,{" "}
          <code className="bg-blue-800/10 px-1.5 py-0.5 rounded">experience</code>, and{" "}
          <code className="bg-blue-800/10 px-1.5 py-0.5 rounded">domain</code>.

          <button
            className="absolute top-2.5 right-2.5 border-0 bg-transparent text-blue-800 cursor-pointer"
            onClick={() =>
              setShowCreateNotice(false)
            }
          >
            <FiX />
          </button>
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          subtitle="Create your first job to start screening candidates."
          actionLabel="Create Job"
          onAction={() =>
            setShowCreateNotice(true)
          }
        />
      ) : (
        <div className={jobsGridCls}>
          {jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              applicantCount={
                candidateCounts[job.job_id] ?? "…"
              }
              onViewCandidates={() =>
                onSelectJob(job.job_id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}