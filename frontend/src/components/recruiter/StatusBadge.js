import React from "react";

const STATUS_STYLES = {
  Applied: {
    bg: "#eef0f2",
    color: "#4b5563",
  },

  Screening: {
    bg: "#e8f0fe",
    color: "#1d4ed8",
  },

  Shortlisted: {
    bg: "#eef2ff",
    color: "#6d28d9",
  },

  Interview: {
    bg: "#fff7e6",
    color: "#b45309",
  },

  Selected: {
    bg: "#e7f9ed",
    color: "#15803d",
  },

  Rejected: {
    bg: "#fdecec",
    color: "#b91c1c",
  },
};

export default function StatusBadge({ status }) {
  const style =
    STATUS_STYLES[status] || STATUS_STYLES.Applied;

  return (
    <span
      className="rd-badge"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
}
