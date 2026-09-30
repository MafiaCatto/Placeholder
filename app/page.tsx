"use client";

import { useEffect, useMemo, useState } from "react";

type Plan = {
  title: string;
  summary: string;
  estimate: string;
  criteria: string[];
  steps: string[];
  tests: string[];
  risks: string[];
};

const examples = [
  "Add passwordless email login with a 10-minute magic link",
  "Let users export their monthly expenses as a CSV",
  "Build a search endpoint with filters, sorting, and pagination",
];

function makePlan(input: string, type: string, stack: string): Plan {
  const clean = input.trim().replace(/[.!?]+$/, "");
  const lower = clean.toLowerCase();
  const isAuth = /auth|login|password|sign.?in|magic link/.test(lower);
  const isExport = /export|csv|download|report/.test(lower);
  const isSearch = /search|filter|sort|pagination/.test(lower);
  const hasData = /data|user|expense|record|database|save|store/.test(lower) || isAuth || isExport;

  const criteria = [
    `A user can ${clean.charAt(0).toLowerCase() + clean.slice(1)}.`,
    "Loading, empty, success, and failure states are clearly communicated.",
    "The feature is keyboard-accessible and works on mobile layouts.",
  ];
  if (isAuth) criteria.push("Links expire after 10 minutes, are single-use, and do not reveal whether an account exists.");
  if (isExport) criteria.push("The exported file has stable column names, correct escaping, and a timestamped filename.");
  if (isSearch) criteria.push("Filters are reflected in the URL and results remain stable across pages.");

  const steps = [
    `Define the ${type.toLowerCase()} contract, states, and edge cases.`,
    hasData ? `Add the data model and validation layer in ${stack}.` : `Create typed input validation in ${stack}.`,
    isAuth ? "Implement token creation, hashing, expiry, and one-time consumption." :
      isExport ? "Build the export serializer with escaping and streaming for large datasets." :
      isSearch ? "Implement query parsing, indexed filters, stable sorting, and cursor pagination." :
      "Implement the core service logic behind a small, testable interface.",
    "Build the user-facing flow with optimistic feedback and recoverable errors.",
    "Add telemetry-safe error handling and update the project documentation.",
  ];

  return {
    title: clean.length > 58 ? clean.slice(0, 55) + "…" : clean,
    summary: `A production-minded plan for ${clean.toLowerCase()}, scoped for an early-career engineer with clear boundaries and test coverage.`,
    estimate: steps.length > 5 || isAuth ? "3–5 days" : "2–3 days",
    criteria,
    steps,
    tests: [
      "Happy path completes with valid input.",
      "Invalid, missing, and boundary inputs return useful errors.",
      ...(hasData ? ["Duplicate or concurrent requests do not corrupt data."] : []),
      "Core flow passes keyboard and narrow-screen checks.",
    ],
    risks: [
      isAuth ? "Token leakage and account enumeration" : isExport ? "Memory usage on large exports" : isSearch ? "Slow queries as data grows" : "Unclear edge-case behavior",
      hasData ? "Schema changes and backward compatibility" : "Inconsistent client and server validation",
    ],
  };
}

export default function Home() {
  const [brief, setBrief] = useState("");
  const [type, setType] = useState("Feature");
  const [stack, setStack] = useState("TypeScript + React");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("ticketsmith-history") || "[]")); } catch {}
  }, []);

  const progress = useMemo(() => plan ? Math.round((done.length / plan.steps.length) * 100) : 0, [done, plan]);

  function generate() {
    if (brief.trim().length < 12) return;
    const next = makePlan(brief, type, stack);
    setPlan(next);
    setDone([]);
    const updated = [next.title, ...history.filter((h) => h !== next.title)].slice(0, 4);
    setHistory(updated);
    localStorage.setItem("ticketsmith-history", JSON.stringify(updated));
  }

  async function copyPlan() {
    if (!plan) return;
    const text = `# ${plan.title}\n\n${plan.summary}\n\n## Acceptance criteria\n${plan.criteria.map(x => `- ${x}`).join("\n")}\n\n## Implementation\n${plan.steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n## Tests\n${plan.tests.map(x => `- ${x}`).join("\n")}\n\n## Risks\n${plan.risks.map(x => `- ${x}`).join("\n")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  function downloadPlan() {
    if (!plan) return;
    const content = `# ${plan.title}\n\n${plan.summary}\n\n## Acceptance criteria\n${plan.criteria.map(item => `- ${item}`).join("\n")}\n\n## Implementation plan\n${plan.steps.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n## Test cases\n${plan.tests.map(item => `- ${item}`).join("\n")}`;
    const file = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${plan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="TicketSmith home">
          <span className="brand-mark">T</span>
          <span>TicketSmith</span>
        </a>
        <div className="status"><span className="status-dot" /> Local intelligence · no API key</div>
      </header>

      <section className="workspace">
        <aside className="composer">
          <div className="eyebrow"><span>01</span> Describe the work</div>
          <h1>Turn a rough idea into an engineer-ready ticket.</h1>
          <p className="lede">Get scope, acceptance criteria, implementation steps, risks, and tests—without sending your work anywhere.</p>

          <label htmlFor="brief">What are you building?</label>
          <textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Add passwordless login with magic links that expire after 10 minutes…"
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate(); }}
          />
          <div className="char-row"><span>Be specific about users and constraints</span><span>{brief.trim() ? `${brief.trim().split(/\s+/).length} words · ` : ""}{brief.length}/500</span></div>
          {brief && <button className="clear-brief" onClick={() => setBrief("")}>Clear brief</button>}

          <div className="select-row">
            <div><label htmlFor="type">Work type</label><select id="type" value={type} onChange={(e) => setType(e.target.value)}><option>Feature</option><option>Bug fix</option><option>Refactor</option></select></div>
            <div><label htmlFor="stack">Stack</label><select id="stack" value={stack} onChange={(e) => setStack(e.target.value)}><option>TypeScript + React</option><option>Python + FastAPI</option><option>Java + Spring</option></select></div>
          </div>

          <button className="generate" onClick={generate} disabled={brief.trim().length < 12}>
            Generate engineering plan <span>⌘ ↵</span>
          </button>

          <div className="examples">
            <span>Try an example</span>
            {examples.map((x, i) => <button key={x} onClick={() => setBrief(x)}>0{i + 1} — {x}</button>)}
          </div>

          {history.length > 0 && <div className="history"><div className="history-head"><span>Recent on this device</span><button className="clear-history" onClick={() => { setHistory([]); localStorage.removeItem("ticketsmith-history"); }}>Clear</button></div>{history.map(h => <button key={h} onClick={() => setBrief(h)}>{h}</button>)}</div>}
        </aside>

        <section className={`output ${plan ? "has-plan" : ""}`} aria-live="polite">
          {!plan ? (
            <div className="empty-state">
              <div className="blueprint">
                <div className="bp-line wide" /><div className="bp-line" /><div className="bp-grid"><i /><i /><i /></div><div className="bp-line short" />
              </div>
              <span className="eyebrow"><span>02</span> Review the plan</span>
              <h2>Your engineering plan will appear here.</h2>
              <p>Structured enough for Jira. Clear enough for a first pull request.</p>
              <div className="privacy"><strong>Private by design</strong><br />Planning happens in your browser. Nothing is uploaded.</div>
            </div>
          ) : (
            <article className="plan">
              <div className="plan-head">
                <div><span className="ticket">TS-{String(history.indexOf(plan.title) + 101).padStart(3, "0")}</span><h2>{plan.title}</h2><p>{plan.summary}</p></div>
                <div className="plan-actions"><button className="copy" onClick={copyPlan}>{copied ? "Copied!" : "Copy markdown"}</button><button className="download" onClick={downloadPlan}>Download .md</button></div>
              </div>
              <div className="meta">
                <span><small>ESTIMATE</small>{plan.estimate}</span>
                <span><small>TYPE</small>{type}</span>
                <span><small>STACK</small>{stack}</span>
              </div>
              <PlanSection number="01" title="Acceptance criteria" items={plan.criteria} />
              <section className="plan-section">
                <div className="section-title"><span>02</span><h3>Implementation plan</h3><em>{progress}% complete</em></div>
                <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                <ol className="checklist">
                  {plan.steps.map((item, i) => <li key={item} className={done.includes(i) ? "checked" : ""}><button aria-label={`Mark step ${i + 1} complete`} onClick={() => setDone(done.includes(i) ? done.filter(x => x !== i) : [...done, i])}>{done.includes(i) ? "✓" : i + 1}</button><span>{item}</span></li>)}
                </ol>
              </section>
              <div className="split">
                <PlanSection number="03" title="Test cases" items={plan.tests} compact />
                <PlanSection number="04" title="Watch outs" items={plan.risks} compact warning />
              </div>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}

function PlanSection({ number, title, items, compact = false, warning = false }: { number: string; title: string; items: string[]; compact?: boolean; warning?: boolean }) {
  return <section className={`plan-section ${compact ? "compact" : ""}`}><div className="section-title"><span>{number}</span><h3>{title}</h3></div><ul className={warning ? "warnings" : ""}>{items.map(item => <li key={item}>{item}</li>)}</ul></section>;
}
