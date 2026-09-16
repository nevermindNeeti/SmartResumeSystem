import React, { useEffect, useMemo, useState } from "react";
import { FiUsers, FiTarget, FiFileText, FiStar } from "react-icons/fi";
import { recruiterApi } from "../../services/RecruiterApi";
import StatCard from "./StatCard";
import ErrorState from "./ErrorState";
import { SkeletonCard } from "./Skeleton";
import { Card } from "../ui";

const STATUSES = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected",
];

export default function Analytics({ jobs }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    if (!jobs || jobs.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        jobs.map((job) =>
          recruiterApi.getCandidates(job.job_id)
        )
      );

      const allCandidates = results.flatMap(
        (result) => result.candidates || []
      );

      setCandidates(allCandidates);
    } catch (err) {
      setError(
        "Unable to load analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [jobs]);

  const analytics = useMemo(() => {
    const total = candidates.length;

    const averageMatch =
      total > 0
        ? Math.round(
            candidates.reduce(
              (sum, candidate) =>
                sum +
                Number(
                  candidate.job_match_score || 0
                ),
              0
            ) / total
          )
        : 0;

    const averageResumeScore =
      total > 0
        ? Math.round(
            candidates.reduce(
              (sum, candidate) =>
                sum +
                Number(
                  candidate.resume_score || 0
                ),
              0
            ) / total
          )
        : 0;

    const statusCounts = {};

    STATUSES.forEach((status) => {
      statusCounts[status] =
        candidates.filter(
          (candidate) =>
            candidate.status === status
        ).length;
    });

    return {
      total,
      averageMatch,
      averageResumeScore,
      statusCounts,
    };
  }, [candidates]);

  if (loading) {
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
        onRetry={loadAnalytics}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-ink-900 m-0">Analytics</h2>
          <div className="text-ink-400 text-xs mt-1">
            Recruitment pipeline and candidate
            performance overview
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-7">
        <StatCard
          label="Total Candidates"
          value={analytics.total}
          icon={<FiUsers size={20} />}
        />

        <StatCard
          label="Average Job Match"
          value={`${analytics.averageMatch}%`}
          icon={<FiTarget size={20} />}
        />

        <StatCard
          label="Average Resume Score"
          value={analytics.averageResumeScore}
          icon={<FiFileText size={20} />}
        />

        <StatCard
          label="Shortlisted"
          value={
            analytics.statusCounts.Shortlisted
          }
          icon={<FiStar size={20} />}
        />
      </div>

      <Card padding="sm" className="mt-5">
        <div className="mb-5">
          <h3 className="text-ink-900 text-[15px] font-bold m-0">Candidate Pipeline</h3>
        </div>

        <div>
          {STATUSES.map((status) => {
            const count =
              analytics.statusCounts[status];

            const percentage =
              analytics.total > 0
                ? Math.round(
                    (count / analytics.total) *
                      100
                  )
                : 0;

            return (
              <div
                key={status}
                className="grid grid-cols-[100px_1fr_45px] items-center gap-3 mb-3.5"
              >
                <div className="flex justify-between gap-2 text-ink-600 text-[11px]">
                  <span>{status}</span>
                  <strong className="text-ink-900">{count}</strong>
                </div>

                <div className="h-[7px] bg-ink-100 rounded-pill overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-pill"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <div className="text-right text-ink-400 text-[11px]">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding="sm" className="mt-5">
        <div className="mb-5">
          <h3 className="text-ink-900 text-[15px] font-bold m-0">Jobs Overview</h3>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="flex flex-col">
            {jobs.map((job) => {
              const jobCandidates =
                candidates.filter(
                  (candidate) =>
                    candidate.job_id === job.job_id
                );

              const average =
                jobCandidates.length > 0
                  ? Math.round(
                      jobCandidates.reduce(
                        (sum, candidate) =>
                          sum +
                          Number(
                            candidate.job_match_score ||
                              0
                          ),
                        0
                      ) /
                        jobCandidates.length
                    )
                  : 0;

              return (
                <div
                  key={job.job_id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px] items-center gap-2.5 sm:gap-5 py-3.5 border-b border-ink-100 last:border-b-0 text-xs"
                >
                  <div>
                    <strong className="block text-ink-700">{job.title}</strong>
                    <div className="text-ink-400 text-[11px]">
                      {job.company}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-ink-400 text-[11px]">
                      Candidates
                    </span>
                    <strong>
                      {jobCandidates.length}
                    </strong>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-ink-400 text-[11px]">
                      Avg. Match
                    </span>
                    <strong>
                      {average}%
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-ink-400 text-[11px]">
            No jobs available yet.
          </div>
        )}
      </Card>
    </div>
  );
}