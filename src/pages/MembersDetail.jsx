// ─── src/pages/MembersDetail.jsx ─────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, hasPermission } from '../lib/auth';
import { canAdvance, advanceMember, applyOverride, clearOverride, getMemberStageName } from '../lib/engine';
import { MemberAvatar, SmAvatar } from '../components/shared/Avatar';
import { StatusBadge, StageBadge } from '../components/shared/StatusBadge';

// ── Assign Mentor Modal ───────────────────────────────────────────────────────
function AssignMentorModal({ currentMember, members, stages, onClose, onAssign }) {
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(
    currentMember.mentorId ? { name: currentMember.mentor, id: currentMember.mentorId } : null
  );

  // Mentor must be at Build stage (index 3) with Leadership Training complete
  const eligible = members.filter(m =>
    m.id !== currentMember.id && m.status === 'active' &&
    m.currentStageIndex === 3 && m.tasks[4]?.[0] === true
  );
  const filtered = eligible.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.group || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-7 pb-4 border-b border-surface-container flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Mentorship</p>
              <h3 className="text-xl font-bold font-headline">Assign a Mentor</h3>
              <p className="text-xs text-on-surface-variant mt-1">Must be at Build stage with Leadership Training complete</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="relative mt-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
              placeholder="Search by name or group…"
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {currentMember.mentor && (
            <button onClick={() => setSelected(null)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selected === null ? 'border-error/40 bg-error-container/10' : 'border-transparent hover:bg-surface-container-low'}`}>
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-outline text-sm">person_off</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Remove Current Mentor</p>
                <p className="text-xs text-on-surface-variant">Currently: {currentMember.mentor}</p>
              </div>
              {selected === null && <span className="material-symbols-outlined text-error ml-auto ms-filled">check_circle</span>}
            </button>
          )}
          {filtered.map(mb => {
            const isSelected = selected?.id === mb.id;
            return (
              <button key={mb.id} onClick={() => setSelected({ name: mb.name, id: mb.id })}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-primary bg-primary-container/20' : 'border-transparent hover:bg-surface-container-low'}`}>
                <MemberAvatar member={mb} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface">{mb.name}</p>
                  <p className="text-xs text-on-surface-variant">{mb.group || 'No group'} · {getMemberStageName(mb, stages)}</p>
                </div>
                {isSelected && <span className="material-symbols-outlined text-primary ms-filled">check_circle</span>}
              </button>
            );
          })}
          {filtered.length === 0 && !currentMember.mentor && (
            <p className="text-center text-xs text-outline-variant py-8">No eligible mentors found.<br/>Mentors must be at Build stage with Leadership Training complete.</p>
          )}
        </div>
        <div className="p-5 border-t border-surface-container flex gap-3 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
          <button onClick={() => onAssign(selected?.name ?? null, selected?.id ?? null)}
            className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl shadow-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm ms-filled">how_to_reg</span>
            {selected ? 'Assign Mentor' : 'Remove Mentor'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Member Detail Page ────────────────────────────────────────────────────────
export function MemberDetail({ members, stages, setMembers, toast }) {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const id         = window.location.pathname.split('/').pop();
  const memberId   = parseInt(id);
  const found      = members.find(m => m.id === memberId);
  const [m, setM]  = useState(found);

  const [showAssignMentor, setShowAssignMentor] = useState(false);
  const [overrideDraft, setOverrideDraft]       = useState(false);
  const [overrideReason, setOverrideReason]     = useState('');

  if (!m) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8 fade-in">
      <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">person_off</span>
      <p className="font-semibold text-on-surface-variant">Member not found</p>
      <button onClick={() => navigate('/members')} className="mt-4 text-sm font-semibold text-primary hover:underline">Back to Members</button>
    </div>
  );

  const currentStageIdx = m.currentStageIndex ?? 0;
  const currentStage    = stages[currentStageIdx];
  const isLastStage     = currentStageIdx >= stages.length - 1;
  const activeTasks     = m.tasks[currentStage?.id] || [];
  const completedTasks  = activeTasks.filter(Boolean).length;
  const totalTasks      = currentStage?.requirements?.length ?? 0;
  const progress        = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  const canMove         = canAdvance(m, stages);
  const stageName       = getMemberStageName(m, stages);
  const mentor          = members.find(mb => mb.name === m.mentor);
  const overrideActive  = m.override?.enabled === true;

  const sync = updated => {
    setM(updated);
    setMembers(prev => prev.map(mb => mb.id === updated.id ? updated : mb));
  };

  const toggleTask = (stageId, taskIdx) => {
    const arr = [...(m.tasks[stageId] || [])];
    while (arr.length <= taskIdx) arr.push(false);
    arr[taskIdx] = !arr[taskIdx];
    sync({ ...m, tasks: { ...m.tasks, [stageId]: arr } });
    toast('Task updated');
  };

  const handleAdvance = () => {
    const result = advanceMember(m, stages);
    if (!result.success) { toast(`⛔ ${result.message}`); return; }
    sync(result.updatedMember);
    setOverrideDraft(false);
    setOverrideReason('');
    toast(`✓ ${m.name} advanced to ${stages[result.updatedMember.currentStageIndex]?.name}!`);
  };

  const handleApplyOverride = () => {
    if (!overrideReason.trim()) { toast('Please enter a reason'); return; }
    sync(applyOverride(m, user?.name ?? 'Admin', overrideReason.trim()));
    toast('Admin override enabled');
  };

  const handleClearOverride = () => {
    sync(clearOverride(m));
    setOverrideDraft(false);
    setOverrideReason('');
    toast('Override cleared');
  };

  const handleAssignMentor = (mentorName, mentorId) => {
    sync({ ...m, mentor: mentorName, mentorId: mentorId ?? null });
    setShowAssignMentor(false);
    toast(mentorName ? `Mentor assigned: ${mentorName}` : 'Mentor removed');
  };

  const faithMap = {
    born_again:     { label: 'Born Again',     cls: 'bg-green-100 text-green-700'                          },
    not_born_again: { label: 'Not Born Again', cls: 'bg-surface-container-high text-on-surface-variant'    },
    visitor:        { label: 'Visitor',        cls: 'bg-tertiary-container text-on-tertiary-container'     },
  };

  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center gap-4 px-8">
        <button onClick={() => navigate('/members')} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>Members
        </button>
        <span className="text-lg font-bold text-slate-800 font-headline">{m.name}</span>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-10">
        {/* Profile card */}
        <section className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="ring-4 ring-surface-container-low rounded-full overflow-hidden flex-shrink-0">
            <MemberAvatar member={m} size={112} />
          </div>
          <div className="flex-1 text-center md:text-left space-y-3">
            <h2 className="text-3xl font-extrabold font-headline tracking-tight">{m.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-on-surface-variant text-sm">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">mail</span>{m.email || '—'}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">phone</span>{m.phone || '—'}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">calendar_today</span>Joined {m.joinDate}</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
              {m.faithStatus && (() => {
                const fd = faithMap[m.faithStatus] ?? { label: m.faithStatus, cls: 'bg-surface-container-high text-on-surface-variant' };
                return <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${fd.cls}`}>{fd.label}</span>;
              })()}
              {m.gender && <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-surface-container-high text-on-surface-variant">{m.gender}</span>}
              {m.maritalStatus && <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-surface-container-high text-on-surface-variant">{m.maritalStatus}</span>}
            </div>
            <div className="flex gap-2 flex-wrap justify-center md:justify-start">
              <StatusBadge status={m.status} enrollmentStage={m.enrollmentStage} />
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded-full">{stageName} Stage</span>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            {!isLastStage && hasPermission(user, 'approve', m) && (
              <button onClick={handleAdvance} disabled={!canMove}
                className={`px-5 py-2.5 rounded-md font-semibold shadow-sm transition-all text-sm ${canMove ? 'bg-primary text-on-primary hover:bg-primary-dim cursor-pointer' : 'bg-surface-container-high text-outline cursor-not-allowed opacity-60'}`}>
                Advance Stage
              </button>
            )}
          </div>
        </section>

        {/* Journey stepper */}
        <section className="space-y-8">
          <h3 className="text-2xl font-bold font-headline">Blueprint Journey</h3>
          <div className="flex justify-between items-start px-4 relative">
            {stages.map((s, i) => {
              const done   = i < currentStageIdx;
              const active = i === currentStageIdx;
              const locked = i > currentStageIdx;
              return (
                <div key={s.id} className={`relative z-10 flex flex-col items-center gap-3 flex-1 ${locked ? 'opacity-40' : ''}`}>
                  {i > 0 && <div className={`absolute top-7 right-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 ${done ? 'bg-green-200' : 'bg-outline-variant/30'}`} />}
                  <div className={`flex items-center justify-center border-4 border-surface shadow-sm rounded-full ${done ? 'w-14 h-14 bg-green-100 text-green-700' : active ? 'w-16 h-16 bg-primary-container text-primary shadow-xl -mt-1' : 'w-14 h-14 bg-surface-container-high text-outline'}`}>
                    {done ? <span className="material-symbols-outlined">check</span> : locked ? <span className="material-symbols-outlined text-xl">lock</span> : <span className="material-symbols-outlined text-2xl">{s.icon}</span>}
                  </div>
                  <div className="text-center">
                    <p className={`font-headline font-bold ${active ? 'text-base' : 'text-sm'}`}>{s.name}</p>
                    <p className={`text-[11px] font-bold uppercase tracking-tighter ${done ? 'text-green-600' : active ? 'text-primary' : 'text-outline-variant'}`}>
                      {done ? 'Completed' : active ? 'In Progress' : 'Locked'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-8 border border-primary/5 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-xl font-bold font-headline">Current Focus: {stageName}</h4>
                <p className="text-sm text-on-surface-variant">{currentStage?.description}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold font-headline ${canMove ? 'text-green-600' : 'text-primary'}`}>{progress}%</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Stage Progress</p>
              </div>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-8">
              <div className={`h-full rounded-full progress-bar ${canMove ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-3">
              {(currentStage?.requirements || []).map((task, i) => {
                const done = activeTasks[i] === true;
                return (
                  <div key={i} onClick={() => toggleTask(currentStage.id, i)}
                    className={`task-row flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${done ? 'bg-surface-container-lowest border border-primary/10' : 'bg-surface-container-low hover:bg-surface-container-high'}`}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-primary' : 'border-2 border-primary/20 bg-white'}`}>
                      {done && <span className="material-symbols-outlined text-on-primary text-sm ms-filled">check</span>}
                    </div>
                    <p className={`font-semibold text-sm flex-1 ${done ? 'line-through opacity-50' : ''}`}>{task}</p>
                    {done && <span className="text-[10px] text-green-600 font-bold uppercase">Done</span>}
                  </div>
                );
              })}
            </div>
            {!isLastStage && (
              <div className="mt-8 pt-8 border-t border-surface-container space-y-3">
                {!canMove && !overrideActive && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-semibold">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Complete all {totalTasks} tasks to unlock advancement. ({completedTasks}/{totalTasks} done)
                  </div>
                )}
                <button onClick={handleAdvance} disabled={!canMove}
                  className={`w-full py-4 rounded-md font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-sm ${canMove ? 'bg-primary text-on-primary hover:bg-primary-dim cursor-pointer' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}>
                  {canMove ? (
                    <><span className="material-symbols-outlined text-sm">arrow_forward</span>Advance to {stages[currentStageIdx + 1]?.name} Stage</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">lock</span>Tasks Incomplete — Cannot Advance</>
                  )}
                </button>
              </div>
            )}
            {isLastStage && (
              <div className="mt-8 pt-8 border-t border-surface-container flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
                <span className="material-symbols-outlined ms-filled">verified</span>Blueprint Complete!
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {!isLastStage && hasPermission(user, 'approve', m) && (user?.role === 'pastor' || user?.role === 'admin') && (
              <div className={`rounded-xl p-6 border ${overrideActive ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-primary/5 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${overrideActive ? 'text-amber-600 ms-filled' : 'text-outline'}`}>admin_panel_settings</span>
                    <h5 className="font-headline font-bold text-sm">Admin Override</h5>
                  </div>
                  <input type="checkbox" className="apple-toggle" checked={overrideActive || overrideDraft}
                    onChange={e => {
                      if (!e.target.checked && overrideActive) handleClearOverride();
                      else if (!e.target.checked) { setOverrideDraft(false); setOverrideReason(''); }
                      else setOverrideDraft(true);
                    }} />
                </div>
                {overrideActive ? (
                  <div className="space-y-3">
                    <div className="text-xs text-amber-700 font-semibold space-y-1">
                      <p><strong>Reason:</strong> {m.override.reason}</p>
                      <p><strong>By:</strong> {m.override.overriddenBy}</p>
                    </div>
                    <button onClick={handleClearOverride} className="w-full py-2 text-xs font-bold text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors">Revoke Override</button>
                  </div>
                ) : overrideDraft ? (
                  <div className="space-y-3">
                    <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Reason for override…" rows={3}
                      className="w-full text-xs border border-outline-variant/30 bg-surface-container-low rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                    <button onClick={handleApplyOverride} className="w-full py-2.5 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">Apply Override</button>
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant leading-relaxed">Allows advancing a member regardless of task completion. Requires a documented reason.</p>
                )}
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-primary/5">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-headline font-bold text-sm">Assigned Mentor</h5>
                <button onClick={() => setShowAssignMentor(true)} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">{m.mentor ? 'edit' : 'add'}</span>
                  {m.mentor ? 'Change' : 'Assign'}
                </button>
              </div>
              {mentor ? (
                <div className="flex items-center gap-3">
                  <SmAvatar member={mentor} />
                  <div>
                    <p className="text-sm font-bold">{mentor.name}</p>
                    <p className="text-xs text-on-surface-variant">{mentor.group} · {getMemberStageName(mentor, stages)}</p>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAssignMentor(true)} className="w-full flex flex-col items-center justify-center py-5 rounded-xl border-2 border-dashed border-outline-variant/20 hover:border-primary/40 hover:bg-primary-container/10 transition-all group">
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors mb-1">person_add</span>
                  <p className="text-xs font-semibold text-outline group-hover:text-primary transition-colors">Assign a Mentor</p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAssignMentor && (
        <AssignMentorModal currentMember={m} members={members} stages={stages}
          onClose={() => setShowAssignMentor(false)} onAssign={handleAssignMentor} />
      )}
    </div>
  );
}
