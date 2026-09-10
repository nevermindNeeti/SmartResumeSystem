import React, { useState } from "react";
import UploadResume from "./components/UploadResume";
import Dashboard from "./components/Dashboard";

const G = {
  app: { minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Outfit', sans-serif", color: "#0f172a" },
  header: { background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  headerInner: { maxWidth: "1300px", margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.25rem", color: "#0f172a", letterSpacing: "-0.01em" },
  logoDot: { width: "10px", height: "10px", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #0ea5e9)" },
  badge: { background: "#eff6ff", color: "#2563eb", padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, border: "1px solid #bfdbfe" },
  resetBtn: { background: "white", border: "1px solid #e2e8f0", color: "#64748b", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  main: { flex: 1, padding: "32px 24px", maxWidth: "1300px", margin: "0 auto", width: "100%" },
  loadWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "20px" },
  loadCard: { background: "white", borderRadius: "20px", padding: "48px 56px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  loadTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" },
  loadSub: { color: "#64748b", fontSize: "0.9rem" },
};

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const analyzeResume = async (file) => {
    setLoading(true);
    setFileName(file.name);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("http://127.0.0.1:5001/analyze_resume", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) alert("Error: " + data.error);
      else setAnalysis(data);
    } catch {
      alert("Cannot connect to backend.\n\nRun: cd backend && python app.py");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={G.app}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fillBar { from { width: 0; } to { width: var(--w); } }
        @keyframes drawCircle { from { stroke-dasharray: 0 339; } to { stroke-dasharray: var(--dash) 339; } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.5s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.5s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.5s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.5s 0.4s ease both; }
        button:hover { opacity: 0.88; }
      `}</style>

      <header style={G.header}>
        <div style={G.headerInner}>
          <div style={G.logo}>
            <div style={G.logoDot} />
            Resume Analyser
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {analysis && <span style={G.badge}>Analysis Complete</span>}
            {analysis && (
              <button style={G.resetBtn} onClick={() => { setAnalysis(null); setFileName(""); }}>
                ← New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <div style={G.main}>
        {!analysis && !loading && <UploadResume onAnalyze={analyzeResume} />}

        {loading && (
          <div style={G.loadWrap}>
            <div style={G.loadCard}>
              <div style={{ width: 52, height: 52, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
              <div>
                <p style={G.loadTitle}>Analysing your resume</p>
                <p style={G.loadSub}>{fileName}</p>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Scanning skills · Checking sections · Matching roles</p>
            </div>
          </div>
        )}

        {analysis && !loading && <Dashboard data={analysis} />}
      </div>
    </div>
  );
}