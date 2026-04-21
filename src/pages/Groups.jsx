// ─── src/pages/Groups.jsx ────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, hasPermission, hasBlueprintComplete, getLeaderGroupIds } from '../lib/auth';
import { checkEligibility, getMemberStageName } from '../lib/engine';
import { MemberAvatar, SmAvatar } from '../components/shared/Avatar';
import { StatusBadge } from '../components/shared/StatusBadge';

// =============================================================================
// CONSTANTS
// =============================================================================

export const GROUP_TYPES = {
  home_cell:   { label: 'Home Cell',   icon: 'home',     tabLabel: 'Home Cells',   color: 'bg-blue-100 text-blue-700',    iconBg: '#d3e4fe', iconColor: '#506076' },
  sunday_team: { label: 'Sunday Team', icon: 'church',   tabLabel: 'Sunday Teams', color: 'bg-amber-100 text-amber-700',  iconBg: '#fef3c7', iconColor: '#92400e' },
  ministry:    { label: 'Ministry',    icon: 'favorite', tabLabel: 'Ministries',   color: 'bg-purple-100 text-purple-700',iconBg: '#ede9fe', iconColor: '#5b21b6' },
  department:  { label: 'Department',  icon: 'category', tabLabel: 'Departments',  color: 'bg-green-100 text-green-700',  iconBg: '#dcfce7', iconColor: '#166534' },
};

const TABS = [
  { id: 'all',         label: 'All',          icon: 'apps'     },
  { id: 'home_cell',   label: 'Home Cells',   icon: 'home'     },
  { id: 'sunday_team', label: 'Sunday Teams', icon: 'church'   },
  { id: 'ministry',    label: 'Ministries',   icon: 'favorite' },
  { id: 'department',  label: 'Departments',  icon: 'category' },
];

// =============================================================================
// ELIGIBILITY MODAL
// =============================================================================

function EligibilityModal({ member, result, onClose, onOverride }) {
  const [showOverride, setShowOverride]     = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const isBlock = result.type === 'block';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden">
        <div className={`px-7 pt-7 pb-5 ${isBlock ? 'border-b-2 border-error/20' : 'border-b-2 border-amber-200'}`}>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isBlock ? 'bg-error-container' : 'bg-amber-100'}`}>
              <span className={`material-symbols-outlined text-sm ms-filled ${isBlock ? 'text-error' : 'text-amber-600'}`}>{isBlock ? 'block' : 'warning'}</span>
            </div>
            <h3 className="text-lg font-bold font-headline">{isBlock ? 'Not Eligible' : 'Warning'}</h3>
          </div>
          <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{result.message}</p>
        </div>
        <div className="px-7 py-5 space-y-2.5">
          {(result.failures || []).map((f, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${f.passed ? 'bg-green-50 text-green-700' : 'bg-error-container/20 text-error'}`}>
              <span className={`material-symbols-outlined text-sm ms-filled ${f.passed ? 'text-green-600' : 'text-error'}`}>{f.passed ? 'check_circle' : 'cancel'}</span>
              <span className="text-sm font-semibold">{f.label}</span>
            </div>
          ))}
        </div>
        {showOverride ? (
          <div className="px-7 pb-5 space-y-3">
            <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
              placeholder="Document the pastoral reason…" rows={3}
              className="w-full text-sm border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowOverride(false)} className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">Back</button>
              <button onClick={() => overrideReason.trim() && onOverride(overrideReason.trim())} disabled={!overrideReason.trim()}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors ${overrideReason.trim() ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-surface-container text-outline cursor-not-allowed'}`}>
                Confirm Override
              </button>
            </div>
          </div>
        ) : (
          <div className="px-7 pb-7 flex gap-3 border-t border-surface-container pt-5">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">Cancel</button>
            {(!result.allowed || result.type === 'warn') && (
              <button onClick={() => setShowOverride(true)} className="flex-1 py-2.5 text-sm font-semibold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>Override
              </button>
            )}
            {result.type === 'warn' && (
              <button onClick={() => onOverride(null)} className="flex-1 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors">Proceed Anyway</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ASSIGN LEADER MODAL
// Blueprint completion required. Pastor can override with documented reason.
// Automatically updates the user account's groupIds and role.
// =============================================================================

function AssignLeaderModal({ group, members, stages, users, setUsers, setGroups, onClose, toast, userRole }) {
  const [search, setSearch]                 = useState('');
  const [selected, setSelected]             = useState(null);
  const [showOverride, setShowOverride]     = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  const filtered = members
    .filter(m => m.id !== group.leaderId)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  const applyLeader = (member, overrideNote) => {
    // Update group
    setGroups(prev => prev.map(g =>
      g.id === group.id ? { ...g, leaderId: member.id, leader: member.name } : g
    ));
    // Remove old leader's groupId
    if (group.leaderId) {
      setUsers(prev => prev.map(u => {
        if (u.memberId !== group.leaderId) return u;
        const newIds = (u.groupIds ?? []).filter(id => id !== group.id);
        return { ...u, groupIds: newIds, role: newIds.length === 0 ? 'member' : u.role };
      }));
    }
    // Update new leader's user account
    setUsers(prev => prev.map(u => {
      if (u.memberId !== member.id) return u;
      const newIds = [...new Set([...(u.groupIds ?? []), group.id])];
      return { ...u, groupIds: newIds, role: 'leader' };
    }));
    toast(overrideNote ? `Leader appointed with override noted` : `✓ ${member.name} appointed as leader`);
    onClose();
  };

  const handleConfirm = () => {
    if (!selected) return;
    const complete = hasBlueprintComplete(selected, stages);
    if (!complete) {
      if (userRole !== 'pastor') {
        toast('⛔ Only the pastor can override Blueprint requirements for leader appointments.');
        return;
      }
      setOverrideTarget(selected);
      setShowOverride(true);
      return;
    }
    applyLeader(selected, null);
  };

  const handleRemove = () => {
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, leaderId: null, leader: 'Unassigned' } : g));
    if (group.leaderId) {
      setUsers(prev => prev.map(u => {
        if (u.memberId !== group.leaderId) return u;
        const newIds = (u.groupIds ?? []).filter(id => id !== group.id);
        return { ...u, groupIds: newIds, role: newIds.length === 0 ? 'member' : u.role };
      }));
    }
    toast('Leader removed');
    onClose();
  };

  if (showOverride) return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden">
        <div className="px-7 pt-7 pb-5 border-b border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-sm ms-filled">admin_panel_settings</span>
            </div>
            <h3 className="text-lg font-bold font-headline">Pastor Override Required</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <strong>{overrideTarget?.name}</strong> has not completed the full Blueprint. Document your reason for this appointment.
          </p>
        </div>
        <div className="px-7 py-5 space-y-3">
          <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} autoFocus
            placeholder="Pastoral reason for appointing this member as leader despite an incomplete Blueprint…" rows={4}
            className="w-full text-sm border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setShowOverride(false)} className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">Back</button>
            <button onClick={() => overrideReason.trim() && applyLeader(overrideTarget, overrideReason.trim())} disabled={!overrideReason.trim()}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${overrideReason.trim() ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-surface-container text-outline cursor-not-allowed'}`}>
              <span className="material-symbols-outlined text-sm">how_to_reg</span>Appoint Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-7 pb-4 border-b border-surface-container flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Appoint Leader</p>
              <h3 className="text-xl font-bold font-headline">{group.name}</h3>
              <p className="text-xs text-on-surface-variant mt-1">Full Blueprint completion required. <span className="text-amber-600 font-semibold">Incomplete = pastor override needed.</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="relative mt-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} autoFocus placeholder="Search members…"
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {group.leaderId && (
            <button onClick={handleRemove} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-error/20 hover:bg-error-container/5 transition-all text-left">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-outline text-sm">person_off</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Remove Current Leader</p>
                <p className="text-xs text-on-surface-variant">Currently: {group.leader}</p>
              </div>
            </button>
          )}
          {filtered.map(m => {
            const complete    = hasBlueprintComplete(m, stages);
            const isSelected  = selected?.id === m.id;
            const isCurrent   = m.id === group.leaderId;
            return (
              <button key={m.id} onClick={() => setSelected(isSelected ? null : m)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-primary bg-primary-container/20' : isCurrent ? 'border-green-200 bg-green-50' : 'border-transparent hover:bg-surface-container-low'}`}>
                <MemberAvatar member={m} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-on-surface">{m.name}</p>
                    {isCurrent && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Current</span>}
                  </div>
                  <p className="text-xs text-on-surface-variant">{m.group || 'No group'} · {getMemberStageName(m, stages)}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  {complete ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <span className="material-symbols-outlined text-xs ms-filled">verified</span>Blueprint ✓
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      <span className="material-symbols-outlined text-xs">warning</span>Incomplete
                    </span>
                  )}
                  {isSelected && <span className="material-symbols-outlined text-primary ms-filled text-sm">check_circle</span>}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-xs text-outline-variant py-8">No members found</p>}
        </div>

        <div className="p-5 border-t border-surface-container flex gap-3 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={!selected}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${selected ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-sm' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}>
            <span className="material-symbols-outlined text-sm ms-filled">how_to_reg</span>Appoint Leader
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CREATE ZONE MODAL
// =============================================================================

function CreateZoneModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const ic = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden">
        <div className="p-7 pb-5 border-b border-surface-container flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">New Zone</p>
            <h3 className="text-xl font-bold font-headline">Create Location Zone</h3>
            <p className="text-xs text-on-surface-variant mt-1">Zones group home cells by geographic area.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-7 space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Zone Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. Zone 4 — East Rand" className={ic} />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. East Rand — Boksburg, Germiston, Edenvale" className={ic} />
          </div>
        </div>
        <div className="p-6 border-t border-surface-container flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
          <button onClick={() => name.trim() && onSave({ name: name.trim(), description: desc.trim() })} disabled={!name.trim()}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${name.trim() ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-sm' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}>
            <span className="material-symbols-outlined text-sm">add_location</span>Create Zone
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CREATE GROUP MODAL
// =============================================================================

function CreateGroupModal({ defaultType, zones, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', type: defaultType || 'home_cell', zoneId: '', description: '', schedule: '' });
  const f  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const ic = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';
  const lc = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block';
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-7 pb-5 border-b border-surface-container flex justify-between items-start flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">New Group</p>
            <h3 className="text-xl font-bold font-headline">Create Group</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-7 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className={lc}>Group Name *</label>
            <input value={form.name} onChange={e => f('name', e.target.value)} autoFocus placeholder="e.g. Midrand Cell, Protocol Team…" className={ic} />
          </div>
          <div>
            <label className={lc}>Group Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GROUP_TYPES).map(([key, meta]) => (
                <button key={key} type="button" onClick={() => f('type', key)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${form.type === key ? 'border-primary bg-primary-container/20' : 'border-outline-variant/20 hover:border-outline-variant/40'}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta.iconBg, color: meta.iconColor }}>
                    <span className="material-symbols-outlined text-sm">{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface">{meta.label}</p>
                    <p className="text-[10px] text-on-surface-variant">{meta.tabLabel}</p>
                  </div>
                  {form.type === key && <span className="material-symbols-outlined text-primary ms-filled text-sm flex-shrink-0">check_circle</span>}
                </button>
              ))}
            </div>
          </div>
          {form.type === 'home_cell' && (
            <div>
              <label className={lc}>Zone (for Home Cells)</label>
              {(zones ?? []).length === 0 ? (
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-semibold">No zones exist yet. Create a zone first from the Home Cells tab.</p>
                </div>
              ) : (
                <select value={form.zoneId} onChange={e => f('zoneId', e.target.value)} className={ic}>
                  <option value="">No zone / assign later</option>
                  {(zones ?? []).map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              )}
            </div>
          )}
          <div>
            <label className={lc}>Description</label>
            <input value={form.description} onChange={e => f('description', e.target.value)} placeholder="Brief description" className={ic} />
          </div>
          <div>
            <label className={lc}>Meeting Schedule</label>
            <input value={form.schedule} onChange={e => f('schedule', e.target.value)} placeholder="e.g. Tuesdays 7pm" className={ic} />
          </div>
        </div>
        <div className="p-6 border-t border-surface-container flex gap-3 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${form.name.trim() ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-sm' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}>
            <span className="material-symbols-outlined text-sm">add</span>Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// GROUP CARD
// =============================================================================

function GroupCard({ g, members, onClick, onEdit, onDelete, canManage }) {
  const gMembers = members.filter(m => g.memberIds.includes(m.id));
  const meta     = GROUP_TYPES[g.type] ?? GROUP_TYPES.department;
  return (
    <div className="group-card bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 flex flex-col cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: g.iconBg ?? meta.iconBg, color: g.iconColor ?? meta.iconColor }}>
          <span className="material-symbols-outlined text-xl">{g.icon ?? meta.icon}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${meta.color}`}>{meta.label}</span>
      </div>
      <h4 className="text-base font-bold font-headline text-on-surface mb-1">{g.name}</h4>
      <p className="text-xs flex items-center gap-1 mb-3">
        <span className="material-symbols-outlined text-xs">person</span>
        {g.leader === 'Unassigned'
          ? <span className="text-amber-600 font-semibold">No leader assigned</span>
          : <span className="text-on-surface-variant">{g.leader}</span>}
      </p>
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>Progress</span><span className="text-primary">{g.avgProgression}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full progress-bar" style={{ width: `${g.avgProgression}%` }} />
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex -space-x-1.5">
            {gMembers.slice(0, 4).map(m => <MemberAvatar key={m.id} member={m} size={24} ring />)}
            {gMembers.length > 4 && <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">+{gMembers.length - 4}</div>}
          </div>
          <span className="text-xs text-slate-500 font-medium">{gMembers.length} members</span>
        </div>
      </div>
      {canManage && (
        <div className="mt-auto flex gap-2 pt-3 border-t border-surface-container" onClick={e => e.stopPropagation()}>
          <button onClick={onClick} className="flex-1 bg-surface-container-low text-on-surface py-2 rounded-md text-xs font-bold hover:bg-surface-container-high transition-all">View</button>
          <button onClick={onEdit} className="p-2 bg-surface-container-low text-on-surface-variant rounded-md hover:bg-primary-container hover:text-primary transition-all">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button onClick={onDelete} className="p-2 bg-surface-container-low text-on-surface-variant rounded-md hover:bg-error-container/30 hover:text-error transition-all">
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// GROUPS PAGE
// =============================================================================

export function Groups({ groups, setGroups, zones, setZones, members, setMembers, stages, rules, users, setUsers, toast }) {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const canManage = hasPermission(user, 'assign');

  const [activeTab, setActiveTab]           = useState('all');
  const [activeGroup, setActiveGroup]       = useState(null);
  const [search, setSearch]                 = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateZone, setShowCreateZone]   = useState(false);
  const [showAssignLeader, setShowAssignLeader] = useState(false);
  const [editingGroup, setEditingGroup]       = useState(null);
  const [editForm, setEditForm]               = useState({});
  const [showAddMember, setShowAddMember]     = useState(false);
  const [pendingMember, setPendingMember]     = useState(null);
  const [eligResult, setEligResult]           = useState(null);
  const [expandedZones, setExpandedZones]     = useState(() =>
    Object.fromEntries((zones ?? []).map(z => [z.id, true]))
  );

  const leaderGroupIds = getLeaderGroupIds(user);
  const scopedGroups   = user?.role === 'leader' ? groups.filter(g => leaderGroupIds.includes(g.id)) : groups;
  const filteredGroups = scopedGroups.filter(g =>
    (!search || g.name.toLowerCase().includes(search.toLowerCase())) &&
    (activeTab === 'all' || g.type === activeTab)
  );
  const getGroupMembers = g => members.filter(m => g.memberIds.includes(m.id));

  const handleCreateGroup = form => {
    const meta   = GROUP_TYPES[form.type] ?? GROUP_TYPES.department;
    const zoneId = form.type === 'home_cell' && form.zoneId ? Number(form.zoneId) : null;
    setGroups(prev => [...prev, {
      id: Date.now(), name: form.name, type: form.type, zoneId,
      icon: meta.icon, iconBg: meta.iconBg, iconColor: meta.iconColor,
      leader: 'Unassigned', leaderId: null, status: 'Active',
      description: form.description, schedule: form.schedule,
      memberIds: [], avgProgression: 0,
      servingTeam: form.type === 'sunday_team' || form.type === 'ministry',
    }]);
    setShowCreateGroup(false);
    toast('Group created');
  };

  const handleCreateZone = ({ name, description }) => {
    const nz = { id: Date.now(), name, description };
    setZones(prev => [...prev, nz]);
    setExpandedZones(prev => ({ ...prev, [nz.id]: true }));
    setShowCreateZone(false);
    toast('Zone created');
  };

  const handleEditGroup   = g => { setEditingGroup(g); setEditForm({ name: g.name, description: g.description, schedule: g.schedule }); };
  const handleSaveEdit    = () => {
    const oldName = editingGroup.name;
    const newName = editForm.name?.trim() ?? oldName;
    setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, ...editForm, name: newName } : g));
    // Sync member.group display name if the group was renamed
    if (newName !== oldName && setMembers) {
      setMembers(prev => prev.map(m =>
        m.group === oldName ? { ...m, group: newName } : m
      ));
    }
    setEditingGroup(null);
    toast('Group updated');
  };
  const handleDeleteGroup = g => { if (!window.confirm(`Delete "${g.name}"?`)) return; setGroups(prev => prev.filter(gr => gr.id !== g.id)); toast('Group deleted'); };

  const initiateAddMember = (member, group) => {
    const result = checkEligibility(member, rules, group.id, stages);
    if (result.type === 'allow') confirmAddMember(member, group);
    else { setPendingMember(member); setEligResult(result); }
  };
  const confirmAddMember  = (member, group) => {
    const tgt = group || activeGroup;
    // If home cell, remove member from any previous home cell first
    if (tgt.type === 'home_cell') {
      setGroups(prev => prev.map(g =>
        g.type === 'home_cell' && g.id !== tgt.id && g.memberIds.includes(member.id)
          ? { ...g, memberIds: g.memberIds.filter(id => id !== member.id) }
          : g
      ));
    }
    setGroups(prev => prev.map(g => g.id === tgt.id ? { ...g, memberIds: [...new Set([...g.memberIds, member.id])] } : g));
    if (activeGroup?.id === tgt.id) setActiveGroup(prev => ({ ...prev, memberIds: [...new Set([...prev.memberIds, member.id])] }));
    setPendingMember(null); setEligResult(null); setShowAddMember(false);
    toast(`${member.name} added to ${tgt.name}`);
  };
  const handleEligOverride = reason => { if (reason) toast(`Override: ${reason}`); confirmAddMember(pendingMember, activeGroup); };

  // ── GROUP DETAIL VIEW ──────────────────────────────────────────────────────
  if (activeGroup) {
    const g        = groups.find(gr => gr.id === activeGroup.id) ?? activeGroup;
    const gMembers = getGroupMembers(g);
    const meta     = GROUP_TYPES[g.type] ?? GROUP_TYPES.department;
    const zone     = (zones ?? []).find(z => z.id === g.zoneId);

    return (
      <>
        <div className="fade-in">
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center gap-4 px-8">
            <button onClick={() => setActiveGroup(null)} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>Groups & Teams
            </button>
            <span className="text-lg font-bold text-slate-800 font-headline">{g.name}</span>
          </div>

          <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="bg-surface-container-lowest rounded-2xl p-8 flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: g.iconBg ?? meta.iconBg, color: g.iconColor ?? meta.iconColor }}>
                <span className="material-symbols-outlined text-4xl">{g.icon ?? meta.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h2 className="text-2xl font-extrabold font-headline">{g.name}</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${meta.color}`}>{meta.label}</span>
                  {zone && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-blue-100 text-blue-700">{zone.name}</span>}
                </div>
                {g.description && <p className="text-on-surface-variant text-sm mb-3">{g.description}</p>}
                <div className="flex gap-4 text-sm text-on-surface-variant flex-wrap">
                  {g.schedule && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{g.schedule}</span>}
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span>{gMembers.length} members</span>
                </div>
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-outline">person</span>
                    <span className="text-sm text-on-surface-variant">Leader:</span>
                    {g.leader === 'Unassigned'
                      ? <span className="text-sm font-semibold text-amber-600">Unassigned</span>
                      : <span className="text-sm font-semibold text-on-surface">{g.leader}</span>}
                  </div>
                  {canManage && (
                    <button onClick={() => setShowAssignLeader(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary-container/30 rounded-lg hover:bg-primary-container/50 transition-colors">
                      <span className="material-symbols-outlined text-xs">{g.leaderId ? 'edit' : 'add'}</span>
                      {g.leaderId ? 'Change Leader' : 'Assign Leader'}
                    </button>
                  )}
                </div>
              </div>
              {canManage && (
                <button onClick={() => setShowAddMember(true)} className="bg-primary text-on-primary px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-primary-dim transition-colors flex items-center gap-2 flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">person_add</span>Add Member
                </button>
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/5">
              <h4 className="text-lg font-bold font-headline mb-6">{g.name} Roster</h4>
              {gMembers.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">group_off</span>
                  <p className="font-semibold">No members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-surface rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate(`/members/${m.id}`)}>
                      <div className="flex items-center gap-4">
                        <SmAvatar member={m} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{m.name}</p>
                            {m.id === g.leaderId && <span className="text-[10px] font-bold text-primary bg-primary-container/40 px-2 py-0.5 rounded-full">Leader</span>}
                          </div>
                          <p className="text-xs text-on-surface-variant">{getMemberStageName(m, stages)} Stage</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={m.status} enrollmentStage={m.enrollmentStage} />
                        <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showAddMember && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddMember(false)}>
            <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-7 pb-4 border-b border-surface-container flex-shrink-0 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Add to {g.name}</p>
                  <h3 className="text-xl font-bold font-headline">Select a Member</h3>
                </div>
                <button onClick={() => setShowAddMember(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {members.filter(m => !g.memberIds.includes(m.id)).map(m => {
                  const result = checkEligibility(m, rules, g.id, stages);
                  const si = result.type === 'allow' ? { icon: 'check_circle', cls: 'text-green-600 ms-filled' } : result.type === 'warn' ? { icon: 'warning', cls: 'text-amber-500 ms-filled' } : { icon: 'block', cls: 'text-error ms-filled' };
                  return (
                    <button key={m.id} onClick={() => { setShowAddMember(false); initiateAddMember(m, g); }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-surface-container-low transition-colors text-left">
                      <MemberAvatar member={m} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface">{m.name}</p>
                        <p className="text-xs text-on-surface-variant">{getMemberStageName(m, stages)} · {m.group || 'No group'}</p>
                      </div>
                      <span className={`material-symbols-outlined text-lg ${si.cls}`}>{si.icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {pendingMember && eligResult && (
          <EligibilityModal member={pendingMember} result={eligResult}
            onClose={() => { setPendingMember(null); setEligResult(null); }} onOverride={handleEligOverride} />
        )}
        {showAssignLeader && (
          <AssignLeaderModal group={g} members={members} stages={stages} users={users ?? []}
            setUsers={setUsers} setGroups={setGroups} userRole={user?.role}
            onClose={() => setShowAssignLeader(false)} toast={toast} />
        )}
      </>
    );
  }

  // ── GROUPS LIST ───────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-8">
        <span className="text-lg font-bold text-slate-800 font-headline">Groups & Teams</span>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-surface-container-low border-none rounded-full py-1.5 pl-9 pr-4 text-sm w-52 focus:ring-1 focus:ring-primary/20 outline-none" placeholder="Search groups..." />
          </div>
          {canManage && activeTab === 'home_cell' && (
            <button onClick={() => setShowCreateZone(true)} className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2 rounded-md flex items-center gap-2 font-semibold text-sm transition-all">
              <span className="material-symbols-outlined text-sm">add_location</span>New Zone
            </button>
          )}
          {canManage && (
            <button onClick={() => setShowCreateGroup(true)} className="bg-primary hover:bg-primary-dim text-on-primary px-5 py-2 rounded-md flex items-center gap-2 font-semibold text-sm transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">add</span>
              {activeTab === 'all' ? 'New Group' : `New ${GROUP_TYPES[activeTab]?.label ?? 'Group'}`}
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight">Groups & Teams</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Home cells, Sunday teams, ministries and departments.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-surface-container overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all whitespace-nowrap ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm">{t.icon}</span>
              {t.label}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container text-outline ml-0.5">
                {t.id === 'all' ? scopedGroups.length : scopedGroups.filter(g => g.type === t.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* HOME CELLS — zone-based layout */}
        {activeTab === 'home_cell' && (
          <div className="space-y-5">
            {/* Unassigned members warning */}
            {canManage && (() => {
              const cellIds = new Set(groups.filter(g => g.type === 'home_cell').flatMap(g => g.memberIds));
              const without = members.filter(m => !cellIds.has(m.id) && m.enrollmentStage !== 'new_applicant');
              if (!without.length) return null;
              return (
                <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="material-symbols-outlined text-amber-600 flex-shrink-0 mt-0.5">warning</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">{without.length} approved member{without.length !== 1 ? 's' : ''} not yet in a home cell</p>
                    <p className="text-xs text-amber-700 mt-0.5">{without.map(m => m.name).join(', ')}</p>
                  </div>
                </div>
              );
            })()}

            {(zones ?? []).length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">add_location</span>
                <p className="font-semibold">No zones defined yet</p>
                <p className="text-sm mt-1 opacity-70">Zones group home cells by geographic area.</p>
                {canManage && <button onClick={() => setShowCreateZone(true)} className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-md font-semibold text-sm hover:bg-primary-dim transition-colors">Create First Zone</button>}
              </div>
            ) : (zones ?? []).map(zone => {
              const zoneGroups = filteredGroups.filter(g => g.zoneId === zone.id);
              const isExpanded = expandedZones[zone.id] !== false;
              return (
                <div key={zone.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
                  <button onClick={() => setExpandedZones(prev => ({ ...prev, [zone.id]: !isExpanded }))}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-blue-700">location_on</span>
                      </div>
                      <div>
                        <h3 className="font-bold font-headline text-on-surface">{zone.name}</h3>
                        {zone.description && <p className="text-xs text-on-surface-variant">{zone.description}</p>}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 ml-2">
                        {zoneGroups.length} group{zoneGroups.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      {zoneGroups.length === 0 ? (
                        <div className="text-center py-8 text-on-surface-variant border border-dashed border-outline-variant/20 rounded-xl">
                          <span className="material-symbols-outlined text-3xl mb-2 block text-outline-variant">home</span>
                          <p className="text-sm font-semibold">No cells in this zone yet</p>
                          {canManage && <button onClick={() => setShowCreateGroup(true)} className="mt-2 text-xs font-bold text-primary hover:underline">+ Add a Home Cell</button>}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {zoneGroups.map(g => (
                            <GroupCard key={g.id} g={g} members={members} onClick={() => setActiveGroup(g)}
                              onEdit={e => { e.stopPropagation(); handleEditGroup(g); }}
                              onDelete={e => { e.stopPropagation(); handleDeleteGroup(g); }}
                              canManage={canManage} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredGroups.filter(g => !g.zoneId).length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Not assigned to a zone</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGroups.filter(g => !g.zoneId).map(g => (
                    <GroupCard key={g.id} g={g} members={members} onClick={() => setActiveGroup(g)}
                      onEdit={e => { e.stopPropagation(); handleEditGroup(g); }}
                      onDelete={e => { e.stopPropagation(); handleDeleteGroup(g); }}
                      canManage={canManage} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ALL OTHER TABS */}
        {activeTab !== 'home_cell' && (
          filteredGroups.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">{GROUP_TYPES[activeTab]?.icon ?? 'apps'}</span>
              <p className="font-semibold">{activeTab === 'all' ? 'No groups yet' : `No ${GROUP_TYPES[activeTab]?.tabLabel ?? 'groups'} yet`}</p>
              {canManage && <button onClick={() => setShowCreateGroup(true)} className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-md font-semibold text-sm hover:bg-primary-dim transition-colors">Create First Group</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredGroups.map(g => (
                <GroupCard key={g.id} g={g} members={members} onClick={() => setActiveGroup(g)}
                  onEdit={e => { e.stopPropagation(); handleEditGroup(g); }}
                  onDelete={e => { e.stopPropagation(); handleDeleteGroup(g); }}
                  canManage={canManage} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      {showCreateGroup && <CreateGroupModal defaultType={activeTab === 'all' ? 'home_cell' : activeTab} zones={zones ?? []} onClose={() => setShowCreateGroup(false)} onSave={handleCreateGroup} />}
      {showCreateZone  && <CreateZoneModal onClose={() => setShowCreateZone(false)} onSave={handleCreateZone} />}
      {editingGroup && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingGroup(null)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden">
            <div className="p-7 pb-5 border-b border-surface-container flex justify-between items-start">
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Edit Group</p><h3 className="text-xl font-bold font-headline">{editingGroup.name}</h3></div>
              <button onClick={() => setEditingGroup(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-7 space-y-4">
              {[{ label: 'Group Name', key: 'name' }, { label: 'Description', key: 'description' }, { label: 'Schedule', key: 'schedule' }].map(fi => (
                <div key={fi.key}>
                  <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">{fi.label}</label>
                  <input type="text" value={editForm[fi.key] ?? ''} onChange={e => setEditForm(p => ({ ...p, [fi.key]: e.target.value }))}
                    className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-surface-container flex gap-3 justify-end">
              <button onClick={() => setEditingGroup(null)} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">save</span>Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
