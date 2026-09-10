import React, { useState } from "react";

function SkillBar({ skill, delay }) {
  return (
    <span style={{
      padding: "5px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 500,
      background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
      display: "inline-block", animation: `fadeUp 0.4s ${delay}s ease both`
    }}>{skill}</span>
  );
}

function SectionRow({ icon, label, present, tips }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: present ? "#f0fdf4" : "#fff7ed", border: `1px solid ${present ? "#bbf7d0" : "#fed7aa"}`, borderRadius: "12px", marginBottom: "10px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <span style={{ fontSize: "1.2rem" }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a", flex: 1 }}>{label}</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: present ? "#16a34a" : "#ea580c", marginRight: "8px" }}>
          {present ? "✓ Found" : "✗ Missing"}
        </span>
        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{open ? "▲" : "▼"} Tips</span>
      </div>
      {open && (
        <div style={{ padding: "0 16px 14px 44px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <span style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "1px" }}>→</span>
              <p style={{ color: "#475569", fontSize: "0.83rem", lineHeight: 1.5 }}>{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JobMatchRow({ role, data, rank }) {
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[rank % colors.length];
  const pct = data.match;

  return (
    <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: "14px", padding: "18px 20px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {rank === 0 && <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "100px" }}>Best Match</span>}
          <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>{role}</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color, fontFamily: "'Playfair Display', serif" }}>{pct}%</span>
      </div>
      <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "100px", marginBottom: "10px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "100px", transition: "width 1s ease" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {data.matched_skills.map(s => (
          <span key={s} style={{ padding: "2px 10px", background: "#f0f9ff", color: "#0369a1", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 500, border: "1px solid #bae6fd" }}>{s}</span>
        ))}
        {data.missing_skills.slice(0, 3).map(s => (
          <span key={s} style={{ padding: "2px 10px", background: "#fff1f2", color: "#be123c", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 500, border: "1px solid #fecdd3" }}>{s} missing</span>
        ))}
      </div>
    </div>
  );
}

export default function AnalysisPanel({ data, activeTab }) {
  const skills_found = data?.skills_found || [];
  const skills_by_category = data?.skills_by_category || {};
  const missing_skills = data?.missing_skills || [];
  const sections = data?.sections || {};
  const section_tips = data?.section_tips || {};
  const achievements = data?.achievements || [];
  const repetitions = data?.repetitions || [];
  const suggestions = data?.suggestions || [];
  const job_matches = data?.job_matches || {};

  const sectionList = [
    { key: "summary", label: "Professional Summary", icon: "👤" },
    { key: "education", label: "Education", icon: "🎓" },
    { key: "experience", label: "Experience", icon: "💼" },
    { key: "projects", label: "Projects", icon: "🛠" },
    { key: "skills", label: "Skills", icon: "⚡" },
    { key: "certifications", label: "Certifications", icon: "🏆" },
    { key: "achievements", label: "Achievements", icon: "⭐" },
  ];

  const categoryColors = {
    programming: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    web: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    data: { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
    database: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
    cloud: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
    tools: { bg: "#fefce8", color: "#854d0e", border: "#fef08a" },
  };

  const s = {
    panel: { background: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", minHeight: "400px" },
    sectionTitle: { fontWeight: 700, fontSize: "0.78rem", color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" },
    catTitle: { fontWeight: 700, fontSize: "0.78rem", color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px", marginTop: "16px" },
    tags: { display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "8px" },
    missingTag: { padding: "5px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 500, background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" },
    achieveTag: { padding: "5px 12px", borderRadius: "8px", fontSize: "0.8rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
    warnTag: { padding: "5px 12px", borderRadius: "8px", fontSize: "0.8rem", background: "#fefce8", color: "#854d0e", border: "1px solid #fef08a" },
    suggCard: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 18px", marginBottom: "10px", display: "flex", gap: "14px", alignItems: "flex-start" },
    suggNum: { fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem", color: "#2563eb", flexShrink: 0, width: "24px" },
    suggText: { color: "#334155", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 },
  };

  return (
    <div style={s.panel} className="fade-up-2">
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {activeTab === "skills" && (
        <>
          <p style={s.sectionTitle}>Skills by Category ({skills_found.length} found)</p>
          {Object.entries(skills_by_category).length > 0 ? (
            Object.entries(skills_by_category).map(([cat, skills]) => {
              const theme = categoryColors[cat] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
              return (
                <div key={cat}>
                  <p style={s.catTitle}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</p>
                  <div style={s.tags}>
                    {skills.map((sk, i) => (
                      <span key={sk} style={{ padding: "5px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 500, background: theme.bg, color: theme.color, border: `1px solid ${theme.border}`, animation: `fadeUp 0.3s ${i * 0.04}s ease both` }}>{sk}</span>
                    ))}
                  </div>
                </div>
              );
            })
          ) : <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No skills detected.</p>}

          {missing_skills.length > 0 && (
            <>
              <p style={{ ...s.catTitle, color: "#be123c", marginTop: "20px" }}>High-Demand Skills Missing</p>
              <div style={s.tags}>
                {missing_skills.map(sk => <span key={sk} style={s.missingTag}>{sk}</span>)}
              </div>
            </>
          )}

          {achievements.length > 0 && (
            <>
              <p style={{ ...s.catTitle, color: "#16a34a", marginTop: "20px" }}>Quantified Achievements Detected</p>
              <div style={s.tags}>
                {achievements.map((a, i) => <span key={i} style={s.achieveTag}>{a}</span>)}
              </div>
            </>
          )}

          {repetitions.length > 0 && (
            <>
              <p style={{ ...s.catTitle, color: "#854d0e", marginTop: "20px" }}>Overused Words</p>
              <div style={s.tags}>
                {repetitions.map(r => <span key={r} style={s.warnTag}>{r}</span>)}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "sections" && (
        <>
          <p style={s.sectionTitle}>Resume Sections · Click a section to see tips</p>
          {sectionList.map(({ key, label, icon }) => (
            <SectionRow
              key={key} icon={icon} label={label}
              present={!!sections[key]}
              tips={section_tips[key]?.tips || ["Keep this section concise and relevant.", "Use bullet points for readability."]}
            />
          ))}
        </>
      )}

      {activeTab === "jobs" && (
        <>
          <p style={s.sectionTitle}>Top Job Role Matches Based on Your Skills</p>
          {Object.entries(job_matches).length > 0 ? (
            Object.entries(job_matches).map(([role, matchData], i) => (
              <JobMatchRow key={role} role={role} data={matchData} rank={i} />
            ))
          ) : <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Add more skills to see job matches.</p>}
        </>
      )}

      {activeTab === "suggestions" && (
        <>
          <p style={s.sectionTitle}>{suggestions.length} Improvement Suggestions</p>
          {suggestions.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No suggestions — great resume!</p>
          ) : (
            suggestions.map((sug, i) => (
              <div key={i} style={s.suggCard}>
                <span style={s.suggNum}>{i + 1}</span>
                <p style={s.suggText}>{sug}</p>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}