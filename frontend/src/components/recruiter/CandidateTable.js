import React from "react";
import StatusBadge from "./StatusBadge";
import { Button } from "../ui";

export default function CandidateTable({
  candidates,
  onSelectCandidate,
}) {
  return (
    <div className="w-full overflow-x-auto bg-white border border-ink-200 rounded-lg">
      <table className="w-full border-collapse min-w-[950px]">

        <thead>
          <tr>
            {["Rank", "Candidate", "Resume Score", "Job Match", "Matched Skills", "Missing Skills", "Status", ""].map((h) => (
              <th key={h} className="bg-ink-50 text-ink-500 text-left px-3.5 py-3 text-[10px] uppercase tracking-wide font-bold border-b border-ink-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {candidates.map((candidate, index) => (
            <tr
              key={candidate.candidate_id}
              onClick={() =>
                onSelectCandidate(candidate)
              }
              className="cursor-pointer transition-colors duration-150 hover:bg-ink-50 [&>td]:border-b [&>td]:border-ink-100 last:[&>td]:border-b-0"
            >

              <td className="px-3.5 py-3.5 text-ink-600 text-xs align-middle">
                #{index + 1}
              </td>

              <td className="px-3.5 py-3.5 max-w-[190px] text-ink-900 font-semibold overflow-hidden text-ellipsis whitespace-nowrap text-xs align-middle">
                {candidate.resume_filename}
              </td>

              <td className="px-3.5 py-3.5 align-middle">
                <div className="w-[105px] h-[25px] flex items-center gap-1.5">
                  <div className="h-[5px] w-[55px] bg-ink-200 rounded-pill overflow-hidden">
                    <div
                      className="h-full bg-ink-600 rounded-pill"
                      style={{ width: `${candidate.resume_score || 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-ink-600 whitespace-nowrap">
                    {candidate.resume_score || 0}
                  </span>
                </div>
              </td>

              <td className="px-3.5 py-3.5 align-middle">
                <div className="w-[105px] h-[25px] flex items-center gap-1.5">
                  <div className="h-[5px] w-[55px] bg-ink-200 rounded-pill overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-pill"
                      style={{ width: `${candidate.job_match_score || 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-ink-600 whitespace-nowrap">
                    {candidate.job_match_score || 0}%
                  </span>
                </div>
              </td>

              <td className="px-3.5 py-3.5 max-w-[170px] leading-relaxed text-ink-500 text-xs align-middle">
                {(candidate.matched_job_skills || [])
                  .slice(0, 3)
                  .join(", ") || "—"}
              </td>

              <td className="px-3.5 py-3.5 max-w-[170px] leading-relaxed text-ink-500 text-xs align-middle">
                {(candidate.missing_job_skills || [])
                  .slice(0, 3)
                  .join(", ") || "—"}
              </td>

              <td className="px-3.5 py-3.5 align-middle">
                <StatusBadge
                  status={candidate.status}
                />
              </td>

              <td className="px-3.5 py-3.5 align-middle">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCandidate(candidate);
                  }}
                >
                  View
                </Button>
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
