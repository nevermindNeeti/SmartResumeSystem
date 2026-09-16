import React from "react";
import { Card } from "../ui";

export default function StatCard({ label, value, icon, hint }) {
  return (
    <Card className="flex items-center gap-4 min-h-[110px]">
      <div className="w-[46px] h-[46px] rounded-[10px] bg-ink-100 text-brand-600 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div>
        <div className="font-display text-2xl font-bold text-ink-900 leading-tight">{value}</div>

        <div className="text-ink-500 text-xs mt-1">
          {label}
        </div>

        {hint && (
          <div className="text-ink-400 text-[11px] mt-0.5">
            {hint}
          </div>
        )}
      </div>
    </Card>
  );
}
