import React from "react";

export default function Topbar() {
  const recruiterName =
    localStorage.getItem("recruiterName") || "Recruiter";

  return (
    <header className="rd-topbar">
      <div>
        <div className="rd-topbar-title">
          Recruiter Dashboard
        </div>

        <div className="rd-topbar-subtitle">
          Welcome back, {recruiterName}
        </div>
      </div>

      <div className="rd-topbar-right">
        <div className="rd-status-dot" />
        <span>System Online</span>
      </div>
    </header>
  );
}

