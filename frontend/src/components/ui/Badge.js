import React from "react";

const VARIANTS = {
  brand: "bg-brand-50 text-brand-600 border-brand-200",
  neutral: "bg-ink-100 text-ink-600 border-ink-200",
  success: "bg-green-50 text-green-600 border-green-200",
  warning: "bg-amber-50 text-amber-600 border-amber-200",
  danger: "bg-red-50 text-red-600 border-red-200",
};

export default function Badge({ variant = "neutral", className = "", children }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border text-xs font-semibold font-body",
        VARIANTS[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
