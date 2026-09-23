import React, { useEffect, useMemo, useState } from "react";
import { FiX, FiCheck, FiUsers, FiBriefcase, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { recruiterApi } from "../../services/RecruiterApi";
import StatusBadge from "./StatusBadge";
import { SkeletonRow } from "./Skeleton";
import ErrorState from "./ErrorState";
import { Card } from "../ui";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["All", "Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"];

const STATUS_FLOW = ["Applied", "Screening", "Shortlisted", "Interview", "Selected"];

const selectCls =
  "h-[34px] border border-ink-300 rounded-md bg-white text-ink-700 px-2.5 text-xs outline-none focus:border-brand-500";

/**
 * Compute how many of a job's required skills appear in the candidate's skill list.
 * Returns a 0-100 percentage.
 */
function matchScore(skillsFound, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 0;
  const found = new Set((skillsFound || []).map((s) => s.toLowerCase()));
  const matched = requiredSkills.filter((s) => found.has(s.toLowerCase()));
  return Math.round((matched.length / requiredSkills.length) * 100);
}

// ─── Candidate Detail Panel (slide-over) ──────────────────────────────────────

function CandidateDetailPanel({ candidate, jobs, onClose, onStatusUpdated }) {
  const [status, setStatus] = useState(candidate.status || "Applied");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const sections = candidate.sections || {};

  // Rank the recruiter's jobs by skill overlap with this candidate
  const jobRankings = useMemo(() => {
    return [...jobs]
      .map((job) => {
        const score = matchScore(candidate.skills_found, job.required_skills);
        const found = (job.required_skills || []).filter((s) =>
          (candidate.skills_found || []).map((x) => x.toLowerCase()).includes(s.toLowerCase())
        );
        const missing = (job.required_skills || []).filter(
          (s) => !(candidate.skills_found || []).map((x) => x.toLowerCase()).includes(s.toLowerCase())
        );
        return { job, score, found, missing };
      })
      .sort((a, b) => b.score - a.score);
  }, [jobs, candidate.skills_found]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setSaving(true);
    setSaveError(null);
    try {
      await recruiterApi.updateCandidateStatus(candidate.candidate_id, newStatus);
      onStatusUpdated(candidate.candidate_id, newStatus);
    } catch {
      setSaveError("Failed to update status.");
      setStatus(candidate.status);
    } finally {
      setSaving(false);
    }
  };

  const RANK_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];

  return (
    <div
      className="fixed inset-0 z-[1000] bg-ink-900/40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[520px] h-full overflow-y-auto bg-white shadow-[-10px_0_35px_rgba(0,0,0,0.12)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="px-6 pt-6 pb-5 border-b border-ink-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-bold text-[17px] text-ink-900 break-all leading-snug">
              {candidate.resume_filename}
            </div>
            <div className="text-ink-400 text-xs mt-1.5">
              Applied to <span className="font-semibold text-ink-700">{candidate._jobTitle}</span>
            </div>
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
          <button
            className="w-8 h-8 border border-ink-200 bg-white rounded-md cursor-pointer text-ink-500 hover:bg-ink-50 hover:text-ink-900 shrink-0"
            onClick={onClose}
          >
            <FiX className="mx-auto" />
          </button>
        </div>

        {/* ── SCORES ── */}
        <div className="grid grid-cols-2 gap-2.5 px-6 py-5 border-b border-ink-100">
          <div className="bg-ink-50 border border-ink-200 rounded-lg p-4">
            <div className="text-ink-500 text-[10px] uppercase tracking-wide">Resume Quality</div>
            <div className="text-ink-900 text-xl font-bold mt-1">{candidate.resume_score || 0}/100</div>
          </div>
          <div className="bg-ink-50 border border-ink-200 rounded-lg p-4">
            <div className="text-ink-500 text-[10px] uppercase tracking-wide">Job Match</div>
            <div className="text-ink-900 text-xl font-bold mt-1">{candidate.job_match_score || 0}%</div>
          </div>
        </div>

        {/* ── STATUS UPDATE ── */}
        <div className="px-6 py-5 border-b border-ink-100">
          <label className="block text-ink-700 text-xs font-bold mb-1.5">Update Pipeline Status</label>
          <select className={`${selectCls} w-full`} value={status} onChange={handleStatusChange} disabled={saving}>
            {[...STATUS_FLOW, "Rejected"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {saving && <div className="text-ink-400 text-[11px] mt-1.5">Saving…</div>}
          {saveError && <div className="text-red-600 text-[11px] mt-1.5">{saveError}</div>}
        </div>

        {/* ── BEST MATCHING JOBS ── */}
        <div className="px-6 pt-5 border-b border-ink-100 pb-5">
          <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-3">
            Top Job Matches for This Candidate
          </h4>

          {jobRankings.length === 0 ? (
            <div className="text-ink-400 text-xs">No jobs posted yet.</div>
          ) : (
            <>
              {(expanded ? jobRankings : jobRankings.slice(0, 3)).map(({ job, score, found, missing }, i) => (
                <div
                  key={job.job_id}
                  className={[
                    "rounded-lg border p-3.5 mb-2.5",
                    i === 0
                      ? "border-brand-200 bg-brand-50"
                      : "border-ink-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {i === 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          Best
                        </span>
                      )}
                      <span className="font-semibold text-[13px] text-ink-900 truncate">{job.title}</span>
                    </div>
                    <span
                      className="font-display font-extrabold text-[15px] shrink-0 ml-3"
                      style={{ color: RANK_COLORS[i % RANK_COLORS.length] }}
                    >
                      {score}%
                    </span>
                  </div>

                  <div className="text-ink-400 text-[11px] mb-2">{job.company}</div>

                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${score}%`,
                        background: RANK_COLORS[i % RANK_COLORS.length],
                      }}
                    />
                  </div>

                  {(job.required_skills || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {found.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px]">
                          {s}
                        </span>
                      ))}
                      {missing.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded text-[10px]">
                          {s} missing
                        </span>
                      ))}
                      {missing.length > 3 && (
                        <span className="px-2 py-0.5 bg-ink-100 text-ink-400 rounded text-[10px]">
                          +{missing.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-ink-400 text-[10px]">No required skills listed.</div>
                  )}
                </div>
              ))}

              {jobRankings.length > 3 && (
                <button
                  className="text-brand-600 text-xs font-semibold mt-0.5 flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                  onClick={() => setExpanded((e) => !e)}
                >
                  {expanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                  {expanded ? "Show less" : `Show ${jobRankings.length - 3} more jobs`}
                </button>
              )}
            </>
          )}
        </div>

        {/* ── MATCHED / MISSING SKILLS ── */}
        <div className="px-6 pt-5 border-b border-ink-100 pb-5">
          <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-3">Skills vs Applied Job</h4>
          <div className="mb-3">
            <span className="block text-[10px] font-bold text-green-700 mb-1.5">Matched</span>
            <div className="text-ink-500 text-xs leading-relaxed">
              {(candidate.matched_job_skills || []).join(", ") || "None"}
            </div>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-red-700 mb-1.5">Missing</span>
            <div className="text-ink-500 text-xs leading-relaxed">
              {(candidate.missing_job_skills || []).join(", ") || "None"}
            </div>
          </div>
        </div>

        {/* ── RESUME SECTIONS ── */}
        <div className="px-6 pt-5 pb-6">
          <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-3">Resume Sections</h4>
          {Object.keys(sections).length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4">
              {Object.entries(sections).map(([name, present]) => (
                <div
                  key={name}
                  className={[
                    "py-1.5 text-xs flex items-center gap-1.5",
                    present ? "text-green-700" : "text-red-600",
                  ].join(" ")}
                >
                  {present ? <FiCheck size={12} /> : <FiX size={12} />}
                  <span className="capitalize">{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-ink-400 text-xs">No section data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function AllCandidatesView({ jobs }) {
  const [allCandidates, setAllCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [jobFilter, setJobFilter] = useState("All");
  const [sortBy, setSortBy] = useState("job_match_score");
  const [sortDir, setSortDir] = useState("desc");

  const load = async () => {
    if (!jobs || jobs.length === 0) {
      setAllCandidates([]);
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
            .then((res) =>
              (res.candidates || []).map((c) => ({
                ...c,
                // Attach job context to each candidate row
                _jobId: job.job_id,
                _jobTitle: job.title,
                _jobCompany: job.company,
              }))
            )
            .catch(() => [])
        )
      );

      setAllCandidates(results.flat());
    } catch {
      setError("Unable to load candidates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  const handleStatusUpdated = (candidateId, newStatus) => {
    setAllCandidates((prev) =>
      prev.map((c) =>
        c.candidate_id === candidateId ? { ...c, status: newStatus } : c
      )
    );
    setSelected((prev) =>
      prev && prev.candidate_id === candidateId ? { ...prev, status: newStatus } : prev
    );
  };

  // ── Filtered + sorted list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allCandidates];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.resume_filename?.toLowerCase().includes(q) ||
          c._jobTitle?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (jobFilter !== "All") {
      list = list.filter((c) => c._jobId === jobFilter);
    }

    list.sort((a, b) => {
      const av = Number(a[sortBy] || 0);
      const bv = Number(b[sortBy] || 0);
      return sortDir === "desc" ? bv - av : av - bv;
    });

    return list;
  }, [allCandidates, search, statusFilter, jobFilter, sortBy, sortDir]);

  // ── Stats bar ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allCandidates.length;
    const shortlisted = allCandidates.filter((c) => c.status === "Shortlisted").length;
    const interview = allCandidates.filter((c) => c.status === "Interview").length;
    const avgMatch =
      total > 0
        ? Math.round(allCandidates.reduce((s, c) => s + Number(c.job_match_score || 0), 0) / total)
        : 0;
    return { total, shortlisted, interview, avgMatch };
  }, [allCandidates]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-ink-900 m-0">All Candidates</h2>
          <div className="text-ink-400 text-xs mt-1">
            Every candidate across all your jobs, in one place.
          </div>
        </div>
      </div>

      {/* Stats pills */}
      {!loading && !error && allCandidates.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total", value: stats.total, color: "#2563eb" },
            { label: "Shortlisted", value: stats.shortlisted, color: "#7c3aed" },
            { label: "Interview", value: stats.interview, color: "#b45309" },
            { label: "Avg Match", value: `${stats.avgMatch}%`, color: "#059669" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white border border-ink-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-card"
            >
              <div
                className="w-2 h-8 rounded-full shrink-0"
                style={{ background: color }}
              />
              <div>
                <div className="font-display text-lg font-bold text-ink-900 leading-none">{value}</div>
                <div className="text-ink-400 text-[11px] mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      {!loading && !error && allCandidates.length > 0 && (
        <Card padding="sm" rounded="lg" className="flex flex-wrap gap-2.5 mb-4">
          <input
            className="h-[34px] border border-ink-300 rounded-md bg-white text-ink-700 px-2.5 text-xs outline-none focus:border-brand-500 min-w-[180px] flex-1"
            placeholder="Search candidate or job…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={selectCls}
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
          >
            <option value="All">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.job_id} value={j.job_id}>
                {j.title}
              </option>
            ))}
          </select>

          <select
            className={selectCls}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>

          <select
            className={selectCls}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="job_match_score">Sort by Job Match</option>
            <option value="resume_score">Sort by Resume Score</option>
          </select>

          <select
            className={selectCls}
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
          >
            <option value="desc">Highest first</option>
            <option value="asc">Lowest first</option>
          </select>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className="w-full bg-white border border-ink-200 rounded-lg">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : allCandidates.length === 0 ? (
        /* Zero state — no candidates at all */
        <div className="bg-white border border-dashed border-ink-300 rounded-xl px-8 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center mx-auto mb-4">
            <FiUsers size={26} className="text-ink-400" />
          </div>
          <p className="font-display text-base font-bold text-ink-900 mb-2">No candidates yet</p>
          <p className="text-ink-400 text-sm leading-relaxed max-w-[320px] mx-auto">
            {jobs.length === 0
              ? "Create a job first, then upload PDF resumes to start screening."
              : "Open a job from the Jobs tab and upload PDF resumes to see candidates here."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        /* Filters yielded no results */
        <div className="bg-white border border-dashed border-ink-300 rounded-xl px-8 py-12 text-center">
          <p className="font-semibold text-ink-700 mb-1">No candidates match your filters</p>
          <button
            className="text-brand-600 text-xs font-semibold mt-2 border-0 bg-transparent cursor-pointer"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setJobFilter("All");
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Main table */
        <div className="w-full overflow-x-auto bg-white border border-ink-200 rounded-xl shadow-card">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr>
                {["#", "Candidate (Resume)", "Applied For", "Resume Score", "Job Match", "Domain", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="bg-ink-50 text-ink-500 text-left px-4 py-3 text-[10px] uppercase tracking-wide font-bold border-b border-ink-200"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((candidate, index) => (
                <tr
                  key={`${candidate.candidate_id}-${candidate._jobId}`}
                  onClick={() => setSelected(candidate)}
                  className="cursor-pointer transition-colors duration-150 hover:bg-brand-50 [&>td]:border-b [&>td]:border-ink-100 last:[&>td]:border-b-0"
                >
                  {/* Rank */}
                  <td className="px-4 py-3.5 text-ink-400 text-xs align-middle w-10">
                    #{index + 1}
                  </td>

                  {/* Resume filename */}
                  <td className="px-4 py-3.5 align-middle max-w-[200px]">
                    <div className="font-semibold text-ink-900 text-xs truncate">
                      {candidate.resume_filename}
                    </div>
                    <div className="text-ink-400 text-[10px] mt-0.5">
                      {candidate.word_count ? `${candidate.word_count} words` : ""}
                    </div>
                  </td>

                  {/* Applied for job */}
                  <td className="px-4 py-3.5 align-middle max-w-[180px]">
                    <div className="flex items-center gap-1.5">
                      <FiBriefcase size={11} className="text-ink-400 shrink-0" />
                      <span className="text-ink-700 text-xs font-medium truncate">
                        {candidate._jobTitle}
                      </span>
                    </div>
                    <div className="text-ink-400 text-[10px] mt-0.5 pl-4">
                      {candidate._jobCompany}
                    </div>
                  </td>

                  {/* Resume score */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center gap-1.5">
                      <div className="h-[5px] w-[48px] bg-ink-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ink-600 rounded-full"
                          style={{ width: `${candidate.resume_score || 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-ink-700">
                        {candidate.resume_score || 0}
                      </span>
                    </div>
                  </td>

                  {/* Job match score */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center gap-1.5">
                      <div className="h-[5px] w-[48px] bg-ink-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-600 rounded-full"
                          style={{ width: `${candidate.job_match_score || 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-brand-700">
                        {candidate.job_match_score || 0}%
                      </span>
                    </div>
                  </td>

                  {/* Domain */}
                  <td className="px-4 py-3.5 align-middle">
                    <span className="text-ink-500 text-xs">{candidate.domain || "—"}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 align-middle">
                    <StatusBadge status={candidate.status} />
                  </td>

                  {/* View button */}
                  <td className="px-4 py-3.5 align-middle">
                    <button
                      className="text-brand-600 text-xs font-semibold border border-brand-200 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(candidate);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="px-4 py-2.5 border-t border-ink-100 text-ink-400 text-[11px]">
            Showing {filtered.length} of {allCandidates.length} candidate{allCandidates.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <CandidateDetailPanel
          key={selected.candidate_id}
          candidate={selected}
          jobs={jobs}
          onClose={() => setSelected(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
