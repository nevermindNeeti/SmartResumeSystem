import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import { recruiterApi } from "../../services/RecruiterApi";

const STATUS_FLOW = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview",
  "Selected",
];

export default function CandidateDrawer({
  candidate,
  onClose,
  onStatusUpdated,
}) {
  const [status, setStatus] = useState(candidate?.status || "Applied");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!candidate) return null;

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    setStatus(newStatus);
    setSaving(true);
    setError(null);

    try {
      await recruiterApi.updateCandidateStatus(
        candidate.candidate_id,
        newStatus
      );

      onStatusUpdated(
        candidate.candidate_id,
        newStatus
      );
    } catch (err) {
      setError("Failed to update status.");
      setStatus(candidate.status);
    } finally {
      setSaving(false);
    }
  };

  const sections = candidate.sections || {};

  return (
    <div
      className="rd-drawer-overlay"
      onClick={onClose}
    >
      <div
        className="rd-drawer"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="rd-drawer-header">
          <div>
            <div className="rd-drawer-title">
              {candidate.resume_filename}
            </div>

            <StatusBadge status={status} />
          </div>

          <button
            className="rd-icon-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* SCORES */}
        <div className="rd-drawer-scores">

          <div className="rd-drawer-score-block">
            <div className="rd-drawer-score-label">
              Resume Quality
            </div>

            <div className="rd-drawer-score-value">
              {candidate.resume_score || 0}/100
            </div>
          </div>

          <div className="rd-drawer-score-block">
            <div className="rd-drawer-score-label">
              Job Match
            </div>

            <div className="rd-drawer-score-value">
              {candidate.job_match_score || 0}%
            </div>
          </div>

        </div>

        {/* STATUS */}
        <div className="rd-drawer-field">
          <label>Status</label>

          <select
            value={status}
            onChange={handleStatusChange}
            disabled={saving}
          >
            {[
              ...STATUS_FLOW,
              "Rejected",
            ].map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          {saving && (
            <div className="rd-text-muted">
              Updating status...
            </div>
          )}

          {error && (
            <div className="rd-inline-error">
              {error}
            </div>
          )}
        </div>

        {/* SKILLS */}
        <div className="rd-drawer-section">
          <h4>Skills</h4>

          <div className="rd-drawer-skill-row">
            <span className="rd-label-good">
              Matched
            </span>

            <div className="rd-skills-cell">
              {(candidate.matched_job_skills || [])
                .join(", ") || "None"}
            </div>
          </div>

          <div className="rd-drawer-skill-row">
            <span className="rd-label-bad">
              Missing
            </span>

            <div className="rd-skills-cell">
              {(candidate.missing_job_skills || [])
                .join(", ") || "None"}
            </div>
          </div>
        </div>

        {/* RESUME SECTIONS */}
        <div className="rd-drawer-section">
          <h4>Resume Sections</h4>

          <div className="rd-section-checklist">
            {Object.keys(sections).length > 0 ? (
              Object.entries(sections).map(
                ([name, present]) => (
                  <div
                    key={name}
                    className={
                      present
                        ? "rd-check-yes"
                        : "rd-check-no"
                    }
                  >
                    {present ? "✓" : "✕"} {name}
                  </div>
                )
              )
            ) : (
              <div className="rd-text-muted">
                No section data available.
              </div>
            )}
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        {candidate.achievements &&
          candidate.achievements.length > 0 && (
            <div className="rd-drawer-section">
              <h4>Achievements</h4>

              <ul>
                {candidate.achievements.map(
                  (achievement, index) => (
                    <li key={index}>
                      {achievement}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

      </div>
    </div>
  );
}
