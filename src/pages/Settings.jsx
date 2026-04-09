import { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';

export function Settings({ toast }) {
  const [churchName, setChurchName] = useState('Grace Community Church');
  const [timezone, setTimezone]     = useState('Africa/Johannesburg');
  const [notifs, setNotifs]         = useState({ email:true, sms:false, weekly:true });
  const [saved, setSaved]           = useState(false);

  const save = () => { setSaved(true); toast('Settings saved'); setTimeout(() => setSaved(false), 2000); };

  const inputCls = 'w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low';

  return (
    <div className="fade-in">
      <TopBar title="Settings"/>
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight">Settings</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Configure your ChurchOS workspace.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5">
          <h3 className="text-lg font-bold font-headline mb-6">Church Profile</h3>
          <div className="space-y-5">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Church Name</label>
              <input value={churchName} onChange={e => setChurchName(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls}>
                {['Africa/Johannesburg','America/New_York','America/Chicago','America/Los_Angeles','Europe/London'].map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5">
          <h3 className="text-lg font-bold font-headline mb-6">Notifications</h3>
          <div className="space-y-5">
            {[
              { label:'Email Notifications', key:'email'  },
              { label:'SMS Alerts',          key:'sms'    },
              { label:'Weekly Digest',       key:'weekly' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between">
                <label className="text-sm font-medium text-on-surface">{n.label}</label>
                <input type="checkbox" className="apple-toggle" checked={notifs[n.key]} onChange={() => setNotifs(p => ({ ...p, [n.key]:!p[n.key] }))}/>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={save}
            className={`px-8 py-3 font-semibold text-sm rounded-xl shadow-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-primary text-on-primary hover:bg-primary-dim'}`}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}