import React, { useState } from "react";
import { FiZap, FiClipboard, FiBriefcase } from "react-icons/fi";
import { BsLightbulb } from "react-icons/bs";
import ScoreCard from "./ScoreCard";
import AnalysisPanel from "./AnalysisPanel";
import { Card } from "./ui";

const TABS = [
  { id: "skills", label: "Skills", Icon: FiZap },
  { id: "sections", label: "Sections", Icon: FiClipboard },
  { id: "jobs", label: "Job Match", Icon: FiBriefcase },
  { id: "suggestions", label: "Suggestions", Icon: BsLightbulb },
];

export default function Dashboard({ data }) {
  const [activeTab, setActiveTab] = useState("skills");

  return (
    <div className="grid grid-cols-[380px_1fr] gap-6 h-full">
      <div className="h-full min-h-0 overflow-y-auto">
        <ScoreCard data={data} />
      </div>

      <div className="flex flex-col gap-4 min-w-0 min-h-0">
        <Card padding="none" className="flex gap-1 p-1.5 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={[
                "flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors duration-150",
                activeTab === t.id ? "bg-brand-600 text-white" : "bg-transparent text-ink-500 hover:bg-ink-50",
              ].join(" ")}
            >
              <t.Icon size={15} />
              {t.label}
            </button>
          ))}
        </Card>

        <div className="flex-1 min-h-0">
          <AnalysisPanel data={data} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
