import React from "react";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="rd-error">
      <div>
        {message || "Something went wrong."}
      </div>

      {onRetry && (
        <button
          className="rd-btn-secondary"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}

