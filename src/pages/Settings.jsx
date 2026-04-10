import { useState } from 'react';
import { useBranding, FONT_PAIRS, COLOR_PRESETS, LOGO_ICONS, DEFAULT_BRANDING } from '../lib/branding.jsx';

export function Settings({ toast }) {
  const { branding, setBranding } = useBranding();
  const [activeTab, setActiveTab] = useState('branding');

  // ── Church profile state ──────────────────────────────────────────────────
  const [churchName, setChurchName] = useState('Grace Community Church');
  const [timezone, setTimezone]     = useState('Africa/Johannesburg');

  // ── Notifications state ───────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({ email: true, sms: false, weekly: true });

  // ── Branding draft — uncommitted until Apply ──────────────────────────────
  const [draft, setDraft] = useState({ ...branding });
  const fd = (k, v) => setDraft(p => ({ ...p, [k]: v }));

  const saveBranding = () => {
    setBranding(draft);
    toast('✓ Branding applied across the app');
  };

  const resetBranding = () => {
    if (!window.confirm('Reset all branding to defaults?')) return;
    setDraft({ ...DEFAULT_BRANDING });
    setBranding(DEFAULT_BRANDING);
    toast('Branding reset to default');
  };

  const TABS = [
    { id: 'branding',       label: 'Branding',       icon: 'palette'       },
    { id: 'church',         label: 'Church Profile', icon: 'church'        },
    { id: 'notifications',  label: 'Notifications',  icon: 'notifications' },
  ];

  return (
    <div className="fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center px-8">
        <span className="text-lg font-bold text-on-surface font-headline">Settings</span>
      </div>

      {/* Tab bar */}
      <div className="sticky top-16 z-20 bg-white border-b border-slate-100">
        <div className="flex max-w-3xl mx-auto px-8">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 -mb-px transition-all ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 max-w-3xl mx-auto">

        {/* ══════════════════════════════════════════════════════════════════
            BRANDING TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'branding' && (
          <div className="space-y-8 fade-in">

            {/* Header */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-extrabold font-headline tracking-tight">Branding</h1>
                <p className="text-on-surface-variant mt-1 text-sm">
                  Customise how your app looks and feels. Changes preview instantly — click Apply to save.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={resetBranding}
                  className="px-4 py-2 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">
                  Reset
                </button>
                <button onClick={saveBranding}
                  className="px-6 py-2 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors shadow-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm ms-filled">palette</span>Apply Branding
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-surface-container-low rounded-2xl p-1 border border-outline-variant/10">
              <div className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-on-primary flex-shrink-0 shadow-sm"
                  style={{ background: draft.primaryHex }}>
                  {draft.logoType === 'icon'
                    ? <span className="material-symbols-outlined ms-filled">{draft.logoIcon}</span>
                    : <span className="font-black text-sm">{(draft.orgName || 'AA').slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-on-surface text-base tracking-tight truncate"
                    style={{ fontFamily: `"${FONT_PAIRS[draft.fontPair]?.headline ?? 'Manrope'}", sans-serif` }}>
                    {draft.orgName || 'Your Organisation'}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-outline font-bold">
                    {draft.tagline || 'Your Tagline'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: draft.primaryHex }} />
                    <div className="w-4 h-4 rounded-full shadow-sm opacity-60" style={{ background: draft.primaryHex }} />
                    <div className="w-4 h-4 rounded-full shadow-sm opacity-30" style={{ background: draft.primaryHex }} />
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {FONT_PAIRS[draft.fontPair]?.headline ?? 'Manrope'} · {draft.mode === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Identity ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-surface-container flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm ms-filled">business</span>
                <h3 className="text-sm font-bold font-headline text-on-surface">Organisation Identity</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Organisation Name</label>
                  <input value={draft.orgName} onChange={e => fd('orgName', e.target.value)}
                    placeholder="e.g. Grace Community Church"
                    className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Tagline</label>
                  <input value={draft.tagline} onChange={e => fd('tagline', e.target.value)}
                    placeholder="e.g. Growing Together in Faith"
                    className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <p className="text-[10px] text-outline-variant mt-1">Shown in the sidebar and login screen.</p>
                </div>
              </div>
            </div>

            {/* ── Logo ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-surface-container flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm ms-filled">image</span>
                <h3 className="text-sm font-bold font-headline text-on-surface">Logo Style</h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'icon', l: 'Icon',     d: 'Choose from a curated icon set' },
                    { v: 'text', l: 'Initials', d: 'First two letters of your name'  },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => fd('logoType', opt.v)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${draft.logoType === opt.v ? 'border-primary bg-primary-container/20' : 'border-outline-variant/20 hover:border-outline-variant/40'}`}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-on-primary flex-shrink-0 shadow-sm"
                        style={{ background: draft.primaryHex }}>
                        {opt.v === 'icon'
                          ? <span className="material-symbols-outlined ms-filled text-sm">{draft.logoIcon}</span>
                          : <span className="text-sm font-black">{(draft.orgName || 'AB').slice(0, 2).toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface">{opt.l}</p>
                        <p className="text-[10px] text-on-surface-variant leading-tight">{opt.d}</p>
                      </div>
                      {draft.logoType === opt.v && (
                        <span className="material-symbols-outlined text-primary ms-filled flex-shrink-0 text-sm">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>

                {draft.logoType === 'icon' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-3 block">Choose Icon</label>
                    <div className="grid grid-cols-6 gap-2">
                      {LOGO_ICONS.map(ic => (
                        <button key={ic} onClick={() => fd('logoIcon', ic)}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all border-2 ${draft.logoIcon === ic ? 'border-primary bg-primary-container/30 text-primary' : 'border-outline-variant/10 bg-surface-container-low hover:border-primary/30 text-on-surface-variant'}`}>
                          <span className={`material-symbols-outlined ${draft.logoIcon === ic ? 'ms-filled' : ''}`}>{ic}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Brand Color ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-surface-container flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm ms-filled">palette</span>
                <h3 className="text-sm font-bold font-headline text-on-surface">Brand Color</h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map(p => (
                    <button key={p.hex} onClick={() => fd('primaryHex', p.hex)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${draft.primaryHex === p.hex ? 'border-on-surface/20 shadow-md bg-surface-container-low' : 'border-transparent hover:border-outline-variant/20 hover:bg-surface-container-low'}`}>
                      <div className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm" style={{ background: p.hex }} />
                      <span className="text-xs font-semibold text-on-surface truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-surface-container">
                  <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline flex-shrink-0">Custom</label>
                  <div className="flex items-center gap-3 flex-1">
                    <input type="color" value={draft.primaryHex}
                      onChange={e => fd('primaryHex', e.target.value)}
                      className="w-10 h-10 rounded-lg border-2 border-outline-variant/20 cursor-pointer p-0.5 bg-transparent flex-shrink-0" />
                    <input value={draft.primaryHex}
                      onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && fd('primaryHex', e.target.value)}
                      className="border border-outline-variant/30 bg-surface-container-low rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20 w-28" />
                    {/* Color tints preview */}
                    <div className="flex gap-1 ml-2">
                      {[1, 0.6, 0.3, 0.12].map((o, i) => (
                        <div key={i} className="w-6 h-6 rounded-md shadow-sm"
                          style={{ background: draft.primaryHex, opacity: o }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Typography ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-surface-container flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm ms-filled">text_fields</span>
                <h3 className="text-sm font-bold font-headline text-on-surface">Typography</h3>
              </div>
              <div className="p-6 space-y-3">
                {Object.entries(FONT_PAIRS).map(([key, pair]) => (
                  <button key={key} onClick={() => fd('fontPair', key)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${draft.fontPair === key ? 'border-primary bg-primary-container/10' : 'border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container-low'}`}>
                    <div>
                      <p className="text-sm font-bold text-on-surface"
                        style={{ fontFamily: `"${pair.headline}", sans-serif` }}>
                        {pair.label}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{pair.headline} (headings) · {pair.body} (body)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold" style={{ fontFamily: `"${pair.headline}", sans-serif`, color: draft.primaryHex }}>Aa</p>
                      {draft.fontPair === key && (
                        <span className="material-symbols-outlined text-primary ms-filled text-sm">check_circle</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Appearance / Dark mode ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-surface-container flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm ms-filled">contrast</span>
                <h3 className="text-sm font-bold font-headline text-on-surface">Appearance</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'light', icon: 'light_mode',  label: 'Light', desc: 'Clean white interface',   bg: 'bg-white border border-slate-200 text-slate-700'     },
                    { v: 'dark',  icon: 'dark_mode',   label: 'Dark',  desc: 'Easy on the eyes at night', bg: 'bg-slate-900 text-white'                          },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => fd('mode', opt.v)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${draft.mode === opt.v ? 'border-primary bg-primary-container/10' : 'border-outline-variant/20 hover:border-outline-variant/40'}`}>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.bg}`}>
                        <span className="material-symbols-outlined ms-filled">{opt.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface">{opt.label}</p>
                        <p className="text-[10px] text-on-surface-variant">{opt.desc}</p>
                      </div>
                      {draft.mode === opt.v && (
                        <span className="material-symbols-outlined text-primary ms-filled flex-shrink-0 text-sm">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-outline-variant mt-3">Note: Dark mode adjusts surface and background tones. For a full dark theme, apply and then fine-tune your brand color to suit.</p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-between items-center pt-2">
              <button onClick={resetBranding}
                className="text-sm font-semibold text-on-surface-variant hover:text-error transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">restart_alt</span>Reset to Default
              </button>
              <button onClick={saveBranding}
                className="px-8 py-3 font-semibold text-sm rounded-xl shadow-sm transition-all bg-primary text-on-primary hover:bg-primary-dim flex items-center gap-2">
                <span className="material-symbols-outlined text-sm ms-filled">palette</span>Apply Branding
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHURCH PROFILE TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'church' && (
          <div className="space-y-8 fade-in">
            <div>
              <h1 className="text-3xl font-extrabold font-headline tracking-tight">Church Profile</h1>
              <p className="text-on-surface-variant mt-1 text-sm">Configure your workspace settings.</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/5 space-y-5">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Church Name</label>
                <input value={churchName} onChange={e => setChurchName(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low">
                  {['Africa/Johannesburg', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London'].map(z => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => toast('Settings saved')}
                className="px-8 py-3 font-semibold text-sm rounded-xl shadow-sm bg-primary text-on-primary hover:bg-primary-dim transition-all">
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            NOTIFICATIONS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className="space-y-8 fade-in">
            <div>
              <h1 className="text-3xl font-extrabold font-headline tracking-tight">Notifications</h1>
              <p className="text-on-surface-variant mt-1 text-sm">Configure how and when you receive updates.</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
              {[
                { label: 'Email Notifications', desc: 'Receive updates and alerts via email',     key: 'email'  },
                { label: 'SMS Alerts',           desc: 'Text message for urgent pastoral items',  key: 'sms'    },
                { label: 'Weekly Digest',        desc: 'Community summary every Monday morning', key: 'weekly' },
              ].map((n, i) => (
                <div key={n.key} className={`flex items-center justify-between px-6 py-5 ${i < 2 ? 'border-b border-surface-container' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{n.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{n.desc}</p>
                  </div>
                  <input type="checkbox" className="apple-toggle" checked={notifs[n.key]}
                    onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => toast('Notification settings saved')}
                className="px-8 py-3 font-semibold text-sm rounded-xl shadow-sm bg-primary text-on-primary hover:bg-primary-dim transition-all">
                Save Settings
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
