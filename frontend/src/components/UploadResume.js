import React, { useState, useRef } from "react";

function UploadResume({ onAnalyze }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") setFile(f);
    else alert("Please upload a PDF file.");
  };

  const s = {
    page: { maxWidth: "640px", margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "32px" },
    heroTitle: { fontFamily: "'Syne', sans-serif", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "16px", textAlign: "center" },
    accent: { background: "linear-gradient(135deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    heroSub: { color: "#64748b", fontSize: "1rem", lineHeight: 1.6, textAlign: "center", maxWidth: "480px" },
    card: { width: "100%", background: "#0f1623", border: "1px solid #1e2d45", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" },
    dropZone: (drag, hasFile) => ({ border: `2px dashed ${hasFile ? "#22c55e" : drag ? "#3b82f6" : "#1e2d45"}`, borderRadius: "12px", padding: "48px 24px", textAlign: "center", cursor: "pointer", background: hasFile ? "rgba(34,197,94,0.05)" : drag ? "rgba(59,130,246,0.05)" : "transparent", transition: "all 0.2s" }),
    dropIcon: { fontSize: "2rem", display: "block", marginBottom: "12px", color: "#3b82f6" },
    dropText: { fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#e2e8f0", marginBottom: "4px" },
    dropSub: { color: "#64748b", fontSize: "0.85rem" },
    fileName: { fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#22c55e", wordBreak: "break-all" },
    fileSize: { color: "#64748b", fontSize: "0.8rem" },
    btn: (active) => ({ width: "100%", padding: "14px", borderRadius: "10px", border: "none", fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 700, cursor: active ? "pointer" : "not-allowed", background: active ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "#1e2d45", color: active ? "white" : "#64748b", boxShadow: active ? "0 4px 20px rgba(59,130,246,0.3)" : "none", transition: "all 0.2s" }),
    pills: { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" },
    pill: { padding: "6px 14px", borderRadius: "100px", border: "1px solid #1e2d45", fontSize: "0.8rem", color: "#64748b" },
  };

  return (
    <div style={s.page}>
      <div style={{ textAlign: "center" }}>
        <h1 style={s.heroTitle}>
          <span style={s.accent}>AI-Powered</span><br />Resume Analyzer
        </h1>
        <p style={s.heroSub}>Upload your resume and get an instant score, skill gap analysis, and actionable suggestions.</p>
      </div>

      <div style={s.card}>
        <div
          style={s.dropZone(dragging, !!file)}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current.click()}
        >
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          {file ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "2.5rem" }}>📄</span>
              <span style={s.fileName}>{file.name}</span>
              <span style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ) : (
            <>
              <span style={s.dropIcon}>⬆</span>
              <p style={s.dropText}>Drop your PDF resume here</p>
              <p style={s.dropSub}>or click to browse</p>
            </>
          )}
        </div>
        <button style={s.btn(!!file)} onClick={() => { if (!file) { alert("Please select a resume first."); return; } onAnalyze(file); }} disabled={!file}>
          {file ? "Analyze Resume →" : "Select a PDF to continue"}
        </button>
      </div>

      <div style={s.pills}>
        {["✓ Skill Detection", "✓ Section Check", "✓ Score & Grade", "✓ AI Suggestions"].map(p => <span key={p} style={s.pill}>{p}</span>)}
      </div>
    </div>
  );
}

export default UploadResume;