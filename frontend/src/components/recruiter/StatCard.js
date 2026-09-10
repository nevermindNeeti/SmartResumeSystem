import React from "react";

export default function StatCard({ label, value, icon, hint }) {
  return (
    <div className="rd-stat-card">
      <div className="rd-stat-icon">{icon}</div>

      <div>
        <div className="rd-stat-value">{value}</div>

        <div className="rd-stat-label">
          {label}
        </div>

        {hint && (
          <div className="rd-stat-hint">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
