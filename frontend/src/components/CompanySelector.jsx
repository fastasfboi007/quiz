import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { COMPANIES, COMPANY_ORDER } from "../data/companies";

export const CompanySelector = ({ selected, onToggle, counts }) => {
  return (
    <div
      data-testid="desk-selector"
      className="rounded-xl border border-[color:var(--border-hairline)] bg-[color:var(--surface-card)] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={14} className="text-[color:var(--gold)]" />
        <span className="text-[10px] uppercase tracking-[0.25em] font-mono-terminal text-[color:var(--text-secondary)]">
          Desks in play — choose your companies
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {COMPANY_ORDER.map((k) => {
          const c = COMPANIES[k];
          const on = selected.includes(k);
          const isLast = on && selected.length === 1;
          return (
            <button
              key={k}
              type="button"
              data-testid={`desk-toggle-${c.testid}`}
              onClick={() => !isLast && onToggle(k)}
              aria-pressed={on}
              title={isLast ? "At least one desk must stay in play" : c.name}
              className={`group flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
                on
                  ? "text-[color:var(--text-primary)]"
                  : "text-[color:var(--text-secondary)] border-[color:var(--border-hairline)] opacity-60 hover:opacity-100"
              } ${isLast ? "cursor-not-allowed" : "cursor-pointer"}`}
              style={
                on
                  ? { borderColor: `${c.accent}88`, backgroundColor: `${c.accent}1f` }
                  : {}
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full transition-all"
                style={{
                  backgroundColor: on ? c.accent : "transparent",
                  border: `1.5px solid ${c.accent}`,
                }}
              />
              {c.short}
              <span className="font-mono-terminal opacity-60">{counts[k] ?? 0}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
