import { Card, Input } from "../ui";

const STATUS_OPTIONS = [
  "All",
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected",
];

const MATCH_OPTIONS = [
  { label: "All", value: 0 },
  { label: "90%+", value: 90 },
  { label: "80%+", value: 80 },
  { label: "70%+", value: 70 },
  { label: "60%+", value: 60 },
];

const SCORE_OPTIONS = [
  { label: "All", value: 0 },
  { label: "90+", value: 90 },
  { label: "80+", value: 80 },
  { label: "70+", value: 70 },
  { label: "60+", value: 60 },
];

const selectCls = "h-[38px] border border-ink-300 rounded-md bg-white text-ink-700 px-2.5 text-xs outline-none focus:border-brand-500";

export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <Card padding="sm" rounded="lg" className="flex flex-wrap gap-2.5 mb-4">
      <Input
        size="sm"
        className="min-w-[190px] flex-1"
        placeholder="Search candidate"
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      <select
        className={selectCls}
        value={filters.status}
        onChange={(e) => update("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            Status: {status}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        value={filters.minMatch}
        onChange={(e) =>
          update("minMatch", Number(e.target.value))
        }
      >
        {MATCH_OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            Job Match: {option.label}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        value={filters.minScore}
        onChange={(e) =>
          update("minScore", Number(e.target.value))
        }
      >
        {SCORE_OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            Resume Score: {option.label}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        value={filters.sortBy}
        onChange={(e) =>
          update("sortBy", e.target.value)
        }
      >
        <option value="job_match_score">
          Sort by Job Match
        </option>

        <option value="resume_score">
          Sort by Resume Score
        </option>
      </select>

      <select
        className={selectCls}
        value={filters.sortDir}
        onChange={(e) =>
          update("sortDir", e.target.value)
        }
      >
        <option value="desc">
          Highest first
        </option>

        <option value="asc">
          Lowest first
        </option>
      </select>
    </Card>
  );
}
