import { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { SmAvatar } from '../components/shared/Avatar';
import { MemberAvatar } from '../components/shared/Avatar';

export function Attendance({ members = [], groups = [] }) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);

  const group = groups.find(g => g.id === Number(selectedGroup));
  const groupMembers = members.filter(m => group?.memberIds.includes(m.id));

  const toggle = (id) => setAttendance(p => ({ ...p, [id]: !p[id] }));

  const present = Object.values(attendance).filter(Boolean).length;
  const total   = groupMembers.length;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fade-in">
      <TopBar title="Attendance"/>
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight">Attendance</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Track member attendance for groups and services.</p>
        </div>

        {/* Controls */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Group</label>
            <select value={selectedGroup ?? ''} onChange={e => { setSelectedGroup(e.target.value); setAttendance({}); setSaved(false); }}
              className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"/>
          </div>
          {total > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold font-headline text-primary">{present}/{total}</p>
              <p className="text-[10px] text-outline uppercase tracking-widest">Present</p>
            </div>
          )}
        </div>

        {/* Roster */}
        {groupMembers.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">group_off</span>
            <p className="font-semibold">No members in this group</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-container flex justify-between items-center">
              <h3 className="font-bold font-headline">{group?.name} — {date}</h3>
              <div className="flex gap-2">
                <button onClick={() => setAttendance(Object.fromEntries(groupMembers.map(m => [m.id, true])))}
                  className="text-xs font-bold text-primary hover:underline">Mark All Present</button>
                <span className="text-outline-variant">·</span>
                <button onClick={() => setAttendance({})}
                  className="text-xs font-bold text-on-surface-variant hover:underline">Clear</button>
              </div>
            </div>
            <div className="divide-y divide-surface-container">
              {groupMembers.map(m => (
                <div key={m.id} onClick={() => toggle(m.id)}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${attendance[m.id] ? 'bg-green-50' : 'hover:bg-surface-container-low'}`}>
                  <SmAvatar member={m}/>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-on-surface">{m.name}</p>
                    <p className="text-xs text-on-surface-variant">{m.group}</p>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${attendance[m.id] ? 'bg-green-500 border-green-500' : 'border-outline-variant/30 bg-white'}`}>
                    {attendance[m.id] && <span className="material-symbols-outlined text-white text-sm ms-filled">check</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-surface-container flex justify-end">
              <button onClick={handleSave}
                className={`px-6 py-2.5 font-semibold text-sm rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'bg-primary text-on-primary hover:bg-primary-dim'}`}>
                {saved ? '✓ Saved!' : 'Save Attendance'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}