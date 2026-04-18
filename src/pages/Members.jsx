// ─── src/pages/Members.jsx ───────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, hasPermission, getVisibleMembers, createUserForMember } from '../lib/auth';
import { getMemberStageName } from '../lib/engine';
import { mkOverride, createMemberDefaults } from '../lib/members';
import { MemberAvatar, SmAvatar } from '../components/shared/Avatar';
import { StatusBadge, StageBadge } from '../components/shared/StatusBadge';

// ── Utility (needed by AddMemberModal) ───────────────────────────────────────
function suggestGroupForAddress(address, members, groups) {
  if (!address || address.trim().length < 4) return null;
  const addr  = address.toLowerCase();
  const words = addr.split(/[\s,]+/).filter(w => w.length > 3);
  if (words.length === 0) return null;
  const scored = groups.map(g => {
    const gm    = members.filter(m => g.memberIds?.includes(m.id) && m.homeAddress);
    const score = gm.reduce((s, m) => s + words.filter(w => m.homeAddress.toLowerCase().includes(w)).length, 0);
    return { group: g, score, count: gm.length };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

// ── Add Member Modal ──────────────────────────────────────────────────────────
function AddMemberModal({ groups, stages, members = [], onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', surname: '', phone: '', gender: '', email: '',
    maritalStatus: '', spouseId: null, spouseName: '', homeAddress: '',
    faithStatus: 'visitor', comment: '',
  });
  const [errors, setErrors]       = useState({});
  const [suggestion, setSuggestion] = useState(null);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const ic = k => `w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors[k] ? 'border-error bg-error-container/10' : 'border-outline-variant/30 bg-surface-container-low'}`;
  const sc = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';
  const lc = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block';

  const faithOptions = [
    { val: 'born_again',     icon: 'favorite',    desc: 'Committed believer', label: 'Born Again'     },
    { val: 'not_born_again', icon: 'help_outline', desc: 'Seeking faith',      label: 'Not Born Again' },
    { val: 'visitor',        icon: 'explore',      desc: 'First-time guest',   label: 'Visitor'        },
  ];

  useEffect(() => {
    setSuggestion(suggestGroupForAddress(form.homeAddress, members, groups));
  }, [form.homeAddress]);

  const validateStep1 = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.surname.trim())   e.surname   = 'Surname is required';
    if (!form.phone.trim())     e.phone     = 'Phone number is required';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required';
    return e;
  };

  const nextStep = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(2);
  };

  const submit = () => {
    const fullName  = `${form.firstName.trim()} ${form.surname.trim()}`;
    const initials  = [form.firstName[0], form.surname[0]].filter(Boolean).join('').toUpperCase();
    const colors    = ['#d5e3fd', '#d3e4fe', '#cfdef5', '#dde3e9'];
    const spouseId  = form.maritalStatus === 'married' ? form.spouseId || null : null;
    const spouseName = form.maritalStatus === 'married' ? form.spouseName.trim() || null : null;
    onSave(createMemberDefaults({
      name: fullName, initials,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      joinDate: new Date().toISOString().split('T')[0],
      currentStageIndex: 0,
      email: form.email.trim(), phone: form.phone.trim(),
      gender: form.gender, maritalStatus: form.maritalStatus,
      spouseId, spouseName, homeAddress: form.homeAddress.trim(),
      faithStatus: form.faithStatus, comment: form.comment.trim(),
      group: '', mentor: null, mentorId: null,
      tasks: Object.fromEntries(stages.map(s => [s.id, Array(s.requirements.length).fill(false)])),
      override: mkOverride(),
    }));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl mx-4 slide-in overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-7 pb-5 border-b border-surface-container flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">New Enrolment</p>
              <h3 className="text-xl font-bold font-headline">{step === 1 ? 'Personal Details' : 'Faith & Additional Info'}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-5">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${step >= s ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>
                  {step > s ? <span className="material-symbols-outlined text-sm ms-filled">check</span> : s}
                </div>
                <span className={`text-xs font-semibold ${step === s ? 'text-primary' : 'text-outline-variant'}`}>{s === 1 ? 'Personal' : 'Faith & Notes'}</span>
                {s < 2 && <div className={`w-8 h-px mx-1 ${step > s ? 'bg-primary' : 'bg-outline-variant/30'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-7 space-y-5 overflow-y-auto flex-1">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc}>First Name *</label>
                  <input value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="John" className={ic('firstName')} />
                  {errors.firstName && <p className="text-xs text-error mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className={lc}>Surname *</label>
                  <input value={form.surname} onChange={e => f('surname', e.target.value)} placeholder="Smith" className={ic('surname')} />
                  {errors.surname && <p className="text-xs text-error mt-1">{errors.surname}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc}>Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+27 71 000 0000" className={ic('phone')} />
                  {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className={lc}>Gender</label>
                  <select value={form.gender} onChange={e => f('gender', e.target.value)} className={sc}>
                    <option value="">Select gender</option>
                    <option>Male</option><option>Female</option><option>Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={lc}>Email *</label>
                <input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="john.smith@email.com" className={ic('email')} />
                {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc}>Marital Status</label>
                  <select value={form.maritalStatus} onChange={e => f('maritalStatus', e.target.value)} className={sc}>
                    <option value="">Select status</option>
                    <option value="single">Single</option><option value="married">Married</option>
                    <option value="divorced">Divorced</option><option value="widowed">Widowed</option>
                  </select>
                </div>
                {form.maritalStatus === 'married' && (
                  <div>
                    <label className={lc}>Spouse Name</label>
                    <input value={form.spouseName} onChange={e => f('spouseName', e.target.value)} placeholder="Spouse full name" className={sc} />
                  </div>
                )}
              </div>
              <div>
                <label className={lc}>Home Address</label>
                <textarea value={form.homeAddress} onChange={e => f('homeAddress', e.target.value)}
                  placeholder="123 Main Street, City, Province, 0000" rows={2}
                  className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              {suggestion && (
                <div className="flex items-start gap-3 px-4 py-3 bg-primary-container/20 border border-primary/20 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-sm flex-shrink-0 mt-0.5">location_on</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary">Homecell suggestion</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                      <strong>{suggestion.count} member{suggestion.count !== 1 ? 's' : ''}</strong> near this address are in{' '}
                      <strong>{suggestion.group.name}</strong>. Consider adding this person to that group.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-primary whitespace-nowrap px-2 py-1 bg-primary-container rounded-full flex-shrink-0">
                    {suggestion.group.name}
                  </span>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={lc}>Spiritual Status</label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  {faithOptions.map(opt => (
                    <button key={opt.val} type="button" onClick={() => f('faithStatus', opt.val)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${form.faithStatus === opt.val ? 'border-primary bg-primary-container/40 text-primary' : 'border-outline-variant/20 bg-surface-container-low hover:border-outline-variant text-on-surface-variant'}`}>
                      <span className={`material-symbols-outlined ${form.faithStatus === opt.val ? 'ms-filled' : ''}`}>{opt.icon}</span>
                      <span className="text-xs font-bold leading-tight">{opt.label}</span>
                      <span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lc}>Pastoral Comment</label>
                <textarea value={form.comment} onChange={e => f('comment', e.target.value)}
                  placeholder="Any notes, prayer requests, or observations…" rows={4}
                  className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                <p className="text-[10px] text-outline-variant mt-1">Visible only to pastoral staff.</p>
              </div>
            </>
          )}
        </div>

        <div className="p-6 pt-0 flex gap-3 justify-between flex-shrink-0 border-t border-surface-container mt-2">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span>Back
            </button>
          ) : (
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
          )}
          {step === 1 ? (
            <button onClick={nextStep} className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl shadow-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
              Next <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button onClick={submit} className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl shadow-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm ms-filled">person_add</span>Enrol Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Members Page ──────────────────────────────────────────────────────────────
export function Members({ members, groups, stages, setMembers, setUsers, setNewMemberCredentials, toast }) {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [search, setSearch]               = useState('');
  const [filterStage, setFilterStage]     = useState('All Stages');
  const [filterGroup, setFilterGroup]     = useState('All Groups');
  const [filterStatus, setFilterStatus]   = useState('All');
  const [showAdd, setShowAdd]             = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm]           = useState({});
  const [viewMode, setViewMode]           = useState('card');
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE = 10;

  const ef = (k, v) => setEditForm(p => ({ ...p, [k]: v }));

  const visibleMembers = getVisibleMembers(user, members, groups);
  const filtered = visibleMembers.filter(m => {
    const q = search.toLowerCase();
    return (
      (!q || m.name.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || (m.phone || '').includes(q)) &&
      (filterStage === 'All Stages' || getMemberStageName(m, stages) === filterStage) &&
      (filterGroup === 'All Groups' || m.group === filterGroup) &&
      (filterStatus === 'All' || m.enrollmentStage === filterStatus)
    );
  });

  useEffect(() => { setPage(1); }, [search, filterStage, filterGroup, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleAdd = data => {
    const nm = { ...data, id: Date.now() };
    setMembers(prev => [nm, ...prev]);
    const { user: nu, tempPassword } = createUserForMember(nm);
    setUsers(prev => prev.find(u => u.memberId === nm.id) ? prev : [...prev, nu]);
    setShowAdd(false);
    setNewMemberCredentials({ member: nm, email: nu.email, tempPassword });
  };

  const handleApprove = member => {
    if (!hasPermission(user, 'approve', member)) { toast('⛔ Permission denied'); return; }
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, enrollmentStage: 'approved', approvedBy: user.id, approvedAt: new Date().toISOString() } : m));
    toast(`✓ ${member.name} approved`);
  };

  const handleEditOpen = (m, e) => {
    e.stopPropagation();
    setEditingMember(m);
    setEditForm({
      name: m.name, phone: m.phone ?? '', email: m.email ?? '',
      maritalStatus: m.maritalStatus ?? '', spouseName: m.spouseName ?? '',
      faithStatus: m.faithStatus ?? 'visitor', comment: m.comment ?? '',
      homeAddress: m.homeAddress ?? '', avatarUrl: m.avatarUrl ?? null,
    });
  };

  const handleEditSave = () => {
    const updated = { ...editingMember, ...editForm };
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setEditingMember(null);
    toast(`✓ ${updated.name} updated`);
  };

  const handleDelete = (m, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${m.name}? This cannot be undone.`)) return;
    setMembers(prev => prev.filter(mb => mb.id !== m.id));
    setUsers(prev => prev.filter(u => u.memberId !== m.id));
    toast(`${m.name} removed`);
  };

  const stagePillCls  = idx => ['bg-blue-100 text-blue-700','bg-cyan-100 text-cyan-700','bg-violet-100 text-violet-700','bg-green-100 text-green-700'][idx] ?? 'bg-surface-container text-on-surface-variant';
  const enrollPillCls = es  => ({ new_applicant: 'bg-amber-100 text-amber-700', approved: 'bg-primary-container text-primary', in_discipleship: 'bg-green-100 text-green-700' })[es] ?? 'bg-surface-container text-on-surface-variant';
  const enrollLabel   = es  => ({ new_applicant: 'New', approved: 'Approved', in_discipleship: 'Blueprint' })[es] ?? es;

  return (
    <div className="fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-8">
        <span className="text-lg font-bold text-slate-800 font-headline">Members</span>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1 p-1 bg-surface-container-low rounded-lg">
            {[{ mode: 'card', icon: 'grid_view' }, { mode: 'list', icon: 'view_agenda' }].map(v => (
              <button key={v.mode} onClick={() => setViewMode(v.mode)}
                className={`p-1.5 rounded-md transition-all ${viewMode === v.mode ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-sm">{v.icon}</span>
              </button>
            ))}
          </div>
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-surface-container-low border-none rounded-full py-1.5 pl-9 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary/20 outline-none"
              placeholder="Search members..." />
          </div>
          {hasPermission(user, 'enrol') && (
            <button onClick={() => setShowAdd(true)}
              className="bg-primary hover:bg-primary-dim text-on-primary px-5 py-2 rounded-md flex items-center gap-2 font-semibold text-sm transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">add</span>Add Member
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface leading-none mb-2 font-headline">Members</h1>
            <p className="text-on-surface-variant">Manage your community's spiritual journey.</p>
          </div>
          <span className="text-on-surface-variant text-sm">{filtered.length} of {visibleMembers.length} members</span>
        </div>

        {/* Filters */}
        <div className="bg-surface-container-low rounded-xl p-6 mb-8 flex flex-wrap items-center gap-8">
          {[
            { label: 'Stage',     value: filterStage,  set: setFilterStage,  opts: ['All Stages',  ...stages.map(s => s.name)] },
            { label: 'Group',     value: filterGroup,  set: setFilterGroup,  opts: ['All Groups',  ...groups.map(g => g.name)] },
            { label: 'Lifecycle', value: filterStatus, set: setFilterStatus, opts: ['All', 'new_applicant', 'approved', 'in_discipleship'] },
          ].map(fi => (
            <div key={fi.label}>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">{fi.label}</label>
              <select value={fi.value} onChange={e => fi.set(e.target.value)}
                className="bg-transparent border-0 text-sm font-semibold text-primary focus:ring-0 cursor-pointer p-0 pr-6 outline-none">
                {fi.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Card view */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginated.map(m => (
              <div key={m.id} className="member-card bg-surface-container-lowest rounded-xl p-6 cursor-pointer" onClick={() => navigate(`/members/${m.id}`)}>
                <div className="flex items-start justify-between mb-5">
                  <div className="border-4 border-white shadow-sm rounded-2xl overflow-hidden"><MemberAvatar member={m} size={56} /></div>
                  <StatusBadge status={m.status} enrollmentStage={m.enrollmentStage} />
                </div>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-on-surface mb-1 font-headline">{m.name}</h3>
                  <p className="text-on-surface-variant text-sm">{m.group || <span className="italic text-outline-variant">New Enrolment</span>}</p>
                </div>
                <div className="pt-5 border-t border-surface-container flex items-center justify-between">
                  <StageBadge stageName={getMemberStageName(m, stages)} stageIndex={m.currentStageIndex} />
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={e => handleEditOpen(m, e)} className="p-1.5 rounded-lg hover:bg-primary-container/30 text-outline-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={e => handleDelete(m, e)} className="p-1.5 rounded-lg hover:bg-error-container/20 text-outline-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                {m.enrollmentStage === 'new_applicant' && hasPermission(user, 'approve', m) && (
                  <div className="mt-4 pt-4 border-t border-surface-container" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleApprove(m)} className="w-full py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                      <span className="material-symbols-outlined text-sm ms-filled">check_circle</span>Approve Member
                    </button>
                  </div>
                )}
              </div>
            ))}
            {hasPermission(user, 'enrol') && (
              <div onClick={() => setShowAdd(true)} className="border-2 border-dashed border-outline-variant/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/40 transition-all cursor-pointer group">
                <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-2 transition-colors text-3xl">person_add</span>
                <p className="text-sm font-semibold text-outline group-hover:text-primary transition-colors">Add New Member</p>
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low/70">
                  {['Member', 'Phone', 'Group', 'Stage', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-outline whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(m => (
                  <tr key={m.id} className="border-b border-surface-container hover:bg-surface-container-low/60 transition-colors group cursor-pointer" onClick={() => navigate(`/members/${m.id}`)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <MemberAvatar member={m} size={36} ring />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate leading-tight">{m.name}</p>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">{m.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-sm text-on-surface-variant">{m.phone || '—'}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-on-surface-variant truncate block max-w-[130px]">{m.group || <span className="italic text-outline-variant">None</span>}</span></td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${stagePillCls(m.currentStageIndex)}`}>
                        {getMemberStageName(m, stages)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${enrollPillCls(m.enrollmentStage)}`}>
                        {enrollLabel(m.enrollmentStage)}
                      </span>
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => handleEditOpen(m, e)} className="p-1.5 rounded-lg text-outline-variant hover:text-primary hover:bg-primary-container/30 transition-colors">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={e => handleDelete(m, e)} className="p-1.5 rounded-lg text-outline-variant hover:text-error hover:bg-error-container/20 transition-colors">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        {m.enrollmentStage === 'new_applicant' && hasPermission(user, 'approve', m) && (
                          <button onClick={() => handleApprove(m)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-green-700 bg-green-100 hover:bg-green-200 transition-colors whitespace-nowrap flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs ms-filled">check_circle</span>Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">group_off</span>
                <p className="font-semibold text-sm">No members match your filters</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-on-surface">{filtered.length}</span> members
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === safePage ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border border-outline-variant/20'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddMemberModal groups={groups} stages={stages} members={members} onClose={() => setShowAdd(false)} onSave={handleAdd} />}

      {editingMember && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingMember(null)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 slide-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-7 pb-5 border-b border-surface-container flex justify-between items-start flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Edit Member</p>
                <h3 className="text-xl font-bold font-headline">{editingMember.name}</h3>
              </div>
              <button onClick={() => setEditingMember(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-7 space-y-4 overflow-y-auto flex-1">
              {/* Photo upload */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-3 block">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="rounded-full overflow-hidden flex-shrink-0 ring-4 ring-surface-container-low">
                    <MemberAvatar member={{ ...editingMember, avatarUrl: editForm.avatarUrl }} size={64} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      {editForm.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => ef('avatarUrl', ev.target.result);
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    {editForm.avatarUrl && <button onClick={() => ef('avatarUrl', null)} className="text-xs text-error hover:underline text-left px-1">Remove photo</button>}
                  </div>
                </div>
              </div>
              {[
                { label: 'Full Name',    key: 'name',          type: 'text'  },
                { label: 'Phone',        key: 'phone',         type: 'tel'   },
                { label: 'Email',        key: 'email',         type: 'email' },
                { label: 'Home Address', key: 'homeAddress',   type: 'text'  },
                { label: 'Spouse Name',  key: 'spouseName',    type: 'text'  },
              ].map(fi => (
                <div key={fi.key}>
                  <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">{fi.label}</label>
                  <input type={fi.type} value={editForm[fi.key] ?? ''} onChange={e => ef(fi.key, e.target.value)}
                    className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              ))}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">Marital Status</label>
                <select value={editForm.maritalStatus ?? ''} onChange={e => ef('maritalStatus', e.target.value)}
                  className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select status</option>
                  <option value="single">Single</option><option value="married">Married</option>
                  <option value="divorced">Divorced</option><option value="widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">Spiritual Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ val: 'born_again', label: 'Born Again' }, { val: 'not_born_again', label: 'Not Born Again' }, { val: 'visitor', label: 'Visitor' }].map(opt => (
                    <button key={opt.val} type="button" onClick={() => ef('faithStatus', opt.val)}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${editForm.faithStatus === opt.val ? 'border-primary bg-primary-container/30 text-primary' : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Pastoral Comment</label>
                <textarea value={editForm.comment ?? ''} onChange={e => ef('comment', e.target.value)}
                  rows={3} className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-surface-container flex gap-3 justify-end flex-shrink-0">
              <button onClick={() => setEditingMember(null)} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
              <button onClick={handleEditSave} className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm ms-filled">save</span>Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
