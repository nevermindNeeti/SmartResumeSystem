import React from "react";

export default function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rd-empty">
      <div className="rd-empty-title">
        {title}
      </div>

      <div className="rd-empty-subtitle">
        {subtitle}
      </div>

      {actionLabel && (
        <button
          className="rd-btn-primary"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
