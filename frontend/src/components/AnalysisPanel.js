import React, { useMemo, useState } from "react";
import {
  FiCheck, FiX, FiChevronUp, FiChevronDown, FiArrowRight,
  FiUser, FiBook, FiBriefcase, FiTool, FiZap, FiAward, FiStar,
  FiAlertCircle, FiPackage,
} from "react-icons/fi";
import { Card } from "./ui";

const SECTION_ICONS = {
  summary: FiUser,
  education: FiBook,
  experience: FiBriefcase,
  projects: FiTool,
  skills: FiZap,
  certifications: FiAward,
  achievements: FiStar,
};

const SECTION_LIST = [
  { key: "summary", label: "Professional Summary" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills" },
  { key: "certifications", label: "Certifications" },
  { key: "achievements", label: "Achievements" },
];

const CATEGORY_COLORS = {
  technology:              { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  data_ai:                 { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  finance_banking:         { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  law_legal:               { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  healthcare_medical:      { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  pharma_biotech:          { bg: "#fefce8", color: "#854d0e", border: "#fef08a" },
  marketing:               { bg: "#fdf2f8", color: "#a21caf", border: "#f5d0fe" },
  sales_business_development: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  human_resources:         { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  education:               { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  design_creative:         { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  operations_supply_chain: { bg: "#f0f9ff", color: "#075985", border: "#bae6fd" },
  project_management_consulting: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  engineering:             { bg: "#fefce8", color: "#78350f", border: "#fde68a" },
  cybersecurity:           { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
};

const JOB_RANK_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Compute job-match score between a candidate's skills and a job's
 * required_skills list.  Returns 0–100.
 */
function computeJobMatch(skillsFound, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 0;
  const found = new Set((skillsFound || []).map((s) => s.toLowerCase()));
  const matched = requiredSkills.filter((s) => found.has(s.toLowerCase()));
  return Math.round((matched.length / requiredSkills.length) * 100);
}

/**
 * For a given job from /jobs/public, return { matched, missing } against
 * the candidate's detected skills.
 */
function jobSkillBreakdown(skillsFound, requiredSkills) {
  const found = new Set((skillsFound || []).map((s) => s.toLowerCase()));
  const matched = (requiredSkills || []).filter((s) => found.has(s.toLowerCase()));
  const missing = (requiredSkills || []).filter((s) => !found.has(s.toLowerCase()));
  return { matched, missing };
}

// ─── sub-components ──────────────────────────────────────────────────────────

function EmptyHint({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center text-ink-400">
        <Icon size={22} />
      </div>
      <p className="font-semibold text-sm text-ink-700">{title}</p>
      {sub && <p className="text-ink-400 text-xs max-w-[280px] leading-relaxed">{sub}</p>}
    </div>
  );
}

function SectionRow({ sectionKey, label, present, tips }) {
  const [open, setOpen] = useState(false);
  const Icon = SECTION_ICONS[sectionKey] || FiStar;
  return (
    <div className={["rounded-xl mb-2.5 overflow-hidden border", present ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"].join(" ")}>
      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer" onClick={() => setOpen(!open)}>
        <Icon size={18} className={present ? "text-green-600" : "text-orange-600"} />
        <span className="font-semibold text-sm text-ink-900 flex-1">{label}</span>
        <span className={["text-[0.82rem] font-semibold mr-2 inline-flex items-center gap-1", present ? "text-green-600" : "text-orange-600"].join(" ")}>
          {present ? <FiCheck /> : <FiX />} {present ? "Found" : "Missing"}
        </span>
        <span className="text-ink-400 text-xs inline-flex items-center gap-1">
          {open ? <FiChevronUp /> : <FiChevronDown />} Tips
        </span>
      </div>
      {open && (
        <div className="px-4 pb-3.5 pl-11 flex flex-col gap-1.5">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-2 items-start">
              <FiArrowRight className="text-brand-600 shrink-0 mt-0.5" size={13} />
              <p className="text-ink-600 text-[0.83rem] leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Card for a REAL job from the DB */
function RealJobMatchRow({ job, skillsFound, rank }) {
  const color = JOB_RANK_COLORS[rank % JOB_RANK_COLORS.length];
  const { matched, missing } = jobSkillBreakdown(skillsFound, job.required_skills);
  const pct = computeJobMatch(skillsFound, job.required_skills);

  return (
    <Card padding="none" rounded="2xl" className="px-5 py-[18px] mb-2.5">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {rank === 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-pill">Best Match</span>
          )}
          <span className="font-bold text-[0.92rem] text-ink-900">{job.title}</span>
        </div>
        <span className="font-display font-extrabold text-lg shrink-0 ml-4" style={{ color }}>{pct}%</span>
      </div>
      <div className="text-ink-400 text-[11px] mb-2.5">
        {job.company}{job.domain ? ` · ${job.domain}` : ""}{job.experience ? ` · ${job.experience}` : ""}
      </div>
      <div className="h-1.5 bg-ink-100 rounded-pill mb-2.5 overflow-hidden">
        <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: color, transition: "width 1s ease" }} />
      </div>
      {job.required_skills && job.required_skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {matched.map((s) => (
            <span key={s} className="px-2.5 py-0.5 bg-sky-50 text-sky-700 rounded-md text-xs font-medium border border-sky-200">{s}</span>
          ))}
          {missing.slice(0, 4).map((s) => (
            <span key={s} className="px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-md text-xs font-medium border border-rose-200">{s} missing</span>
          ))}
          {missing.length > 4 && (
            <span className="px-2.5 py-0.5 bg-ink-100 text-ink-400 rounded-md text-xs">+{missing.length - 4} more missing</span>
          )}
        </div>
      ) : (
        <p className="text-ink-400 text-xs">No required skills specified for this job.</p>
      )}
    </Card>
  );
}

/** Fallback card for AI-generated role matches (when no real jobs exist) */
function AIJobMatchRow({ role, data, rank }) {
  const color = JOB_RANK_COLORS[rank % JOB_RANK_COLORS.length];
  const pct = data.match;

  return (
    <Card padding="none" rounded="2xl" className="px-5 py-[18px] mb-2.5">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2.5">
          {rank === 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-pill">Best Match</span>
          )}
          <span className="font-bold text-[0.92rem] text-ink-900">{role}</span>
        </div>
        <span className="font-display font-extrabold text-lg" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-ink-100 rounded-pill mb-2.5 overflow-hidden">
        <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: color, transition: "width 1s ease" }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.matched_skills.map((s) => (
          <span key={s} className="px-2.5 py-0.5 bg-sky-50 text-sky-700 rounded-md text-xs font-medium border border-sky-200">{s}</span>
        ))}
        {data.missing_skills.slice(0, 3).map((s) => (
          <span key={s} className="px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-md text-xs font-medium border border-rose-200">{s} missing</span>
        ))}
      </div>
    </Card>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AnalysisPanel({ data, activeTab, publicJobs = [] }) {
  const skills_by_category  = data?.skills_by_category  || {};
  const missing_skills      = data?.missing_skills       || [];
  const sections            = data?.sections             || {};
  const section_tips        = data?.section_tips         || {};
  const achievements        = data?.achievements         || [];
  const repetitions         = data?.repetitions          || [];
  const suggestions         = data?.suggestions          || [];
  const job_matches         = data?.job_matches          || {};

  // Stable reference so useMemo dependency doesn't change every render
  const skills_found = useMemo(() => data?.skills_found || [], [data]);

  const sectionTitleCls = "font-bold text-[0.78rem] text-ink-400 tracking-[0.08em] uppercase mb-4";
  const catTitleCls     = "font-bold text-[0.78rem] text-ink-500 tracking-[0.06em] uppercase mb-2 mt-4";
  const tagCls          = "px-3 py-1 rounded-lg text-sm font-medium";

  /**
   * Sort real DB jobs by computed match score descending.
   * We limit to top 5 to keep the panel compact.
   */
  const rankedRealJobs = useMemo(() => {
    if (publicJobs.length === 0) return [];
    return [...publicJobs]
      .map((job) => ({ job, score: computeJobMatch(skills_found, job.required_skills) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [publicJobs, skills_found]);

  const hasRealJobs  = rankedRealJobs.length > 0;
  const hasAIJobs    = Object.keys(job_matches).length > 0;

  return (
    <Card padding="lg" shadow="raised" className="h-full min-h-[400px] overflow-y-auto fade-up-2">

      {/* ── SKILLS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "skills" && (
        <>
          <p className={sectionTitleCls}>Skills by Category ({skills_found.length} found)</p>
          {Object.entries(skills_by_category).length > 0 ? (
            Object.entries(skills_by_category).map(([cat, skills]) => {
              const theme = CATEGORY_COLORS[cat] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
              return (
                <div key={cat}>
                  <p className={catTitleCls}>{cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {skills.map((sk, i) => (
                      <span
                        key={sk}
                        className={[tagCls, "border fade-up"].join(" ")}
                        style={{ background: theme.bg, color: theme.color, borderColor: theme.border, animationDelay: `${i * 0.04}s` }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyHint
              icon={FiZap}
              title="No skills detected"
              sub="Make sure your resume has a Skills section listing your technical and professional competencies."
            />
          )}

          {missing_skills.length > 0 && (
            <>
              <p className={[catTitleCls, "text-rose-700"].join(" ")}>High-Demand Skills Missing</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {missing_skills.map((sk) => (
                  <span key={sk} className={[tagCls, "bg-rose-50 text-rose-700 border border-rose-200"].join(" ")}>{sk}</span>
                ))}
              </div>
            </>
          )}

          {achievements.length > 0 && (
            <>
              <p className={[catTitleCls, "text-green-700"].join(" ")}>Quantified Achievements Detected</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {achievements.map((a, i) => (
                  <span key={i} className={[tagCls, "bg-green-50 text-green-700 border border-green-200"].join(" ")}>{a}</span>
                ))}
              </div>
            </>
          )}

          {repetitions.length > 0 && (
            <>
              <p className={[catTitleCls, "text-yellow-800"].join(" ")}>Overused Words</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {repetitions.map((r) => (
                  <span key={r} className={[tagCls, "bg-yellow-50 text-yellow-800 border border-yellow-200"].join(" ")}>{r}</span>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── SECTIONS TAB ────────────────────────────────────────────────────── */}
      {activeTab === "sections" && (
        <>
          <p className={sectionTitleCls}>Resume Sections · Click a section to see tips</p>
          {SECTION_LIST.map(({ key, label }) => (
            <SectionRow
              key={key} sectionKey={key} label={label}
              present={!!sections[key]}
              tips={section_tips[key]?.tips || ["Keep this section concise and relevant.", "Use bullet points for readability."]}
            />
          ))}
        </>
      )}

      {/* ── JOB MATCH TAB ───────────────────────────────────────────────────── */}
      {activeTab === "jobs" && (
        <>
          {hasRealJobs ? (
            <>
              <p className={sectionTitleCls}>
                Matching Against {rankedRealJobs.length} Active Job{rankedRealJobs.length !== 1 ? "s" : ""} · Ranked by Fit
              </p>
              {rankedRealJobs.map(({ job }, i) => (
                <RealJobMatchRow
                  key={job.job_id}
                  job={job}
                  skillsFound={skills_found}
                  rank={i}
                />
              ))}
            </>
          ) : hasAIJobs ? (
            <>
              {/* Fallback: show AI generic matches with a notice */}
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                <FiAlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-amber-800 text-xs leading-relaxed">
                  No active job postings found in the system yet. Showing generic AI role matches based on your skills. Ask a recruiter to post jobs so you can see real matches.
                </p>
              </div>
              <p className={sectionTitleCls}>Top AI Role Matches Based on Your Skills</p>
              {Object.entries(job_matches).map(([role, matchData], i) => (
                <AIJobMatchRow key={role} role={role} data={matchData} rank={i} />
              ))}
            </>
          ) : (
            <EmptyHint
              icon={FiPackage}
              title="No job matches yet"
              sub="Add more skills to your resume to see which roles you match best."
            />
          )}
        </>
      )}

      {/* ── SUGGESTIONS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "suggestions" && (
        <>
          <p className={sectionTitleCls}>{suggestions.length} Improvement Suggestion{suggestions.length !== 1 ? "s" : ""}</p>
          {suggestions.length === 0 ? (
            <EmptyHint
              icon={FiStar}
              title="No suggestions — great resume!"
              sub="Your resume covers all the key areas well. Keep tailoring it for each role."
            />
          ) : (
            suggestions.map((sug, i) => (
              <div key={i} className="bg-ink-50 border border-ink-200 rounded-xl px-[18px] py-4 mb-2.5 flex gap-3.5 items-start">
                <span className="font-display font-bold text-base text-brand-600 shrink-0 w-6">{i + 1}</span>
                <p className="text-ink-700 text-[0.88rem] leading-relaxed m-0">{sug}</p>
              </div>
            ))
          )}
        </>
      )}

    </Card>
  );
}
