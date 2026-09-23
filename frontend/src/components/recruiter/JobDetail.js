import React, { useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { recruiterApi } from "../../services/RecruiterApi";
import { Card } from "../ui";
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
    <div className="w-full">
      <button
        className="border-0 bg-transparent text-ink-500 p-0 mb-[18px] text-xs cursor-pointer flex items-center gap-1.5 hover:text-ink-900"
        onClick={onBack}
      >
        <FiArrowLeft size={14} /> Back to Jobs
      </button>

      <div className="flex items-center justify-between gap-5 mb-5 flex-col items-start sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 m-0">{job.title}</h2>

          <div className="text-ink-400 text-xs mt-1">
            {job.company}
            {job.domain
              ? ` • ${job.domain}`
              : ""}
            {job.experience
              ? ` • ${job.experience}`
              : ""}
          </div>
        </div>

        <div className="px-3.5 py-2.5 bg-white border border-ink-200 rounded-lg text-ink-600 text-xs font-semibold">
          {candidates.length} applicants
        </div>
      </div>

      <Card padding="sm" rounded="lg" className="mb-3.5">
        <h4 className="m-0 mb-2.5 text-[13px] text-ink-700">Job Description</h4>

        <p className="text-ink-400 text-xs leading-relaxed m-0">
          {job.description ||
            "No job description available."}
        </p>
      </Card>

      <Card padding="sm" rounded="lg" className="mb-3.5">
        <h4 className="m-0 mb-2.5 text-[13px] text-ink-700">Required Skills</h4>

        <div className="flex flex-wrap gap-1.5">
          {(job.required_skills || []).map(
            (skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2 py-1 bg-ink-100 text-ink-600 rounded-md text-[11px]"
              >
                {skill}
              </span>
            )
          )}
        </div>
      </Card>

      <UploadResumes
        job={job}
        onUploadComplete={loadCandidates}
      />

      <div>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900 m-0">Candidates</h2>

            <div className="text-ink-400 text-xs mt-1">
              Ranked by job match score
            </div>
          </div>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
        />

        {loading ? (
          <div className="w-full bg-white border border-ink-200 rounded-lg">
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
          <div className="bg-white border border-dashed border-ink-300 rounded-lg px-6 py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="text-ink-700 text-base font-bold mb-1.5">
              {candidates.length === 0 ? "No candidates yet" : "No candidates match your filters"}
            </div>
            <div className="text-ink-400 text-xs leading-relaxed max-w-[260px] mx-auto">
              {candidates.length === 0
                ? "Upload PDF resumes above to start screening candidates for this job."
                : "Try clearing some filters to see more results."}
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
        key={selectedCandidate?.candidate_id}
        candidate={selectedCandidate}
        onClose={() =>
          setSelectedCandidate(null)
        }
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}