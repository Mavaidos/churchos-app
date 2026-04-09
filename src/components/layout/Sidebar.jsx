import { NavLink } from 'react-router-dom';
import { ROLE_META } from '../../lib/auth';

const allNav = [
  { to: '/',           icon: 'dashboard',                label: 'Dashboard',  roles: ['pastor','admin','leader'] },
  { to: '/members',    icon: 'group',                    label: 'Members',    roles: ['pastor','admin','leader'] },
  { to: '/groups',     icon: 'diversity_3',              label: 'Groups',     roles: ['pastor','admin','leader'] },
  { to: '/attendance', icon: 'fact_check',               label: 'Attendance', roles: ['pastor','admin','leader'] },
  { to: '/events',     icon: 'event',                    label: 'Events',     roles: ['pastor','admin','leader'] },
  { to: '/messages',   icon: 'forum',                    label: 'Messages',   roles: ['pastor','admin']          },
  { to: '/engine',     icon: 'settings_input_component', label: 'Blueprint',  roles: ['pastor','admin']          },
  { to: '/settings',   icon: 'settings',                 label: 'Settings',   roles: ['pastor','admin']          },
];

export function Sidebar({ user, onLogout }) {
  const nav  = allNav.filter(n => !user || n.roles.includes(user.role));
  const meta = ROLE_META[user?.role] ?? ROLE_META.member;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 flex flex-col p-4 gap-1 border-r border-slate-100 z-40">
      <div className="flex items-center gap-3 px-2 py-4 mb-2">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-on-primary">
          <span className="material-symbols-outlined ms-filled text-lg">church</span>
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-headline">ChurchOS</h2>
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Sanctuary Management</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {nav.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all w-full text-left ${
                isActive ? 'nav-active' : 'text-slate-500 hover:bg-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'ms-filled' : ''}`}>{n.icon}</span>
                <span>{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="border-t border-slate-100 pt-3 mt-2">
          <div className="px-3 py-2.5 rounded-xl bg-surface-container mb-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">{user.initials}</div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>
              <span className="material-symbols-outlined text-xs">{meta.icon}</span>
              {meta.label}
            </span>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-error-container/20 hover:text-error rounded-xl transition-all text-sm w-full text-left">
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}