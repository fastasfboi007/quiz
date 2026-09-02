import React from "react";
import { Search } from "lucide-react";
import { COMPANIES, COMPANY_ORDER } from "../data/companies";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "answered", label: "Answered" },
  { value: "unanswered", label: "Unanswered" },
  { value: "correct", label: "Correct" },
  { value: "incorrect", label: "Incorrect" },
];

export const FilterBar = ({
  activeCompany,
  onCompany,
  companies = COMPANY_ORDER,
  search,
  onSearch,
  status,
  onStatus,
  counts,
}) => {
  const Tab = ({ value, label, testid, accent }) => {
    const active = activeCompany === value;
    return (
      <button
        data-testid={testid}
        onClick={() => onCompany(value)}
        className={`relative whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
          active
            ? "text-[#0B0E14]"
            : "text-[color:var(--text-secondary)] border-[color:var(--border-hairline)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-interactive)]"
        }`}
        style={active ? { backgroundColor: accent, borderColor: accent } : {}}
      >
        {label}
        {counts[value] !== undefined && (
          <span className={`ml-1.5 font-mono-terminal ${active ? "opacity-70" : "opacity-50"}`}>
            {counts[value]}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <Tab value="ALL" label="All Desks" testid="company-filter-all" accent="#F59E0B" />
        {COMPANY_ORDER.filter((k) => companies.includes(k)).map((k) => (
          <Tab
            key={k}
            value={k}
            label={COMPANIES[k].short}
            testid={`company-filter-${COMPANIES[k].testid}`}
            accent={COMPANIES[k].accent}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 lg:w-56">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)]"
          />
          <input
            data-testid="search-input"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search briefs…"
            className="w-full rounded-lg border border-[color:var(--border-hairline)] bg-[color:var(--surface-card)] py-2 pl-9 pr-3 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)] focus:border-[color:var(--gold)] focus:outline-none transition-colors"
          />
        </div>
        <select
          data-testid="status-filter-select"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          className="rounded-lg border border-[color:var(--border-hairline)] bg-[color:var(--surface-card)] py-2 px-3 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--gold)] focus:outline-none transition-colors cursor-pointer"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
