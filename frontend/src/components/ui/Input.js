import React from "react";

const SIZES = {
  sm: "px-2.5 h-[38px]",
  md: "px-3 py-2",
  lg: "px-3.5 py-3",
};

export default function Input({ size = "md", className = "", ...rest }) {
  return (
    <input
      className={[
        "w-full font-body text-sm text-ink-800 bg-white border border-ink-200 rounded-lg",
        SIZES[size],
        "placeholder:text-ink-400 outline-none transition-colors duration-150",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
