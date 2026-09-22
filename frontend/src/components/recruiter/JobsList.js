import React, { useEffect, useState } from "react";
import { recruiterApi } from "../../services/RecruiterApi";
import JobCard from "./JobCard";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import { SkeletonCard } from "./Skeleton";
import CreateJobModal from "./CreateJobModal";
import { Button } from "../ui";

const jobsGridCls = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]";

export default function JobsList({
  jobs,
  jobsLoading,
  jobsError,
  onRefresh,
  onSelectJob,
  onJobCreated,
}) {
  const [candidateCounts, setCandidateCounts] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!jobs || jobs.length === 0) return;

    let cancelled = false;

    Promise.all(
      jobs.map((job) =>
        recruiterApi
          .getCandidates(job.job_id)
          .then((res) => [job.job_id, (res.candidates || []).length])
          .catch(() => [job.job_id, 0])
      )
    ).then((results) => {
      if (!cancelled) {
        setCandidateCounts(Object.fromEntries(results));
      }
    });

    return () => { cancelled = true; };
  }, [jobs]);

  const handleCreated = () => {
    setShowModal(false);
    onJobCreated();
  };

  if (jobsLoading) {
    return (
      <div className={jobsGridCls}>
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (jobsError) {
    return <ErrorState message={jobsError} onRetry={onRefresh} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="font-display text-xl font-bold text-ink-900 m-0">Jobs</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Create Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          subtitle="Create your first job to start screening candidates."
          actionLabel="Create Job"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className={jobsGridCls}>
          {jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              applicantCount={candidateCounts[job.job_id] ?? "…"}
              onViewCandidates={() => onSelectJob(job.job_id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CreateJobModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
