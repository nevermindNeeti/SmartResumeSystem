import React, { useEffect, useMemo, useState } from "react";
import { recruiterApi } from "../../services/RecruiterApi";
import FilterBar from "./FilterBar"; 
import CandidateTable from "./CandidateTable";
import CandidateDrawer from "./CandidateDrawer";
import UploadResumes from "./UploadResumes";
import ErrorState from "./ErrorState";
import { SkeletonRow } from "./Skeleton";

export default function JobDetail({ job, onBack }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    minMatch: 0,
    minScore: 0,
    sortBy: "job_match_score",
    sortDir: "desc",
  });

  const loadCandidates = async () => {
    if (!job) return;

    setLoading(true);
    setError(null);

    try {
      const result = await recruiterApi.getCandidates(
        job.job_id
      );

      setCandidates(result.candidates || []);
    } catch (err) {
      setError(
        "Unable to load candidates. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  loadCandidates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [job]);

  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();

      result = result.filter((candidate) =>
        candidate.resume_filename
          ?.toLowerCase()
          .includes(search)
      );
    }

    if (filters.status !== "All") {
      result = result.filter(
        (candidate) =>
          candidate.status === filters.status
      );
    }

    result = result.filter(
      (candidate) =>
        Number(candidate.job_match_score || 0) >=
        filters.minMatch
    );

    result = result.filter(
      (candidate) =>
        Number(candidate.resume_score || 0) >=
        filters.minScore
    );

    result.sort((a, b) => {
      const aValue = Number(
        a[filters.sortBy] || 0
      );

      const bValue = Number(
        b[filters.sortBy] || 0
      );

      return filters.sortDir === "desc"
        ? bValue - aValue
        : aValue - bValue;
    });

    return result;
  }, [candidates, filters]);

  const handleStatusUpdated = (
    candidateId,
    newStatus
  ) => {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.candidate_id === candidateId
          ? {
              ...candidate,
              status: newStatus,
            }
          : candidate
      )
    );

    setSelectedCandidate((current) =>
      current &&
      current.candidate_id === candidateId
        ? {
            ...current,
            status: newStatus,
          }
        : current
    );
  };

  if (!job) {
    return null;
  }

  return (
    <div className="rd-job-detail">
      <button
        className="rd-back-btn"
        onClick={onBack}
      >
        ← Back to Jobs
      </button>

      <div className="rd-job-detail-header">
        <div>
          <h2>{job.title}</h2>

          <div className="rd-text-muted">
            {job.company}
            {job.domain
              ? ` • ${job.domain}`
              : ""}
            {job.experience
              ? ` • ${job.experience}`
              : ""}
          </div>
        </div>

        <div className="rd-job-detail-count">
          {candidates.length} applicants
        </div>
      </div>

      <div className="rd-job-description">
        <h4>Job Description</h4>

        <p>
          {job.description ||
            "No job description available."}
        </p>
      </div>

      <div className="rd-job-required">
        <h4>Required Skills</h4>

        <div className="rd-job-skills">
          {(job.required_skills || []).map(
            (skill) => (
              <span
                key={skill}
                className="rd-skill-chip"
              >
                {skill}
              </span>
            )
          )}
        </div>
      </div>

      <UploadResumes
        job={job}
        onUploadComplete={loadCandidates}
      />

      <div className="rd-candidates-section">
        <div className="rd-section-header">
          <div>
            <h2>Candidates</h2>

            <div className="rd-text-muted">
              Ranked by job match score
            </div>
          </div>
        </div>

        <FilterBar
  filters={filters}
  onChange={setFilters}
/>

        {loading ? (
          <div className="rd-table-container">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={loadCandidates}
          />
        ) : filteredCandidates.length === 0 ? (
          <div className="rd-empty">
            <div className="rd-empty-title">
              No candidates found
            </div>

            <div className="rd-empty-subtitle">
              Upload resumes or change your filters.
            </div>
          </div>
        ) : (
          <CandidateTable
            candidates={filteredCandidates}
            onSelectCandidate={
              setSelectedCandidate
            }
          />
        )}
      </div>

      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() =>
          setSelectedCandidate(null)
        }
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}