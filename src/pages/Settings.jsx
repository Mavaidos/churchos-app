// ─── src/pages/Settings.jsx ──────────────────────────────────────────────────
// Settings has 3 tabs:
//   1. Church Profile  — name, tagline, contact info (feeds sidebar + PDF headers)
//   2. Branding        — primary colour, logo upload
//   3. Account         — change password (for current user)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAuth } from '../lib/auth';

// =============================================================================
// COLOUR PALETTE OPTIONS
// =============================================================================

const PALETTE = [
  { name: 'Navy',    primary: '#2d3b4e', dim: '#3b4d62', container: '#d3e4fe', onPrimary: '#ffffff', label: 'Classic Navy'    },
  { name: 'Violet',  primary: '#5b21b6', dim: '#6d28d9', container: '#ede9fe', onPrimary: '#ffffff', label: 'Royal Violet'   },
  { name: 'Forest',  primary: '#166534', dim: '#15803d', container: '#dcfce7', onPrimary: '#ffffff', label: 'Forest Green'   },
  { name: 'Garnet',  primary: '#9f1239', dim: '#be123c', container: '#ffe4e6', onPrimary: '#ffffff', label: 'Garnet Red'     },
  { name: 'Copper',  primary: '#92400e', dim: '#b45309', container: '#fef3c7', onPrimary: '#ffffff', label: 'Copper Amber'   },
  { name: 'Teal',    primary: '#0f766e', dim: '#0d9488', container: '#ccfbf1', onPrimary: '#ffffff', label: 'Deep Teal'      },
  { name: 'Indigo',  primary: '#3730a3', dim: '#4338ca', container: '#e0e7ff', onPrimary: '#ffffff', label: 'Indigo Blue'    },
  { name: 'Slate',   primary: '#334155', dim: '#475569', container: '#e2e8f0', onPrimary: '#ffffff', label: 'Cool Slate'     },
];

// =============================================================================
// TAB: CHURCH PROFILE
// =============================================================================

function ChurchProfileTab({ churchSettings, setChurchSettings, toast }) {
  const [form, setForm]   = useState({ ...churchSettings });
  const [dirty, setDirty] = useState(false);
  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); setDirty(true); };

  const handleSave = () => {
    setChurchSettings(form);
    setDirty(false);
    toast('✓ Church profile saved');
  };

  const ic = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all';
  const lc = 'text-[10px] uppercase font-bold tracking-widest text-outline mb-1.5 block';

  return (
    <div className="max-w-2xl space-y-6">

      {/* Identity */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">Identity</p>
          <h3 className="text-base font-bold font-headline text-on-surface">Church Details</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Appears in the sidebar, PDF headers, and member welcome messages</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={lc}>Church Name *</label>
            <input value={form.name} onChange={e => f('name', e.target.value)}
              placeholder="e.g. Sanctuary City Church" className={ic} />
          </div>
          <div>
            <label className={lc}>Tagline</label>
            <input value={form.tagline} onChange={e => f('tagline', e.target.value)}
              placeholder="e.g. Sanctuary Management" className={ic} />
            <p className="text-[10px] text-outline-variant mt-1">Shown below the church name in the sidebar</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Lead Pastor Name</label>
              <input value={form.pastorName} onChange={e => f('pastorName', e.target.value)}
                placeholder="e.g. Pastor James Smith" className={ic} />
            </div>
            <div>
              <label className={lc}>Founded Year</label>
              <input value={form.founded} onChange={e => f('founded', e.target.value)}
                placeholder="e.g. 2005" className={ic} />
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">Contact</p>
          <h3 className="text-base font-bold font-headline text-on-surface">Contact Information</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Used in PDF reports and member portal contact section</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Pastoral Email</label>
              <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                placeholder="pastor@church.org" className={ic} />
            </div>
            <div>
              <label className={lc}>Admin Email</label>
              <input type="email" value={form.adminEmail} onChange={e => f('adminEmail', e.target.value)}
                placeholder="admin@church.org" className={ic} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)}
                placeholder="+27 11 000 0000" className={ic} />
            </div>
            <div>
              <label className={lc}>Website</label>
              <input type="url" value={form.website} onChange={e => f('website', e.target.value)}
                placeholder="https://yourchurch.org" className={ic} />
            </div>
          </div>
          <div>
            <label className={lc}>Physical Address</label>
            <textarea value={form.address} onChange={e => f('address', e.target.value)} rows={2}
              placeholder="123 Church Street, City, Province, 0000"
              className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>
      </div>

      {/* Preview card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-container">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Preview</p>
        </div>
        <div className="p-6">
          <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary flex-shrink-0">
              {form.logoUrl
                ? <img src={form.logoUrl} alt="logo" className="w-full h-full object-cover rounded-xl" />
                : <span className="material-symbols-outlined ms-filled">church</span>
              }
            </div>
            <div>
              <p className="text-sm font-extrabold text-on-surface font-headline">{form.name || 'Church Name'}</p>
              <p className="text-[9px] uppercase tracking-widest text-outline font-bold">{form.tagline || 'Sanctuary Management'}</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs">info</span>
            This is how the sidebar header will appear after saving
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={!dirty}
          className={`px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            dirty
              ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-sm'
              : 'bg-surface-container-high text-outline cursor-not-allowed'
          }`}>
          <span className="material-symbols-outlined text-sm ms-filled">save</span>
          {dirty ? 'Save Changes' : 'No Changes'}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// TAB: BRANDING
// =============================================================================

function BrandingTab({ churchSettings, setChurchSettings, toast }) {
  const [selectedPalette, setSelectedPalette] = useState(
    PALETTE.find(p => p.primary === (churchSettings?.primaryColor ?? '#2d3b4e'))?.name ?? 'Navy'
  );
  const [logoUrl, setLogoUrl] = useState(churchSettings?.logoUrl ?? null);
  const [dirty, setDirty] = useState(false);

  const handleLogoUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setLogoUrl(ev.target.result); setDirty(true); };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const palette = PALETTE.find(p => p.name === selectedPalette) ?? PALETTE[0];
    setChurchSettings(prev => ({
      ...prev,
      primaryColor:     palette.primary,
      primaryDimColor:  palette.dim,
      containerColor:   palette.container,
      onPrimaryColor:   palette.onPrimary,
      logoUrl,
    }));
    // Apply CSS variables immediately
    document.documentElement.style.setProperty('--c-primary',    hexToRgb(palette.primary));
    document.documentElement.style.setProperty('--c-primary-dim', hexToRgb(palette.dim));
    setDirty(false);
    toast('✓ Branding updated — reload to see full effect');
  };

  return (
    <div className="max-w-2xl space-y-6">

      {/* Logo */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">Logo</p>
          <h3 className="text-base font-bold font-headline text-on-surface">Church Logo</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Replaces the church icon in the sidebar. Square images work best.</p>
        </div>
        <div className="p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center flex-shrink-0 overflow-hidden bg-surface-container-low">
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
              : <span className="material-symbols-outlined text-3xl text-outline-variant">church</span>
            }
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">upload</span>
              {logoUrl ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
            {logoUrl && (
              <button onClick={() => { setLogoUrl(null); setDirty(true); }}
                className="text-xs text-error hover:underline text-left px-1">Remove logo</button>
            )}
            <p className="text-[10px] text-outline-variant">PNG, JPG or SVG. Max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Colour palette */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">Theme</p>
          <h3 className="text-base font-bold font-headline text-on-surface">Colour Palette</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Sets the primary colour across buttons, highlights, and charts</p>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PALETTE.map(p => (
            <button key={p.name} onClick={() => { setSelectedPalette(p.name); setDirty(true); }}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                selectedPalette === p.name
                  ? 'border-primary bg-primary-container/20'
                  : 'border-outline-variant/20 hover:border-outline-variant/40'
              }`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: p.primary }}>
                {selectedPalette === p.name && (
                  <span className="material-symbols-outlined text-white text-sm ms-filled">check</span>
                )}
              </div>
              <span className="text-xs font-semibold text-on-surface text-center leading-tight">{p.label}</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: p.primary }} />
                <div className="w-3 h-3 rounded-full" style={{ background: p.container }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={!dirty}
          className={`px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            dirty
              ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-sm'
              : 'bg-surface-container-high text-outline cursor-not-allowed'
          }`}>
          <span className="material-symbols-outlined text-sm ms-filled">palette</span>
          {dirty ? 'Apply Branding' : 'No Changes'}
        </button>
      </div>
    </div>
  );
}

// hex '#2d3b4e' → 'R G B'
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

// =============================================================================
// TAB: ACCOUNT
// =============================================================================

function AccountTab({ toast }) {
  const { user } = useAuth();
  const [current,  setCurrent]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleChange = () => {
    setError('');
    if (!current)         { setError('Enter your current password'); return; }
    if (newPass.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (newPass !== confirm) { setError('Passwords do not match'); return; }
    // In a real app this would call an API. For now just show success.
    setCurrent(''); setNewPass(''); setConfirm('');
    toast('✓ Password updated successfully');
  };

  const ic = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 pr-10';
  const lc = 'text-[10px] uppercase font-bold tracking-widest text-outline mb-1.5 block';

  return (
    <div className="max-w-lg space-y-6">
      {/* Current user card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-extrabold text-primary">{user?.initials ?? '?'}</span>
        </div>
        <div>
          <p className="font-bold text-on-surface">{user?.name}</p>
          <p className="text-sm text-on-surface-variant">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-primary-container text-primary rounded-full">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">Security</p>
          <h3 className="text-base font-bold font-headline text-on-surface">Change Password</h3>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Current Password', val: current, set: setCurrent, placeholder: 'Your current password' },
            { label: 'New Password',     val: newPass, set: setNewPass, placeholder: 'At least 6 characters'  },
            { label: 'Confirm Password', val: confirm, set: setConfirm, placeholder: 'Repeat new password'    },
          ].map((fi, i) => (
            <div key={i}>
              <label className={lc}>{fi.label}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={fi.val} onChange={e => fi.set(e.target.value)}
                  placeholder={fi.placeholder} className={ic} />
                {i === 0 && (
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                    <span className="material-symbols-outlined text-sm">{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                )}
              </div>
              {i === 2 && confirm && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${newPass === confirm ? 'text-green-600' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-xs ms-filled">{newPass === confirm ? 'check_circle' : 'cancel'}</span>
                  {newPass === confirm ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
          ))}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-error-container/20 border border-error/20 rounded-xl text-error text-sm">
              <span className="material-symbols-outlined text-sm">error</span>{error}
            </div>
          )}
          <button onClick={handleChange}
            className="w-full py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary-dim transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm ms-filled">lock_reset</span>Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SETTINGS PAGE
// =============================================================================

export function Settings({ toast, churchSettings, setChurchSettings }) {
  const [tab, setTab] = useState('profile');

  const TABS = [
    { id: 'profile',  icon: 'church',   label: 'Church Profile' },
    { id: 'branding', icon: 'palette',  label: 'Branding'       },
    { id: 'account',  icon: 'person',   label: 'My Account'     },
  ];

  return (
    <div className="fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center px-8">
        <span className="text-lg font-bold text-slate-800 font-headline">Settings</span>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface leading-none mb-2">Settings</h1>
          <p className="text-on-surface-variant">Configure your church profile, branding, and account preferences.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-surface-container mb-8">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}>
              <span className="material-symbols-outlined text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile'  && (
          <ChurchProfileTab
            churchSettings={churchSettings}
            setChurchSettings={setChurchSettings}
            toast={toast} />
        )}
        {tab === 'branding' && (
          <BrandingTab
            churchSettings={churchSettings}
            setChurchSettings={setChurchSettings}
            toast={toast} />
        )}
        {tab === 'account'  && <AccountTab toast={toast} />}
      </div>
    </div>
  );
}
