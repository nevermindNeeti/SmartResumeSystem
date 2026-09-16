import React from "react";
import { FiArrowRight } from "react-icons/fi";
import { Card, Badge } from "./ui";

function AnimatedBar({ label, score, max, color, delay = 0 }) {
  const pct = Math.round((score / max) * 100);

  return (
    <div className="mb-3.5">
      <div className="flex justify-between mb-1.5">
        <span className="text-[0.82rem] font-medium text-ink-600">{label}</span>
        <span className="text-[0.82rem] font-bold text-ink-900">
          {score}
          <span className="text-ink-400 font-normal">/{max}</span>
        </span>
      </div>

      <div className="h-2 bg-ink-100 rounded-pill overflow-hidden">
        <div
          className="h-full rounded-pill"
          style={{ background: color, width: `${pct}%`, transition: `width 1s ${delay}s ease` }}
        />
      </div>
    </div>
  );
}

const GRADES = [
  { min: 85, grade: "A", label: "Excellent", color: "#16a34a", bg: "#dcfce7", ring: "#22c55e" },
  { min: 70, grade: "B", label: "Good", color: "#2563eb", bg: "#dbeafe", ring: "#3b82f6" },
  { min: 55, grade: "C", label: "Average", color: "#d97706", bg: "#fef3c7", ring: "#f59e0b" },
  { min: 40, grade: "D", label: "Needs Work", color: "#ea580c", bg: "#ffedd5", ring: "#f97316" },
  { min: 0, grade: "F", label: "Poor", color: "#dc2626", bg: "#fee2e2", ring: "#ef4444" },
];

const getGrade = (score) => GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1];

// The backend's suggestion sentences are a small, fixed set of templates (see
// generate_suggestions() in app.py) — some with a comma-separated list spliced
// in. A blind word-count cutoff chops those mid-list ("...time saved or…").
// Matching on the fixed prefix and using a hand-written short form keeps each
// Quick Win a complete sentence of 8-12 words instead of a dangling fragment.
// The two dynamic ones splice in `domain` (1-4 words in DOMAIN_PRIORITY_SKILLS,
// e.g. "Technology" vs "Sales & Business Development") — the fixed wording
// around it is sized so the total always lands in the 8-12 range either way.
const SHORT_TIPS = [
  { prefix: "Add a Professional Summary", short: "Add a Professional Summary that's tailored to your target role." },
  { prefix: "Add a Work Experience section", short: "Add a Work Experience section with clear, measurable results." },
  { prefix: "Add relevant projects", short: "Add relevant projects, case studies or work samples where possible." },
  { prefix: "Add more quantified achievements", short: "Add more quantified, measurable achievements using numbers or percentages." },
  {
    prefix: "Consider adding relevant",
    short: (s) => {
      const m = s.match(/^Consider adding relevant (.+?) skills/);
      return m ? `Add a few relevant ${m[1]} skills to your resume.` : "Add a few more relevant skills to your resume.";
    },
  },
  { prefix: "Add relevant certifications", short: "Add relevant certifications, licenses or professional training where applicable." },
  { prefix: "Vary your language", short: "Vary your language to avoid frequently repeated words and phrases." },
  {
    prefix: "Expand the skills section",
    short: (s) => {
      const m = s.match(/relevant (.+?) competencies/);
      return m ? `Expand your skills section with more relevant ${m[1]} competencies.` : "Expand your skills section with more relevant competencies.";
    },
  },
  { prefix: "Strong resume", short: "Tailor your resume's content and keywords to each target job." },
];

const TRAILING_STOPWORDS = new Set(["or", "and", "the", "a", "an", "of", "to", "in", "on", "for", "with", "using"]);

function truncateWords(text, maxWords = 12) {
  let words = text.trim().replace(/[.,;:]+$/, "").split(/\s+/);
  if (words.length <= maxWords) return text;
  words = words.slice(0, maxWords);
  while (words.length > 1 && TRAILING_STOPWORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }
  return words.join(" ") + "…";
}

function shortenSuggestion(text) {
  const rule = SHORT_TIPS.find((r) => text.startsWith(r.prefix));
  if (rule) return typeof rule.short === "function" ? rule.short(text) : rule.short;
  return truncateWords(text);
}

export default function ScoreCard({ data }) {
  const {
    score,
    breakdown = {},
    word_count,
    skills_found = [],
    sections = {},
    domain,
    suggestions = [],
  } = data;

  const { grade, label, color, bg, ring } = getGrade(score);

  const circumference = 2 * Math.PI * 52;
  const dash = (score / 100) * circumference;

  const sectionsFound = Object.values(sections).filter(Boolean).length;

  const barData = [
    { label: "Sections", score: breakdown.sections?.score || 0, max: 35, color: "#3b82f6", delay: 0.1 },
    { label: "Skills", score: breakdown.skills?.score || 0, max: 30, color: "#8b5cf6", delay: 0.2 },
    { label: "Achievements", score: breakdown.achievements?.score || 0, max: 25, color: "#f59e0b", delay: 0.3 },
    { label: "Writing Quality", score: breakdown.writing?.score || 0, max: 10, color: "#10b981", delay: 0.4 },
  ];

  return (
    <Card padding="lg" shadow="raised" className="fade-up-1">
      <div className="flex items-center gap-5 mb-7 pb-6 border-b border-ink-100">
        <div className="relative w-[120px] h-[120px] shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={ring} strokeWidth="10"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray 1.2s ease" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[2rem] font-bold text-ink-900 leading-none">{score}</span>
            <span className="text-ink-400 text-xs mt-0.5">out of 100</span>
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill mb-1.5" style={{ background: bg }}>
            <span className="font-bold text-sm" style={{ color }}>Grade {grade}</span>
          </div>

          <p className="font-display text-[1.1rem] font-bold text-ink-900 mb-1">{label}</p>
          <p className="text-ink-500 text-sm mb-2">Resume Score</p>

          {domain && <Badge variant="neutral">{domain}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {[
          { val: skills_found.length, key: "Skills" },
          { val: `${sectionsFound}/7`, key: "Sections" },
          { val: word_count, key: "Words" },
        ].map(({ val, key }) => (
          <div key={key} className="bg-ink-50 rounded-lg p-3 text-center">
            <span className="font-display text-2xl font-bold text-ink-900 block">{val}</span>
            <span className="text-ink-400 text-xs font-medium mt-0.5 block">{key}</span>
          </div>
        ))}
      </div>

      <p className="font-bold text-xs text-ink-400 tracking-[0.08em] uppercase mb-4">Score Breakdown</p>

      {barData.map((b) => (
        <AnimatedBar key={b.label} {...b} />
      ))}

      {suggestions.length > 0 && (
        <div className="mt-6 pt-5 border-t border-ink-100">
          <p className="font-bold text-xs text-ink-400 tracking-[0.08em] uppercase mb-3">Quick Wins</p>

          <div className="flex flex-col gap-2.5">
            {suggestions.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <FiArrowRight className="text-brand-600 shrink-0 mt-0.5" size={13} />
                <p className="text-ink-600 text-[0.82rem] leading-relaxed">{shortenSuggestion(s)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
