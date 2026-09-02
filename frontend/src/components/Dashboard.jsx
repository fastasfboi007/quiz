import React from "react";
import { Radio, Clock, Target, Sun, Moon, RotateCcw } from "lucide-react";

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const Metric = ({ icon: Icon, label, value, testid, accent }) => (
  <div className="flex items-center gap-2.5" data-testid={testid}>
    <div
      className="flex h-9 w-9 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${accent}1f`, color: accent }}
    >
      <Icon size={16} />
    </div>
    <div className="leading-none">
      <div className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)] font-mono-terminal mb-1">
        {label}
      </div>
      <div className="font-mono-terminal text-lg sm:text-xl font-bold tracking-tight text-[color:var(--text-primary)]">
        {value}
      </div>
    </div>
  </div>
);

export const Dashboard = ({
  score,
  total,
  answeredCount,
  seconds,
  theme,
  onToggleTheme,
  onSubmit,
  submitted,
  onReset,
}) => {
  const progress = total ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <header
      data-testid="app-header-ticker"
      className="sticky top-0 z-40 border-b border-[color:var(--ticker-border)] backdrop-blur-xl"
      style={{ backgroundColor: theme === "dark" ? "rgba(11,14,20,0.82)" : "rgba(248,250,252,0.9)" }}
    >
      {/* Live wire top strip */}
      <div className="flex items-center gap-2 px-4 sm:px-8 pt-2.5 pb-1">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[color:var(--gold)] font-mono-terminal">
          <Radio size={12} className="animate-pulse" /> Reuters Wire
        </span>
        <span className="h-1 w-1 rounded-full bg-[color:var(--text-secondary)]" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)] font-mono-terminal truncate">
          Corporate Intelligence Desk · Australia
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 pb-3">
        <div className="flex items-center gap-5 sm:gap-8">
          <Metric
            icon={Target}
            label="Score"
            value={`${score}/${total}`}
            testid="total-score-display"
            accent="#10B981"
          />
          <Metric
            icon={Clock}
            label="Time"
            value={fmtTime(seconds)}
            testid="stopwatch-timer"
            accent="var(--gold)"
          />
          <div className="hidden sm:flex items-center gap-2.5 min-w-[150px]" data-testid="progress-bar">
            <div className="leading-none w-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)] font-mono-terminal">
                  Progress
                </span>
                <span className="text-[10px] font-mono-terminal font-bold text-[color:var(--text-primary)]">
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-black/25 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg,#F59E0B,#10B981)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="reset-quiz-button"
            onClick={onReset}
            title="New round (draws fresh random questions)"
            className="flex items-center gap-1.5 rounded-lg border border-[color:var(--border-interactive)] px-3 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={14} />
            <span className="hidden md:inline">New Round</span>
          </button>
          <button
            data-testid="theme-toggle-button"
            onClick={onToggleTheme}
            title="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border-interactive)] text-[color:var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            data-testid="submit-quiz-button-top"
            onClick={onSubmit}
            disabled={submitted}
            className="rounded-lg bg-[color:var(--gold)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#0B0E14] hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitted ? "Submitted" : "Submit"}
          </button>
        </div>
      </div>
    </header>
  );
};
