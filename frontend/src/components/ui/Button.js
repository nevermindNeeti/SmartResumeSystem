import React from "react";

const VARIANTS = {
  primary: "bg-brand-600 text-white border border-brand-600 hover:bg-brand-700 hover:border-brand-700 shadow-card",
  secondary: "bg-white text-ink-600 border border-ink-200 hover:border-brand-300 hover:text-brand-600 shadow-card",
  ghost: "bg-transparent text-ink-500 border border-transparent hover:bg-ink-50 hover:text-ink-700",
  danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
  xl: "px-5 py-3.5 text-base gap-2",
};

export default function Button({
  variant = "secondary",
  size = "md",
  active = false,
  icon = null,
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center font-body font-medium rounded-lg cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        SIZES[size],
        active ? VARIANTS.primary : VARIANTS[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
