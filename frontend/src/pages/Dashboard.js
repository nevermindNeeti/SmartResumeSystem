import React, { useState } from "react";
import ScoreCard from "./ScoreCard";
import AnalysisPanel from "./AnalysisPanel";

export default function Dashboard({ data }) {
  const [activeTab, setActiveTab] = useState("skills");

  const tabs = [
    { id: "skills", label: "Skills", icon: "⚡" },
    { id: "sections", label: "Sections", icon: "📋" },
    { id: "jobs", label: "Job Match", icon: "💼" },
    { id: "suggestions", label: "Suggestions", icon: "💡" },
  ];

  const s = {
    wrap: { display: "flex", flexDirection: "column", gap: "24px" },
    topRow: { display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" },
    tabBar: { background: "white", borderRadius: "16px", padding: "6px", display: "flex", gap: "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" },
    tab: (active) => ({
      flex: 1, padding: "10px 16px", borderRadius: "12px", border: "none", cursor: "pointer",
      background: active ? "#2563eb" : "transparent",
      color: active ? "white" : "#64748b",
      fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.88rem",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
      transition: "all 0.15s ease",
    }),
  };

  return (
    <div style={s.wrap} className="fade-up">
      <div style={s.topRow}>
        <ScoreCard data={data} />
        <AnalysisPanel data={data} activeTab={activeTab} />
      </div>
      <div style={s.tabBar}>
        {tabs.map((t) => (
          <button key={t.id} style={s.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}