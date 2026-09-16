import React, { useState, useRef } from "react";
import { FiFileText, FiUploadCloud, FiArrowRight, FiTarget, FiSearch, FiBriefcase } from "react-icons/fi";
import { Card, Button } from "./ui";

const FEATURES = [
  { Icon: FiTarget, title: "Smart Scoring", sub: "Weighted score across 4 key dimensions" },
  { Icon: FiSearch, title: "Skill Analysis", sub: "Detect 60+ skills across 6 categories" },
  { Icon: FiBriefcase, title: "Role Matching", sub: "Match against 8 industry job profiles" },
];

export default function UploadResume({ onAnalyze }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") setFile(f);
    else alert("Please upload a PDF file.");
  };

  return (
    <div className="w-full max-w-[680px] mx-auto flex flex-col gap-[clamp(14px,3vh,36px)]">

      <div className="text-center">
        <h1 className="font-display font-bold text-ink-900 leading-[1.15] tracking-tight mb-[clamp(6px,1.2vh,14px)] text-[clamp(1.5rem,3vw+1rem,2.75rem)]">
          Get your resume <span className="text-brand-600">analysis</span><br />in seconds
        </h1>
        <p className="text-ink-500 text-base leading-relaxed max-w-[480px] mx-auto">
          Upload your PDF resume and receive a detailed analysis, matching job roles, and section-by-section improvement tips.
        </p>
      </div>

      <Card className="flex flex-col gap-[clamp(12px,2vh,20px)]">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current.click()}
          className={[
            "border-2 border-dashed rounded-[14px] px-6 py-[clamp(16px,3.5vh,32px)] text-center cursor-pointer transition-colors duration-200",
            file ? "border-brand-600 bg-brand-50" : dragging ? "border-brand-300 bg-[#f8faff]" : "border-ink-200 bg-ink-50",
          ].join(" ")}
        >
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {file ? (
            <div className="flex flex-col items-center">
              <FiFileText size={44} className="text-brand-600 mb-3" />
              <p className="font-semibold text-brand-600 text-base mb-1">{file.name}</p>
              <p className="text-ink-400 text-sm">{(file.size / 1024).toFixed(1)} KB · PDF</p>
            </div>
          ) : (
            <>
              <FiUploadCloud size={40} className="text-ink-400 mb-3.5 mx-auto" />
              <p className="font-semibold text-ink-900 text-base mb-1.5">Drop your PDF resume here</p>
              <p className="text-ink-400 text-sm">or click to browse · PDF only</p>
            </>
          )}
        </div>

        <Button
          variant="primary"
          size="xl"
          disabled={!file}
          onClick={() => { if (!file) return; onAnalyze(file); }}
          className="w-full font-semibold justify-center"
        >
          {file ? (
            <>Analyse Resume <FiArrowRight /></>
          ) : "Select a PDF to continue"}
        </Button>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {FEATURES.map(({ Icon, title, sub }) => (
          <Card key={title} padding="sm" rounded="lg" className="text-center">
            <Icon size={22} className="text-brand-600 mb-2 mx-auto" />
            <p className="font-semibold text-sm text-ink-900 mb-1">{title}</p>
            <p className="text-ink-400 text-xs leading-relaxed">{sub}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
