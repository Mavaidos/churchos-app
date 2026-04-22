// ─── ChurchOS — App.jsx ──────────────────────────────────────────────────────
// This file should contain ONLY:
//   1. Auth-gate pages (pre-router, no sidebar)
//   2. Shared modals that need App-level state
//   3. App() — state + routing
// All page components live in src/pages/
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// ── Lib ──────────────────────────────────────────────────────────────────────
import {
  AuthContext,
  useAuth,
  hasPermission,
  getVisibleMembers,
  canAccessFullApp,
  createUserForMember,
  hashPassword,
  ROLE_META,
} from "./lib/auth";
import { mkOverride, createMemberDefaults } from "./lib/members";

// ── Data ─────────────────────────────────────────────────────────────────────
import {
  seedMembers, seedGroups, seedStages, seedRules, seedUsers, seedEvents, seedZones,
  seedAttendanceRecords,
} from "./data/seed";

// ── Shared components ─────────────────────────────────────────────────────────
import { Avatar, SmAvatar, MemberAvatar } from "./components/shared/Avatar";
import { StatusBadge, StageBadge } from "./components/shared/StatusBadge";
import { Toast } from "./components/shared/Toast";
import { Sidebar } from "./components/layout/Sidebar";

// ── Pages (each page is its own file in src/pages/) ──────────────────────────
import { Dashboard }    from "./pages/Dashboard";
import { Members }      from "./pages/Members";
import { MemberDetail } from "./pages/MembersDetail";
import { Groups }       from "./pages/Groups";
import { Engine }       from "./pages/Engine";
import { Events }       from "./pages/Events";
import { Messages }     from "./pages/Messages";
import { Attendance }   from "./pages/Attendance";
import { Settings }     from "./pages/Settings";
import { MemberPortal } from "./pages/MemberPortal";


// =============================================================================
// UTILITY — Homecell suggestion (also used by AddMemberModal below)
// TODO: move to src/lib/members.js when you have a chance
// =============================================================================

function suggestGroupForAddress(address, members, groups) {
  if (!address || address.trim().length < 4) return null;
  const addr  = address.toLowerCase();
  const words = addr.split(/[\s,]+/).filter(w => w.length > 3);
  if (words.length === 0) return null;
   const scored = groups.map(g => {
    const groupMembers = members.filter(m => g.memberIds?.includes(m.id) && m.homeAddress);
    const score = groupMembers.reduce((s, m) => {
      const mAddr = m.homeAddress.toLowerCase();
      return s + words.filter(w => mAddr.includes(w)).length;
    }, 0);
    return { group: g, score, count: groupMembers.length };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

// =============================================================================
// AUTH PAGES — shown before the app shell mounts (no Sidebar, no Router outlet)
// =============================================================================

function LoginPage({ onLogin, users }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const quickLogins = [
    { label: "Pastor",       email: "pastor@church.org",  password: "pastor123" },
    { label: "Admin",        email: "admin@church.org",   password: "admin123"  },
    { label: "Leader",       email: "leader@church.org",  password: "leader123" },
    { label: "Member",       email: "member@church.org",  password: "member123" },
    { label: "New (set pwd)",email: "new@church.org",     password: "set_me"    },
  ];

  const handleSubmit = () => {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Email and password are required."); return; }
    setLoading(true);
    setTimeout(() => {
      const found = (users ?? seedUsers).find(u => u.email === email.trim().toLowerCase());
      if (!found) { setError("No account found with that email."); setLoading(false); return; }
      const ok = found.mustSetPassword
        ? found.password === password
        : found.passwordHash === hashPassword(password) || found.password === password;
      if (!ok) { setError("Incorrect password."); setLoading(false); return; }
      onLogin(found);
    }, 400);
  };

  const ic = "w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20";

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
                onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="you@church.org" className={ic} autoFocus />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••" className={ic} />
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error-container/20 border border-error/20 rounded-xl text-error text-xs font-semibold">
                <span className="material-symbols-outlined text-sm">error</span>{error}
              </div>
            )}
            <button onClick={handleSubmit} disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${loading ? "bg-primary/60 text-on-primary cursor-wait" : "bg-primary text-on-primary hover:bg-primary-dim"}`}>
              {loading ? (
                <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Signing in…</>
              ) : (
                <><span className="material-symbols-outlined text-sm">login</span>Sign In</>
              )}
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
  const [newPass, setNewPass]       = useState("");
  const [confirmPass, setConfirm]   = useState("");
  const [error, setError]           = useState("");
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const ic = "w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20";

  const handleSubmit = () => {
    setError("");
    if (!newPass.trim()) { setError("Password cannot be empty."); return; }
    if (newPass.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { setError("Passwords do not match."); return; }
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
            {[
              { label: "New Password", val: newPass, set: setNewPass, show: showNew, toggle: () => setShowNew(p => !p), ph: "At least 6 characters" },
              { label: "Confirm Password", val: confirmPass, set: setConfirm, show: showConfirm, toggle: () => setShowConfirm(p => !p), ph: "Repeat password" },
            ].map((f, i) => (
              <div key={i}>
                <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">{f.label}</label>
                <div className="relative">
                  <input type={f.show ? "text" : "password"} value={f.val}
                    onChange={e => f.set(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    placeholder={f.ph} className={ic + " pr-10"} autoFocus={i === 0} />
                  <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                    <span className="material-symbols-outlined text-sm">{f.show ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {i === 1 && confirmPass && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${newPass === confirmPass ? "text-green-600" : "text-error"}`}>
                    <span className="material-symbols-outlined text-xs ms-filled">{newPass === confirmPass ? "check_circle" : "cancel"}</span>
                    {newPass === confirmPass ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>
            ))}
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
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Your account is awaiting approval by a pastor or administrator.</p>
          {member && (
            <div className="bg-surface-container-low rounded-xl p-5 text-left mb-6 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Your Profile</p>
              <div className="flex items-center gap-3">
                <MemberAvatar member={member} size={40} />
                <div>
                  <p className="text-sm font-bold text-on-surface">{member.name}</p>
                  <p className="text-xs text-on-surface-variant">{member.email || "—"}</p>
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
// CREDENTIALS MODAL — shown after enrolling a new member
// Lives here because it depends on App-level newMemberCredentials state
// =============================================================================

function CredentialsModal({ member, credentials, onClose }) {
  const [copied, setCopied] = useState(false);

  const shareText =
    `Hi ${member.name.split(" ")[0]}! 👋\n\n` +
    `You've been enrolled at our church. Here are your login details for the ChurchOS Member Portal:\n\n` +
    `🔗 Login at: ${window.location.origin}\n` +
    `📧 Email: ${credentials.email}\n` +
    `🔑 Temp Password: ${credentials.tempPassword}\n\n` +
    `When you log in for the first time, you'll be asked to set your own password.\n\nSee you on Sunday! 🙏`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };
  const handleWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden">
        <div className="bg-green-50 border-b-2 border-green-100 px-7 pt-7 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-white ms-filled text-2xl">how_to_reg</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">Enrolment Successful</p>
              <h3 className="text-xl font-bold font-headline text-on-surface">{member.name} is enrolled!</h3>
            </div>
          </div>
          <p className="text-xs text-green-800 leading-relaxed bg-green-100/70 rounded-xl px-4 py-2.5">
            Share these login credentials with <strong>{member.name.split(" ")[0]}</strong>. They will be asked to create their own password on first login.
          </p>
        </div>
        <div className="px-7 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Login Details to Share</p>
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 divide-y divide-outline-variant/10">
            {[
              { label: "Login URL",           val: window.location.origin,   icon: "link" },
              { label: "Email Address",       val: credentials.email,        icon: "mail" },
            ].map(r => (
              <div key={r.label} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-0.5">{r.label}</p>
                  <p className="text-sm font-mono font-semibold text-on-surface truncate">{r.val}</p>
                </div>
                <span className="material-symbols-outlined text-primary text-sm flex-shrink-0">{r.icon}</span>
              </div>
            ))}
            <div className="px-4 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1">Temporary Password</p>
                <p className="text-2xl font-mono font-extrabold text-primary tracking-[0.15em]">{credentials.tempPassword}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">Member must change this on first login</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary-container/40 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary ms-filled">key</span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="material-symbols-outlined text-amber-600 text-sm flex-shrink-0 mt-0.5">warning</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Save this now.</strong> Once you close this window, the temporary password won't be shown again.
            </p>
          </div>
        </div>
        <div className="px-7 pb-7 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Share With {member.name.split(" ")[0]}</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#25D366] text-white hover:bg-[#20b558] transition-colors shadow-sm">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>
            <button onClick={handleCopy}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm ${copied ? "bg-green-500 text-white" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"}`}>
              <span className="material-symbols-outlined text-sm ms-filled">{copied ? "check_circle" : "content_copy"}</span>
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>
          <button onClick={onClose}
            className="w-full py-3 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors shadow-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm ms-filled">done</span>Done
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ADD MEMBER MODAL
// Lives here because it's triggered from both the Members page AND the Dashboard
// (via showEnrolModal state in App).
// TODO: Extract to src/components/modals/AddMemberModal.jsx and import in both places
// =============================================================================

function AddMemberModal({ groups, stages, members = [], onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "", surname: "", phone: "", gender: "",
    email: "", maritalStatus: "", spouseId: null, spouseName: "",
    homeAddress: "", faithStatus: "visitor", comment: "",
  });
  const [errors, setErrors] = useState({});
  const [suggestion, setSuggestion] = useState(null);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const ic = k => `w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors[k] ? "border-error bg-error-container/10" : "border-outline-variant/30 bg-surface-container-low"}`;
  const sc = "w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20";
  const lc = "text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block";

  const faithOptions = [
    { val: "born_again",     icon: "favorite",     desc: "Committed believer", label: "Born Again"     },
    { val: "not_born_again", icon: "help_outline",  desc: "Seeking faith",      label: "Not Born Again" },
    { val: "visitor",        icon: "explore",       desc: "First-time guest",   label: "Visitor"        },
  ];

  useEffect(() => {
    const result = suggestGroupForAddress(form.homeAddress, members, groups);
    setSuggestion(result);
  }, [form.homeAddress]);

  const validateStep1 = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.surname.trim())   e.surname   = "Surname is required";
    if (!form.phone.trim())     e.phone     = "Phone number is required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
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
    const initials  = [form.firstName[0], form.surname[0]].filter(Boolean).join("").toUpperCase();
    const colors    = ["#d5e3fd","#d3e4fe","#cfdef5","#dde3e9"];
    const spouseId  = form.maritalStatus === "married" ? form.spouseId || null : null;
    const spouseName = form.maritalStatus === "married" ? form.spouseName.trim() || null : null;
    onSave(createMemberDefaults({
      name: fullName, initials,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      joinDate: new Date().toISOString().split("T")[0],
      currentStageIndex: 0,
      email: form.email.trim(), phone: form.phone.trim(),
      gender: form.gender, maritalStatus: form.maritalStatus,
      spouseId, spouseName, homeAddress: form.homeAddress.trim(),
      faithStatus: form.faithStatus, comment: form.comment.trim(),
      group: "", mentor: null, mentorId: null,
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
              <h3 className="text-xl font-bold font-headline">{step === 1 ? "Personal Details" : "Faith & Additional Info"}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-5">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${step >= s ? "bg-primary text-on-primary" : "bg-surface-container text-outline"}`}>
                  {step > s ? <span className="material-symbols-outlined text-sm ms-filled">check</span> : s}
                </div>
                <span className={`text-xs font-semibold ${step === s ? "text-primary" : "text-outline-variant"}`}>{s === 1 ? "Personal" : "Faith & Notes"}</span>
                {s < 2 && <div className={`w-8 h-px mx-1 ${step > s ? "bg-primary" : "bg-outline-variant/30"}`} />}
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
                  <input value={form.firstName} onChange={e => f("firstName", e.target.value)} placeholder="John" className={ic("firstName")} />
                  {errors.firstName && <p className="text-xs text-error mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className={lc}>Surname *</label>
                  <input value={form.surname} onChange={e => f("surname", e.target.value)} placeholder="Smith" className={ic("surname")} />
                  {errors.surname && <p className="text-xs text-error mt-1">{errors.surname}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc}>Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="+27 71 000 0000" className={ic("phone")} />
                  {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className={lc}>Gender</label>
                  <select value={form.gender} onChange={e => f("gender", e.target.value)} className={sc}>
                    <option value="">Select gender</option>
                    <option>Male</option><option>Female</option><option>Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={lc}>Email *</label>
                <input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="john.smith@email.com" className={ic("email")} />
                {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc}>Marital Status</label>
                  <select value={form.maritalStatus} onChange={e => f("maritalStatus", e.target.value)} className={sc}>
                    <option value="">Select status</option>
                    <option value="single">Single</option><option value="married">Married</option>
                    <option value="divorced">Divorced</option><option value="widowed">Widowed</option>
                  </select>
                </div>
                {form.maritalStatus === "married" && (
                  <div>
                    <label className={lc}>Spouse Name</label>
                    <input value={form.spouseName} onChange={e => f("spouseName", e.target.value)} placeholder="Spouse full name"
                      className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                )}
              </div>
              <div>
                <label className={lc}>Home Address</label>
                <textarea value={form.homeAddress} onChange={e => f("homeAddress", e.target.value)}
                  placeholder="123 Main Street, City, Province, 0000" rows={2}
                  className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              {/* Homecell suggestion */}
              {suggestion && (
                <div className="flex items-start gap-3 px-4 py-3 bg-primary-container/20 border border-primary/20 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-sm flex-shrink-0 mt-0.5">location_on</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary">Homecell suggestion</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                      <strong>{suggestion.count} member{suggestion.count !== 1 ? "s" : ""}</strong> near this address are in{" "}
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
                    <button key={opt.val} type="button" onClick={() => f("faithStatus", opt.val)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${form.faithStatus === opt.val ? "border-primary bg-primary-container/40 text-primary" : "border-outline-variant/20 bg-surface-container-low hover:border-outline-variant text-on-surface-variant"}`}>
                      <span className={`material-symbols-outlined ${form.faithStatus === opt.val ? "ms-filled" : ""}`}>{opt.icon}</span>
                      <span className="text-xs font-bold leading-tight">{opt.label}</span>
                      <span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lc}>Pastoral Comment</label>
                <textarea value={form.comment} onChange={e => f("comment", e.target.value)}
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
function BulkCredentialsModal({ entries, onClose }) {
  const [copied, setCopied] = useState(false);

  const asCSV = [
    'Name,Email,Temp Password,Login URL',
    ...entries.map(e =>
      `"${e.member.name}","${e.email}","${e.tempPassword}","${window.location.origin}"`
    ),
  ].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(asCSV).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([asCSV], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `invitations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const waLink = e =>
    `https://wa.me/${(e.member.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
      `Hi ${e.member.name.split(' ')[0]}! Your ChurchOS login:\n` +
      `${window.location.origin}\nEmail: ${e.email}\nTemp password: ${e.tempPassword}\n` +
      `You'll set your own password on first login.`
    )}`;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl mx-4 slide-in overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-green-50 border-b-2 border-green-100 px-7 pt-7 pb-5 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-white ms-filled text-2xl">mail</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">Bulk Invitations Created</p>
              <h3 className="text-xl font-bold font-headline text-on-surface">
                {entries.length} account{entries.length === 1 ? '' : 's'} ready to share
              </h3>
            </div>
          </div>
          <p className="text-xs text-green-800 leading-relaxed bg-green-100/70 rounded-xl px-4 py-2.5">
            <strong>Save this list now.</strong> Temp passwords won't be recoverable after this window closes (unless a member hasn't logged in yet — then you can resend individually).
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-container-low">
              <tr className="border-b border-surface-container">
                {['Name', 'Email', 'Temp Password', 'Share'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-outline">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-surface-container/50 hover:bg-surface-container-low/50">
                  <td className="px-4 py-2.5 font-semibold text-on-surface whitespace-nowrap">{e.member.name}</td>
                  <td className="px-4 py-2.5 text-on-surface-variant font-mono">{e.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-bold text-primary tracking-widest">{e.tempPassword}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {e.member.phone ? (
                      <a href={waLink(e)} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] text-white text-[10px] font-bold hover:opacity-90">
                        <span className="material-symbols-outlined text-xs">chat</span>WhatsApp
                      </a>
                    ) : (
                      <span className="text-[10px] text-outline-variant italic">no phone</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-surface-container flex gap-3 justify-end flex-shrink-0 bg-surface-container-lowest">
          <button onClick={handleCopy}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}>
            <span className="material-symbols-outlined text-sm">{copied ? 'check_circle' : 'content_copy'}</span>
            {copied ? 'Copied' : 'Copy as CSV'}
          </button>
          <button onClick={handleDownload}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>Download CSV
          </button>
          <button onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors shadow-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ROLE GUARD + UNAUTHORIZED
// Small enough to live here. RoleGuard wraps route elements.
// =============================================================================

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

function RoleGuard({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Unauthorized />;
  return children;
}

// =============================================================================
// APP ROOT — state + auth gates + routing
// This function should stay lean. If you add logic here, ask: "does this
// belong in a page component instead?"
// =============================================================================

export default function App() {
  // ── Shared data state ─────────────────────────────────────────────────────
  const [members, setMembers]   = useState(seedMembers);
  const [events,  setEvents]    = useState(seedEvents);
  const [groups,  setGroups]    = useState(seedGroups);
  const [stages,  setStages]    = useState(seedStages);
  const [rules,   setRules]     = useState(seedRules);
  const [users,   setUsers]     = useState(seedUsers);
  const [zones, setZones] = useState(seedZones);
  const [churchSettings, setChurchSettings] = useState({
    name:        'ChurchOS',
    tagline:     'Sanctuary Management',
    pastorName:  '',
    founded:     '',
    email:       'pastor@church.org',
    adminEmail:  'admin@church.org',
    phone:       '',
    website:     '',
    address:     '',
    logoUrl:     null,
    primaryColor: '#2d3b4e',
  });



  // ── Messages — shared between admin/leader (Messages.jsx) and member portal
  // IMPORTANT: toId must match the memberId in seedUsers for the demo member
  // member@church.org → memberId:1 → Sarah Jenkins
  const [messages, setMessages]                   = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState(seedAttendanceRecords);
  // ── UI state ──────────────────────────────────────────────────────────────
  const [toastMsg, setToastMsg]                       = useState(null);
  const [showEnrolModal, setShowEnrolModal]           = useState(false);
  const [user, setUser]                               = useState(null);
  const [newMemberCredentials, setNewMemberCredentials] = useState(null);
  const [bulkCredentials, setBulkCredentials] = useState(null); // array | null

  const toast  = msg => setToastMsg(msg);
  const login  = u   => setUser(u);
  const logout = ()  => setUser(null);

  const handleEnrol = data => {
    const nm = { ...data, id: Date.now() };
    setMembers(prev => [nm, ...prev]);
    const { user: nu, tempPassword } = createUserForMember(nm);
    setUsers(prev => prev.find(u => u.memberId === nm.id) ? prev : [...prev, nu]);
    setShowEnrolModal(false);
    setNewMemberCredentials({ member: nm, email: nu.email, tempPassword });
  };

  const handleSetPassword = passwordHash => {
    const updated = { ...user, passwordHash, password: null, mustSetPassword: false };
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setUser(updated);
    toast("Password set. Welcome!");
  };

  // ── Auth gate 1: not logged in ────────────────────────────────────────────
  if (!user) {
    return (
      <AuthContext.Provider value={{ user: null, login, logout }}>
        <LoginPage onLogin={login} users={users} />
      </AuthContext.Provider>
    );
  }

  // ── Auth gate 2: must set password ───────────────────────────────────────
  if (user.mustSetPassword) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <FirstTimePasswordPage user={user} onComplete={handleSetPassword} />
      </AuthContext.Provider>
    );
  }

  // ── Auth gate 3: pending approval ────────────────────────────────────────
  if (!canAccessFullApp(user, members)) {
    const linkedMember = members.find(m => m.id === user.memberId) ?? null;
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <PendingApprovalPage user={user} member={linkedMember} onLogout={logout} />
      </AuthContext.Provider>
    );
  }

  // ── Auth gate 4: member portal (mobile, no sidebar) ──────────────────────
  if (user.role === "member") {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <MemberPortal
  users={users}
  members={members} stages={stages} setMembers={setMembers}
  groups={groups}   events={events}  setEvents={setEvents}
  messages={messages} setMessages={setMessages}
  toast={toast} onLogout={logout}
/>
        {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
      </AuthContext.Provider>
    );
  }

  // ── Full app shell ────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="flex min-h-screen">
         <Sidebar user={user} onLogout={logout} churchSettings={churchSettings} />
        <div className="ml-64 flex-1 min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={
              <Dashboard members={members} groups={groups} stages={stages}
                churchSettings={churchSettings}
                setSelectedMember={() => {}}
                onAddMember={hasPermission(user, "enrol") ? () => setShowEnrolModal(true) : null} />
            } />
            <Route path="/members" element={
              <RoleGuard roles={["pastor","admin","leader"]}>
                <Members
  members={members} groups={groups} stages={stages}
  users={users}                        // ← add
  setMembers={setMembers} setUsers={setUsers}
  setNewMemberCredentials={setNewMemberCredentials}
  setBulkCredentials={setBulkCredentials}   // ← add
  toast={toast} />
              </RoleGuard>
            } />
            <Route path="/members/:id" element={
              <RoleGuard roles={["pastor","admin","leader"]}>
                <MemberDetail
  members={members}
  stages={stages}
  setMembers={setMembers}
  groups={groups}
  setGroups={setGroups}
  toast={toast}
/>
              </RoleGuard>
            } />
            <Route path="/groups" element={
  <RoleGuard roles={["pastor","admin","leader"]}>
    <Groups
     groups={groups} setGroups={setGroups}
     zones={zones}   setZones={setZones}
     members={members} setMembers={setMembers}
     stages={stages} rules={rules}
     users={users}   setUsers={setUsers}
     toast={toast}
   />
  </RoleGuard>
} />
            <Route path="/attendance" element={
              <RoleGuard roles={["pastor","admin","leader"]}>
                <Attendance
                  members={members} groups={groups} stages={stages}
                  attendanceRecords={attendanceRecords}
                  setAttendanceRecords={setAttendanceRecords} />
              </RoleGuard>
            } />
            <Route path="/events" element={
              <Events events={events} setEvents={setEvents} members={members} />
            } />
            <Route path="/messages" element={
              <RoleGuard roles={["pastor","admin","leader"]}>
                <Messages groups={groups} members={members} stages={stages}
                  messages={messages} setMessages={setMessages} user={user} />
              </RoleGuard>
            } />
            <Route path="/engine" element={
              <RoleGuard roles={["pastor","admin"]}>
                <Engine stages={stages} setStages={setStages} rules={rules} setRules={setRules} groups={groups} toast={toast} />
              </RoleGuard>
            } />
            <Route path="/settings" element={
              <RoleGuard roles={["pastor","admin"]}>
                <Settings
                  toast={toast}
                  churchSettings={churchSettings}
                  setChurchSettings={setChurchSettings} />
              </RoleGuard>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <footer className="py-6 border-t border-slate-100 bg-slate-50 mt-auto">
            <div className="flex justify-between items-center px-8 max-w-7xl mx-auto">
              <p className="text-slate-400 text-xs">© 2025 ChurchOS. Sanctuary Minimalism.</p>
              <div className="flex gap-6">
                {["Support","Privacy","Terms"].map(l => (
                  <a key={l} href="#" className="text-slate-400 text-xs hover:text-slate-900 transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>

      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
      {showEnrolModal && hasPermission(user, "enrol") && (
        <AddMemberModal groups={groups} stages={stages} members={members}
          onClose={() => setShowEnrolModal(false)} onSave={handleEnrol} />
      )}
      {newMemberCredentials && (
        <CredentialsModal member={newMemberCredentials.member} credentials={newMemberCredentials}
          onClose={() => setNewMemberCredentials(null)} />
      )}
      {bulkCredentials && (
  <BulkCredentialsModal
    entries={bulkCredentials}
    onClose={() => setBulkCredentials(null)} />
)}
    </AuthContext.Provider>
  );
}
