import { useAuth, ROLE_META } from '../../lib/auth';

export function TopBar({ title, search, setSearch, onAdd, addLabel, extra }) {
  const { user } = useAuth();
  const meta = ROLE_META[user?.role] ?? ROLE_META.member;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-slate-800 font-headline tracking-tight">{title}</span>
        {extra}
      </div>
      <div className="flex items-center gap-4">
        {search !== undefined && (
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-surface-container-low border-none rounded-full py-1.5 pl-9 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary/20 outline-none"
              placeholder="Search..." />
          </div>
        )}
        <button className="hover:bg-slate-50 p-2 rounded-full transition-colors text-slate-600">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>
              <span className="material-symbols-outlined text-xs">{meta.icon}</span>
              {meta.label}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-on-primary">{user.initials}</div>
          </div>
        )}
        {onAdd && (
          <button onClick={onAdd} className="bg-primary hover:bg-primary-dim text-on-primary px-5 py-2 rounded-md flex items-center gap-2 font-semibold text-sm transition-all shadow-sm ml-2">
            <span className="material-symbols-outlined text-lg">add</span>
            {addLabel || 'Add'}
          </button>
        )}
      </div>
    </header>
  );
}