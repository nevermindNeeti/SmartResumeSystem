import React, { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import UploadResume from "./components/UploadResume";
import Dashboard from "./components/Dashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import { Button, Badge, Card } from "./components/ui";

export default function App() {
  const [mode, setMode] = useState("candidate");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const isLanding = mode === "candidate" && !analysis && !loading;
  const isDashboard = mode === "candidate" && !!analysis && !loading;
  const showModeToggle = isLanding || mode === "recruiter";

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
    <div className="min-h-screen bg-ink-100 font-body text-ink-900">
      <header className="bg-white border-b border-ink-200 h-16 px-10 flex items-center sticky top-0 z-50 shadow-card">
        <div className="max-w-[1300px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-display font-bold text-xl text-ink-900 tracking-tight">
            <div className="w-2.5 h-2.5 rounded-full bg-[linear-gradient(135deg,#2563eb,#0ea5e9)]" />
            Resume Analyser
          </div>

          <div className="flex items-center gap-2.5">
            {showModeToggle && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMode(mode === "candidate" ? "recruiter" : "candidate")}
              >
                {mode === "candidate" ? "Recruiter Portal" : "Resume Analyser"}
              </Button>
            )}

            {mode === "candidate" && analysis && (
              <Badge variant="brand">Analysis Complete</Badge>
            )}

            {mode === "candidate" && analysis && (
              <Button
                variant="secondary"
                size="sm"
                icon={<FiArrowLeft size={14} />}
                onClick={() => {
                  setAnalysis(null);
                  setFileName("");
                }}
              >
                New Analysis
              </Button>
            )}
          </div>
        </div>
      </header>

      {isLanding ? (
        <div className="h-[calc(100vh-4rem)] overflow-y-auto flex items-center justify-center px-6 py-6">
          <UploadResume onAnalyze={analyzeResume} />
        </div>
      ) : isDashboard ? (
        <div className="h-[calc(100vh-4rem)] overflow-hidden px-6 py-8 max-w-[1300px] mx-auto w-full">
          <Dashboard data={analysis} />
        </div>
      ) : mode === "recruiter" ? (
        <RecruiterDashboard />
      ) : (
        <div className="flex-1 px-6 py-8 max-w-[1300px] mx-auto w-full">
          {mode === "candidate" && loading && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5">
              <Card padding="none" shadow="raised" className="px-14 py-12 text-center flex flex-col items-center gap-4">
                <div className="w-[52px] h-[52px] border-[3px] border-ink-200 border-t-brand-600 rounded-full animate-spin" />
                <div>
                  <p className="font-display text-xl font-bold text-ink-900">Analysing your resume</p>
                  <p className="text-ink-500 text-sm">{fileName}</p>
                </div>
                <p className="text-ink-400 text-[0.82rem]">Scanning skills · Checking sections · Matching roles</p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
