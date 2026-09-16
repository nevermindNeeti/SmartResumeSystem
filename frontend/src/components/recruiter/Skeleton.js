import React from "react";

export function SkeletonRow() {
  return <div className="h-[60px] m-2 rounded-lg bg-ink-200 animate-pulse" />;
}

export function SkeletonCard() {
  return <div className="min-h-[150px] rounded-xl bg-ink-200 animate-pulse" />;
}
