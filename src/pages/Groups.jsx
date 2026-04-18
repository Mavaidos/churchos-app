// ─── src/pages/Groups.jsx ────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, hasPermission } from '../lib/auth';
import { checkEligibility, getMemberStageName } from '../lib/engine';
import { MemberAvatar, SmAvatar } from '../components/shared/Avatar';
import { StatusBadge } from '../components/shared/StatusBadge';

// ── Eligibility Modal ─────────────────────────────────────────────────────────
function EligibilityModal({ member, result, onClose, onOverride }) {
  const [showOverride, setShowOverride]   = useState(false);
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
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">{result.rule?.name}</p>
              <h3 className="text-lg font-bold font-headline">{isBlock ? 'Not Eligible' : 'Warning'}</h3>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{result.message}</p>
        </div>
        <div className="px-7 py-5 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Eligibility Check for {member.name}</p>
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
              placeholder="Document the pastoral reason for this override…" rows={3}
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

// ── Groups Page ───────────────────────────────────────────────────────────────
export function Groups({ groups, setGroups, members, stages, rules, toast }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch]           = useState('');
  const [activeGroup, setActiveGroup] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [pendingMember, setPendingMember] = useState(null);
  const [eligResult, setEligResult]   = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm]       = useState({});

  const scopedGroups = user?.role === 'leader' && user.groupId
    ? groups.filter(g => g.id === user.groupId) : groups;
  const filtered = scopedGroups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));
  const getGroupMembers = g => members.filter(m => g.memberIds.includes(m.id));

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    const icons = ['groups', 'star', 'bolt', 'explore'];
    const bg    = ['#d5e3fd', '#d3e4fe', '#cfdef5', '#dde3e9'];
    const i     = groups.length % 4;
    setGroups(prev => [...prev, {
      id: Date.now(), name: newGroupName, icon: icons[i], iconBg: bg[i],
      iconColor: '#515f74', leader: 'Unassigned', leaderId: null,
      status: 'Active', description: 'New ministry group', schedule: 'TBD',
      memberIds: [], avgProgression: 0,
    }]);
    setNewGroupName('');
    setShowNewGroup(false);
    toast('Group created');
  };

  const initiateAddMember = (member, group) => {
    const result = checkEligibility(member, rules, group.id, stages);
    if (result.type === 'allow') { confirmAddMember(member, group); }
    else { setPendingMember(member); setEligResult(result); }
  };

  const confirmAddMember = (member, group) => {
    const tgt = group || activeGroup;
    setGroups(prev => prev.map(g => g.id === tgt.id ? { ...g, memberIds: [...new Set([...g.memberIds, member.id])] } : g));
    if (activeGroup?.id === tgt.id) setActiveGroup(prev => ({ ...prev, memberIds: [...new Set([...prev.memberIds, member.id])] }));
    setPendingMember(null); setEligResult(null); setShowAddMember(false);
    toast(`${member.name} added to ${tgt.name}`);
  };

  const handleEligOverride = reason => {
    if (reason) toast(`Override logged: ${reason}`);
    confirmAddMember(pendingMember, activeGroup);
  };

  const handleEditGroup = g => {
    setEditingGroup(g);
    setEditForm({ name: g.name, description: g.description, schedule: g.schedule, leader: g.leader });
  };

  const handleSaveEdit = () => {
    setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, ...editForm } : g));
    setEditingGroup(null);
    toast('Group updated');
  };

  const handleDeleteGroup = g => {
    if (!window.confirm(`Delete "${g.name}"? This cannot be undone.`)) return;
    setGroups(prev => prev.filter(gr => gr.id !== g.id));
    toast('Group deleted');
  };

  // ── Group detail view ─────────────────────────────────────────────────────
  if (activeGroup) {
    const gMembers = getGroupMembers(activeGroup);
    return (
      <>
        <div className="fade-in">
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center gap-4 px-8">
            <button onClick={() => setActiveGroup(null)} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>All Groups
            </button>
            <span className="text-lg font-bold text-slate-800 font-headline">{activeGroup.name}</span>
          </div>
          <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="bg-surface-container-lowest rounded-2xl p-8 flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: activeGroup.iconBg, color: activeGroup.iconColor }}>
                <span className="material-symbols-outlined text-4xl">{activeGroup.icon}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold font-headline">{activeGroup.name}</h2>
                <p className="text-on-surface-variant text-sm mt-1">{activeGroup.description}</p>
                <div className="flex gap-4 mt-3 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{activeGroup.schedule}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">person</span>Leader: {activeGroup.leader}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span>{gMembers.length} members</span>
                </div>
              </div>
              <button onClick={() => setShowAddMember(true)} className="bg-primary text-on-primary px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">person_add</span>Add Member
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/5">
              <h4 className="text-lg font-bold font-headline mb-6">{activeGroup.name} Roster</h4>
              {gMembers.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">group_off</span>
                  <p className="font-semibold">No members yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-surface rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate(`/members/${m.id}`)}>
                      <div className="flex items-center gap-4">
                        <SmAvatar member={m} />
                        <div>
                          <p className="font-bold text-sm">{m.name}</p>
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
              <div className="p-7 pb-4 border-b border-surface-container flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Add to {activeGroup.name}</p>
                    <h3 className="text-xl font-bold font-headline">Select a Member</h3>
                    <p className="text-xs text-on-surface-variant mt-1">Eligibility rules will be checked automatically</p>
                  </div>
                  <button onClick={() => setShowAddMember(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {members.filter(m => !activeGroup.memberIds.includes(m.id)).map(m => {
                  const result = checkEligibility(m, rules, activeGroup.id, stages);
                  const si = result.type === 'allow' ? { icon: 'check_circle', cls: 'text-green-600 ms-filled' }
                    : result.type === 'warn' ? { icon: 'warning', cls: 'text-amber-500 ms-filled' }
                    : { icon: 'block', cls: 'text-error ms-filled' };
                  return (
                    <button key={m.id} onClick={() => { setShowAddMember(false); initiateAddMember(m, activeGroup); }}
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
          <EligibilityModal member={pendingMember} result={eligResult} targetName={activeGroup.name}
            onClose={() => { setPendingMember(null); setEligResult(null); }}
            onOverride={handleEligOverride} />
        )}
      </>
    );
  }

  // ── Groups list view ──────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-8">
        <span className="text-lg font-bold text-slate-800 font-headline">Groups & Teams</span>
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-surface-container-low border-none rounded-full py-1.5 pl-9 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary/20 outline-none"
              placeholder="Search groups..." />
          </div>
          {hasPermission(user, 'assign') && (
            <button onClick={() => setShowNewGroup(true)} className="bg-primary hover:bg-primary-dim text-on-primary px-5 py-2 rounded-md flex items-center gap-2 font-semibold text-sm transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">add</span>New Group
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight">Groups & Teams</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Manage your B-Groups and B-Teams.</p>
        </div>

        {showNewGroup && (
          <div className="bg-surface-container-lowest rounded-xl p-6 border-2 border-dashed border-primary/30 slide-in flex gap-4 items-center">
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name..." autoFocus
              onKeyDown={e => e.key === 'Enter' && createGroup()}
              className="flex-1 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low" />
            <button onClick={createGroup} className="bg-primary text-on-primary px-5 py-3 rounded-xl font-semibold text-sm hover:bg-primary-dim transition-colors">Create</button>
            <button onClick={() => setShowNewGroup(false)} className="text-on-surface-variant p-3"><span className="material-symbols-outlined">close</span></button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(g => {
            const gMembers = getGroupMembers(g);
            const statusColors = { Active: 'bg-green-100 text-green-700', 'Needs Review': 'bg-amber-100 text-amber-700' };
            return (
              <div key={g.id} className="group-card bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 flex flex-col cursor-pointer" onClick={() => setActiveGroup(g)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: g.iconBg, color: g.iconColor }}>
                    <span className="material-symbols-outlined text-2xl">{g.icon}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${statusColors[g.status] || 'bg-surface-container text-on-surface-variant'}`}>{g.status}</span>
                </div>
                <h4 className="text-xl font-bold font-headline text-on-surface mb-1">{g.name}</h4>
                <p className="text-slate-500 text-sm flex items-center gap-1 mb-6">
                  <span className="material-symbols-outlined text-sm">person</span>Leader: {g.leader}
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>Avg Progression</span>
                    <span className="text-primary">{g.avgProgression}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full progress-bar" style={{ width: `${g.avgProgression}%` }} />
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex -space-x-2">
                      {gMembers.slice(0, 3).map(m => <MemberAvatar key={m.id} member={m} size={28} ring />)}
                      {gMembers.length > 3 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{gMembers.length - 3}</div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{gMembers.length} Members</span>
                  </div>
                </div>
                <div className="mt-auto flex gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setActiveGroup(g)} className="flex-1 bg-surface-container-low text-on-surface py-2.5 rounded-md text-xs font-bold transition-all hover:bg-surface-container-high">View Details</button>
                  <button onClick={() => handleEditGroup(g)} className="p-2.5 bg-surface-container-low text-on-surface-variant rounded-md hover:bg-primary-container hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => handleDeleteGroup(g)} className="p-2.5 bg-surface-container-low text-on-surface-variant rounded-md hover:bg-error-container/30 hover:text-error transition-all">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Group Modal */}
        {editingGroup && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingGroup(null)}>
            <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden">
              <div className="p-7 pb-5 border-b border-surface-container flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Edit Group</p>
                  <h3 className="text-xl font-bold font-headline">{editingGroup.name}</h3>
                </div>
                <button onClick={() => setEditingGroup(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-7 space-y-4">
                {[
                  { label: 'Group Name',   key: 'name'        },
                  { label: 'Description',  key: 'description' },
                  { label: 'Schedule',     key: 'schedule'    },
                  { label: 'Leader Name',  key: 'leader'      },
                ].map(fi => (
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
                  <span className="material-symbols-outlined text-sm">save</span>Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
