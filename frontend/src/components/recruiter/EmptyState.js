import React from "react";
import { Button } from "../ui";

export default function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}) {
  return (
    <div className="bg-white border border-dashed border-ink-300 rounded-lg px-6 py-11 text-center">
      <div className="text-ink-700 text-base font-bold">
        {title}
      </div>

      <div className="text-ink-400 text-xs my-1.5 mb-4">
        {subtitle}
      </div>

      {actionLabel && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
