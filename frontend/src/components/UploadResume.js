import React, { useState, useRef } from "react";

export default function UploadResume({ onAnalyze }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") setFile(f);
    else alert("Please upload a PDF file.");
  };

  const s = {
    page: { maxWidth: "680px", margin: "0 auto", padding: "40px 0 60px", display: "flex", flexDirection: "column", gap: "36px" },
    eyebrow: { display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" },
    eyebrowLine: { height: "1px", width: "40px", background: "#cbd5e1" },
    eyebrowText: { fontSize: "0.78rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" },
    hero: { textAlign: "center" },
    title: { fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#0f172a", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "14px" },
    titleAccent: { color: "#2563eb" },
    sub: { color: "#64748b", fontSize: "1rem", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" },
    card: { background: "white", borderRadius: "20px", padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "20px" },
    dropZone: (drag, has) => ({
      border: `2px dashed ${has ? "#2563eb" : drag ? "#93c5fd" : "#e2e8f0"}`,
      borderRadius: "14px", padding: "52px 24px", textAlign: "center", cursor: "pointer",
      background: has ? "#eff6ff" : drag ? "#f8faff" : "#fafafa",
      transition: "all 0.2s ease"
    }),
    uploadIcon: { fontSize: "2.5rem", marginBottom: "14px", display: "block" },
    dropTitle: { fontWeight: 600, fontSize: "1rem", color: "#0f172a", marginBottom: "6px" },
    dropSub: { color: "#94a3b8", fontSize: "0.85rem" },
    fileName: { fontWeight: 600, color: "#2563eb", fontSize: "1rem", marginBottom: "4px" },
    fileSize: { color: "#94a3b8", fontSize: "0.8rem" },
    btn: (active) => ({
      width: "100%", padding: "15px", borderRadius: "12px", border: "none",
      fontFamily: "'Outfit', sans-serif", fontSize: "1rem", fontWeight: 600, cursor: active ? "pointer" : "not-allowed",
      background: active ? "linear-gradient(135deg, #2563eb, #0ea5e9)" : "#f1f5f9",
      color: active ? "white" : "#94a3b8",
      boxShadow: active ? "0 4px 16px rgba(37,99,235,0.3)" : "none",
      transition: "all 0.2s ease", letterSpacing: "0.01em"
    }),
    features: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" },
    featureCard: { background: "white", border: "1px solid #f1f5f9", borderRadius: "12px", padding: "16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    featureIcon: { fontSize: "1.4rem", marginBottom: "8px", display: "block" },
    featureTitle: { fontWeight: 600, fontSize: "0.85rem", color: "#0f172a", marginBottom: "4px" },
    featureSub: { color: "#94a3b8", fontSize: "0.75rem", lineHeight: 1.4 },
  };

  return (
    <div style={s.page}>
      <div style={s.eyebrow}>
        <div style={s.eyebrowLine} />
        <span style={s.eyebrowText}>AI Resume Analysis</span>
        <div style={s.eyebrowLine} />
      </div>

      <div style={s.hero}>
        <h1 style={s.title}>
          Get your resume <span style={s.titleAccent}>analysis</span><br />in seconds
        </h1>
        <p style={s.sub}>Upload your PDF resume and receive a detailed score, skill gap analysis, job role matching, and section-by-section improvement tips.</p>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "3rem", marginBottom: "12px" }}>📄</span>
              <p style={s.fileName}>{file.name}</p>
              <p style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB · PDF</p>
            </div>
          ) : (
            <>
              <span style={s.uploadIcon}>☁</span>
              <p style={s.dropTitle}>Drop your PDF resume here</p>
              <p style={s.dropSub}>or click to browse · PDF only</p>
            </>
          )}
        </div>

        <button style={s.btn(!!file)} disabled={!file} onClick={() => { if (!file) return; onAnalyze(file); }}>
          {file ? "Analyse Resume →" : "Select a PDF to continue"}
        </button>
      </div>

      <div style={s.features}>
        {[
          { icon: "🎯", title: "Smart Scoring", sub: "Weighted score across 4 key dimensions" },
          { icon: "🔍", title: "Skill Analysis", sub: "Detect 60+ skills across 6 categories" },
          { icon: "💼", title: "Role Matching", sub: "Match against 8 industry job profiles" },
        ].map(({ icon, title, sub }) => (
          <div key={title} style={s.featureCard}>
            <span style={s.featureIcon}>{icon}</span>
            <p style={s.featureTitle}>{title}</p>
            <p style={s.featureSub}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}