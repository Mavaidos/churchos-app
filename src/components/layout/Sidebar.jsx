import { NavLink } from 'react-router-dom';
import { ROLE_META } from '../../lib/auth';
import { useBranding } from '../../lib/branding.jsx';

const allNav = [
  { to: '/',           icon: 'dashboard',                label: 'Dashboard',  roles: ['pastor', 'admin', 'leader'] },
  { to: '/members',    icon: 'group',                    label: 'Members',    roles: ['pastor', 'admin', 'leader'] },
  { to: '/groups',     icon: 'diversity_3',              label: 'Groups',     roles: ['pastor', 'admin', 'leader'] },
  { to: '/attendance', icon: 'fact_check',               label: 'Attendance', roles: ['pastor', 'admin', 'leader'] },
  { to: '/events',     icon: 'event',                    label: 'Events',     roles: ['pastor', 'admin', 'leader'] },
  { to: '/messages',   icon: 'forum',                    label: 'Messages',   roles: ['pastor', 'admin', 'leader'] },
  { to: '/engine',     icon: 'settings_input_component', label: 'Blueprint',  roles: ['pastor', 'admin']           },
  { to: '/settings',   icon: 'settings',                 label: 'Settings',   roles: ['pastor', 'admin']           },
];

export function Sidebar({ user, onLogout, churchSettings }) {
  const { branding } = useBranding();
  const nav  = allNav.filter(n => !user || n.roles.includes(user.role));
  const meta = ROLE_META[user?.role] ?? ROLE_META.member;

  // churchSettings takes priority over branding context
  const orgName = churchSettings?.name    || branding.orgName || 'ChurchOS';
  const tagline = churchSettings?.tagline || branding.tagline || 'Sanctuary Management';
  const logoUrl = churchSettings?.logoUrl ?? null;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 flex flex-col p-4 gap-1 border-r border-slate-100 z-40">

      {/* Logo block */}
      <div className="flex items-center gap-3 px-2 py-4 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-on-primary flex-shrink-0 overflow-hidden"
          style={{ background: logoUrl ? 'transparent' : `rgb(var(--c-primary))` }}>
          {logoUrl ? (
            <img src={logoUrl} alt={orgName} className="w-9 h-9 object-cover rounded-xl" />
          ) : branding.logoType === 'icon' ? (
            <span className="material-symbols-outlined ms-filled text-lg">{branding.logoIcon ?? 'church'}</span>
          ) : (
            <span className="font-black text-sm">{orgName.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-headline truncate">{orgName}</h2>
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold truncate">{tagline}</p>
        </div>
      </div>

      {/* Navigation */}
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

      {/* User card */}
      {user && (
        <div className="border-t border-slate-100 pt-3 mt-2">
          <div className="px-3 py-2.5 rounded-xl bg-surface-container mb-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0"
                style={{ background: `rgb(var(--c-primary))` }}>
                {user.initials}
              </div>
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
