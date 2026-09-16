import React from "react";
import { Button } from "../ui";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-white border border-red-200 rounded-lg p-[18px] text-red-700 text-xs flex items-center justify-between gap-4">
      <div>
        {message || "Something went wrong."}
      </div>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
