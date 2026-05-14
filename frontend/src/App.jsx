import { useState } from "react";

const sqlTemplates = {
  default: {
    raw: `SELECT * FROM students\nWHERE department = 'CSE'\nORDER BY cgpa DESC\nLIMIT 5;`,
    tokens: [
      { text: "SELECT", type: "kw" }, { text: " * ", type: "plain" },
      { text: "FROM", type: "kw" }, { text: " students\n", type: "plain" },
      { text: "WHERE", type: "kw" }, { text: " department = ", type: "plain" },
      { text: "'CSE'", type: "val" }, { text: "\n", type: "plain" },
      { text: "ORDER BY", type: "kw" }, { text: " cgpa ", type: "plain" },
      { text: "DESC", type: "kw" }, { text: "\n", type: "plain" },
      { text: "LIMIT", type: "kw" }, { text: " ", type: "plain" },
      { text: "5", type: "val" }, { text: ";", type: "plain" },
    ],
    intent: "TOP_N",
    intentDesc: "Fetching top N records ordered by a specific metric.",
    keywords: ["TOP", "STUDENTS", "CGPA", "CSE"],
    activeKw: ["STUDENTS", "CGPA", "CSE"],
    orderBy: "cgpa",
    rows: [
      { id: 10, name: "Anita C", dept: "ME", cgpa: 9.3, attendance: 95, sem: 6 },
      { id: 2, name: "Priya K", dept: "CSE", cgpa: 9.1, attendance: 91, sem: 6 },
      { id: 1, name: "Ashwin S", dept: "CSE", cgpa: 8.7, attendance: 82, sem: 6 },
      { id: 8, name: "Meena J", dept: "IT", cgpa: 8.5, attendance: 85, sem: 4 },
      { id: 6, name: "Divya R", dept: "ECE", cgpa: 8.2, attendance: 79, sem: 6 },
    ],
  },
  attendance: {
    raw: `SELECT name, attendance FROM students\nWHERE attendance < 75\nORDER BY attendance ASC;`,
    tokens: [
      { text: "SELECT", type: "kw" }, { text: " name, attendance ", type: "plain" },
      { text: "FROM", type: "kw" }, { text: " students\n", type: "plain" },
      { text: "WHERE", type: "kw" }, { text: " attendance < ", type: "plain" },
      { text: "75", type: "val" }, { text: "\n", type: "plain" },
      { text: "ORDER BY", type: "kw" }, { text: " attendance ", type: "plain" },
      { text: "ASC", type: "kw" }, { text: ";", type: "plain" },
    ],
    intent: "FILTER",
    intentDesc: "Filtering records below a threshold value.",
    keywords: ["STUDENTS", "ATTENDANCE", "BELOW", "75"],
    activeKw: ["ATTENDANCE", "75"],
    orderBy: "attendance",
    rows: [
      { id: 3, name: "Rohit M", dept: "ECE", cgpa: 7.1, attendance: 61, sem: 3 },
      { id: 7, name: "Sara T", dept: "CSE", cgpa: 6.8, attendance: 68, sem: 5 },
      { id: 11, name: "Kiran B", dept: "ME", cgpa: 7.5, attendance: 72, sem: 2 },
    ],
  },
  count: {
    raw: `SELECT COUNT(*) AS total_students\nFROM students;`,
    tokens: [
      { text: "SELECT", type: "kw" }, { text: " ", type: "plain" },
      { text: "COUNT", type: "fn" }, { text: "(*) ", type: "plain" },
      { text: "AS", type: "kw" }, { text: " total_students\n", type: "plain" },
      { text: "FROM", type: "kw" }, { text: " students;", type: "plain" },
    ],
    intent: "AGGREGATE",
    intentDesc: "Counting total records in the dataset.",
    keywords: ["COUNT", "ALL", "STUDENTS"],
    activeKw: ["COUNT", "STUDENTS"],
    orderBy: "—",
    rows: [
      { id: "—", name: "total_students", dept: "—", cgpa: "—", attendance: 142, sem: "—" },
    ],
  },
};

const deptColors = {
  CSE: "bg-blue-100 text-blue-700",
  ME: "bg-emerald-100 text-emerald-700",
  IT: "bg-amber-100 text-amber-700",
  ECE: "bg-pink-100 text-pink-700",
};

const suggestions = [
  { label: "show top 5 students by cgpa", key: "default" },
  { label: "students with attendance below 75", key: "attendance" },
  { label: "count all students", key: "count" },
];

function SqlToken({ tokens }) {
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

export default function NL2SQL() {
  const [query, setQuery] = useState("show top 5 students by cgpa in CSE");
  const [activeTemplate, setActiveTemplate] = useState("default");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("Query");
  const [activeNavTab, setActiveNavTab] = useState("Query");

  const tpl = sqlTemplates[activeTemplate];

  function handleGenerate(key) {
    setGenerating(true);
    setTimeout(() => {
      setActiveTemplate(key || detectTemplate(query));
      setGenerating(false);
    }, 350);
  }

  function detectTemplate(q) {
    const lower = q.toLowerCase();
    if (lower.includes("attendance")) return "attendance";
    if (lower.includes("count")) return "count";
    return "default";
  }

  function handleSuggestion(s) {
    setQuery(s.label);
    setGenerating(true);
    setTimeout(() => {
      setActiveTemplate(s.key);
      setGenerating(false);
    }, 300);
  }

  function handleCopy() {
    navigator.clipboard.writeText(tpl.raw).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const tabs = ["Query", "History", "Schema", "Settings"];

  return (
    <div className="flex h-screen bg-gray-100 font-mono text-xs overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-52 min-w-[208px] bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
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

        {/* Workspace */}
        <div className="px-4 pt-3 pb-1 text-[10px] tracking-widest text-gray-400 font-semibold">ACTIVE WORKSPACE</div>
        <div className="mx-3 mb-2 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16" /></svg>
          <span className="text-xs font-medium text-gray-800 flex-1 truncate">Production_DB_01</span>
          <span className="text-gray-400 text-base leading-none">+</span>
        </div>

        {/* Favorites */}
        <div className="px-4 pt-2 pb-1 text-[10px] tracking-widest text-gray-400 font-semibold">FAVORITES</div>
        {["Student Performance", "Attendance Reports"].map((f) => (
          <div key={f} className="flex items-center gap-2 px-4 py-1.5 cursor-pointer text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-3 h-3 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            <span className="text-xs">{f}</span>
          </div>
        ))}

        {/* Tables */}
        <div className="px-4 pt-3 pb-1 text-[10px] tracking-widest text-gray-400 font-semibold">TABLES</div>
        {["students", "departments", "courses"].map((t) => (
          <div key={t} className="flex items-center gap-2 px-4 py-1.5 cursor-pointer text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} /><path d="M3 9h18M9 9v12" strokeWidth={2} /></svg>
            <span className="text-xs">{t}</span>
          </div>
        ))}

        {/* Usage */}
        <div className="mt-auto px-4 py-3 border-t border-gray-200">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
            <span>Usage</span><span>84%</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full">
            <div className="h-full w-[84%] bg-gray-900 rounded-full" />
          </div>
          <div className="text-right text-[10px] text-gray-400 mt-1">1.2m queries</div>
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
            <button className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center text-[10px] font-semibold text-white">JD</div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 flex gap-3 p-4 overflow-hidden">

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
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 active:scale-95 transition-all"
                >
                  {generating ? "Generating…" : "Generate SQL"}
                </button>
              </div>
              <div className="flex gap-2 px-4 pb-3 flex-wrap">
                {suggestions.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleSuggestion(s)}
                    className="px-3 py-1 border border-gray-200 rounded-full text-[11px] text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                  >{s.label}</button>
                ))}
              </div>
            </div>

            {/* SQL Output */}
            <div className={`bg-[#161616] rounded-xl border border-gray-700 overflow-hidden transition-opacity duration-200 ${generating ? "opacity-40" : "opacity-100"}`}>
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
              <SqlToken tokens={tpl.tokens} />
            </div>

            {/* Results */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2 text-[10px] tracking-widest text-gray-400 font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} /><path d="M3 9h18M3 15h18M9 9v12" strokeWidth={2} /></svg>
                  QUERY RESULTS
                </div>
                <span className="text-[11px] text-gray-400">{tpl.rows.length} rows returned</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["ID", "NAME", "DEPARTMENT", "CGPA", "ATTENDANCE", "SEMESTER"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] tracking-widest font-semibold text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tpl.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-600">{row.id}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                        <td className="px-4 py-2.5">
                          {row.dept !== "—"
                            ? <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${deptColors[row.dept] || "bg-gray-100 text-gray-600"}`}>{row.dept}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {typeof row.cgpa === "number"
                            ? <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-medium">{row.cgpa}</span>
                              <div className="w-12 h-1 bg-gray-100 rounded-full"><div className="h-full bg-gray-800 rounded-full" style={{ width: `${(row.cgpa / 10) * 100}%` }} /></div>
                            </div>
                            : <span className="text-gray-400">{row.cgpa}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{row.attendance}</td>
                        <td className="px-4 py-2.5 text-gray-600">{row.sem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                <div className="text-base font-semibold text-gray-900 mb-3">STUDENTS</div>
                {[{ col: "students", conf: 32.6, w: "33%" }, { col: "marks", conf: 29.9, w: "30%" }].map((s) => (
                  <div key={s.col} className="mb-2.5">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">{s.col}</span>
                      <span className="text-gray-400">{s.conf}% Conf.</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full">
                      <div className="h-full bg-gray-800 rounded-full transition-all duration-500" style={{ width: s.w }} />
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
                <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 mb-2">{tpl.intent}</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">{tpl.intentDesc}</p>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 text-[10px] tracking-widest text-gray-400 font-semibold">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                EXPLANATION
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {[["Intent", tpl.intent], ["Table", "students"], ["Order By", tpl.orderBy]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{k}:</span>
                    <span className="px-2 py-0.5 border border-gray-200 rounded bg-gray-50 text-[11px] font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <div className="mt-2">
                  <div className="text-[10px] tracking-widest text-gray-400 font-semibold mb-2">KEYWORDS IDENTIFIED</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.keywords.map((kw) => (
                      <span key={kw} className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border transition-colors ${tpl.activeKw.includes(kw) ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-500 border-gray-200"}`}>{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="text-xs font-semibold text-gray-900 tracking-wide">CONNECT EXTERNAL DBS</div>
              <div className="text-[11px] text-gray-500 leading-relaxed">Upgrade to Pro for real-time Postgres, MySQL, and BigQuery integration.</div>
              <button className="mt-1 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-semibold rounded-lg hover:bg-gray-700 active:scale-95 transition-all">Upgrade to Pro</button>
            </div>

          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-5 py-1.5 bg-white border-t border-gray-200 text-[10px] text-gray-400 tracking-wide">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Engine Ready
          </span>
          <span>Latency: 335ms</span>
          <span>UTF-8 &nbsp;·&nbsp; SQL: PostgreSQL 15.2</span>
        </div>
      </div>
    </div>
  );
}