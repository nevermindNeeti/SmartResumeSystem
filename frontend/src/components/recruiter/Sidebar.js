import React from "react";
import { FiGrid, FiBriefcase, FiUsers, FiBarChart2, FiSettings, FiLogOut } from "react-icons/fi";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", Icon: FiGrid },
  { id: "jobs", label: "Jobs", Icon: FiBriefcase },
  { id: "candidates", label: "Candidates", Icon: FiUsers },
  { id: "analytics", label: "Analytics", Icon: FiBarChart2 },
  { id: "settings", label: "Settings", Icon: FiSettings },
];

export default function Sidebar({
  activeView,
  onNavigate,
  onLogout,
}) {
  const recruiterName =
    localStorage.getItem("recruiterName") || "Recruiter";

  return (
    <aside className="w-full md:w-[250px] bg-ink-900 text-white flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center bg-brand-600 text-white text-sm font-extrabold shrink-0">
          SR
        </div>

        <div>
          <div className="text-[17px] font-bold">SmartResume</div>
          <div className="mt-0.5 text-[11px] text-ink-400">Recruiter Portal</div>
        </div>
      </div>

      <nav className="flex-1 px-3.5 py-6 md:flex md:flex-col overflow-x-auto flex">
        <div className="hidden md:block px-3 pb-2.5 text-[10px] tracking-[1.2px] font-bold text-ink-500">WORKSPACE</div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={[
              "w-full border-0 flex items-center gap-3 px-3.5 py-3 mb-1 rounded-lg cursor-pointer text-left text-sm transition-colors duration-200 shrink-0",
              activeView === item.id
                ? "bg-brand-600 text-white font-semibold"
                : "bg-transparent text-ink-400 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")}
          >
            <span className="w-5 text-center inline-flex justify-center"><item.Icon size={16} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="hidden md:block px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 p-2">
          <div className="w-[34px] h-[34px] rounded-full bg-ink-700 text-white flex items-center justify-center font-bold text-[13px] shrink-0">
            {recruiterName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="text-white text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{recruiterName}</div>
            <div className="text-ink-400 text-[11px] mt-0.5">Recruiter</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-2 border-0 bg-transparent text-ink-400 px-2.5 py-2.5 flex items-center gap-2.5 rounded-md cursor-pointer text-[13px] text-left hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
        >
          <FiLogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
