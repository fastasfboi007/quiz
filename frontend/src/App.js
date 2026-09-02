import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { Newspaper, FileCheck2 } from "lucide-react";
import "@/App.css";

import { Dashboard } from "@/components/Dashboard";
import { FilterBar } from "@/components/FilterBar";
import { QuestionCard } from "@/components/QuestionCard";
import { SummaryModal } from "@/components/SummaryModal";
import { CompanySelector } from "@/components/CompanySelector";
import { COMPANY_ORDER } from "@/data/companies";
import { buildSession } from "@/data/questions";

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  const [theme, setTheme] = useState("dark");
  const [company, setCompany] = useState("ALL");
  const [selectedCompanies, setSelectedCompanies] = useState(COMPANY_ORDER);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [summaryOpen, setSummaryOpen] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, [theme]);

  const newQuiz = useCallback(() => {
    setQuestions(buildSession());
    setAnswers({});
    setSubmitted(false);
    setSeconds(0);
    setRunning(true);
    setSummaryOpen(false);
  }, []);

  useEffect(() => {
    newQuiz();
  }, [newQuiz]);

  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const activeQuestions = useMemo(
    () => questions.filter((q) => selectedCompanies.includes(q.company)),
    [questions, selectedCompanies]
  );
  const activeTotal = activeQuestions.length;
  const score = useMemo(
    () => activeQuestions.reduce((acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc), 0),
    [activeQuestions, answers]
  );
  const answeredCount = activeQuestions.filter((q) => answers[q.id] !== undefined).length;

  const breakdown = useMemo(() => {
    const b = {};
    selectedCompanies.forEach((k) => (b[k] = { company: k, correct: 0, total: 0 }));
    activeQuestions.forEach((q) => {
      if (!b[q.company]) b[q.company] = { company: q.company, correct: 0, total: 0 };
      b[q.company].total += 1;
      if (answers[q.id] === q.correctIndex) b[q.company].correct += 1;
    });
    return b;
  }, [activeQuestions, answers, selectedCompanies]);

  const counts = useMemo(() => {
    const c = { ALL: activeTotal };
    COMPANY_ORDER.forEach((k) => (c[k] = questions.filter((q) => q.company === k).length));
    return c;
  }, [questions, activeTotal]);

  const toggleDesk = (k) => {
    setSelectedCompanies((prev) => {
      const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
      return COMPANY_ORDER.filter((c) => next.includes(c));
    });
  };

  useEffect(() => {
    if (company !== "ALL" && !selectedCompanies.includes(company)) setCompany("ALL");
  }, [selectedCompanies, company]);

  const handleSelect = (qid, idx) => {
    if (submitted || answers[qid] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  };

  const filtered = useMemo(() => {
    return activeQuestions.filter((q) => {
      if (company !== "ALL" && q.company !== company) return false;
      if (search && !`${q.question} ${q.category} ${q.options.join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
      const a = answers[q.id];
      if (status === "answered" && a === undefined) return false;
      if (status === "unanswered" && a !== undefined) return false;
      if (status === "correct" && a !== q.correctIndex) return false;
      if (status === "incorrect" && (a === undefined || a === q.correctIndex)) return false;
      return true;
    });
  }, [activeQuestions, company, search, status, answers]);

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    setRunning(false);
    setSummaryOpen(true);
  };

  const handleReset = () => {
    toast("Fresh wire loaded — new questions drawn at random");
    newQuiz();
  };

  return (
    <div className="grain-overlay min-h-screen relative">
      <Toaster position="top-center" theme={theme} richColors />

      <Dashboard
        score={score}
        total={activeTotal}
        answeredCount={answeredCount}
        seconds={seconds}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onSubmit={handleSubmit}
        submitted={submitted}
        onReset={handleReset}
      />

      <main className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-8 pb-24 pt-8">
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Newspaper size={16} className="text-[color:var(--gold)]" />
            <span className="text-[11px] uppercase tracking-[0.3em] font-mono-terminal text-[color:var(--text-secondary)]">
              Associate Correspondent · Prep Terminal
            </span>
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[color:var(--text-primary)] leading-[1.05]">
            The Australia Wire
            <span className="text-[color:var(--gold)]">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-[color:var(--text-secondary)] leading-relaxed">
            High-yield corporate-intelligence briefs across five ASX heavyweights — ANZ, The Star,
            Santos, Rio Tinto and WiseTech. Each round draws a fresh set at random from a 100-question
            bank. Pick your desks, tap for instant verification, and beat the clock.
          </p>
        </section>

        <div className="mb-6">
          <CompanySelector selected={selectedCompanies} onToggle={toggleDesk} counts={counts} />
        </div>

        <div className="mb-6">
          <FilterBar
            activeCompany={company}
            onCompany={setCompany}
            companies={selectedCompanies}
            search={search}
            onSearch={setSearch}
            status={status}
            onStatus={setStatus}
            counts={counts}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-24 text-center text-sm text-[color:var(--text-secondary)]">
            No briefs match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={activeQuestions.indexOf(q)}
                selected={answers[q.id]}
                submitted={submitted}
                onSelect={(idx) => handleSelect(q.id, idx)}
              />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            data-testid="submit-quiz-button"
            onClick={handleSubmit}
            disabled={submitted}
            className="group flex items-center gap-2 rounded-full bg-[color:var(--gold)] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-[#0B0E14] hover:brightness-110 transition-all disabled:opacity-50"
          >
            <FileCheck2 size={18} />
            {submitted ? "Report Filed" : "Submit Quiz & File Report"}
          </button>
          <p className="text-xs text-[color:var(--text-secondary)] font-mono-terminal">
            {answeredCount}/{activeTotal} answered · locks all inputs on submit
          </p>
          {submitted && (
            <button
              onClick={() => setSummaryOpen(true)}
              data-testid="view-summary-button"
              className="text-xs font-semibold text-[color:var(--gold)] underline underline-offset-4"
            >
              View performance summary
            </button>
          )}
        </div>
      </main>

      <SummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        score={score}
        total={activeTotal}
        seconds={seconds}
        breakdown={breakdown}
        companies={selectedCompanies}
        onRestart={handleReset}
      />
    </div>
  );
}

export default App;
