import React from "react";

function ScoreCard({ score, wordCount, sectionsFound, skillsCount }) {
  const getGrade = (s) => {
    if (s >= 85) return { grade: "A", label: "Excellent", color: "#22c55e" };
    if (s >= 70) return { grade: "B", label: "Good", color: "#84cc16" };
    if (s >= 55) return { grade: "C", label: "Average", color: "#f59e0b" };
    if (s >= 40) return { grade: "D", label: "Needs Work", color: "#f97316" };
    return { grade: "F", label: "Poor", color: "#ef4444" };
  };

  const { grade, label, color } = getGrade(score);
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (score / 100) * circumference;

  const s = {
    card: { background: "#0f1623", border: "1px solid #1e2d45", borderRadius: "16px", padding: "32px", display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" },
    circleWrap: { position: "relative", width: "140px", height: "140px", flexShrink: 0 },
    svg: { width: "100%", height: "100%" },
    inner: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
    number: { fontFamily: "'Syne', sans-serif", fontSize: "2.2rem", fontWeight: 800, lineHeight: 1, color },
    subLabel: { color: "#64748b", fontSize: "0.75rem" },
    info: { display: "flex", flexDirection: "column", gap: "16px", flex: 1 },
    badge: { display: "inline-block", padding: "6px 16px", borderRadius: "100px", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#080c14", background: color, width: "fit-content" },
    stats: { display: "flex", gap: "32px", flexWrap: "wrap" },
    statVal: { fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#e2e8f0", display: "block" },
    statKey: { color: "#64748b", fontSize: "0.8rem" },
  };

  return (
    <div style={s.card}>
      <div style={s.circleWrap}>
        <svg style={s.svg} viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div style={s.inner}>
          <span style={s.number}>{score}</span>
          <span style={s.subLabel}>/ 100</span>
        </div>
      </div>

      <div style={s.info}>
        <div style={s.badge}>Grade {grade} — {label}</div>
        <div style={s.stats}>
          {[
            ["Skills Found", skillsCount],
            ["Sections", `${sectionsFound}/4`],
            ["Words", wordCount],
          ].map(([key, val]) => (
            <div key={key}>
              <span style={s.statVal}>{val}</span>
              <span style={s.statKey}>{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScoreCard;