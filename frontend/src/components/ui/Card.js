import React from "react";

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-7",
};

const ROUNDED = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

const SHADOW = {
  card: "shadow-card",
  raised: "shadow-raised",
};

export default function Card({ padding = "md", rounded = "xl", shadow = "card", className = "", children, ...rest }) {
  return (
    <div
      className={[
        "bg-white border border-ink-100",
        SHADOW[shadow],
        ROUNDED[rounded],
        PADDING[padding],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
