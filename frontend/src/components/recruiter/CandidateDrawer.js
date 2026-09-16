import React, { useState } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import StatusBadge from "./StatusBadge";
import { recruiterApi } from "../../services/RecruiterApi";

const STATUS_FLOW = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview",
  "Selected",
];

const selectCls = "w-full h-[38px] border border-ink-300 rounded-md bg-white text-ink-700 px-2.5 text-xs outline-none focus:border-brand-500";

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
      className="fixed inset-0 z-[1000] bg-ink-900/40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[500px] h-full overflow-y-auto bg-white shadow-[-10px_0_35px_rgba(0,0,0,0.12)] p-6"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-ink-900 text-[17px] font-bold break-words mb-2">
              {candidate.resume_filename}
            </div>

            <StatusBadge status={status} />
          </div>

          <button
            className="w-8 h-8 border border-ink-200 bg-white rounded-md cursor-pointer text-ink-500 hover:bg-ink-50 hover:text-ink-900 shrink-0"
            onClick={onClose}
          >
            <FiX className="mx-auto" />
          </button>
        </div>

        {/* SCORES */}
        <div className="grid grid-cols-2 gap-2.5 my-6">

          <div className="bg-ink-50 border border-ink-200 rounded-lg p-4">
            <div className="text-ink-500 text-[10px] uppercase tracking-wide">
              Resume Quality
            </div>

            <div className="text-ink-900 text-xl font-bold mt-1">
              {candidate.resume_score || 0}/100
            </div>
          </div>

          <div className="bg-ink-50 border border-ink-200 rounded-lg p-4">
            <div className="text-ink-500 text-[10px] uppercase tracking-wide">
              Job Match
            </div>

            <div className="text-ink-900 text-xl font-bold mt-1">
              {candidate.job_match_score || 0}%
            </div>
          </div>

        </div>

        {/* STATUS */}
        <div className="mb-6">
          <label className="block text-ink-700 text-xs font-bold mb-1.5">Status</label>

          <select
            className={selectCls}
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
            <div className="text-ink-400 text-[11px] mt-1.5">
              Updating status...
            </div>
          )}

          {error && (
            <div className="text-red-700 text-[11px] mt-1.5">
              {error}
            </div>
          )}
        </div>

        {/* SKILLS */}
        <div className="border-t border-ink-200 pt-5 mt-5">
          <h4 className="m-0 mb-2.5 text-[13px] text-ink-700">Skills</h4>

          <div className="mb-3.5">
            <span className="block text-[10px] font-bold mb-1 text-green-700">
              Matched
            </span>

            <div className="text-ink-500 text-xs leading-relaxed">
              {(candidate.matched_job_skills || [])
                .join(", ") || "None"}
            </div>
          </div>

          <div className="mb-3.5">
            <span className="block text-[10px] font-bold mb-1 text-red-700">
              Missing
            </span>

            <div className="text-ink-500 text-xs leading-relaxed">
              {(candidate.missing_job_skills || [])
                .join(", ") || "None"}
            </div>
          </div>
        </div>

        {/* RESUME SECTIONS */}
        <div className="border-t border-ink-200 pt-5 mt-5">
          <h4 className="m-0 mb-2.5 text-[13px] text-ink-700">Resume Sections</h4>

          <div>
            {Object.keys(sections).length > 0 ? (
              Object.entries(sections).map(
                ([name, present]) => (
                  <div
                    key={name}
                    className={[
                      "py-1.5 text-xs flex items-center gap-1.5",
                      present ? "text-green-700" : "text-red-700",
                    ].join(" ")}
                  >
                    {present ? <FiCheck size={13} /> : <FiX size={13} />} {name}
                  </div>
                )
              )
            ) : (
              <div className="text-ink-400 text-[11px]">
                No section data available.
              </div>
            )}
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        {candidate.achievements &&
          candidate.achievements.length > 0 && (
            <div className="border-t border-ink-200 pt-5 mt-5">
              <h4 className="m-0 mb-2.5 text-[13px] text-ink-700">Achievements</h4>

              <ul className="m-0 pl-[18px]">
                {candidate.achievements.map(
                  (achievement, index) => (
                    <li key={index} className="text-ink-500 text-xs leading-relaxed mb-1">
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
