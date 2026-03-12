import React, { useState } from "react";
import UploadResume from "./components/UploadResume";
import ScoreCard from "./components/ScoreCard";
import AnalysisPanel from "./components/AnalysisPanel";

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const analyzeResume = async (file) => {
    setLoading(true);
    setFileName(file.name);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const response = await fetch("http://127.0.0.1:5001/analyze_resume", { method: "POST", body: formData });
      const data = await response.json();
      if (data.error) alert("Error: " + data.error);
      else setAnalysis(data);
    } catch {
      alert("Cannot connect to backend. Make sure Flask is running:\n\ncd backend\npython app.py");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    app: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "#080c14", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" },
    header: { borderBottom: "1px solid #1e2d45", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", background: "rgba(8,12,20,0.9)", position: "sticky", top: 0, zIndex: 100 },
    headerInner: { width: "100%", maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.2rem" },
    logoIcon: { color: "#3b82f6", fontSize: "1.4rem" },
    resetBtn: { background: "transparent", border: "1px solid #1e2d45", color: "#64748b", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" },
    main: { flex: 1, padding: "40px 20px" },
    dashboard: { maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" },
    loadingScreen: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" },
    loadingText: { fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 600 },
    loadingSub: { color: "#64748b", fontSize: "0.9rem" },
  };

  return (
    <div style={styles.app}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>◈</span>
            <span>Resume Analyser</span>
          </div>
          {analysis && (
            <button style={styles.resetBtn} onClick={() => { setAnalysis(null); setFileName(""); }}>
              ← Analyze Another
            </button>
          )}
        </div>
      </header>

      <main style={styles.main}>
        {!analysis && !loading && <UploadResume onAnalyze={analyzeResume} />}

        {loading && (
          <div style={styles.loadingScreen}>
            <div style={{ width: 48, height: 48, border: "3px solid #1e2d45", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={styles.loadingText}>Analyzing <strong>{fileName}</strong>...</p>
            <p style={styles.loadingSub}>Scanning skills, sections & achievements</p>
          </div>
        )}

        {analysis && !loading && (
          <div style={styles.dashboard}>
            <ScoreCard
              score={analysis.score}
              wordCount={analysis.word_count}
              sectionsFound={Object.values(analysis.sections || {}).filter(Boolean).length}
              skillsCount={(analysis.skills_found || []).length}
            />
            <AnalysisPanel data={analysis} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;