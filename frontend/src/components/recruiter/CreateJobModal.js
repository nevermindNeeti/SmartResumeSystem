import React, { useState } from "react";
import { FiX, FiPlus } from "react-icons/fi";
import { recruiterApi } from "../../services/RecruiterApi";
import { Button, Input, Card } from "../ui";

const DOMAINS = [
  "Technology", "Data & AI", "Finance & Banking", "Law & Legal",
  "Healthcare & Medical", "Pharma & Biotech", "Marketing",
  "Sales & Business Development", "Human Resources", "Education",
  "Design & Creative", "Operations & Supply Chain",
  "Project Management & Consulting", "Engineering",
  "Architecture & Construction", "Science & Research",
  "Media & Communications", "Hospitality & Tourism", "Real Estate",
  "Government & Public Sector", "Customer Service",
  "Environment & Agriculture", "Cybersecurity",
];

const EXPERIENCE_OPTIONS = [
  "0-1 years", "1-2 years", "2-4 years", "4-6 years",
  "6-10 years", "10+ years",
];

const FIELD_ERRORS = {
  title: "Job title is required.",
  company: "Company name is required.",
  description: "Job description is required (minimum 20 characters).",
};

function validate(fields) {
  const errors = {};
  if (!fields.title.trim()) errors.title = FIELD_ERRORS.title;
  if (!fields.company.trim()) errors.company = FIELD_ERRORS.company;
  if (!fields.description.trim() || fields.description.trim().length < 20)
    errors.description = FIELD_ERRORS.description;
  return errors;
}

export default function CreateJobModal({ onClose, onCreated }) {
  const [fields, setFields] = useState({
    title: "",
    company: "",
    description: "",
    experience: "",
    domain: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key, value) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (!s) return;
    if (skills.includes(s)) { setSkillInput(""); return; }
    setSkills((prev) => [...prev, s]);
    setSkillInput("");
  };

  const removeSkill = (s) =>
    setSkills((prev) => prev.filter((x) => x !== s));

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await recruiterApi.createJob({
        title: fields.title.trim(),
        company: fields.company.trim(),
        description: fields.description.trim(),
        required_skills: skills,
        experience: fields.experience,
        domain: fields.domain,
      });
      onCreated(result);
    } catch (err) {
      setSubmitError(err.message || "Failed to create job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-ink-900/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        padding="none"
        rounded="2xl"
        shadow="raised"
        className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-ink-100">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900 m-0">
              Create Job Posting
            </h2>
            <p className="text-ink-400 text-xs mt-0.5">
              Fill in the details below to post a new role.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md border border-ink-200 bg-white flex items-center justify-center text-ink-400 hover:text-ink-700 hover:border-ink-300 transition-colors cursor-pointer"
          >
            <FiX size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-5">

          {/* Title */}
          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
              Job Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Software Engineer"
              value={fields.title}
              onChange={(e) => set("title", e.target.value)}
              size="lg"
            />
            {errors.title && (
              <p className="text-red-500 text-[11px] mt-1">{errors.title}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
              Company <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Acme Corp"
              value={fields.company}
              onChange={(e) => set("company", e.target.value)}
              size="lg"
            />
            {errors.company && (
              <p className="text-red-500 text-[11px] mt-1">{errors.company}</p>
            )}
          </div>

          {/* Domain + Experience (row) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
                Domain
              </label>
              <select
                value={fields.domain}
                onChange={(e) => set("domain", e.target.value)}
                className="w-full h-[46px] px-3.5 bg-white border border-ink-200 rounded-lg text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
              >
                <option value="">Select domain</option>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
                Experience
              </label>
              <select
                value={fields.experience}
                onChange={(e) => set("experience", e.target.value)}
                className="w-full h-[46px] px-3.5 bg-white border border-ink-200 rounded-lg text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
              >
                <option value="">Select range</option>
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe the role, responsibilities, and requirements..."
              value={fields.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-ink-200 rounded-lg text-sm text-ink-800 placeholder:text-ink-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors resize-none font-body"
            />
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <p className="text-red-500 text-[11px]">{errors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-ink-300 text-[11px]">
                {fields.description.trim().length} chars
              </span>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">
              Required Skills
              <span className="text-ink-400 font-normal ml-1">(press Enter or , to add)</span>
            </label>

            <div className="flex gap-2">
              <Input
                placeholder="e.g. python, react, sql"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                size="lg"
              />
              <button
                type="button"
                onClick={addSkill}
                className="h-[46px] px-3.5 bg-ink-100 hover:bg-ink-200 border border-ink-200 rounded-lg text-ink-600 transition-colors cursor-pointer shrink-0"
              >
                <FiPlus size={16} />
              </button>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-md text-xs font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="text-brand-400 hover:text-brand-700 cursor-pointer border-0 bg-transparent p-0 leading-none"
                    >
                      <FiX size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[13px]">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-ink-100 mt-1">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Job"}
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
}
