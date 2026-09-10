import React from "react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "jobs", label: "Jobs", icon: "💼" },
  { id: "candidates", label: "Candidates", icon: "👥" },
  { id: "analytics", label: "Analytics", icon: "▥" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar({
  activeView,
  onNavigate,
  onLogout,
}) {
  const recruiterName =
    localStorage.getItem("recruiterName") || "Recruiter";

  return (
    <aside className="rd-sidebar">
      <div className="rd-brand">
        <div className="rd-brand-mark">SR</div>

        <div>
          <div className="rd-brand-name">SmartResume</div>
          <div className="rd-brand-subtitle">Recruiter Portal</div>
        </div>
      </div>

      <nav className="rd-nav">
        <div className="rd-nav-label">WORKSPACE</div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`rd-nav-item ${
              activeView === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="rd-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="rd-sidebar-footer">
        <div className="rd-profile">
          <div className="rd-avatar">
            {recruiterName.charAt(0).toUpperCase()}
          </div>

          <div className="rd-profile-info">
            <div className="rd-profile-name">{recruiterName}</div>
            <div className="rd-profile-role">Recruiter</div>
          </div>
        </div>

        <button
          className="rd-logout"
          onClick={onLogout}
        >
          <span>↪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

