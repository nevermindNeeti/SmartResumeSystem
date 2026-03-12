import React, { useState } from "react";

function AnalysisPanel({ data }) {
  const [tab, setTab] = useState("skills");

  const skills_found = data?.skills_found || [];
  const missing_skills = data?.missing_skills || [];
  const sections = data?.sections || {};
  const achievements = data?.achievements || [];
  const repetitions = data?.repetitions || [];
  const suggestions = data?.suggestions || [];

  const s = {
    panel: { background: "#0f1623", border: "1px solid #1e2d45", borderRadius: "16px", overflow: "hidden" },
    tabs: { display: "flex", borderBottom: "1px solid #1e2d45", padding: "0 24px" },
    tabBtn: (active) => ({ padding: "16px 20px", background: "none", border: "none", borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent", color: active ? "#3b82f6" : "#64748b", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", marginBottom: "-1px" }),
    content: { padding: "24px" },
    groupTitle: (type) => ({ fontFamily: "'Syne', sans-serif", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px", color: type === "found" ? "#22c55e" : "#f97316" }),
    tags: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" },
    tag: (type) => ({ padding: "4px 12px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 500, background: type === "found" ? "rgba(34,197,94,0.1)" : type === "missing" ? "rgba(249,115,22,0.1)" : "rgba(245,158,11,0.1)", color: type === "found" ? "#22c55e" : type === "missing" ? "#f97316" : "#f59e0b", border: `1px solid ${type === "found" ? "rgba(34,197,94,0.2)" : type === "missing" ? "rgba(249,115,22,0.2)" : "rgba(245,158,11,0.2)"}` }),
    achievementTag: { padding: "4px 12px", borderRadius: "6px", fontSize: "0.82rem", background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" },
    sectionItem: (present) => ({ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "10px", border: `1px solid ${present ? "rgba(34,197,94,0.2)" : "rgba(249,115,22,0.15)"}`, background: present ? "rgba(34,197,94,0.05)" : "rgba(249,115,22,0.05)", marginBottom: "12px" }),
    sectionLabel: { fontFamily: "'Syne', sans-serif", fontWeight: 600, flex: 1 },
    sectionStatus: (present) => ({ fontSize: "0.85rem", fontWeight: 600, color: present ? "#22c55e" : "#f97316" }),
    suggItem: { display: "flex", gap: "16px", alignItems: "flex-start", padding: "16px", background: "#161e2e", borderRadius: "10px", border: "1px solid #1e2d45", marginBottom: "12px" },
    suggNum: { fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#3b82f6", fontSize: "0.85rem", flexShrink: 0, marginTop: "2px" },
    suggText: { color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.6 },
    empty: { color: "#64748b", fontSize: "0.9rem" },
  };

  const sectionList = [
    { key: "education", label: "Education", icon: "🎓" },
    { key: "experience", label: "Experience", icon: "💼" },
    { key: "projects", label: "Projects", icon: "🛠" },
    { key: "skills", label: "Skills", icon: "⚡" },
  ];

  return (
    <div style={s.panel}>
      <div style={s.tabs}>
        {["skills", "sections", "suggestions"].map((t) => (
          <button key={t} style={s.tabBtn(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {tab === "skills" && (
          <>
            <p style={s.groupTitle("found")}>✓ Skills Detected ({skills_found.length})</p>
            <div style={s.tags}>
              {skills_found.length > 0 ? skills_found.map(sk => <span key={sk} style={s.tag("found")}>{sk}</span>) : <span style={s.empty}>No skills found.</span>}
            </div>
            <p style={s.groupTitle("missing")}>✗ Key Skills Missing ({missing_skills.length})</p>
            <div style={s.tags}>
              {missing_skills.length > 0 ? missing_skills.map(sk => <span key={sk} style={s.tag("missing")}>{sk}</span>) : <span style={{ color: "#22c55e", fontSize: "0.9rem" }}>No critical skills missing!</span>}
            </div>
            {achievements.length > 0 && (
              <>
                <p style={s.groupTitle("found")}>📊 Quantified Achievements</p>
                <div style={s.tags}>{achievements.map((a, i) => <span key={i} style={s.achievementTag}>{a}</span>)}</div>
              </>
            )}
            {repetitions.length > 0 && (
              <>
                <p style={s.groupTitle("missing")}>⚠ Overused Words</p>
                <div style={s.tags}>{repetitions.map(r => <span key={r} style={s.tag("warn")}>{r}</span>)}</div>
              </>
            )}
          </>
        )}

        {tab === "sections" && sectionList.map(({ key, label, icon }) => (
          <div key={key} style={s.sectionItem(sections[key])}>
            <span style={{ fontSize: "1.2rem" }}>{icon}</span>
            <span style={s.sectionLabel}>{label}</span>
            <span style={s.sectionStatus(sections[key])}>{sections[key] ? "✓ Found" : "✗ Missing"}</span>
          </div>
        ))}

        {tab === "suggestions" && suggestions.map((suggestion, i) => (
          <div key={i} style={s.suggItem}>
            <span style={s.suggNum}>{String(i + 1).padStart(2, "0")}</span>
            <p style={s.suggText}>{suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalysisPanel;