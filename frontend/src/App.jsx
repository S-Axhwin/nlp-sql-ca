import { useState, useEffect } from "react";
import HistoryPage from "./pages/HistoryPage";
import SchemaPage from "./pages/SchemaPage";
import SettingsPage from "./pages/SettingsPage";

const SUGGESTIONS = [
  "show top 5 students by cgpa",
  "students with attendance below 75",
  "count all students",
];

// SQL syntax highlighter
function SqlToken({ sql }) {
  const KEYWORDS = ["SELECT","FROM","WHERE","ORDER","BY","LIMIT","GROUP","HAVING","JOIN","LEFT","RIGHT","INNER","ON","AS","DESC","ASC","AND","OR","NOT","IN","LIKE","BETWEEN","IS","NULL","DISTINCT"];
  const FUNCTIONS = ["COUNT","AVG","SUM","MIN","MAX","ROUND","COALESCE"];
  const tokens = (sql || "").match(/('.*?'|".*?"|\b\d+\.?\d*\b|\b\w+\b|[^'"\w\s]|\s+)/g) || [];
  return (
    <pre className="p-4 text-sm leading-7 font-mono overflow-x-auto m-0">
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
        const up = t.toUpperCase();
        if (KEYWORDS.includes(up)) return <span key={i} className="text-orange-300 font-semibold">{t}</span>;
        if (FUNCTIONS.includes(up)) return <span key={i} className="text-yellow-300">{t}</span>;
        if (/^'.*'$/.test(t) || /^\d+\.?\d*$/.test(t)) return <span key={i} className="text-emerald-400">{t}</span>;
        return <span key={i} className="text-stone-300">{t}</span>;
      })}
    </pre>
  );
}

// Card wrapper
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-[#e5ddd0] rounded-xl shadow-sm shadow-stone-200/60 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// Card header
function CardHeader({ icon, label, right }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#ede6d8] bg-[#fdfcfa]">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] font-semibold text-[#8a7a6a] uppercase">
        {icon}
        {label}
      </div>
      {right && <div className="text-[10px] text-[#8a7a6a]">{right}</div>}
    </div>
  );
}

const DEFAULT_STATE = {
  generated_sql: "SELECT * FROM students ORDER BY cgpa DESC LIMIT 5;",
  explanation: { intent: "TOP_N", table: "students", order_by: "cgpa", limit: 5 },
  preprocessed: { intent: "TOP_N", keywords: ["top", "students", "cgpa"] },
  schema_match: {
    matched_table: "STUDENTS",
    all_table_scores: { students: 32.6, marks: 29.9, courses: 18.4 },
    matched_columns: [["cgpa", 45.2], ["attendance", 32.1]],
  },
  execution: {
    success: true,
    columns: ["id", "name", "department", "cgpa", "attendance", "semester"],
    rows: [
      [1, "Ashwin S", "CSE", 8.7, 82, 6],
      [2, "Priya K", "CSE", 9.1, 91, 6],
      [3, "Rohit M", "ECE", 7.1, 61, 3],
    ],
    row_count: 3,
  },
};

const INTENT_DESC = {
  TOP_N: "Fetching top N records ordered by a metric.",
  BOTTOM_N: "Fetching bottom N records ordered ascending.",
  COUNT: "Counting total records.",
  AVERAGE: "Computing average of a numeric column.",
  FILTER_LT: "Filtering records below a threshold.",
  FILTER_GT: "Filtering records above a threshold.",
  SELECT: "Fetching filtered records.",
  SELECT_FILTER: "Filtering by a specific column value.",
  SELECT_ALL: "Fetching all records from a table.",
};

export default function App() {
  const [query, setQuery] = useState("show top 5 students by cgpa in CSE");
  const [result, setResult] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("Query");
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nl2sql_history") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    fetch("/schema").then(r => r.json()).then(setSchemaInfo).catch(() => {});
  }, []);

  async function handleGenerate(q = query) {
    if (!q.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
      const entry = { query: q, sql: data.generated_sql || "", intent: data.preprocessed?.intent || "—", success: data.execution?.success ?? false, row_count: data.execution?.row_count ?? 0, timestamp: new Date().toLocaleTimeString() };
      setHistory(prev => { const u = [...prev, entry].slice(-50); localStorage.setItem("nl2sql_history", JSON.stringify(u)); return u; });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result.generated_sql || "").catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  const tableNames = schemaInfo ? Object.keys(schemaInfo) : ["students", "marks", "courses"];
  const sql = result.generated_sql || "";
  const intent = result.preprocessed?.intent || result.explanation?.intent || "—";
  const matchedTable = (result.schema_match?.matched_table || "students").toUpperCase();
  const tableScores = result.schema_match?.all_table_scores || {};
  const matchedColumns = result.schema_match?.matched_columns || [];
  const keywords = result.preprocessed?.keywords || [];
  const explanation = result.explanation || {};
  const execution = result.execution || { success: false, rows: [], columns: [], row_count: 0 };
  const tabs = ["Query", "History", "Schema", "Settings"];

  return (
    <div className="flex h-screen overflow-hidden text-[#1c1410] text-xs font-mono">

      {/* ── SIDEBAR ──────────────────────────────── */}
      <aside className="w-48 shrink-0 flex flex-col bg-[#fdfcfa] border-r border-[#e5ddd0]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-11 border-b border-[#e5ddd0]">
          <div className="w-6 h-6 rounded bg-[#c92a0e] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 12 12" className="w-3 h-3 fill-white">
              <rect x="1" y="1" width="4" height="4" rx="0.8"/>
              <rect x="7" y="1" width="4" height="4" rx="0.8"/>
              <rect x="1" y="7" width="4" height="4" rx="0.8"/>
              <rect x="7" y="7" width="4" height="4" rx="0.8"/>
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight text-[#1c1410]">NL2SQL</span>
        </div>

        {/* DB */}
        <div className="px-3 pt-4 pb-1">
          <p className="text-[9px] tracking-[0.15em] font-semibold text-[#8a7a6a] uppercase mb-2">Database</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#e5ddd0] text-[#1c1410] text-[11px] font-medium">
            <svg className="w-3 h-3 text-[#c92a0e] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="2"/><path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" strokeWidth="2"/><path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" strokeWidth="2"/></svg>
            academic.db
          </div>
        </div>

        {/* Tables */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[9px] tracking-[0.15em] font-semibold text-[#8a7a6a] uppercase mb-1">Tables</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {tableNames.map(t => (
            <div key={t} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-100 cursor-pointer text-[#5a4a3a] text-[11px] transition-colors">
              <svg className="w-3 h-3 text-[#8a7a6a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><path d="M3 9h18M9 9v12" strokeWidth="2"/></svg>
              {t}
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="px-4 py-3 border-t border-[#e5ddd0] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#8a7a6a]">
            <span>Backend</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-red-500" : "bg-emerald-500"}`}/>
              {error ? "Error" : "Live"}
            </span>
          </div>
          <div className="text-[10px] text-[#8a7a6a] truncate">all-MiniLM-L6-v2</div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Nav */}
        <nav className="flex items-center justify-between px-5 h-11 bg-[#fdfcfa] border-b border-[#e5ddd0] shrink-0">
          <div className="flex h-full">
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 h-full text-[11px] font-semibold tracking-wide border-b-2 transition-colors ${
                  activeTab === t
                    ? "border-[#c92a0e] text-[#c92a0e]"
                    : "border-transparent text-[#8a7a6a] hover:text-[#1c1410]"
                }`}
              >{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#8a7a6a]">FastAPI · SQLite</span>
            <div className="w-7 h-7 rounded-full bg-[#c92a0e] flex items-center justify-center text-[10px] font-bold text-white">AS</div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-hidden">

          {activeTab === "History" && <div className="h-full overflow-y-auto p-4"><HistoryPage history={history} onRerun={q => { setQuery(q); setActiveTab("Query"); handleGenerate(q); }} onClear={() => { setHistory([]); localStorage.removeItem("nl2sql_history"); }} /></div>}
          {activeTab === "Schema" && <div className="h-full overflow-y-auto p-4"><SchemaPage schemaInfo={schemaInfo} /></div>}
          {activeTab === "Settings" && <div className="h-full overflow-y-auto p-4"><SettingsPage /></div>}

          {activeTab === "Query" && (
            <div className="flex gap-4 p-4 h-full overflow-hidden">

              {/* Left column */}
              <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pr-1">

                {/* Input */}
                <Card>
                  <CardHeader
                    icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/></svg>}
                    label="Natural Language Query"
                    right={<span className="border border-[#e5ddd0] rounded px-2 py-0.5 text-[#8a7a6a]">English</span>}
                  />
                  <div className="p-4 space-y-3">
                    <div className="flex gap-3">
                      <input
                        className="flex-1 bg-[#F6F4F2] border border-[#e5ddd0] rounded-lg px-3 py-2 text-sm text-[#1c1410] placeholder-[#8a7a6a] focus:ring-2 focus:ring-[#c92a0e]/20 focus:border-[#c92a0e] transition-all"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleGenerate()}
                        placeholder="Ask anything about your data…"
                      />
                      <button
                        onClick={() => handleGenerate()}
                        disabled={loading}
                        className="px-5 py-2 bg-[#c92a0e] hover:bg-[#a82208] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
                      >
                        {loading ? "Running…" : "Run Query"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => { setQuery(s); handleGenerate(s); }}
                          className="px-3 py-1 text-[11px] text-[#8a7a6a] border border-[#e5ddd0] rounded-full bg-[#F6F4F2] hover:border-[#c92a0e] hover:text-[#c92a0e] transition-colors"
                        >{s}</button>
                      ))}
                    </div>
                    {error && (
                      <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600">{error}</div>
                    )}
                  </div>
                </Card>

                {/* SQL output */}
                <Card className={`transition-opacity ${loading ? "opacity-40" : ""}`}>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-700 bg-[#1a0f08]">
                    <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] font-semibold text-stone-500 uppercase">
                      <svg className="w-3 h-3 text-[#c92a0e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                      Generated SQL
                    </div>
                    <button onClick={handleCopy} className="w-7 h-7 flex items-center justify-center rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors">
                      {copied
                        ? <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      }
                    </button>
                  </div>
                  <div className="bg-[#1a0f08]">
                    <SqlToken sql={sql} />
                  </div>
                </Card>

                {/* Results */}
                <Card>
                  <CardHeader
                    icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2}/><path d="M3 9h18M3 15h18M9 9v12" strokeWidth={2}/></svg>}
                    label="Results"
                    right={execution.success ? `${execution.row_count} row${execution.row_count !== 1 ? "s" : ""}` : "error"}
                  />
                  {!execution.success ? (
                    <div className="px-4 py-3 text-[11px] text-red-500">{execution.error || "Query failed"}</div>
                  ) : execution.row_count === 0 ? (
                    <div className="px-4 py-3 text-[11px] text-[#8a7a6a]">No results.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#ede6d8] bg-[#fdfcfa]">
                            {execution.columns.map(col => (
                              <th key={col} className="px-4 py-2.5 text-left text-[10px] tracking-[0.12em] font-semibold text-[#8a7a6a] uppercase">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {execution.rows.map((row, i) => (
                            <tr key={i} className="border-b border-[#f5ede0] hover:bg-[#fdfaf7] transition-colors">
                              {row.map((cell, j) => {
                                const col = execution.columns[j];
                                if (col === "cgpa" && typeof cell === "number") return (
                                  <td key={j} className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-[#1c1410]">{cell}</span>
                                      <div className="w-12 h-1 rounded-full bg-stone-100">
                                        <div className="h-full rounded-full bg-[#c92a0e]" style={{ width: `${(cell / 10) * 100}%` }}/>
                                      </div>
                                    </div>
                                  </td>
                                );
                                if (col === "department" && cell) return (
                                  <td key={j} className="px-4 py-2.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fff0ee] text-[#c92a0e] border border-[#f5c4bc]">{cell}</span>
                                  </td>
                                );
                                return <td key={j} className="px-4 py-2.5 text-[#5a4a3a]">{cell ?? "—"}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

              </div>

              {/* Right panel */}
              <div className="w-56 shrink-0 flex flex-col gap-4 overflow-y-auto">

                {/* Schema match */}
                <Card>
                  <CardHeader icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2}/><path d="M21 21l-2-2" strokeWidth={2} strokeLinecap="round"/></svg>} label="Schema Match" />
                  <div className="p-4 space-y-3">
                    <div className="text-sm font-bold text-[#c92a0e]">{matchedTable}</div>
                    {Object.entries(tableScores).map(([tbl, conf]) => (
                      <div key={tbl} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#5a4a3a]">{tbl}</span>
                          <span className="text-[#8a7a6a]">{conf}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-stone-100">
                          <div className="h-full rounded-full bg-[#c92a0e] transition-all duration-500" style={{ width: `${Math.min(conf, 100)}%` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Intent */}
                <Card>
                  <CardHeader icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>} label="Intent" />
                  <div className="p-4 space-y-2">
                    <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-[#c92a0e] text-white">{intent}</span>
                    <p className="text-[11px] text-[#8a7a6a] leading-relaxed">{INTENT_DESC[intent] || "Processing query."}</p>
                  </div>
                </Card>

                {/* Breakdown */}
                <Card>
                  <CardHeader icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} label="Breakdown" />
                  <div className="p-4 space-y-2">
                    {[
                      ["Intent", explanation.intent || intent],
                      ["Table", explanation.table || "—"],
                      ["Order By", explanation.order_by || "—"],
                      ...(explanation.limit ? [["Limit", explanation.limit]] : []),
                      ...(explanation.condition ? [["Condition", explanation.condition]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#8a7a6a] shrink-0">{k}</span>
                        <span className="px-2 py-0.5 rounded bg-[#F6F4F2] border border-[#e5ddd0] text-[11px] font-semibold text-[#1c1410] truncate max-w-[100px]">{v}</span>
                      </div>
                    ))}
                    {keywords.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <p className="text-[9px] tracking-[0.15em] font-semibold text-[#8a7a6a] uppercase">Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {keywords.slice(0, 8).map(kw => (
                            <span key={kw} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#c92a0e] text-white">{kw.toUpperCase()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {matchedColumns.length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <p className="text-[9px] tracking-[0.15em] font-semibold text-[#8a7a6a] uppercase">Columns</p>
                        {matchedColumns.slice(0, 3).map(([col, conf]) => (
                          <div key={col} className="flex justify-between text-[11px]">
                            <span className="text-[#5a4a3a]">{col}</span>
                            <span className="text-[#8a7a6a]">{conf}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-1.5 bg-[#fdfcfa] border-t border-[#e5ddd0] text-[10px] text-[#8a7a6a] shrink-0">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-400 animate-pulse" : error ? "bg-red-500" : "bg-emerald-500"}`}/>
            {loading ? "Generating…" : error ? "Error" : "Engine Ready"}
          </span>
          <span>all-MiniLM-L6-v2 · SQLite</span>
          <span>NL2SQL v1.0</span>
        </div>

      </div>
    </div>
  );
}
