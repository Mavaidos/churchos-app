// ─── ChurchOS — App.jsx ──────────────────────────────────────────────────────
// React Router v7 — URL-based navigation
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// ── Lib ──────────────────────────────────────────────────────────────────────
import {
  AuthContext, useAuth,
  hasPermission, getVisibleMembers,
  canAccessFullApp, createUserForMember, hashPassword,
  ROLE_META,
} from './lib/auth';
import {
  canAdvance, advanceMember,
  applyOverride, clearOverride,
  getMemberStageName,
  checkEligibility,
} from './lib/engine';
import { mkOverride, createMemberDefaults } from './lib/members';
import {
  ENROLLMENT_STAGE_COLORS, ENROLLMENT_STAGE_LABELS,
  STAGE_COLORS, STAGE_ICONS,
} from './lib/constants';

// ── Data ─────────────────────────────────────────────────────────────────────
import { seedMembers, seedGroups, seedStages, seedRules, seedUsers } from './data/seed';

// ── Shared components ─────────────────────────────────────────────────────────
import { Avatar, SmAvatar }        from './components/shared/Avatar';
import { StatusBadge, StageBadge } from './components/shared/StatusBadge';
import { Toast }                   from './components/shared/Toast';
import { Sidebar }                 from './components/layout/Sidebar';

// ── Pages ────────────────────────────────────────────────────────────────────
import { Dashboard }  from './pages/Dashboard';
import { Events }     from './pages/Events';
import { Messages }   from './pages/Messages';
import { Attendance } from './pages/Attendance';
import { Settings }   from './pages/Settings';

// =============================================================================
// AUTH PAGES (no router — shown before shell mounts)
// =============================================================================

function LoginPage({ onLogin, users }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const quickLogins = [
    { label: 'Pastor',        email: 'pastor@church.org',  password: 'pastor123' },
    { label: 'Admin',         email: 'admin@church.org',   password: 'admin123'  },
    { label: 'Leader',        email: 'leader@church.org',  password: 'leader123' },
    { label: 'Member',        email: 'member@church.org',  password: 'member123' },
    { label: 'New (set pwd)', email: 'new@church.org',     password: 'set_me'    },
  ];

  const handleSubmit = () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Email and password are required.'); return; }
    setLoading(true);
    setTimeout(() => {
      const found = (users ?? seedUsers).find(u => u.email === email.trim().toLowerCase());
      if (!found) { setError('No account found with that email.'); setLoading(false); return; }
      const ok = found.mustSetPassword
        ? found.password === password
        : found.passwordHash === hashPassword(password) || found.password === password;
      if (!ok) { setError('Incorrect password.'); setLoading(false); return; }
      onLogin(found);
    }, 400);
  };

  const ic = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-in">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined ms-filled">church</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-on-surface tracking-tight font-headline">ChurchOS</h1>
            <p className="text-[9px] uppercase tracking-widest text-outline font-bold">Sanctuary Management</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-1">Welcome back</h2>
            <p className="text-sm text-on-surface-variant">Sign in to your workspace</p>
          </div>
          <div className="px-8 pb-8 space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@church.org" className={ic} autoFocus />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••" className={ic} />
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error-container/20 border border-error/20 rounded-xl text-error text-xs font-semibold">
                <span className="material-symbols-outlined text-sm">error</span>{error}
              </div>
            )}
            <button onClick={handleSubmit} disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${loading ? 'bg-primary/60 text-on-primary cursor-wait' : 'bg-primary text-on-primary hover:bg-primary-dim'}`}>
              {loading
                ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Signing in…</>
                : <><span className="material-symbols-outlined text-sm">login</span>Sign In</>}
            </button>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-widest text-outline text-center mb-3 font-bold">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {quickLogins.map(q => (
              <button key={q.label} onClick={() => { setEmail(q.email); setPassword(q.password); }}
                className="px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-xs font-semibold text-on-surface-variant hover:border-primary/30 hover:text-primary transition-all text-left">
                <span className="text-[10px] text-outline uppercase tracking-wider block font-bold">{q.label}</span>
                {q.email}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-[10px] text-outline-variant mt-8">© 2025 ChurchOS. Sanctuary Minimalism.</p>
      </div>
    </div>
  );
}

function FirstTimePasswordPage({ user, onComplete }) {
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirm]     = useState('');
  const [error, setError]             = useState('');
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const ic = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20';

  const handleSubmit = () => {
    setError('');
    if (!newPass.trim())         { setError('Password cannot be empty.');              return; }
    if (newPass.length < 6)      { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass)  { setError('Passwords do not match.');               return; }
    onComplete(hashPassword(newPass));
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-in">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined ms-filled">church</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-on-surface tracking-tight font-headline">ChurchOS</h1>
            <p className="text-[9px] uppercase tracking-widest text-outline font-bold">Sanctuary Management</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-surface-container">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-2xl ms-filled">lock_reset</span>
            </div>
            <h2 className="text-xl font-extrabold font-headline text-on-surface mb-1">Set Your Password</h2>
            <p className="text-sm text-on-surface-variant">Welcome, <strong>{user.name}</strong>. Please create a password to secure your account.</p>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="At least 6 characters" className={ic + ' pr-10'} autoFocus />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-sm">{showNew ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Repeat password" className={ic + ' pr-10'} />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-sm">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {confirmPass && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${newPass === confirmPass ? 'text-green-600' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-xs ms-filled">{newPass === confirmPass ? 'check_circle' : 'cancel'}</span>
                  {newPass === confirmPass ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error-container/20 border border-error/20 rounded-xl text-error text-xs font-semibold">
                <span className="material-symbols-outlined text-sm">error</span>{error}
              </div>
            )}
            <button onClick={handleSubmit}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-on-primary hover:bg-primary-dim transition-all shadow-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">check</span>Set Password & Continue
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-outline-variant mt-8">© 2025 ChurchOS. Sanctuary Minimalism.</p>
      </div>
    </div>
  );
}

function PendingApprovalPage({ user, member, onLogout }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md fade-in text-center">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined ms-filled">church</span>
          </div>
          <div className="text-left">
            <h1 className="text-xl font-extrabold text-on-surface tracking-tight font-headline">ChurchOS</h1>
            <p className="text-[9px] uppercase tracking-widest text-outline font-bold">Sanctuary Management</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-amber-600 text-3xl ms-filled">schedule</span>
          </div>
          <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-2">Pending Approval</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
            Your account is awaiting approval by a pastor or administrator.
          </p>
          {member && (
            <div className="bg-surface-container-low rounded-xl p-5 text-left mb-6 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Your Profile</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: member.avatarColor ?? '#d5e3fd', color: '#515f74' }}>{member.initials}</div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{member.name}</p>
                  <p className="text-xs text-on-surface-variant">{member.email || '—'}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-700">Awaiting Approval</span>
            </div>
          )}
          <button onClick={onLogout}
            className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">logout</span>Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ADD MEMBER MODAL
// =============================================================================

function AddMemberModal({ groups, stages, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', surname: '', phone: '', gender: '', email: '',
    maritalStatus: '', spouseId: null, spouseName: '', homeAddress: '',
    faithStatus: 'visitor', comment: '',
  });
  const [errors, setErrors] = useState({});
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const ic  = (k) => `w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors[k] ? 'border-error bg-error-container/10' : 'border-outline-variant/30 bg-surface-container-low'}`;
  const sc  = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';
  const lc  = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block';

  const faithOptions = [
    { val: 'born_again',     icon: 'favorite',    desc: 'Committed believer', label: 'Born Again'     },
    { val: 'not_born_again', icon: 'help_outline', desc: 'Seeking faith',     label: 'Not Born Again' },
    { val: 'visitor',        icon: 'explore',      desc: 'First-time guest',  label: 'Visitor'        },
  ];

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
    setErrors({}); setStep(2);
  };

  const submit = () => {
    const fullName   = `${form.firstName.trim()} ${form.surname.trim()}`;
    const initials   = [form.firstName[0], form.surname[0]].filter(Boolean).join('').toUpperCase();
    const colors     = ['#d5e3fd', '#d3e4fe', '#cfdef5', '#dde3e9'];
    const spouseId   = form.maritalStatus === 'married' ? (form.spouseId || null) : null;
    const spouseName = form.maritalStatus === 'married' ? (form.spouseName.trim() || null) : null;
    onSave(createMemberDefaults({
  name: fullName,
  initials,
  avatarColor: colors[Math.floor(Math.random() * colors.length)],
  joinDate: new Date().toISOString().split('T')[0],
  currentStageIndex: 0,
      email: form.email.trim(), phone: form.phone.trim(),
      gender: form.gender, maritalStatus: form.maritalStatus,
      spouseId, spouseName,
      homeAddress: form.homeAddress.trim(),
      faithStatus: form.faithStatus, comment: form.comment.trim(),
      group: '', mentor: null, mentorId: null,
      tasks: Object.fromEntries(stages.map(s => [s.id, Array(s.requirements.length).fill(false)])),
      override: mkOverride(),
    }));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl mx-4 slide-in overflow-hidden max-h-[92vh] flex flex-col">
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
                <span className={`text-xs font-semibold ${step === s ? 'text-primary' : 'text-outline-variant'}`}>
                  {s === 1 ? 'Personal' : 'Faith & Notes'}
                </span>
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
                    <input value={form.spouseName} onChange={e => f('spouseName', e.target.value)} placeholder="Spouse full name"
                      className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                )}
              </div>
              <div>
                <label className={lc}>Home Address</label>
                <textarea value={form.homeAddress} onChange={e => f('homeAddress', e.target.value)}
                  placeholder="123 Main Street, City, Province, 0000" rows={2}
                  className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
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
          {step === 2
            ? <button onClick={() => setStep(1)} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span>Back
              </button>
            : <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>}
          {step === 1
            ? <button onClick={nextStep} className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl shadow-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
                Next <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            : <button onClick={submit} className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl shadow-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm ms-filled">person_add</span>Enrol Member
              </button>}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MEMBERS PAGE
// =============================================================================

function Members({ members, groups, stages, setMembers, toast }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch]             = useState('');
  const [filterStage, setFilterStage]   = useState('All Stages');
  const [filterGroup, setFilterGroup]   = useState('All Groups');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAdd, setShowAdd]           = useState(false);

  const visibleMembers = getVisibleMembers(user, members, groups);
  const filtered = visibleMembers.filter(m => {
    const q = search.toLowerCase();
    return (
      (!q || m.name.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || (m.phone || '').includes(q)) &&
      (filterStage  === 'All Stages'  || getMemberStageName(m, stages) === filterStage) &&
      (filterGroup  === 'All Groups'  || m.group === filterGroup) &&
      (filterStatus === 'All'         || m.enrollmentStage === filterStatus)
    );
  });

  const handleAdd = (data) => {
    const nm = { ...data, id: Date.now() };
    setMembers(prev => [nm, ...prev]);
    setShowAdd(false);
    toast(`✓ ${nm.name} enrolled`);
  };

  const handleApprove = (member) => {
    if (!hasPermission(user, 'approve', member)) { toast('⛔ Permission denied'); return; }
    const updated = { ...member, enrollmentStage: 'approved', approvedBy: user.id, approvedAt: new Date().toISOString() };
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    toast(`✓ ${member.name} approved`);
  };

  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-8">
        <span className="text-lg font-bold text-slate-800 font-headline">Members</span>
        <div className="flex items-center gap-4">
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

        <div className="bg-surface-container-low rounded-xl p-6 mb-8 flex flex-wrap items-center gap-8">
          {[
            { label: 'Stage',     value: filterStage,  set: setFilterStage,  opts: ['All Stages',  ...stages.map(s => s.name)]  },
            { label: 'Group',     value: filterGroup,  set: setFilterGroup,  opts: ['All Groups',  ...groups.map(g => g.name)]  },
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(m => (
            <div key={m.id} className="member-card bg-surface-container-lowest rounded-xl p-6 cursor-pointer"
              onClick={() => navigate(`/members/${m.id}`)}>
              <div className="flex items-start justify-between mb-5">
                <div className="border-4 border-white shadow-sm rounded-2xl"><Avatar member={m} size={14} /></div>
                <StatusBadge status={m.status} enrollmentStage={m.enrollmentStage} />
              </div>
              <div className="mb-5">
                <h3 className="text-lg font-bold text-on-surface mb-1 font-headline">{m.name}</h3>
                <p className="text-on-surface-variant text-sm">{m.group || <span className="italic text-outline-variant">New Enrolment</span>}</p>
              </div>
              <div className="pt-5 border-t border-surface-container flex items-center justify-between">
                <StageBadge stageName={getMemberStageName(m, stages)} stageIndex={m.currentStageIndex} />
                <span className="text-xs text-on-surface-variant">{m.joinDate.slice(0, 7)}</span>
              </div>
              {m.enrollmentStage === 'new_applicant' && hasPermission(user, 'approve', m) && (
                <div className="mt-4 pt-4 border-t border-surface-container" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleApprove(m)}
                    className="w-full py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-sm ms-filled">check_circle</span>Approve Member
                  </button>
                </div>
              )}
            </div>
          ))}
          {hasPermission(user, 'enrol') && (
            <div className="border-2 border-dashed border-outline-variant/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/40 transition-all cursor-pointer group"
              onClick={() => setShowAdd(true)}>
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:bg-primary-container group-hover:text-primary transition-colors mb-3">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <p className="text-sm font-bold text-outline group-hover:text-primary">Add New Member</p>
            </div>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">group_off</span>
            <p className="font-semibold">No members match the selected filters</p>
          </div>
        )}
      </div>
      {showAdd && <AddMemberModal groups={groups} stages={stages} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
    </div>
  );
}

// =============================================================================
// MEMBER DETAIL (PROFILE) — now at /members/:id
// =============================================================================

function AssignMentorModal({ currentMember, members, stages, onClose, onAssign }) {
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(currentMember.mentorId ? { name: currentMember.mentor, id: currentMember.mentorId } : null);

  // Mentor must be at Build stage (index 3, stage id 4)
// AND have completed task[0] = "Complete Leadership Training"
const eligible = members.filter(m =>
  m.id !== currentMember.id &&
  m.status === 'active' &&
  m.currentStageIndex === 3 &&
  m.tasks[4]?.[0] === true
);
  const filtered = eligible.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.group || '').toLowerCase().includes(search.toLowerCase()));

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
            <input value={search} onChange={e => setSearch(e.target.value)} autoFocus placeholder="Search by name or group…"
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
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: mb.avatarColor, color: '#515f74' }}>{mb.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface">{mb.name}</p>
                  <p className="text-xs text-on-surface-variant">{mb.group || 'No group'} · {getMemberStageName(mb, stages)}</p>
                </div>
                {isSelected && <span className="material-symbols-outlined text-primary ms-filled">check_circle</span>}
              </button>
            );
          })}
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

function MemberDetail({ members, stages, setMembers, toast }) {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { id }      = { id: window.location.pathname.split('/').pop() };
  const memberId    = parseInt(id);
  const found       = members.find(m => m.id === memberId);
  const [m, setM]   = useState(found);

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

  const sync = (updated) => {
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
    setOverrideDraft(false); setOverrideReason('');
    toast(`✓ ${m.name} advanced to ${stages[result.updatedMember.currentStageIndex]?.name}!`);
  };

  const handleApplyOverride = () => {
    if (!overrideReason.trim()) { toast('Please enter a reason'); return; }
    sync(applyOverride(m, user?.name ?? 'Admin', overrideReason.trim()));
    toast('Admin override enabled');
  };

  const handleClearOverride = () => {
    sync(clearOverride(m)); setOverrideDraft(false); setOverrideReason('');
    toast('Override cleared');
  };

  const handleAssignMentor = (mentorName, mentorId) => {
    sync({ ...m, mentor: mentorName, mentorId: mentorId ?? null });
    setShowAssignMentor(false);
    toast(mentorName ? `Mentor assigned: ${mentorName}` : 'Mentor removed');
  };

  const faithMap = {
    born_again:     { label: 'Born Again',     cls: 'bg-green-100 text-green-700' },
    not_born_again: { label: 'Not Born Again', cls: 'bg-surface-container-high text-on-surface-variant' },
    visitor:        { label: 'Visitor',        cls: 'bg-tertiary-container text-on-tertiary-container' },
  };

  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center gap-4 px-8">
        <button onClick={() => navigate('/members')}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>Members
        </button>
        <span className="text-lg font-bold text-slate-800 font-headline">{m.name}</span>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-10">
        {/* Profile card */}
        <section className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="w-28 h-28 rounded-full flex items-center justify-center font-bold text-3xl ring-4 ring-surface-container-low font-headline"
            style={{ background: m.avatarColor, color: '#515f74' }}>{m.initials}</div>
          <div className="flex-1 text-center md:text-left space-y-3">
            <h2 className="text-3xl font-extrabold font-headline tracking-tight">{m.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-on-surface-variant text-sm">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">mail</span>{m.email || '—'}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">phone</span>{m.phone || '—'}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">calendar_today</span>Joined {m.joinDate}</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
              {m.faithStatus && (() => { const fd = faithMap[m.faithStatus] ?? { label: m.faithStatus, cls: 'bg-surface-container-high text-on-surface-variant' }; return <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${fd.cls}`}>{fd.label}</span>; })()}
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
              const done = i < currentStageIdx, active = i === currentStageIdx, locked = i > currentStageIdx;
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
                  {canMove
                    ? <><span className="material-symbols-outlined text-sm">arrow_forward</span>Advance to {stages[currentStageIdx + 1]?.name} Stage</>
                    : <><span className="material-symbols-outlined text-sm">lock</span>Tasks Incomplete — Cannot Advance</>}
                </button>
              </div>
            )}
            {isLastStage && (
              <div className="mt-8 pt-8 border-t border-surface-container flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
                <span className="material-symbols-outlined ms-filled">verified</span>Blueprint Complete!
              </div>
            )}
          </div>

          {/* Sidebar panels */}
          <div className="space-y-6">
            {!isLastStage && hasPermission(user, 'approve', m) && (user?.role === 'pastor' || user?.role === 'admin') && (
              <div className={`rounded-xl p-6 border ${overrideActive ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-primary/5 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${overrideActive ? 'text-amber-600 ms-filled' : 'text-outline'}`}>admin_panel_settings</span>
                    <h5 className="font-headline font-bold text-sm">Admin Override</h5>
                  </div>
                  <input type="checkbox" className="apple-toggle"
                    checked={overrideActive || overrideDraft}
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
                    <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                      placeholder="Reason for override…" rows={3}
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
                  <span className="material-symbols-outlined text-xs">{m.mentor ? 'edit' : 'add'}</span>{m.mentor ? 'Change' : 'Assign'}
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
                <button onClick={() => setShowAssignMentor(true)}
                  className="w-full flex flex-col items-center justify-center py-5 rounded-xl border-2 border-dashed border-outline-variant/20 hover:border-primary/40 hover:bg-primary-container/10 transition-all group">
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors mb-1">person_add</span>
                  <p className="text-xs font-semibold text-outline group-hover:text-primary transition-colors">Assign a Mentor</p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showAssignMentor && (
        <AssignMentorModal currentMember={m} members={members} stages={stages} onClose={() => setShowAssignMentor(false)} onAssign={handleAssignMentor} />
      )}
    </div>
  );
}

// =============================================================================
// GROUPS PAGE
// =============================================================================

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
              <button onClick={() => setShowOverride(true)}
                className="flex-1 py-2.5 text-sm font-semibold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5">
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

function Groups({ groups, setGroups, members, stages, rules, toast }) {
  const { user }                          = useAuth();
  const navigate                          = useNavigate();
  const [search, setSearch]               = useState('');
  const [activeGroup, setActiveGroup]     = useState(null);
  const [showNewGroup, setShowNewGroup]   = useState(false);
  const [newGroupName, setNewGroupName]   = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [pendingMember, setPendingMember] = useState(null);
  const [eligResult, setEligResult]       = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm]         = useState({});

  const scopedGroups  = (user?.role === 'leader' && user.groupId) ? groups.filter(g => g.id === user.groupId) : groups;
  const filtered      = scopedGroups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));
  const getGroupMembers = (g) => members.filter(m => g.memberIds.includes(m.id));

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    const icons = ['groups', 'star', 'bolt', 'explore'], bg = ['#d5e3fd', '#d3e4fe', '#cfdef5', '#dde3e9'], i = groups.length % 4;
    setGroups(prev => [...prev, { id: Date.now(), name: newGroupName, icon: icons[i], iconBg: bg[i], iconColor: '#515f74', leader: 'Unassigned', leaderId: null, status: 'Active', description: 'New ministry group', schedule: 'TBD', memberIds: [], avgProgression: 0 }]);
    setNewGroupName(''); setShowNewGroup(false); toast('Group created');
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

  const handleEligOverride = (reason) => {
    if (reason) toast(`Override logged: ${reason}`);
    confirmAddMember(pendingMember, activeGroup);
  };
  const handleEditGroup = (g) => {
  setEditingGroup(g);
  setEditForm({ name: g.name, description: g.description, schedule: g.schedule, leader: g.leader });
};

const handleSaveEdit = () => {
  setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, ...editForm } : g));
  setEditingGroup(null);
  toast('Group updated');
};

const handleDeleteGroup = (g) => {
  if (!window.confirm(`Delete "${g.name}"? This cannot be undone.`)) return;
  setGroups(prev => prev.filter(gr => gr.id !== g.id));
  toast('Group deleted');
};

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
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: activeGroup.iconBg, color: activeGroup.iconColor }}>
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
              <button onClick={() => setShowAddMember(true)}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
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
                    <div key={m.id} className="flex items-center justify-between p-4 bg-surface rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
                      onClick={() => navigate(`/members/${m.id}`)}>
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
                  const si = result.type === 'allow' ? { icon: 'check_circle', cls: 'text-green-600 ms-filled' } : result.type === 'warn' ? { icon: 'warning', cls: 'text-amber-500 ms-filled' } : { icon: 'block', cls: 'text-error ms-filled' };
                  return (
                    <button key={m.id} onClick={() => { setShowAddMember(false); initiateAddMember(m, activeGroup); }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-surface-container-low transition-colors text-left">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: m.avatarColor, color: '#515f74' }}>{m.initials}</div>
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

  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-8">
        <span className="text-lg font-bold text-slate-800 font-headline">Groups & Teams</span>
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-surface-container-low border-none rounded-full py-1.5 pl-9 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary/20 outline-none" placeholder="Search groups..." />
          </div>
          {hasPermission(user, 'assign') && (
            <button onClick={() => setShowNewGroup(true)}
              className="bg-primary hover:bg-primary-dim text-on-primary px-5 py-2 rounded-md flex items-center gap-2 font-semibold text-sm transition-all shadow-sm">
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
              <div key={g.id} className="group-card bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 flex flex-col cursor-pointer"
                onClick={() => setActiveGroup(g)}>
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
                      {gMembers.slice(0, 3).map(m => (
                        <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                          style={{ background: m.avatarColor, color: '#515f74' }}>{m.initials}</div>
                      ))}
                      {gMembers.length > 3 && <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{gMembers.length - 3}</div>}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{gMembers.length} Members</span>
                  </div>
                </div>
                <div className="mt-auto flex gap-2" onClick={e => e.stopPropagation()}>
  <button onClick={() => setActiveGroup(g)}
    className="flex-1 bg-surface-container-low text-on-surface py-2.5 rounded-md text-xs font-bold transition-all hover:bg-surface-container-high">
    View Details
  </button>
  <button onClick={() => handleEditGroup(g)}
    className="p-2.5 bg-surface-container-low text-on-surface-variant rounded-md hover:bg-primary-container hover:text-primary transition-all">
    <span className="material-symbols-outlined text-sm">edit</span>
  </button>
  <button onClick={() => handleDeleteGroup(g)}
    className="p-2.5 bg-surface-container-low text-on-surface-variant rounded-md hover:bg-error-container/30 hover:text-error transition-all">
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
                  { label: 'Group Name',   key: 'name',        type: 'text' },
                  { label: 'Description',  key: 'description', type: 'text' },
                  { label: 'Schedule',     key: 'schedule',    type: 'text' },
                  { label: 'Leader Name',  key: 'leader',      type: 'text' },
                ].map(fi => (
                  <div key={fi.key}>
                    <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">{fi.label}</label>
                    <input
                      type={fi.type}
                      value={editForm[fi.key] ?? ''}
                      onChange={e => setEditForm(p => ({ ...p, [fi.key]: e.target.value }))}
                      className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-surface-container flex gap-3 justify-end">
                <button onClick={() => setEditingGroup(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveEdit}
                  className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors flex items-center gap-2">
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

// =============================================================================
// BLUEPRINT ENGINE
// =============================================================================

function RuleCard({ rule, stages, groups, onDelete }) {
  const ac = {
    block: { bg: 'bg-error-container/30', text: 'text-error', icon: 'block', label: 'BLOCK' },
    warn:  { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'warning', label: 'WARN' },
    allow: { bg: 'bg-green-100', text: 'text-green-700', icon: 'check_circle', label: 'ALLOW' },
  }[rule.action.type] || { bg: 'bg-error-container/30', text: 'text-error', icon: 'block', label: 'BLOCK' };
  const targetName = rule.targetId === 'leadership' ? 'All Leadership' : groups.find(g => g.id === rule.targetId)?.name ?? `Target #${rule.targetId}`;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden hover:shadow-md transition-all group">
      <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-surface-container">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{rule.appliesTo}</span>
            <span className="text-outline-variant">·</span>
            <span className="text-[10px] font-bold text-primary">{targetName}</span>
          </div>
          <h4 className="text-base font-bold font-headline text-on-surface">{rule.name}</h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ac.bg} ${ac.text}`}>
            <span className="material-symbols-outlined text-xs ms-filled">{ac.icon}</span>{ac.label}
          </span>
          <button onClick={() => onDelete(rule.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error-container/20 rounded-lg transition-all">
            <span className="material-symbols-outlined text-sm text-outline-variant hover:text-error">delete</span>
          </button>
        </div>
      </div>
      <div className="px-6 py-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">IF ALL CONDITIONS MET</p>
        {rule.conditions.map((c, i) => {
          let label = '';
          if (c.type === 'stage')       label = `Stage ${c.operator === '>=' ? '≥' : '='} ${stages.find(s => s.id === c.value)?.name ?? '?'}`;
          else if (c.type === 'task')   label = `${stages.find(s => s.id === c.stageId)?.name ?? '?'} — all tasks complete`;
          else if (c.type === 'mentor') label = 'Mentor assigned';
          else if (c.type === 'group')  label = 'Group assigned';
          const condIcons = { stage: 'trending_up', task: 'task_alt', mentor: 'person', group: 'diversity_3' };
          return (
            <div key={i} className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-sm">{condIcons[c.type] || 'rule'}</span>
              <span className="font-medium">{label}</span>
            </div>
          );
        })}
      </div>
      <div className={`mx-6 mb-5 px-4 py-3 rounded-xl text-xs font-medium leading-relaxed ${ac.bg} ${ac.text}`}>{rule.action.message}</div>
    </div>
  );
}

function CreateRuleModal({ stages, groups, onClose, onSave }) {
  const [form, setForm]             = useState({ name: '', appliesTo: 'team', targetId: groups[0]?.id ?? '', action: { type: 'block', message: '' } });
  const [conditions, setConditions] = useState([{ id: `c-${Date.now()}`, type: 'stage', operator: '>=', value: stages[0]?.id ?? 1, stageId: null }]);
  const [errors, setErrors]         = useState({});
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addCondition    = () => setConditions(prev => [...prev, { id: `c-${Date.now()}-${prev.length}`, type: 'stage', operator: '>=', value: stages[0]?.id ?? 1, stageId: null }]);
  const removeCondition = (id) => { if (conditions.length <= 1) return; setConditions(prev => prev.filter(c => c.id !== id)); };
  const updateCondition = (id, patch) => setConditions(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const handleSave = () => {
    const e = {};
    if (!form.name.trim())           e.name    = 'Rule name is required';
    if (!form.action.message.trim()) e.message = 'Action message is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    const targetId = form.appliesTo === 'leadership' ? 'leadership' : Number(form.targetId);
    onSave({ id: `rule-${Date.now()}`, name: form.name.trim(), appliesTo: form.appliesTo, targetId, conditions, action: { type: form.action.type, message: form.action.message.trim() } });
  };

  const ic = (k) => `w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low ${errors[k] ? 'border-error' : 'border-outline-variant/30'}`;
  const lc = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block';
  const sc = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 slide-in overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-7 pb-5 border-b border-surface-container flex-shrink-0 flex justify-between items-start">
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Rules Engine</p><h3 className="text-xl font-bold font-headline">Create New Rule</h3></div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-7 space-y-6 overflow-y-auto flex-1">
          <div>
            <label className={lc}>Rule Name *</label>
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Worship Team Eligibility" className={ic('name')} />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Applies To</label>
              <select value={form.appliesTo} onChange={e => f('appliesTo', e.target.value)} className={sc}>
                <option value="team">Team</option><option value="group">Group</option><option value="leadership">Leadership</option>
              </select>
            </div>
            <div>
              <label className={lc}>Target</label>
              {form.appliesTo === 'leadership'
                ? <div className="border border-outline-variant/30 bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface-variant italic">All Leadership</div>
                : <select value={form.targetId} onChange={e => f('targetId', e.target.value)} className={sc}>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={lc + ' mb-0'}>Conditions (ALL must be met)</label>
              <button onClick={addCondition} className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">add</span>Add
              </button>
            </div>
            <div className="space-y-3">
              {conditions.map(cond => (
                <div key={cond.id} className="bg-surface-container-low rounded-xl p-4 space-y-3 relative">
                  {conditions.length > 1 && (
                    <button onClick={() => removeCondition(cond.id)} className="absolute top-3 right-3 p-1 hover:bg-error-container/20 rounded-lg">
                      <span className="material-symbols-outlined text-sm text-outline-variant hover:text-error">close</span>
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className={lc}>Field</label>
                      <select value={cond.type}
                        onChange={e => updateCondition(cond.id, { type: e.target.value, value: e.target.value === 'stage' ? (stages[0]?.id ?? 1) : null, stageId: null, operator: e.target.value === 'mentor' || e.target.value === 'group' ? 'exists' : '>=' })}
                        className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="stage">Stage</option><option value="task">Task</option><option value="mentor">Mentor</option><option value="group">Group</option>
                      </select>
                    </div>
                    <div>
                      <label className={lc}>Operator</label>
                      {cond.type === 'mentor' || cond.type === 'group'
                        ? <div className="border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm text-on-surface-variant italic">exists</div>
                        : cond.type === 'task'
                          ? <div className="border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm text-on-surface-variant italic">all complete</div>
                          : <select value={cond.operator} onChange={e => updateCondition(cond.id, { operator: e.target.value })}
                              className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none">
                              <option value=">=">≥ (or higher)</option><option value="==">= (exactly)</option>
                            </select>}
                    </div>
                  </div>
                  {cond.type === 'stage' && (
                    <div>
                      <label className={lc}>Required Stage</label>
                      <select value={cond.value} onChange={e => updateCondition(cond.id, { value: Number(e.target.value) })}
                        className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none">
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  {cond.type === 'task' && (
                    <div>
                      <label className={lc}>Stage whose tasks must be complete</label>
                      <select value={cond.stageId ?? ''} onChange={e => updateCondition(cond.id, { stageId: Number(e.target.value) })}
                        className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="">Select stage…</option>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className={lc}>Action when conditions are not met</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: 'block', l: '🚫 Block' }, { v: 'warn', l: '⚠️ Warn' }, { v: 'allow', l: '✅ Allow' }].map(a => (
                <button key={a.v} type="button" onClick={() => f('action', { ...form.action, type: a.v })}
                  className={`py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${form.action.type === a.v ? 'border-primary bg-primary-container/30 text-primary' : 'border-outline-variant/20 hover:border-outline-variant text-on-surface-variant'}`}>
                  {a.l}
                </button>
              ))}
            </div>
            <div>
              <label className={lc}>Message shown to admin *</label>
              <textarea value={form.action.message} onChange={e => f('action', { ...form.action, message: e.target.value })}
                placeholder="e.g. Member must be baptized before joining this team." rows={2}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low resize-none ${errors.message ? 'border-error' : 'border-outline-variant/30'}`} />
              {errors.message && <p className="text-xs text-error mt-1">{errors.message}</p>}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-surface-container flex gap-3 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl shadow-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">rule</span>Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

function Engine({ stages, setStages, rules, setRules, groups, toast }) {
  const [tab, setTab]                   = useState('journey');
  const [editingTask, setEditingTask]   = useState(null);
  const [taskDraft, setTaskDraft]       = useState('');
  const [newTaskDraft, setNewTaskDraft] = useState({});
  const [saved, setSaved]               = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [ruleFilter, setRuleFilter]     = useState('all');
  const [editingStageId, setEditingStageId] = useState(null);
  const [stageTitleDraft, setStageTitleDraft] = useState('');

  // ── Drag state ────────────────────────────────────────────────────────────
  const [dragStage, setDragStage]       = useState(null); // stage id being dragged
  const [dragTask, setDragTask]         = useState(null); // {stageId, taskIdx}
  const [dragOverStage, setDragOverStage] = useState(null);
  const [dragOverTask, setDragOverTask]   = useState(null);

  const colorMap     = { primary: '#d5e3fd', secondary: '#d3e4fe', tertiary: '#cfdef5' };
  const textColorMap = { primary: '#515f74', secondary: '#506076', tertiary: '#526073' };

  // ── Stage actions ─────────────────────────────────────────────────────────
  const toggleStage    = (id) => setStages(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  const toggleRequires = (id) => setStages(prev => prev.map(s => s.id === id ? { ...s, requiresPrevious: !s.requiresPrevious } : s));
  const deleteStage    = (id) => {
    if (stages.length <= 1) { toast('Cannot delete the only stage'); return; }
    if (!window.confirm('Delete this stage? This cannot be undone.')) return;
    setStages(prev => prev.filter(s => s.id !== id));
    toast('Stage removed');
  };
  const saveStageTitle = (id) => {
    if (!stageTitleDraft.trim()) return;
    setStages(prev => prev.map(s => s.id === id ? { ...s, name: stageTitleDraft.trim() } : s));
    setEditingStageId(null);
    toast('Stage name updated');
  };
  const addStage = () => {
    const icons = ['star', 'explore', 'bolt', 'emoji_events'];
    setStages(prev => [...prev, { id: Date.now(), name: `Stage ${prev.length + 1}`, icon: icons[prev.length % 4], color: 'primary', description: 'New growth stage', active: true, requiresPrevious: true, requirements: [] }]);
  };

  // ── Task actions ──────────────────────────────────────────────────────────
  const removeTask  = (stageId, idx) => setStages(prev => prev.map(s => s.id === stageId ? { ...s, requirements: s.requirements.filter((_, i) => i !== idx) } : s));
  const addTask     = (stageId) => {
    const d = newTaskDraft[stageId]?.trim();
    if (!d) return;
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, requirements: [...s.requirements, d] } : s));
    setNewTaskDraft(prev => ({ ...prev, [stageId]: '' }));
  };
  const updateTask  = (stageId, idx, val) => setStages(prev => prev.map(s => s.id === stageId ? { ...s, requirements: s.requirements.map((r, i) => i === idx ? val : r) } : s));
  const saveEngine  = () => { setSaved(true); toast('Blueprint saved'); setTimeout(() => setSaved(false), 2000); };

  // ── Stage drag handlers ───────────────────────────────────────────────────
  const onStageDragStart = (e, id) => {
    setDragStage(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onStageDragOver  = (e, id) => { e.preventDefault(); setDragOverStage(id); };
  const onStageDrop      = (e, targetId) => {
    e.preventDefault();
    if (!dragStage || dragStage === targetId) { setDragStage(null); setDragOverStage(null); return; }
    setStages(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(s => s.id === dragStage);
      const toIdx   = arr.findIndex(s => s.id === targetId);
      const [item]  = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    setDragStage(null); setDragOverStage(null);
    toast('Stage order updated');
  };

  // ── Task drag handlers ────────────────────────────────────────────────────
  const onTaskDragStart = (e, stageId, idx) => {
    setDragTask({ stageId, idx });
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };
  const onTaskDragOver  = (e, stageId, idx) => { e.preventDefault(); e.stopPropagation(); setDragOverTask({ stageId, idx }); };
  const onTaskDrop      = (e, stageId, toIdx) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragTask || dragTask.stageId !== stageId || dragTask.idx === toIdx) { setDragTask(null); setDragOverTask(null); return; }
    setStages(prev => prev.map(s => {
      if (s.id !== stageId) return s;
      const arr = [...s.requirements];
      const [item] = arr.splice(dragTask.idx, 1);
      arr.splice(toIdx, 0, item);
      return { ...s, requirements: arr };
    }));
    setDragTask(null); setDragOverTask(null);
  };

  const filteredRules = ruleFilter === 'all' ? rules : rules.filter(r => r.appliesTo === ruleFilter);

  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center px-8">
        <span className="text-lg font-bold text-slate-800 font-headline">{tab === 'journey' ? 'Blueprint Builder' : 'Rules Engine'}</span>
      </div>
      <div className="sticky top-16 z-20 bg-white border-b border-slate-100">
        <div className="flex max-w-4xl mx-auto px-10 gap-0">
          {[{ id: 'journey', label: 'Journey Builder', icon: 'route' }, { id: 'rules', label: 'Rules Engine', icon: 'rule' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'rules' ? (
        <div className="p-10 max-w-4xl mx-auto space-y-8 fade-in">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Rules Engine</h2>
              <p className="text-on-surface-variant text-sm max-w-lg leading-relaxed">Define eligibility rules for who can serve, lead, or join a group.</p>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-primary-dim transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">add</span>New Rule
            </button>
          </div>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            {[{ id: 'all', label: 'All Rules', icon: 'rule' }, { id: 'team', label: 'Serving', icon: 'music_note' }, { id: 'leadership', label: 'Leadership', icon: 'verified' }, { id: 'group', label: 'Groups', icon: 'diversity_3' }].map(fi => (
              <button key={fi.id} onClick={() => setRuleFilter(fi.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${ruleFilter === fi.id ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-sm">{fi.icon}</span>
                <span className="hidden sm:inline">{fi.label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container text-outline ml-1">{fi.id === 'all' ? rules.length : rules.filter(r => r.appliesTo === fi.id).length}</span>
              </button>
            ))}
          </div>
          {filteredRules.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">rule_folder</span>
              <p className="font-semibold">No rules defined</p>
              <button onClick={() => setShowCreate(true)} className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-md font-semibold text-sm hover:bg-primary-dim transition-colors">Create First Rule</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} stages={stages} groups={groups}
                  onDelete={(id) => { setRules(prev => prev.filter(r => r.id !== id)); toast('Rule removed'); }} />
              ))}
            </div>
          )}
          {showCreate && <CreateRuleModal stages={stages} groups={groups} onClose={() => setShowCreate(false)}
            onSave={r => { setRules(prev => [...prev, r]); setShowCreate(false); toast('Rule created'); }} />}
        </div>
      ) : (
        <div className="p-10 max-w-4xl mx-auto">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Blueprint Builder</h2>
              <p className="text-on-surface-variant leading-relaxed max-w-lg text-sm">
                Drag <span className="material-symbols-outlined text-sm align-middle">drag_indicator</span> to reorder stages and tasks. Click a stage name to rename it.
              </p>
            </div>
            <button onClick={saveEngine}
              className={`px-5 py-2.5 font-semibold text-sm rounded-md shadow-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-primary text-on-primary hover:bg-primary-dim'}`}>
              {saved ? '✓ Saved!' : 'Save Blueprint'}
            </button>
          </div>

          <div className="space-y-8">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                draggable
                onDragStart={e => onStageDragStart(e, stage.id)}
                onDragOver={e => onStageDragOver(e, stage.id)}
                onDrop={e => onStageDrop(e, stage.id)}
                onDragEnd={() => { setDragStage(null); setDragOverStage(null); }}
                className={`relative transition-all ${dragOverStage === stage.id && dragStage !== stage.id ? 'scale-[1.02] opacity-80' : ''}`}
              >
                {idx < stages.length - 1 && (
                  <div className="absolute left-7 top-[88px] bottom-[-32px] w-0.5 z-0"
                    style={{ background: 'repeating-linear-gradient(to bottom,#acb3b8 0%,#acb3b8 50%,transparent 50%,transparent 100%)', backgroundSize: '1px 10px' }} />
                )}
                <div className={`bg-surface-container-lowest rounded-2xl p-6 shadow-sm ring-1 ring-black/[0.03] hover:shadow-md relative z-10 border-l-4 transition-all ${stage.active ? 'border-primary' : 'border-outline-variant/30'} ${dragStage === stage.id ? 'opacity-40' : ''}`}>

                  {/* Stage header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      {/* Drag handle for stage */}
                      <span className="material-symbols-outlined text-outline-variant cursor-grab active:cursor-grabbing select-none">drag_indicator</span>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: colorMap[stage.color] || colorMap.primary, color: textColorMap[stage.color] || textColorMap.primary }}>
                        <span className="material-symbols-outlined text-2xl">{stage.icon}</span>
                      </div>
                      <div>
                        {/* Editable stage name */}
                        {editingStageId === stage.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={stageTitleDraft}
                              onChange={e => setStageTitleDraft(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveStageTitle(stage.id);
                                if (e.key === 'Escape') setEditingStageId(null);
                              }}
                              autoFocus
                              className="text-lg font-bold border-b-2 border-primary bg-transparent outline-none font-headline text-on-surface w-40"
                            />
                            <button onClick={() => saveStageTitle(stage.id)} className="text-primary hover:text-primary-dim">
                              <span className="material-symbols-outlined text-sm ms-filled">check_circle</span>
                            </button>
                            <button onClick={() => setEditingStageId(null)} className="text-outline-variant hover:text-on-surface">
                              <span className="material-symbols-outlined text-sm">cancel</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title">
                            <h3 className="text-lg font-bold font-headline text-on-surface">{stage.name}</h3>
                            <button
                              onClick={() => { setEditingStageId(stage.id); setStageTitleDraft(stage.name); }}
                              className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 hover:bg-surface-container rounded-lg">
                              <span className="material-symbols-outlined text-sm text-outline-variant hover:text-primary">edit</span>
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] font-bold uppercase text-outline-variant tracking-wider">Stage {String(idx + 1).padStart(2, '0')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-on-surface-variant">{stage.active ? 'Active' : 'Inactive'}</span>
                      <input type="checkbox" className="apple-toggle" checked={stage.active} onChange={() => toggleStage(stage.id)} />
                      <button onClick={() => deleteStage(stage.id)} className="ml-2 p-1.5 hover:bg-error-container/20 rounded-lg transition-colors text-outline-variant hover:text-error">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-xl ${stage.requiresPrevious && idx > 0 ? 'bg-primary-container/30 border border-primary-container' : 'bg-surface border border-transparent'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${stage.requiresPrevious && idx > 0 ? 'text-primary' : 'text-outline-variant'}`}>{stage.requiresPrevious && idx > 0 ? 'lock' : 'lock_open'}</span>
                        <span className={`text-sm font-medium ${stage.requiresPrevious && idx > 0 ? 'font-semibold text-primary' : ''}`}>{idx === 0 ? 'Entry point — no prerequisites' : 'Must complete previous stage'}</span>
                      </div>
                      {idx > 0 && <input type="checkbox" className="apple-toggle" checked={stage.requiresPrevious} onChange={() => toggleRequires(stage.id)} />}
                    </div>

                    <div className="pt-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Required Tasks — drag to reorder</h4>
                      <div className="space-y-1">
                        {stage.requirements.map((req, ri) => (
                          <div
                            key={ri}
                            draggable
                            onDragStart={e => onTaskDragStart(e, stage.id, ri)}
                            onDragOver={e => onTaskDragOver(e, stage.id, ri)}
                            onDrop={e => onTaskDrop(e, stage.id, ri)}
                            onDragEnd={() => { setDragTask(null); setDragOverTask(null); }}
                            className={`group flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              dragOverTask?.stageId === stage.id && dragOverTask?.idx === ri && dragTask?.idx !== ri
                                ? 'bg-primary-container/30 border border-primary/30'
                                : 'hover:bg-surface-container-low'
                            } ${dragTask?.stageId === stage.id && dragTask?.idx === ri ? 'opacity-40' : ''}`}
                          >
                            <span className="material-symbols-outlined text-outline-variant cursor-grab active:cursor-grabbing select-none">drag_indicator</span>
                            <div className="w-2 h-2 rounded-full bg-primary-dim flex-shrink-0" />
                            {editingTask?.stageId === stage.id && editingTask?.taskIdx === ri ? (
                              <input value={taskDraft} onChange={e => setTaskDraft(e.target.value)} autoFocus
                                onBlur={() => { updateTask(stage.id, ri, taskDraft); setEditingTask(null); }}
                                onKeyDown={e => { if (e.key === 'Enter') { updateTask(stage.id, ri, taskDraft); setEditingTask(null); } if (e.key === 'Escape') setEditingTask(null); }}
                                className="flex-1 border border-primary/30 rounded-md px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-sm flex-1">{req}</span>
                            )}
                            <button onClick={() => { setEditingTask({ stageId: stage.id, taskIdx: ri }); setTaskDraft(req); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-outline-variant text-sm hover:text-primary">edit</span>
                            </button>
                            <button onClick={() => removeTask(stage.id, ri)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-outline-variant text-sm hover:text-error">delete</span>
                            </button>
                          </div>
                        ))}

                        {/* Add new task row */}
                        <div className="flex items-center gap-3 p-3">
                          <span className="material-symbols-outlined text-outline-variant/30">drag_indicator</span>
                          <div className="w-2 h-2 rounded-full bg-outline-variant/30 flex-shrink-0" />
                          <input
                            value={newTaskDraft[stage.id] || ''}
                            onChange={e => setNewTaskDraft(prev => ({ ...prev, [stage.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addTask(stage.id)}
                            placeholder="Add new requirement…"
                            className="flex-1 text-sm text-on-surface-variant bg-transparent outline-none border-b border-outline-variant/20 pb-1 focus:border-primary placeholder:text-outline-variant" />
                          <button onClick={() => addTask(stage.id)} className="text-primary text-xs font-bold hover:underline whitespace-nowrap flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add</span>Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-4">
              <button onClick={addStage}
                className="group flex items-center gap-3 px-8 py-4 bg-surface-container-lowest rounded-full shadow-lg hover:shadow-xl transition-all border border-outline-variant/10 text-primary hover:scale-105 active:scale-95 duration-200">
                <span className="material-symbols-outlined">add_circle</span>
                <span className="font-bold text-sm">Add New Blueprint Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MEMBER PORTAL
// =============================================================================

function MemberPortal({ members, stages, setMembers, groups, toast, onLogout }) {
  const { user }                          = useAuth();
  const member                            = members.find(m => m.id === user?.memberId) ?? null;
  const [activePage, setActivePage]       = useState('journey');
  const [editing, setEditing]             = useState(false);
  const [draft, setDraft]                 = useState({});
  const [message, setMessage]             = useState('');
  const [msgSent, setMsgSent]             = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);

  const fd = (k, v) => setDraft(p => ({ ...p, [k]: v }));
  const openEdit = () => { if (!member) return; setDraft({ phone: member.phone ?? '', email: member.email ?? '', homeAddress: member.homeAddress ?? '' }); setEditing(true); };
  const saveEdit = () => { if (!member) return; const u = { ...member, ...draft }; setMembers(prev => prev.map(m => m.id === u.id ? u : m)); setEditing(false); toast('✓ Profile updated'); };
  const sendMessage = () => { if (!message.trim()) return; setMessage(''); setMsgSent(true); toast('✓ Message sent to your administrator'); setTimeout(() => setMsgSent(false), 4000); };

  const cc = 'bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden';
  const hc = 'px-8 py-5 border-b border-surface-container';
  const bc = 'px-8 py-6';
  const lc = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1 block';
  const ic = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20';

  const stageKey = member?.enrollmentStage ?? 'new_applicant';
  const SI = {
    new_applicant:   { label: 'New Applicant', msg: "You're on the list. Your pastor will review and approve your application soon.", icon: 'schedule',     color: 'text-amber-600', pill: 'bg-amber-100 text-amber-700',                       bg: 'bg-gradient-to-br from-amber-50 to-surface-container-lowest',              border: 'border-amber-200'   },
    approved:        { label: 'Approved',       msg: "You're in. Reach out to your group leader to begin your Blueprint journey.",    icon: 'verified',     color: 'text-primary',   pill: 'bg-primary-container text-on-primary-container',     bg: 'bg-gradient-to-br from-primary-container/20 to-surface-container-lowest', border: 'border-primary/20'  },
    in_discipleship: { label: 'In Blueprint',   msg: "You're on the journey. Keep engaging with your group and completing tasks.",    icon: 'auto_awesome', color: 'text-green-600', pill: 'bg-green-100 text-green-700',                        bg: 'bg-gradient-to-br from-green-50 to-surface-container-lowest',            border: 'border-green-200'   },
  };
  const si = SI[stageKey] ?? SI.new_applicant;
  const STEPS = [{ key: 'new_applicant', label: 'Enrolled' }, { key: 'approved', label: 'Approved' }, { key: 'in_discipleship', label: 'Blueprint' }];
  const stepIdx = STEPS.findIndex(s => s.key === stageKey);
  const faithLabel = f => ({ born_again: 'Born Again', not_born_again: 'Not Born Again', visitor: 'Visitor' }[f] ?? f ?? '—');

  const navItems = [
    { id: 'journey', icon: 'explore', label: 'Your Journey' },
    { id: 'info',    icon: 'person',  label: 'My Info'      },
    { id: 'contact', icon: 'mail',    label: 'Get in Touch' },
  ];

  if (!member) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-6 mx-auto">
            <span className="material-symbols-outlined text-outline text-3xl">person_off</span>
          </div>
          <h2 className="text-xl font-extrabold font-headline text-on-surface mb-2">Profile Not Found</h2>
          <p className="text-on-surface-variant text-sm max-w-xs mb-6">Your account is not linked to a member record yet.</p>
          <button onClick={onLogout} className="text-sm font-semibold text-primary hover:underline">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 flex flex-col p-4 gap-1 border-r border-slate-100 z-40">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined ms-filled text-lg">church</span>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-headline">ChurchOS</h2>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Sanctuary Management</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map(n => (
            <button key={n.id} onClick={() => setActivePage(n.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all w-full text-left ${activePage === n.id ? 'nav-active' : 'text-slate-500 hover:bg-slate-100'}`}>
              <span className={`material-symbols-outlined ${activePage === n.id ? 'ms-filled' : ''}`}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-100 pt-3 mt-2">
          <div className="px-3 py-2.5 rounded-xl bg-surface-container mb-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold flex-shrink-0">{member.initials}</div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate">{member.name}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
              <span className="material-symbols-outlined text-xs">person</span>Member
            </span>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-error-container/20 hover:text-error rounded-xl transition-all text-sm w-full text-left">
            <span className="material-symbols-outlined">logout</span><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="ml-64 flex-1 min-h-screen">
        <div className="p-8 max-w-xl">
          {activePage === 'journey' && (
            <div className="space-y-5 fade-in">
              <div>
                <h2 className="text-xl font-extrabold font-headline tracking-tight text-on-surface">{member.name.split(' ')[0]}'s Journey</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Here's where you are right now.</p>
              </div>
              <div className={`rounded-2xl border-2 ${si.border} ${si.bg} overflow-hidden`}>
                <div className="px-8 pt-7 pb-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/80 shadow-sm">
                      <span className={`material-symbols-outlined text-2xl ms-filled ${si.color}`}>{si.icon}</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">Where you are</p>
                      <h3 className="text-xl font-extrabold font-headline text-on-surface">{si.label}</h3>
                    </div>
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full flex-shrink-0 ${si.pill}`}>{si.label}</span>
                  </div>
                  <div className="bg-white/60 rounded-xl px-5 py-3 mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Next step for you</p>
                    <p className="text-sm text-on-surface leading-relaxed">{si.msg}</p>
                  </div>
                  <div className="flex items-center">
                    {STEPS.map((step, idx) => {
                      const done = idx < stepIdx, current = idx === stepIdx;
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-green-500 border-green-500 text-white' : current ? 'bg-primary border-primary text-on-primary' : 'bg-white/70 border-outline-variant/40 text-outline-variant'}`}>
                              {done ? <span className="material-symbols-outlined text-xs ms-filled">check</span> : <span className="text-[11px] font-bold">{idx + 1}</span>}
                            </div>
                            <span className={`text-[10px] font-semibold whitespace-nowrap ${current ? 'text-primary' : done ? 'text-green-700' : 'text-outline-variant'}`}>{step.label}</span>
                          </div>
                          {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${done ? 'bg-green-400' : 'bg-outline-variant/20'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className={cc}>
                <button onClick={() => setStructureOpen(p => !p)}
                  className="w-full flex items-center justify-between px-8 py-4 hover:bg-surface-container-low transition-colors text-left">
                  <h3 className="text-sm font-semibold text-on-surface-variant">Church Structure</h3>
                  <span className={`material-symbols-outlined text-sm text-outline-variant transition-transform ${structureOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {structureOpen && (
                  <div className="px-8 pb-5 space-y-3 border-t border-surface-container">
                    {[
                      { title: 'Lead Pastor',          name: 'Pastor Admin' },
                      { title: 'Church Administrator', name: 'Church Admin' },
                      { title: 'Group Leaders',        name: groups.map(g => g.leader).filter(Boolean).join(', ') || '—' },
                    ].map(row => (
                      <div key={row.title} className="flex items-center justify-between gap-4 pt-3">
                        <p className="text-xs text-on-surface-variant">{row.title}</p>
                        <p className="text-xs font-semibold text-on-surface text-right">{row.name || '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activePage === 'info' && (
            <div className="space-y-5 fade-in">
              <div>
                <h2 className="text-xl font-extrabold font-headline tracking-tight text-on-surface">My Info</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Your personal details on file.</p>
              </div>
              <div className={cc}>
                <div className={`${hc} flex items-center justify-between`}>
                  <h3 className="text-sm font-bold font-headline text-on-surface">Your Details</h3>
                  {!editing && (
                    <button onClick={openEdit} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                      <span className="material-symbols-outlined text-sm">edit</span>Edit
                    </button>
                  )}
                </div>
                {editing ? (
                  <div className={`${bc} space-y-4`}>
                    <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">You can update your contact details only.</p>
                    {[{ label: 'Phone', key: 'phone', type: 'tel' }, { label: 'Email', key: 'email', type: 'email' }, { label: 'Home Address', key: 'homeAddress', type: 'text' }].map(fi => (
                      <div key={fi.key}>
                        <label className={lc}>{fi.label}</label>
                        <input type={fi.type} value={draft[fi.key] ?? ''} onChange={e => fd(fi.key, e.target.value)} className={ic} />
                      </div>
                    ))}
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => setEditing(false)} className="flex-1 py-2.5 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">Cancel</button>
                      <button onClick={saveEdit} className="flex-1 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className={bc}>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {[
                        { label: 'Name',         value: member.name                    },
                        { label: 'Faith Status', value: faithLabel(member.faithStatus) },
                        { label: 'Phone',        value: member.phone                   },
                        { label: 'Email',        value: member.email                   },
                        { label: 'Marital',      value: member.maritalStatus           },
                        { label: 'Address',      value: member.homeAddress, span: true },
                      ].filter(fi => fi?.value).map(fi => (
                        <div key={fi.label} className={fi.span ? 'col-span-2' : ''}>
                          <p className={lc}>{fi.label}</p>
                          <p className="text-sm text-on-surface font-medium">{fi.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activePage === 'contact' && (
            <div className="space-y-5 fade-in">
              <div>
                <h2 className="text-xl font-extrabold font-headline tracking-tight text-on-surface">Get in Touch</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Send a message to your church administrator.</p>
              </div>
              <div className={cc}>
                <div className={hc}><h3 className="text-sm font-bold font-headline text-on-surface">Message Admin</h3></div>
                <div className={`${bc} space-y-4`}>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message here…" rows={5} disabled={msgSent}
                    className={`${ic} resize-none ${msgSent ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  {msgSent && (
                    <p className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                      <span className="material-symbols-outlined text-sm ms-filled">check_circle</span>Sent — your administrator will be in touch.
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button onClick={sendMessage} disabled={!message.trim() || msgSent}
                      className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${message.trim() && !msgSent ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-sm' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}>
                      <span className="material-symbols-outlined text-sm">send</span>Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Unauthorized() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8 fade-in">
      <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-error text-3xl">lock</span>
      </div>
      <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-2">Access Restricted</h2>
      <p className="text-on-surface-variant text-sm max-w-sm">
        Your role <span className="font-semibold text-on-surface">({ROLE_META[user?.role]?.label ?? user?.role})</span> does not have permission to access this section.
      </p>
    </div>
  );
}

// =============================================================================
// ROLE GUARD
// =============================================================================

function RoleGuard({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Unauthorized />;
  return children;
}

// =============================================================================
// APP ROOT
// =============================================================================

export default function App() {
  const [members, setMembers]               = useState(seedMembers);
  const [groups, setGroups]                 = useState(seedGroups);
  const [stages, setStages]                 = useState(seedStages);
  const [rules, setRules]                   = useState(seedRules);
  const [users, setUsers]                   = useState(seedUsers);
  const [toastMsg, setToastMsg]             = useState(null);
  const [showEnrolModal, setShowEnrolModal] = useState(false);
  const [user, setUser]                     = useState(null);

  const toast  = (msg) => setToastMsg(msg);
  const login  = (u)   => setUser(u);
  const logout = ()    => setUser(null);

  const handleEnrol = (data) => {
    const nm = { ...data, id: Date.now() };
    setMembers(prev => [nm, ...prev]);
    const nu = createUserForMember(nm);
    setUsers(prev => prev.find(u => u.memberId === nm.id) ? prev : [...prev, nu]);
    setShowEnrolModal(false);
    toast(`✓ ${nm.name} enrolled`);
  };

  const handleSetPassword = (passwordHash) => {
    const updated = { ...user, passwordHash, password: null, mustSetPassword: false };
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setUser(updated);
    toast('Password set. Welcome!');
  };

  // ── Auth gates ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <AuthContext.Provider value={{ user: null, login, logout }}>
        <LoginPage onLogin={login} users={users} />
      </AuthContext.Provider>
    );
  }

  if (user.mustSetPassword) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <FirstTimePasswordPage user={user} onComplete={handleSetPassword} />
      </AuthContext.Provider>
    );
  }

  if (!canAccessFullApp(user, members)) {
    const linkedMember = members.find(m => m.id === user.memberId) ?? null;
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <PendingApprovalPage user={user} member={linkedMember} onLogout={logout} />
      </AuthContext.Provider>
    );
  }

  // ── Member portal ─────────────────────────────────────────────────────────
  if (user.role === 'member') {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <MemberPortal members={members} stages={stages} setMembers={setMembers} groups={groups} toast={toast} onLogout={logout} />
        {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
      </AuthContext.Provider>
    );
  }

  // ── Full app shell with React Router ─────────────────────────────────────
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="flex min-h-screen">
        <Sidebar user={user} onLogout={logout} />
        <div className="ml-64 flex-1 min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={
              <Dashboard
                members={members} groups={groups} stages={stages}
                setSelectedMember={() => {}}
                onAddMember={hasPermission(user, 'enrol') ? () => setShowEnrolModal(true) : null}
              />
            } />
            <Route path="/members" element={
              <RoleGuard roles={['pastor', 'admin', 'leader']}>
                <Members members={members} groups={groups} stages={stages} setMembers={setMembers} toast={toast} />
              </RoleGuard>
            } />
            <Route path="/members/:id" element={
              <RoleGuard roles={['pastor', 'admin', 'leader']}>
                <MemberDetail members={members} stages={stages} setMembers={setMembers} toast={toast} />
              </RoleGuard>
            } />
            <Route path="/groups" element={
              <RoleGuard roles={['pastor', 'admin', 'leader']}>
                <Groups groups={groups} setGroups={setGroups} members={members} stages={stages} rules={rules} toast={toast} />
              </RoleGuard>
            } />
            <Route path="/attendance" element={
              <RoleGuard roles={['pastor', 'admin', 'leader']}>
                <Attendance members={members} groups={groups} />
              </RoleGuard>
            } />
            <Route path="/events"   element={<Events />} />
            <Route path="/messages" element={
              <RoleGuard roles={['pastor', 'admin']}>
                <Messages groups={groups} />
              </RoleGuard>
            } />
            <Route path="/engine" element={
              <RoleGuard roles={['pastor', 'admin']}>
                <Engine stages={stages} setStages={setStages} rules={rules} setRules={setRules} groups={groups} toast={toast} />
              </RoleGuard>
            } />
            <Route path="/settings" element={
              <RoleGuard roles={['pastor', 'admin']}>
                <Settings toast={toast} />
              </RoleGuard>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <footer className="py-6 border-t border-slate-100 bg-slate-50 mt-auto">
            <div className="flex justify-between items-center px-8 max-w-7xl mx-auto">
              <p className="text-slate-400 text-xs">© 2025 ChurchOS. Sanctuary Minimalism.</p>
              <div className="flex gap-6">
                {['Support', 'Privacy', 'Terms'].map(l => <a key={l} href="#" className="text-slate-400 text-xs hover:text-slate-900 transition-colors">{l}</a>)}
              </div>
            </div>
          </footer>
        </div>

        {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
        {showEnrolModal && hasPermission(user, 'enrol') && (
          <AddMemberModal groups={groups} stages={stages} onClose={() => setShowEnrolModal(false)} onSave={handleEnrol} />
        )}
      </div>
    </AuthContext.Provider>
  );
}
