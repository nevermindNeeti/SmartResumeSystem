import React from "react";

function CheckItem({ label, status }) {

  const icon =
    status === "good" ? "✅" :
    status === "bad" ? "❌" :
    "🔒";

  return (
    <div className="checkItem">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default CheckItem;