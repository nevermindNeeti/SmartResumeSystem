import React from "react";
import StatusBadge from "./StatusBadge";

export default function CandidateTable({
  candidates,
  onSelectCandidate,
}) {
  return (
    <div className="rd-table-container">
      <table className="rd-table">

        <thead>
          <tr>
            <th>Rank</th>
            <th>Candidate</th>
            <th>Resume Score</th>
            <th>Job Match</th>
            <th>Matched Skills</th>
            <th>Missing Skills</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {candidates.map((candidate, index) => (
            <tr
              key={candidate.candidate_id}
              onClick={() =>
                onSelectCandidate(candidate)
              }
              className="rd-table-row"
            >

              <td>
                #{index + 1}
              </td>

              <td className="rd-candidate-cell">
                {candidate.resume_filename}
              </td>

              <td>
                <div className="rd-score-bar-wrap">
                  <div
                    className="rd-score-bar"
                    style={{
                      width: `${candidate.resume_score || 0}%`,
                    }}
                  />

                  <span>
                    {candidate.resume_score || 0}
                  </span>
                </div>
              </td>

              <td>
                <div className="rd-score-bar-wrap">
                  <div
                    className="rd-score-bar rd-score-bar-match"
                    style={{
                      width: `${candidate.job_match_score || 0}%`,
                    }}
                  />

                  <span>
                    {candidate.job_match_score || 0}%
                  </span>
                </div>
              </td>

              <td className="rd-skills-cell">
                {(candidate.matched_job_skills || [])
                  .slice(0, 3)
                  .join(", ") || "—"}
              </td>

              <td className="rd-skills-cell">
                {(candidate.missing_job_skills || [])
                  .slice(0, 3)
                  .join(", ") || "—"}
              </td>

              <td>
                <StatusBadge
                  status={candidate.status}
                />
              </td>

              <td>
                <button
                  className="rd-btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCandidate(candidate);
                  }}
                >
                  View
                </button>
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}