import React from "react";

export default function Topbar() {
  const recruiterName =
    localStorage.getItem("recruiterName") || "Recruiter";

  return (
    <header className="h-[76px] bg-white border-b border-ink-200 px-6 md:px-8 flex items-center justify-between">
      <div>
        <div className="font-display text-xl font-bold text-ink-900">
          Recruiter Dashboard
        </div>

        <div className="text-ink-500 text-xs mt-0.5">
          Welcome back, {recruiterName}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-ink-500 text-xs">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span>System Online</span>
      </div>
    </header>
  );
}
