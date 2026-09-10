import React, { useEffect, useMemo, useState } from "react";
import { recruiterApi } from "../../services/RecruiterApi";
import StatCard from "./StatCard";
import ErrorState from "./ErrorState";
import { SkeletonCard } from "./Skeleton";

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
        onRetry={loadAnalytics}
      />
    );
  }

  return (
    <div className="rd-analytics">
      <div className="rd-section-header">
        <div>
          <h2>Analytics</h2>
          <div className="rd-text-muted">
            Recruitment pipeline and candidate
            performance overview
          </div>
        </div>
      </div>

      <div className="rd-stats-grid">
        <StatCard
          label="Total Candidates"
          value={analytics.total}
          icon="👥"
        />

        <StatCard
          label="Average Job Match"
          value={`${analytics.averageMatch}%`}
          icon="🎯"
        />

        <StatCard
          label="Average Resume Score"
          value={analytics.averageResumeScore}
          icon="📄"
        />

        <StatCard
          label="Shortlisted"
          value={
            analytics.statusCounts.Shortlisted
          }
          icon="⭐"
        />
      </div>

      <div className="rd-analytics-card">
        <div className="rd-analytics-card-header">
          <h3>Candidate Pipeline</h3>
        </div>

        <div className="rd-pipeline">
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
                className="rd-pipeline-row"
              >
                <div className="rd-pipeline-label">
                  <span>{status}</span>
                  <strong>{count}</strong>
                </div>

                <div className="rd-pipeline-bar-bg">
                  <div
                    className="rd-pipeline-bar"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <div className="rd-pipeline-percent">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rd-analytics-card">
        <div className="rd-analytics-card-header">
          <h3>Jobs Overview</h3>
        </div>

        {jobs && jobs.length > 0 ? (
          <div className="rd-job-analytics-list">
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
                  className="rd-job-analytics-row"
                >
                  <div>
                    <strong>{job.title}</strong>
                    <div className="rd-text-muted">
                      {job.company}
                    </div>
                  </div>

                  <div>
                    <span className="rd-text-muted">
                      Candidates
                    </span>
                    <strong>
                      {jobCandidates.length}
                    </strong>
                  </div>

                  <div>
                    <span className="rd-text-muted">
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
          <div className="rd-text-muted">
            No jobs available yet.
          </div>
        )}
      </div>
    </div>
  );
}