export default function HistoryPage({ history, onRerun, onClear }) {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm">No queries yet. Run something from the Query tab.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] tracking-widest text-gray-400 font-semibold">{history.length} QUERIES</span>
        <button
          onClick={onClear}
          className="text-[11px] text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
        >Clear All</button>
      </div>
      {[...history].reverse().map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{item.timestamp}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                item.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
              }`}>
                {item.success ? `${item.row_count} rows` : "Error"}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 font-semibold">{item.intent}</span>
            </div>
            <button
              onClick={() => onRerun(item.query)}
              className="text-[11px] text-gray-500 hover:text-gray-900 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50 transition-colors"
            >↩ Rerun</button>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-sm text-gray-800 font-medium mb-2">{item.query}</div>
            <div className="bg-[#161616] rounded-lg px-3 py-2 font-mono text-[11px] text-sky-300 overflow-x-auto whitespace-pre">
              {item.sql}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
