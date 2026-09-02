import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Lock } from "lucide-react";
import { COMPANIES, OPTION_LETTERS } from "../data/companies";

export const QuestionCard = ({ question, index, selected, submitted, onSelect }) => {
  const company = COMPANIES[question.company];
  const answered = selected !== undefined && selected !== null;
  const locked = answered || submitted;
  const isCorrectAnswered = answered && selected === question.correctIndex;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.015, 0.4) }}
      data-testid={`question-card-${question.id}`}
      className={`relative flex flex-col rounded-xl border p-5 overflow-hidden group ${
        answered
          ? isCorrectAnswered
            ? "border-emerald-500/70 bg-emerald-500/[0.06]"
            : "border-rose-500/70 bg-rose-500/[0.06]"
          : "border-[color:var(--border-hairline)] bg-[color:var(--surface-card)] hover:border-[color:var(--border-interactive)] hover:-translate-y-0.5"
      }`}
      style={{ transition: "transform .2s ease, border-color .2s ease" }}
    >
      {/* accent rail */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: company.accent }}
      />

      <div className="flex items-center justify-between mb-3 pl-2">
        <span
          data-testid={`question-company-badge-${question.id}`}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest font-mono-terminal"
          style={{
            color: company.accentLight,
            backgroundColor: `${company.accent}22`,
            border: `1px solid ${company.accent}55`,
          }}
        >
          {company.short}
        </span>
        <span className="text-[10px] uppercase tracking-widest font-mono-terminal text-[color:var(--text-secondary)]">
          {question.category}
        </span>
      </div>

      <h3 className="pl-2 text-base font-semibold leading-snug text-[color:var(--text-primary)] mb-4">
        <span className="font-mono-terminal text-[color:var(--gold)] mr-2">
          Q{String(index + 1).padStart(2, "0")}
        </span>
        {question.question}
      </h3>

      <div className="mt-auto flex flex-col gap-2 pl-2">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;
          const revealCorrect = locked && isCorrect;
          const revealWrong = answered && isSelected && !isCorrect;

          let cls =
            "border-[color:var(--border-hairline)] bg-black/10 text-[color:var(--text-secondary)] hover:border-[color:var(--border-interactive)] hover:text-[color:var(--text-primary)]";
          if (revealCorrect)
            cls = "border-emerald-500 bg-emerald-500/15 text-emerald-300";
          else if (revealWrong)
            cls = "border-rose-500 bg-rose-500/15 text-rose-300";

          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => onSelect(i)}
              data-testid={`option-card-${question.id}-${i}`}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${cls} ${
                locked ? "cursor-default" : "cursor-pointer"
              } ${isSelected && answered ? "animate-pop" : ""}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold font-mono-terminal ${
                  revealCorrect
                    ? "border-emerald-400 text-emerald-300"
                    : revealWrong
                    ? "border-rose-400 text-rose-300"
                    : "border-[color:var(--border-interactive)]"
                }`}
              >
                {OPTION_LETTERS[i]}
              </span>
              <span className="flex-1">{opt}</span>
              {revealCorrect && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
              {revealWrong && <XCircle size={16} className="text-rose-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pl-2 mt-3 overflow-hidden"
        >
          <p
            className={`text-xs leading-relaxed rounded-md px-3 py-2 ${
              isCorrectAnswered
                ? "bg-emerald-500/10 text-emerald-200/90"
                : "bg-rose-500/10 text-rose-200/90"
            }`}
          >
            <span className="font-bold uppercase tracking-wide mr-1 font-mono-terminal">
              {isCorrectAnswered ? "Correct" : "Filed wrong"}
            </span>
            — {question.explanation}
          </p>
        </motion.div>
      )}

      {submitted && !answered && (
        <div className="pl-2 mt-3 flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
          <Lock size={12} /> Unanswered — locked at submission
        </div>
      )}
    </motion.div>
  );
};
