import React, { useEffect, useState } from "react";
import { FiBriefcase, FiUsers, FiStar, FiCalendar } from "react-icons/fi";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-7">
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

  const recruiterName = localStorage.getItem("recruiterName") || "Recruiter";

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-ink-900 m-0">
          Welcome back, {recruiterName.split(" ")[0]} 👋
        </h2>
        <p className="text-ink-400 text-sm mt-1">Here's your recruitment snapshot.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-7">

        <StatCard
          label="Total Jobs"
          value={jobs.length}
          icon={<FiBriefcase size={20} />}
        />

        <StatCard
          label="Total Candidates"
          value={totalCandidates}
          icon={<FiUsers size={20} />}
        />

        <StatCard
          label="Shortlisted"
          value={shortlisted}
          icon={<FiStar size={20} />}
        />

        <StatCard
          label="Interviews"
          value={interviews}
          icon={<FiCalendar size={20} />}
        />

      </div>

      {jobs.length === 0 && (
        <div className="bg-white border border-dashed border-ink-300 rounded-xl px-8 py-12 text-center max-w-[540px] mx-auto mt-4">
          <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <FiBriefcase size={26} className="text-brand-600" />
          </div>
          <p className="font-display text-lg font-bold text-ink-900 mb-2">No jobs posted yet</p>
          <p className="text-ink-400 text-sm leading-relaxed mb-1">
            Head to the <strong className="text-ink-700">Jobs</strong> tab and create your first job posting to start screening candidates.
          </p>
        </div>
      )}

      {jobs.length > 0 && totalCandidates === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-sm text-amber-800 mt-2">
          You have {jobs.length} job{jobs.length !== 1 ? "s" : ""} posted but no candidates yet. Open a job and upload PDF resumes to start screening.
        </div>
      )}
    </div>
  );
}
