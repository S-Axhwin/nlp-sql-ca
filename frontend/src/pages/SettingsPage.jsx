import { useState } from "react";

const DEFAULT_SETTINGS = {
  defaultLimit: "5",
  defaultTable: "students",
  theme: "light",
  showConfidence: true,
  autoRunSuggestions: false,
};

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const stored = JSON.parse(localStorage.getItem("nl2sql_settings") || "null") || DEFAULT_SETTINGS;
  const [settings, setSettings] = useState(stored);
  const [health, setHealth] = useState(null);

  function save() {
    localStorage.setItem("nl2sql_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function checkHealth() {
    setHealth("checking…");
    fetch("/health")
      .then((r) => r.json())
      .then((d) => setHealth(`OK — model: ${d.model}`))
      .catch(() => setHealth("Unreachable"));
  }

  function Field({ label, desc, children }) {
    return (
      <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100">
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-800">{label}</div>
          {desc && <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>}
        </div>
        <div>{children}</div>
      </div>
    );
  }

  function Toggle({ value, onChange }) {
    return (
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative ${value ? "bg-gray-900" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-5.5 translate-x-0.5" : "left-0.5"}`} style={{ left: value ? "calc(100% - 1.25rem - 2px)" : "2px" }} />
      </button>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-xl flex flex-col gap-4">

        {/* Query Settings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-[10px] tracking-widest text-gray-400 font-semibold">QUERY DEFAULTS</div>
          <div className="px-4">
            <Field label="Default Result Limit" desc="Max rows returned when no number is specified">
              <select
                value={settings.defaultLimit}
                onChange={(e) => setSettings({ ...settings, defaultLimit: e.target.value })}
                className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 bg-white outline-none"
              >
                {["5", "10", "20", "50"].map((v) => <option key={v} value={v}>{v} rows</option>)}
              </select>
            </Field>
            <Field label="Default Table" desc="Table to query when schema match is ambiguous">
              <select
                value={settings.defaultTable}
                onChange={(e) => setSettings({ ...settings, defaultTable: e.target.value })}
                className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 bg-white outline-none"
              >
                {["students", "marks", "courses"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Auto-run Suggestions" desc="Run query immediately on suggestion click">
              <Toggle value={settings.autoRunSuggestions} onChange={(v) => setSettings({ ...settings, autoRunSuggestions: v })} />
            </Field>
          </div>
        </div>

        {/* Display */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-[10px] tracking-widest text-gray-400 font-semibold">DISPLAY</div>
          <div className="px-4">
            <Field label="Show Confidence Scores" desc="Display schema match % in the right panel">
              <Toggle value={settings.showConfidence} onChange={(v) => setSettings({ ...settings, showConfidence: v })} />
            </Field>
          </div>
        </div>

        {/* Backend */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-[10px] tracking-widest text-gray-400 font-semibold">BACKEND</div>
          <div className="px-4 py-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-800">Backend URL</div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">http://localhost:8000</div>
              </div>
              <button
                onClick={checkHealth}
                className="text-[11px] border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
              >Ping</button>
            </div>
            {health && (
              <div className={`text-[11px] px-3 py-2 rounded-lg ${health.startsWith("OK") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                {health}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-800">Model</div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">all-MiniLM-L6-v2</div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded">Loaded</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-800">Database</div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">academic.db · SQLite</div>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded">READ-ONLY</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-[10px] tracking-widest text-gray-400 font-semibold">ABOUT</div>
          <div className="px-4 py-3 flex flex-col gap-1.5 text-[11px] text-gray-500">
            <div className="flex justify-between"><span>Project</span><span className="text-gray-800 font-semibold">NL2SQL CA</span></div>
            <div className="flex justify-between"><span>Stack</span><span className="text-gray-800 font-semibold">FastAPI · React · SQLite</span></div>
            <div className="flex justify-between"><span>NLP Model</span><span className="text-gray-800 font-semibold">all-MiniLM-L6-v2</span></div>
            <div className="flex justify-between"><span>Author</span><span className="text-gray-800 font-semibold">Ashwin S · LPU</span></div>
            <div className="flex justify-between"><span>Version</span><span className="text-gray-800 font-semibold">1.0.0</span></div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-gray-900 text-white hover:bg-gray-700 active:scale-95"}`}
        >
          {saved ? "✓ Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
