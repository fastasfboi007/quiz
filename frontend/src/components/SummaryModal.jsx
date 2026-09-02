import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, RotateCcw } from "lucide-react";
import { COMPANIES, COMPANY_ORDER } from "../data/companies";

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const rank = (pct) => {
  if (pct >= 90) return { label: "Bureau Chief", tone: "#10B981" };
  if (pct >= 75) return { label: "Senior Correspondent", tone: "#F59E0B" };
  if (pct >= 60) return { label: "Correspondent", tone: "#38BDF8" };
  if (pct >= 40) return { label: "Associate Correspondent", tone: "#A78BFA" };
  return { label: "Cub Reporter", tone: "#F87171" };
};

export const SummaryModal = ({ open, onClose, score, total, seconds, breakdown, companies = COMPANY_ORDER, onRestart }) => {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const badge = rank(pct);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(2,6,12,0.7)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            data-testid="performance-summary-modal"
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto no-scrollbar rounded-2xl border border-[color:var(--border-interactive)] bg-[color:var(--surface-card)] p-6 sm:p-8"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              data-testid="summary-close-button"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gold)] font-mono-terminal mb-2">
                Final Wire Report
              </span>
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl mb-3"
                style={{ backgroundColor: `${badge.tone}22`, color: badge.tone }}
              >
                <Award size={30} />
              </div>
              <div
                data-testid="summary-accuracy-percent"
                className="font-serif-display text-5xl font-extrabold text-[color:var(--text-primary)]"
              >
                {pct}%
              </div>
              <div className="mt-1 text-sm text-[color:var(--text-secondary)]">
                <span className="font-mono-terminal font-bold text-[color:var(--text-primary)]">
                  {score}/{total}
                </span>{" "}
                correct · {fmtTime(seconds)}
              </div>
              <div
                className="mt-3 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: `${badge.tone}22`, color: badge.tone }}
              >
                {badge.label}
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--text-secondary)] font-mono-terminal mb-1">
                Accuracy by desk
              </div>
              {COMPANY_ORDER.filter((k) => companies.includes(k)).map((k) => {
                const b = breakdown[k] || { correct: 0, total: 0 };
                const cp = b.total ? Math.round((b.correct / b.total) * 100) : 0;
                const c = COMPANIES[k];
                return (
                  <div key={k} data-testid={`company-breakdown-${c.testid}`} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs font-semibold text-[color:var(--text-primary)]">
                      {c.short}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-black/25 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${cp}%`, backgroundColor: c.accent }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right font-mono-terminal text-xs font-bold text-[color:var(--text-primary)]">
                      {b.correct}/{b.total}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border-t border-[color:var(--border-hairline)] pt-5 flex items-center gap-3">
              <button
                data-testid="summary-close-button-2"
                onClick={onClose}
                className="flex-1 rounded-lg border border-[color:var(--border-interactive)] py-2.5 px-3 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-white/5 transition-colors"
              >
                Review answers
              </button>
              <button
                data-testid="summary-restart-button"
                onClick={onRestart}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[color:var(--gold)] py-2.5 px-3 text-sm font-bold text-[#0B0E14] hover:brightness-110 transition-all"
              >
                <RotateCcw size={15} /> New round
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
