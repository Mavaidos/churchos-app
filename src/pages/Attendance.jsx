// ─── src/pages/Attendance.jsx ────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getLeaderGroupIds } from '../lib/auth';
import { MemberAvatar } from '../components/shared/Avatar';
import { downloadAttendanceExcel, printAttendanceSession } from '../lib/reports';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, Legend,
} from 'recharts';

const CHART_COLORS = ['#515f74','#7c8fa3','#3b4d62','#a8b6c4','#647a8e','#c2c9d1','#2d3b4e'];
const SERVICES = ['Sunday Morning Service','Wednesday Prayer','Home Cell Meeting','Ministry Session','Youth Ministry Night','Worship Rehearsal','Community Outreach'];

// =============================================================================
// TAB 1 — TAKE ATTENDANCE
// =============================================================================

function TakeAttendance({ members, groups, user, attendanceRecords, setAttendanceRecords }) {
  const isLeader       = user?.role === 'leader';
  const leaderGroupIds = isLeader ? getLeaderGroupIds(user) : [];
  const availGroups    = isLeader ? groups.filter(g => leaderGroupIds.includes(g.id)) : groups;

  const [groupId,    setGroupId]    = useState(availGroups[0]?.id ?? '');
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [service,    setService]    = useState('Sunday Morning Service');
  const [attendance, setAttendance] = useState({});
  const [saved,      setSaved]      = useState(false);

  const selectedGroup = groups.find(g => g.id === Number(groupId));
  const groupMembers  = selectedGroup ? members.filter(m => selectedGroup.memberIds.includes(m.id)) : [];
  const presentCount  = Object.values(attendance).filter(Boolean).length;
  const totalCount    = groupMembers.length;
  const rate          = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const handleToggle  = id => { setAttendance(prev => ({ ...prev, [id]: !prev[id] })); setSaved(false); };
  const handleMarkAll = p  => { const n = {}; groupMembers.forEach(m => { n[m.id] = p; }); setAttendance(n); setSaved(false); };

  const handleSave = () => {
    if (!selectedGroup || !groupMembers.length) return;
    const present = groupMembers.filter(m => attendance[m.id]).map(m => m.id);
    const absent  = groupMembers.filter(m => !attendance[m.id]).map(m => m.id);
    setAttendanceRecords(prev => [{
      id: Date.now(), groupId: selectedGroup.id, groupName: selectedGroup.name,
      date, service, present, absent,
      total: groupMembers.length, presentCount: present.length, attendanceRate: rate,
      recordedBy: user?.name ?? 'Unknown', recordedAt: new Date().toISOString(),
    }, ...prev]);
    setSaved(true);
  };

  const ic = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Session Details</p>
          <h3 className="text-lg font-bold font-headline">New Attendance Session</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-outline mb-1.5 block">Group</label>
              <select value={groupId} onChange={e => { setGroupId(e.target.value); setAttendance({}); setSaved(false); }} className={ic}>
                <option value="">Select a group…</option>
                {availGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-outline mb-1.5 block">Date</label>
              <input type="date" value={date} onChange={e => { setDate(e.target.value); setSaved(false); }} className={ic} />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-outline mb-1.5 block">Service / Event</label>
            <select value={service} onChange={e => setService(e.target.value)} className={ic}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedGroup && groupMembers.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Mark Attendance</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-semibold text-primary">{presentCount} present</span>
                <span className="text-sm text-on-surface-variant">of {totalCount}</span>
                <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${rate}%` }} />
                </div>
                <span className="text-sm font-bold text-primary">{rate}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleMarkAll(true)} className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors">All Present</button>
              <button onClick={() => handleMarkAll(false)} className="text-xs font-bold text-error bg-error-container/20 px-3 py-1.5 rounded-lg hover:bg-error-container/40 transition-colors">All Absent</button>
            </div>
          </div>

          <div className="divide-y divide-outline-variant/5">
            {groupMembers.map(m => {
              const isPresent = !!attendance[m.id];
              return (
                <button key={m.id} onClick={() => handleToggle(m.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${isPresent ? 'bg-green-50 hover:bg-green-100/70' : 'hover:bg-surface-container-low'}`}>
                  <MemberAvatar member={m} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{m.name}</p>
                    <p className="text-xs text-on-surface-variant">{m.group || '—'}</p>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isPresent ? 'bg-green-500 shadow-sm' : 'border-2 border-outline-variant/30 bg-surface-container'}`}>
                    {isPresent && <span className="material-symbols-outlined text-white text-sm ms-filled">check</span>}
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 w-14 text-right ${isPresent ? 'text-green-700' : 'text-error'}`}>
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-surface-container flex items-center justify-between">
            <div className="text-sm">
              {saved
                ? <span className="text-green-700 font-semibold flex items-center gap-1.5"><span className="material-symbols-outlined text-sm ms-filled">check_circle</span>Session saved!</span>
                : <span className="text-on-surface-variant">{presentCount} of {totalCount} marked</span>}
            </div>
            <div className="flex gap-3">
              {saved && (
                <button onClick={() => printAttendanceSession(
                  { groupName: selectedGroup.name, date, service,
                    present: groupMembers.filter(m => attendance[m.id]).map(m => m.id),
                    absent: groupMembers.filter(m => !attendance[m.id]).map(m => m.id),
                    total: totalCount, presentCount, attendanceRate: rate, recordedBy: user?.name }, members)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-sm">print</span>Print
                </button>
              )}
              <button onClick={handleSave} disabled={!groupMembers.length}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-dim transition-colors shadow-sm disabled:opacity-40">
                <span className="material-symbols-outlined text-sm ms-filled">save</span>Save Session
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGroup && groupMembers.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">group_off</span>
          <p className="font-semibold">No members in this group</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TAB 2 — HISTORY
// =============================================================================

function AttendanceHistory({ attendanceRecords, members, groups }) {
  const [search,      setSearch]      = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [expanded,    setExpanded]    = useState(null);

  const filtered = attendanceRecords
    .filter(r => (!filterGroup || String(r.groupId) === filterGroup) &&
      (!search || r.groupName.toLowerCase().includes(search.toLowerCase()) || r.date.includes(search)))
    .sort((a, b) => b.date.localeCompare(a.date));

  const uniqueGroups = [...new Map(attendanceRecords.map(r => [r.groupId, r.groupName])).entries()];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions…"
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Groups</option>
          {uniqueGroups.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        {attendanceRecords.length > 0 && (
          <button onClick={() => downloadAttendanceExcel(attendanceRecords, members, groups)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-sm">download</span>Export All (.xlsx)
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">history</span>
          <p className="font-semibold">No sessions recorded yet</p>
          <p className="text-sm mt-1 opacity-70">Take attendance to see history here</p>
        </div>
      ) : filtered.map(r => {
        const isOpen         = expanded === r.id;
        const sessionMembers = members.filter(m => [...(r.present ?? []), ...(r.absent ?? [])].includes(m.id));
        return (
          <div key={r.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : r.id)}
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-surface-container-low transition-colors">
              <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#eee" strokeWidth="4" />
                <circle cx="24" cy="24" r="20" fill="none"
                  stroke={r.attendanceRate >= 80 ? '#22c55e' : r.attendanceRate >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="4" strokeDasharray={`${r.attendanceRate * 1.257} 125.7`}
                  strokeDashoffset="31.4" strokeLinecap="round" transform="rotate(-90 24 24)" />
                <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="bold"
                  fill={r.attendanceRate >= 80 ? '#166534' : r.attendanceRate >= 60 ? '#92400e' : '#991b1b'}>
                  {r.attendanceRate}%
                </text>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface">{r.groupName}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{r.service} · {r.date}</p>
                <p className="text-xs text-on-surface-variant">
                  <span className="text-green-700 font-semibold">{r.presentCount} present</span>
                  {' · '}<span className="text-error font-semibold">{r.total - r.presentCount} absent</span>
                  {' · '}{r.total} total
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); printAttendanceSession(r, members); }}
                  className="p-2 rounded-lg text-outline-variant hover:text-primary hover:bg-primary-container/30 transition-colors" title="Print PDF">
                  <span className="material-symbols-outlined text-sm">print</span>
                </button>
                <button onClick={e => { e.stopPropagation(); downloadAttendanceExcel([r], members, groups); }}
                  className="p-2 rounded-lg text-outline-variant hover:text-primary hover:bg-primary-container/30 transition-colors" title="Download Excel">
                  <span className="material-symbols-outlined text-sm">download</span>
                </button>
                <span className={`material-symbols-outlined text-outline-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-surface-container divide-y divide-outline-variant/5">
                {sessionMembers.map(m => {
                  const isPresent = (r.present ?? []).includes(m.id);
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-6 py-3">
                      <MemberAvatar member={m} size={32} />
                      <span className="text-sm font-medium flex-1">{m.name}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isPresent ? 'bg-green-100 text-green-700' : 'bg-error-container/20 text-error'}`}>
                        <span className="material-symbols-outlined text-xs ms-filled">{isPresent ? 'check_circle' : 'cancel'}</span>
                        {isPresent ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  );
                })}
                <div className="px-6 py-2 bg-surface-container-low/50">
                  <p className="text-[10px] text-outline">Recorded by {r.recordedBy} · {new Date(r.recordedAt).toLocaleString('en-ZA')}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// TAB 3 — ANALYTICS
// =============================================================================

function GrowthMetrics({ members, attendanceRecords }) {
  const months = useMemo(() => {
    const anchor = new Date('2026-04-21');
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(anchor); d.setMonth(d.getMonth() - (5 - i));
      const key   = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
      return { month: label, newMembers: members.filter(m => (m.joinDate ?? '').startsWith(key)).length };
    });
  }, [members]);

  const avgRate      = attendanceRecords.length > 0 ? Math.round(attendanceRecords.reduce((s, r) => s + r.attendanceRate, 0) / attendanceRecords.length) : 0;
  const thisMonth    = new Date('2026-04-21').toISOString().slice(0, 7);
  const newThisMonth = members.filter(m => (m.joinDate ?? '').startsWith(thisMonth)).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'group',        label: 'Total Members',   value: members.length,        badge: `+${newThisMonth} this month`,           cls: 'text-primary bg-primary-container'     },
          { icon: 'how_to_reg',   label: 'Avg Attendance',  value: avgRate + '%',          badge: `${attendanceRecords.length} sessions`,  cls: 'text-green-700 bg-green-100'           },
          { icon: 'person_pin',   label: 'Have Mentor',     value: members.filter(m => m.mentor).length, badge: Math.round((members.filter(m=>m.mentor).length/Math.max(members.length,1))*100)+'% coverage', cls: 'text-secondary bg-secondary-container' },
          { icon: 'auto_awesome', label: 'In Blueprint',    value: members.filter(m => m.enrollmentStage === 'in_discipleship').length, badge: 'Discipleship active', cls: 'text-violet-700 bg-violet-100' },
        ].map(c => (
          <div key={c.label} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary-container/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">{c.icon}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>{c.badge}</span>
            </div>
            <p className="text-3xl font-extrabold font-headline text-primary">{c.value}</p>
            <p className="text-xs text-on-surface-variant font-semibold mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
        <h3 className="font-bold text-on-surface mb-0.5">New Members per Month</h3>
        <p className="text-xs text-on-surface-variant mb-4">Church growth — last 6 months</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ebeef2" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#596065' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#596065' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ebeef2', fontSize: 12 }} cursor={{ fill: '#f2f4f6' }} />
            <Bar dataKey="newMembers" name="New Members" radius={[6,6,0,0]}>
              {months.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GroupTrends({ attendanceRecords, groups }) {
  const { weeks, activeGroups } = useMemo(() => {
    const anchor = new Date('2026-04-21');
    const ws = Array.from({ length: 8 }, (_, i) => {
      const wStart = new Date(anchor); wStart.setDate(anchor.getDate() - (7 - i) * 7);
      const wEnd   = new Date(wStart); wEnd.setDate(wStart.getDate() + 6);
      const label  = wStart.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
      const entry  = { week: label };
      groups.forEach(g => {
        const recs = attendanceRecords.filter(r => { const d = new Date(r.date); return r.groupId === g.id && d >= wStart && d <= wEnd; });
        entry[g.name] = recs.length > 0 ? Math.round(recs.reduce((s,r) => s + r.attendanceRate, 0) / recs.length) : null;
      });
      return entry;
    });
    return { weeks: ws, activeGroups: groups.filter(g => attendanceRecords.some(r => r.groupId === g.id)) };
  }, [attendanceRecords, groups]);

  if (!activeGroups.length) return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-8 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">show_chart</span>
      <p className="font-semibold">No data yet — take attendance to see trends</p>
    </div>
  );

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
      <h3 className="font-bold text-on-surface mb-0.5">Attendance Rate by Group</h3>
      <p className="text-xs text-on-surface-variant mb-4">Weekly % present per group — last 8 weeks</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={weeks} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ebeef2" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#596065' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: '#596065' }} tickFormatter={v=>`${v}%`} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2.5 text-xs shadow-lg space-y-1">
                <p className="font-bold text-on-surface">{label}</p>
                {payload.map(p => p.value != null && <p key={p.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />{p.name}: <strong>{p.value}%</strong></p>)}
              </div>
            );
          }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {activeGroups.map((g, i) => (
            <Line key={g.id} type="monotone" dataKey={g.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function GroupHealthScores({ groups, members, stages, attendanceRecords }) {
  const scores = useMemo(() => groups.map(g => {
    const gm = members.filter(m => g.memberIds.includes(m.id));
    if (!gm.length) return null;
    const withMentor  = gm.filter(m => m.mentor).length;
    const inBlue      = gm.filter(m => m.enrollmentStage === 'in_discipleship').length;
    const sessions    = attendanceRecords.filter(r => r.groupId === g.id);
    const avgAttend   = sessions.length > 0 ? Math.round(sessions.reduce((s,r) => s + r.attendanceRate, 0) / sessions.length) : 0;
    const mentorPct   = Math.round((withMentor / gm.length) * 100);
    const bluePct     = Math.round((inBlue    / gm.length) * 100);
    const health      = Math.round(mentorPct * 0.3 + bluePct * 0.3 + avgAttend * 0.4);
    return { id: g.id, name: g.name, memberCount: gm.length, health, mentorPct, bluePct, avgAttend };
  }).filter(Boolean).sort((a,b) => b.health - a.health), [groups, members, stages, attendanceRecords]);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-container">
        <h3 className="font-bold text-on-surface">Group Health Scores</h3>
        <p className="text-xs text-on-surface-variant mt-0.5">40% attendance · 30% Blueprint · 30% mentorship</p>
      </div>
      <div className="divide-y divide-outline-variant/5">
        {scores.map(g => (
          <div key={g.id} className="px-6 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-on-surface">{g.name}</p>
                <span className="text-[10px] text-outline">{g.memberCount} members</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['Attendance', g.avgAttend], ['Blueprint', g.bluePct], ['Mentorship', g.mentorPct]].map(([l, v]) => (
                  <div key={l}>
                    <div className="flex justify-between text-[10px] text-on-surface-variant mb-0.5">
                      <span>{l}</span><span className="font-semibold">{v}%</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 text-center w-14">
              <div className={`text-2xl font-extrabold font-headline ${g.health >= 70 ? 'text-green-600' : g.health >= 50 ? 'text-amber-600' : 'text-error'}`}>{g.health}</div>
              <div className="text-[9px] font-bold uppercase tracking-wide text-outline">Health</div>
            </div>
          </div>
        ))}
        {!scores.length && <div className="py-8 text-center text-sm text-on-surface-variant">No group data yet</div>}
      </div>
    </div>
  );
}

function ChronicAbsences({ attendanceRecords, members }) {
  const navigate = useNavigate();
  const risks = useMemo(() => {
    const stats = {};
    attendanceRecords.forEach(r => {
      [...(r.present??[]), ...(r.absent??[])].forEach(mId => {
        if (!stats[mId]) stats[mId] = { sessions: 0, present: 0 };
        stats[mId].sessions++;
        if ((r.present??[]).includes(mId)) stats[mId].present++;
      });
    });
    return members.filter(m => stats[m.id] && stats[m.id].sessions >= 3 && (stats[m.id].present / stats[m.id].sessions) < 0.6)
      .map(m => { const s = stats[m.id]; const rate = Math.round((s.present/s.sessions)*100); return { ...m, sessions: s.sessions, present: s.present, rate }; })
      .sort((a,b) => a.rate - b.rate);
  }, [attendanceRecords, members]);

  if (!risks.length) return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-8 text-center">
      <span className="material-symbols-outlined text-4xl mb-3 block text-green-500 ms-filled">check_circle</span>
      <p className="font-bold text-on-surface">No attendance concerns</p>
      <p className="text-sm text-on-surface-variant mt-1">All members attending regularly</p>
    </div>
  );

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-container flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-error-container/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-sm ms-filled">warning</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-on-surface">Attendance Concerns</h3>
          <p className="text-xs text-on-surface-variant">Below 60% in at least 3 sessions</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold bg-error-container text-error rounded-full">{risks.length}</span>
      </div>
      <div className="divide-y divide-outline-variant/5">
        {risks.map(m => (
          <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors">
            <MemberAvatar member={m} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface">{m.name}</p>
              <p className="text-xs text-on-surface-variant">{m.group || '—'}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full" style={{ width: `${m.rate}%` }} />
                </div>
                <span className="text-[10px] text-error font-bold">{m.rate}%</span>
                <span className="text-[10px] text-on-surface-variant">{m.present}/{m.sessions}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${m.rate < 40 ? 'bg-error text-white' : 'bg-amber-100 text-amber-700'}`}>
                {m.rate < 40 ? 'Critical' : 'At Risk'}
              </span>
              <button onClick={() => navigate(`/members/${m.id}`)} className="p-2 rounded-lg text-outline-variant hover:text-primary hover:bg-primary-container/30 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export function Attendance({ members, groups, stages = [], attendanceRecords = [], setAttendanceRecords }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('take');

  const TABS = [
    { id: 'take',      icon: 'how_to_reg', label: 'Take Attendance' },
    { id: 'history',   icon: 'history',    label: 'History',   badge: attendanceRecords.length || null },
    { id: 'analytics', icon: 'bar_chart',  label: 'Analytics' },
  ];

  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center px-8 flex-shrink-0">
        <span className="text-lg font-bold text-slate-800 font-headline">Attendance</span>
      </div>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface leading-none mb-2">Attendance</h1>
          <p className="text-on-surface-variant">Track, analyse, and export attendance across all your groups.</p>
        </div>
        <div className="flex gap-0 border-b border-surface-container mb-8">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm">{t.icon}</span>
              {t.label}
              {t.badge && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-surface-container text-outline rounded-full">{t.badge}</span>}
            </button>
          ))}
        </div>
        {tab === 'take'      && <TakeAttendance members={members} groups={groups} user={user} attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} />}
        {tab === 'history'   && <AttendanceHistory attendanceRecords={attendanceRecords} members={members} groups={groups} />}
        {tab === 'analytics' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <GrowthMetrics members={members} attendanceRecords={attendanceRecords} />
            <GroupTrends attendanceRecords={attendanceRecords} groups={groups} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GroupHealthScores groups={groups} members={members} stages={stages} attendanceRecords={attendanceRecords} />
              <ChronicAbsences attendanceRecords={attendanceRecords} members={members} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
