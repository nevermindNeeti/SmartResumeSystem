import React from "react";

function AnimatedBar({ label, score, max, color, delay = 0 }) {
  const pct = Math.round((score / max) * 100);

  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 500,
            color: "#475569",
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {score}
          <span style={{ color: "#94a3b8", fontWeight: 400 }}>
            /{max}
          </span>
        </span>
      </div>

      <div
        style={{
          height: "8px",
          background: "#f1f5f9",
          borderRadius: "100px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "100px",
            background: color,
            width: `${pct}%`,
            transition: `width 1s ${delay}s ease`,
          }}
        />
      </div>
    </div>
  );
}

export default function ScoreCard({ data }) {
  const {
    score,
    breakdown = {},
    word_count,
    skills_found = [],
    sections = {},
  } = data;

  const getGrade = (s) => {
    if (s >= 85)
      return {
        grade: "A",
        label: "Excellent",
        color: "#16a34a",
        bg: "#dcfce7",
        ring: "#22c55e",
      };

    if (s >= 70)
      return {
        grade: "B",
        label: "Good",
        color: "#2563eb",
        bg: "#dbeafe",
        ring: "#3b82f6",
      };

    if (s >= 55)
      return {
        grade: "C",
        label: "Average",
        color: "#d97706",
        bg: "#fef3c7",
        ring: "#f59e0b",
      };

    if (s >= 40)
      return {
        grade: "D",
        label: "Needs Work",
        color: "#ea580c",
        bg: "#ffedd5",
        ring: "#f97316",
      };

    return {
      grade: "F",
      label: "Poor",
      color: "#dc2626",
      bg: "#fee2e2",
      ring: "#ef4444",
    };
  };

  const { grade, label, color, bg, ring } = getGrade(score);

  const circumference = 2 * Math.PI * 52;
  const dash = (score / 100) * circumference;

  const sectionsFound = Object.values(sections).filter(Boolean).length;

  const barData = [
    {
      label: "Sections",
      score: breakdown.sections?.score || 0,
      max: 35,
      color: "#3b82f6",
      delay: 0.1,
    },
    {
      label: "Skills",
      score: breakdown.skills?.score || 0,
      max: 30,
      color: "#8b5cf6",
      delay: 0.2,
    },
    {
      label: "Achievements",
      score: breakdown.achievements?.score || 0,
      max: 25,
      color: "#f59e0b",
      delay: 0.3,
    },
    {
      label: "Writing Quality",
      score: breakdown.writing?.score || 0,
      max: 10,
      color: "#10b981",
      delay: 0.4,
    },
  ];

  const s = {
    card: {
      background: "white",
      borderRadius: "20px",
      padding: "28px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      border: "1px solid #f1f5f9",
    },

    scoreTop: {
      display: "flex",
      alignItems: "center",
      gap: "20px",
      marginBottom: "28px",
      paddingBottom: "24px",
      borderBottom: "1px solid #f1f5f9",
    },

    circleWrap: {
      position: "relative",
      width: "120px",
      height: "120px",
      flexShrink: 0,
    },

    inner: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },

    scoreNum: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "2rem",
      fontWeight: 700,
      color: "#0f172a",
      lineHeight: 1,
    },

    scoreOf: {
      color: "#94a3b8",
      fontSize: "0.72rem",
      marginTop: "2px",
    },

    gradeBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 12px",
      borderRadius: "100px",
      background: bg,
      marginBottom: "6px",
    },

    gradeText: {
      fontWeight: 700,
      fontSize: "0.85rem",
      color,
    },

    gradeLabel: {
      color: "#64748b",
      fontSize: "0.8rem",
    },

    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "10px",
      marginBottom: "24px",
    },

    statBox: {
      background: "#f8fafc",
      borderRadius: "12px",
      padding: "12px",
      textAlign: "center",
    },

    statVal: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "1.4rem",
      fontWeight: 700,
      color: "#0f172a",
      display: "block",
    },

    statKey: {
      color: "#94a3b8",
      fontSize: "0.72rem",
      fontWeight: 500,
      marginTop: "2px",
    },

    breakdownTitle: {
      fontWeight: 700,
      fontSize: "0.8rem",
      color: "#94a3b8",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "16px",
    },
  };

  return (
    <div style={s.card} className="fade-up-1">
      <div style={s.scoreTop}>
        <div style={s.circleWrap}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="10"
            />

            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={ring}
              strokeWidth="10"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{
                transition: "stroke-dasharray 1.2s ease",
              }}
            />
          </svg>

          <div style={s.inner}>
            <span style={s.scoreNum}>{score}</span>
            <span style={s.scoreOf}>out of 100</span>
          </div>
        </div>

        <div>
          <div style={s.gradeBadge}>
            <span style={s.gradeText}>Grade {grade}</span>
          </div>

          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "4px",
            }}
          >
            {label}
          </p>

          <p style={s.gradeLabel}>Resume Score</p>
        </div>
      </div>

      <div style={s.statsRow}>
        {[
          { val: skills_found.length, key: "Skills" },
          { val: `${sectionsFound}/7`, key: "Sections" },
          { val: word_count, key: "Words" },
        ].map(({ val, key }) => (
          <div key={key} style={s.statBox}>
            <span style={s.statVal}>{val}</span>
            <span style={s.statKey}>{key}</span>
          </div>
        ))}
      </div>

      <p style={s.breakdownTitle}>Score Breakdown</p>

      {barData.map((b) => (
        <AnimatedBar key={b.label} {...b} />
      ))}
    </div>
  );
}