import { useEffect } from 'react';

export function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return (
    <div className="toast">
      <div className="bg-on-surface text-surface px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold">
        <span className="material-symbols-outlined text-green-400">check_circle</span>
        {msg}
      </div>
    </div>
  );
}