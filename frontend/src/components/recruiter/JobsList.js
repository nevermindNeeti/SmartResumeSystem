import React, { useEffect, useState } from "react";
import { recruiterApi } from "../../services/RecruiterApi";
import JobCard from "./JobCard";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import { SkeletonCard } from "./Skeleton";

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
      <div className="rd-jobs-grid">
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
      <div className="rd-section-header">
        <h2>Jobs</h2>

        <button
          className="rd-btn-primary"
          onClick={() =>
            setShowCreateNotice(true)
          }
        >
          + Create Job
        </button>
      </div>

      {showCreateNotice && (
        <div className="rd-notice">
          Job creation needs a new backend endpoint
          (<code>POST /jobs</code>) that doesn't exist yet.
          Add it, then this button can open a real
          creation form.

          <button
            className="rd-notice-close"
            onClick={() =>
              setShowCreateNotice(false)
            }
          >
            ✕
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
        <div className="rd-jobs-grid">
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