import { useState } from "react";
import QueryInput from "./components/QueryInput";
import SchemaCard from "./components/SchemaCard";
import IntentCard from "./components/IntentCard";
import SQLCard from "./components/SQLCard";
import ExplanationCard from "./components/ExplanationCard";
import ResultsTable from "./components/ResultsTable";
import "./App.css";

const SAMPLES = [
  "show top 5 students by cgpa",
  "students with attendance below 75",
  "show CSE students",
  "count all students",
  "average cgpa of students",
];

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function runQuery(q) {
    const text = (q ?? query).trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>NL<span>2</span>SQL</h1>
        <p>Natural Language to SQL — Transformer-Based Semantic Query Generation</p>
        <div className="badge">✦ all-MiniLM-L6-v2 · Cosine Similarity · FastAPI</div>
      </header>

      <QueryInput
        value={query}
        onChange={setQuery}
        onSubmit={() => runQuery()}
        loading={loading}
        samples={SAMPLES}
        onSample={(s) => { setQuery(s); runQuery(s); }}
      />

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>Processing query with transformer model…</p>
        </div>
      )}

      {error && <div className="error-box">✗ {error}</div>}

      {data && (
        <>
          <div className="results-grid">
            <SchemaCard match={data.schema_match} />
            <IntentCard intent={data.preprocessed.intent} />
            <SQLCard sql={data.generated_sql} />
          </div>
          <ExplanationCard explanation={data.explanation} />
          <ResultsTable execution={data.execution} />
        </>
      )}

      {!loading && !data && !error && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <p>Enter a natural language query above to generate SQL</p>
        </div>
      )}
    </div>
  );
}
