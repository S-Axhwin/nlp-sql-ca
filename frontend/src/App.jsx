import { useState, useEffect } from "react";
import HistoryPage from "./pages/HistoryPage";
import SchemaPage from "./pages/SchemaPage";
import SettingsPage from "./pages/SettingsPage";

const SUGGESTIONS = [
  "show top 5 students by cgpa",
  "students with attendance below 75",
  "count all students",
];

const DEPT_COLORS = {
  CSE: "bg-blue-100 text-blue-700",
  ME: "bg-emerald-100 text-emerald-700",
  IT: "bg-amber-100 text-amber-700",
  ECE: "bg-pink-100 text-pink-700",
  EEE: "bg-purple-100 text-purple-700",
  CIVIL: "bg-orange-100 text-orange-700",
};

// Tokenize raw SQL string for syntax highlighting
function tokenizeSQL(sql) {
  const KEYWORDS = ["SELECT", "FROM", "WHERE", "ORDER", "BY", "LIMIT", "GROUP", "HAVING", "JOIN", "LEFT", "RIGHT", "INNER", "ON", "AS", "DESC", "ASC", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN", "IS", "NULL", "DISTINCT"];
  const FUNCTIONS = ["COUNT", "AVG", "SUM", "MIN", "MAX", "ROUND", "COALESCE"];

  const regex = /('.*?'|".*?"|\b\d+\.?\d*\b|\b\w+\b|[^'\"\w\s]|\s+)/g;
  const matches = sql.match(regex) || [];

  return matches.map((text, i) => {
    if (/^\s+$/.test(text)) return { text, type: "plain" };
    if (KEYWORDS.includes(text.toUpperCase())) return { text, type: "kw" };
    if (FUNCTIONS.includes(text.toUpperCase())) return { text, type: "fn" };
    if (/^'.*'$/.test(text) || /^\d+\.?\d*$/.test(text)) return { text, type: "val" };
    return { text, type: "plain" };
  });
}

function SqlToken({ sql }) {
  const tokens = tokenizeSQL(sql || "");
  return (
    <pre className="p-4 text-sm leading-7 font-mono overflow-x-auto m-0 text-gray-300">
      {tokens.map((t, i) => {
        if (t.type === "kw") return <span key={i} className="text-sky-300 font-semibold">{t.text}</span>;
        if (t.type === "fn") return <span key={i} className="text-violet-400">{t.text}</span>;
        if (t.type === "val") return <span key={i} className="text-emerald-400">{t.text}</span>;
        return <span key={i} className="text-gray-300">{t.text}</span>;
      })}
    </pre>
  );
}

const DEFAULT_STATE = {
  generated_sql: "SELECT * FROM students ORDER BY cgpa DESC LIMIT 5;",
  explanation: { intent: "TOP_N", table: "students", order_by: "cgpa", limit: 5 },
  preprocessed: {
    intent: "TOP_N",
    keywords: ["top", "students", "cgpa"],
  },
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

export default function NL2SQL() {
  const [query, setQuery] = useState("show top 5 students by cgpa in CSE");
  const [result, setResult] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("Query");
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nl2sql_history") || "[]"); } catch { return []; }
  });

  // Load schema on mount
  useEffect(() => {
    fetch("/schema")
      .then((r) => r.json())
      .then(setSchemaInfo)
      .catch(() => {});
  }, []);

  async function handleGenerate(overrideQuery) {
    const q = overrideQuery ?? query;
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
      // Save to history
      const entry = {
        query: q,
        sql: data.generated_sql || "",
        intent: data.preprocessed?.intent || "—",
        success: data.execution?.success ?? false,
        row_count: data.execution?.row_count ?? 0,
        timestamp: new Date().toLocaleTimeString(),
      };
      setHistory((prev) => {
        const updated = [...prev, entry].slice(-50);
        localStorage.setItem("nl2sql_history", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(s) {
    setQuery(s);
    handleGenerate(s);
  }

  function handleRerun(q) {
    setQuery(q);
    setActiveNavTab("Query");
    handleGenerate(q);
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("nl2sql_history");
  }

  function handleCopy() {
    navigator.clipboard.writeText(result.generated_sql || "").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const tabs = ["Query", "History", "Schema", "Settings"];
  const tableNames = schemaInfo ? Object.keys(schemaInfo) : ["students", "marks", "courses"];
  const sql = result.generated_sql || "";
  const intent = result.preprocessed?.intent || result.explanation?.intent || "—";
  const matchedTable = (result.schema_match?.matched_table || "students").toUpperCase();
  const tableScores = result.schema_match?.all_table_scores || {};
  const matchedColumns = result.schema_match?.matched_columns || [];
  const keywords = result.preprocessed?.keywords || [];
  const explanation = result.explanation || {};
  const execution = result.execution || { success: false, rows: [], columns: [], row_count: 0 };

  const intentDescMap = {
    TOP_N: "Fetching top N records ordered by a specific metric.",
    BOTTOM_N: "Fetching bottom N records ordered ascending.",
    COUNT: "Counting total records in the dataset.",
    AVERAGE: "Computing average of a numeric column.",
    FILTER_LT: "Filtering records below a threshold value.",
    FILTER_GT: "Filtering records above a threshold value.",
    SELECT: "Fetching all or filtered records from a table.",
    SELECT_FILTER: "Filtering records by a specific column value.",
    SELECT_ALL: "Fetching all records from a table.",
  };

  return (
    <div className="flex h-screen bg-gray-100 font-mono text-xs overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-52 min-w-[208px] bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
            <svg viewBox="0 0 14 14" className="w-3 h-3 fill-white">
              <rect x="1" y="1" width="5" height="5" rx="1" />
              <rect x="8" y="1" width="5" height="5" rx="1" />
              <rect x="1" y="8" width="5" height="5" rx="1" />
              <rect x="8" y="8" width="5" height="5" rx="1" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-wide text-gray-900">NL2SQL</span>
        </div>

        <div className="px-4 pt-3 pb-1 text-[10px] tracking-widest text-gray-400 font-semibold">ACTIVE WORKSPACE</div>
        <div className="mx-3 mb-2 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" /></svg>
          <span className="text-xs font-medium text-gray-800 flex-1 truncate">academic.db</span>
          <span className="text-gray-400 text-base leading-none">+</span>
        </div>

        <div className="px-4 pt-2 pb-1 text-[10px] tracking-widest text-gray-400 font-semibold">TABLES</div>
        {tableNames.map((t) => (
          <div key={t} className="flex items-center gap-2 px-4 py-1.5 cursor-pointer text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} /><path d="M3 9h18M9 9v12" strokeWidth={2} /></svg>
            <span className="text-xs">{t}</span>
          </div>
        ))}

        <div className="mt-auto px-4 py-3 border-t border-gray-200">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
            <span>Backend</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${error ? "bg-red-400" : "bg-emerald-500"}`} />
              {error ? "Error" : "Connected"}
            </span>
          </div>
          <div className="text-[10px] text-gray-400">all-MiniLM-L6-v2</div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Nav */}
        <nav className="flex items-center justify-between px-5 bg-white border-b border-gray-200 h-11">
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveNavTab(t)}
                className={`px-4 h-11 text-xs font-semibold tracking-wide border-b-2 transition-colors ${activeNavTab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">FastAPI + SQLite</span>
            <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center text-[10px] font-semibold text-white">AS</div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 flex gap-3 p-4 overflow-hidden">

          {activeNavTab === "History" && (
            <HistoryPage history={history} onRerun={handleRerun} onClear={clearHistory} />
          )}
          {activeNavTab === "Schema" && (
            <SchemaPage schemaInfo={schemaInfo} />
          )}
          {activeNavTab === "Settings" && (
            <SettingsPage />
          )}
          {activeNavTab === "Query" && (<>

          {/* Query Panel */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto">

            {/* NL Input */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2 text-[10px] tracking-widest text-gray-400 font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" /></svg>
                  NATURAL LANGUAGE QUERY
                </div>
                <span className="text-[10px] border border-gray-200 rounded px-2 py-0.5 text-gray-500">English (US)</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <input
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 font-mono placeholder-gray-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder="Ask anything about your data…"
                />
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? "Generating…" : "Generate SQL"}
                </button>
              </div>
              <div className="flex gap-2 px-4 pb-3 flex-wrap">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="px-3 py-1 border border-gray-200 rounded-full text-[11px] text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                  >{s}</button>
                ))}
              </div>
              {error && (
                <div className="mx-4 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* SQL Output */}
            <div className={`bg-[#161616] rounded-xl border border-gray-700 overflow-hidden transition-opacity duration-200 ${loading ? "opacity-40" : "opacity-100"}`}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
                <div className="flex items-center gap-2 text-[10px] tracking-widest text-gray-500 font-semibold">
                  <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  GENERATED SQL
                </div>
                <button
                  onClick={handleCopy}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-700 hover:text-gray-300 transition-all"
                  title="Copy SQL"
                >
                  {copied
                    ? <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  }
                </button>
              </div>
              <SqlToken sql={sql} />
            </div>

            {/* Results */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2 text-[10px] tracking-widest text-gray-400 font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} /><path d="M3 9h18M3 15h18M9 9v12" strokeWidth={2} /></svg>
                  QUERY RESULTS
                </div>
                <span className="text-[11px] text-gray-400">
                  {execution.success ? `${execution.row_count} rows returned` : "Error"}
                </span>
              </div>
              {!execution.success ? (
                <div className="px-4 py-3 text-[11px] text-red-500">{execution.error || "Query failed"}</div>
              ) : execution.row_count === 0 ? (
                <div className="px-4 py-3 text-[11px] text-gray-400">No results found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {execution.columns.map((col) => (
                          <th key={col} className="px-4 py-2.5 text-left text-[10px] tracking-widest font-semibold text-gray-400 uppercase">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {execution.rows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          {row.map((cell, j) => {
                            const col = execution.columns[j];
                            // CGPA column — mini bar
                            if (col === "cgpa" && typeof cell === "number") {
                              return (
                                <td key={j} className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-900 font-medium">{cell}</span>
                                    <div className="w-12 h-1 bg-gray-100 rounded-full">
                                      <div className="h-full bg-gray-800 rounded-full" style={{ width: `${(cell / 10) * 100}%` }} />
                                    </div>
                                  </div>
                                </td>
                              );
                            }
                            // Department — badge
                            if (col === "department" && cell) {
                              return (
                                <td key={j} className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${DEPT_COLORS[cell] || "bg-gray-100 text-gray-600"}`}>{cell}</span>
                                </td>
                              );
                            }
                            return <td key={j} className="px-4 py-2.5 text-gray-700">{cell ?? "—"}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right Panel */}
          <div className="w-56 min-w-[224px] flex flex-col gap-3 overflow-y-auto">

            {/* Detected Schema */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 text-[10px] tracking-widest text-gray-400 font-semibold">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2} /><path d="M21 21l-2-2" strokeWidth={2} strokeLinecap="round" /></svg>
                DETECTED SCHEMA
              </div>
              <div className="px-4 py-3">
                <div className="text-base font-semibold text-gray-900 mb-3">{matchedTable}</div>
                {Object.entries(tableScores).map(([tbl, conf]) => (
                  <div key={tbl} className="mb-2.5">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">{tbl}</span>
                      <span className="text-gray-400">{conf}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full">
                      <div className="h-full bg-gray-800 rounded-full transition-all duration-500" style={{ width: `${Math.min(conf, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intent Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 text-[10px] tracking-widest text-gray-400 font-semibold">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                INTENT ANALYSIS
              </div>
              <div className="px-4 py-3">
                <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 mb-2">{intent}</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">{intentDescMap[intent] || "Processing natural language query."}</p>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 text-[10px] tracking-widest text-gray-400 font-semibold">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                EXPLANATION
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {[
                  ["Intent", explanation.intent || intent],
                  ["Table", explanation.table || "—"],
                  ["Order By", explanation.order_by || "—"],
                  ...(explanation.limit ? [["Limit", explanation.limit]] : []),
                  ...(explanation.condition ? [["Condition", explanation.condition]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-400">{k}:</span>
                    <span className="px-2 py-0.5 border border-gray-200 rounded bg-gray-50 text-[11px] font-semibold text-gray-800 truncate max-w-[110px]" title={String(v)}>{v}</span>
                  </div>
                ))}
                {keywords.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] tracking-widest text-gray-400 font-semibold mb-2">KEYWORDS</div>
                    <div className="flex flex-wrap gap-1.5">
                      {keywords.slice(0, 8).map((kw) => (
                        <span key={kw} className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border bg-gray-900 text-white border-gray-900">{kw.toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                )}
                {matchedColumns.length > 0 && (
                  <div className="mt-1">
                    <div className="text-[10px] tracking-widest text-gray-400 font-semibold mb-2">COLUMNS MATCHED</div>
                    <div className="flex flex-col gap-1">
                      {matchedColumns.slice(0, 3).map(([col, conf]) => (
                        <div key={col} className="flex justify-between text-[11px]">
                          <span className="text-gray-600">{col}</span>
                          <span className="text-gray-400">{conf}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>)}

        </div>{/* end content */}

        {/* Status Bar */}
        <div className="flex items-center justify-between px-5 py-1.5 bg-white border-t border-gray-200 text-[10px] text-gray-400 tracking-wide">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${loading ? "bg-amber-400 animate-pulse" : error ? "bg-red-400" : "bg-emerald-500"}`} />
            {loading ? "Generating…" : error ? "Error" : "Engine Ready"}
          </span>
          <span>all-MiniLM-L6-v2 · SQLite</span>
          <span>UTF-8 · NL2SQL v1.0</span>
        </div>
      </div>
    </div>
  );
}
