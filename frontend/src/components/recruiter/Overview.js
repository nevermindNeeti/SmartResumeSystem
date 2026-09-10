import React, { useEffect, useState } from "react";
import { recruiterApi } from "../../services/RecruiterApi";
import StatCard from "./StatCard";
import { SkeletonCard } from "./Skeleton";
import ErrorState from "./ErrorState";

export default function Overview({ jobs, jobsLoading }) {
  const [candidatesByJob, setCandidatesByJob] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCandidates = async () => {
    if (!jobs || jobs.length === 0) {
      setCandidatesByJob({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        jobs.map((job) =>
          recruiterApi
            .getCandidates(job.job_id)
            .then((res) => [
              job.job_id,
              res.candidates || [],
            ])
        )
      );

      setCandidatesByJob(
        Object.fromEntries(results)
      );
    } catch (err) {
      setError(
        "Unable to load candidate data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  if (jobsLoading || loading) {
    return (
      <div className="rd-stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadCandidates}
      />
    );
  }

  const allCandidates =
    Object.values(candidatesByJob).flat();

  const totalCandidates = allCandidates.length;

  const shortlisted = allCandidates.filter(
    (candidate) =>
      candidate.status === "Shortlisted"
  ).length;

  const interviews = allCandidates.filter(
    (candidate) =>
      candidate.status === "Interview"
  ).length;

  return (
    <div className="rd-stats-grid">

      <StatCard
        label="Total Jobs"
        value={jobs.length}
        icon="💼"
      />

      <StatCard
        label="Total Candidates"
        value={totalCandidates}
        icon="👥"
      />

      <StatCard
        label="Shortlisted"
        value={shortlisted}
        icon="⭐"
      />

      <StatCard
        label="Interviews"
        value={interviews}
        icon="🗓️"
      />

    </div>
  );
}
