// ─── src/pages/Dashboard.jsx ─────────────────────────────────────────────────
import { useAuth } from '../lib/auth';
import { hasPermission, getVisibleMembers, getLeaderGroupIds } from '../lib/auth';
import { getMemberStageName } from '../lib/engine';
import { STAGE_BAR_COLORS } from '../lib/constants';
import { seedActivity } from '../data/seed';
import { StatusBadge } from '../components/shared/StatusBadge';
import { SmAvatar, MemberAvatar } from '../components/shared/Avatar';
import { useNavigate } from 'react-router-dom';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// =============================================================================
// CHARTS
// =============================================================================

function DiscipleshipFunnelChart({ members, stages }) {
  const data = stages.map((s, i) => ({
    name: s.name,
    members: members.filter(m => m.currentStageIndex >= i).length,
  }));
  const COLORS = ['#515f74', '#506076', '#526073', '#455368'];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ebeef2" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#596065' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#596065' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ebeef2', fontSize: 12 }} cursor={{ fill: '#f2f4f6' }} />
        <Bar dataKey="members" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function AttendanceTrendChart({ totalMembers }) {
  const base = Math.round(totalMembers * 0.72);
  const data = [
    { week: 'W1', present: Math.round(base * 0.88) },
    { week: 'W2', present: Math.round(base * 0.91) },
    { week: 'W3', present: Math.round(base * 0.85) },
    { week: 'W4', present: Math.round(base * 0.94) },
    { week: 'W5', present: Math.round(base * 0.89) },
    { week: 'W6', present: Math.round(base * 0.96) },
    { week: 'W7', present: Math.round(base * 0.92) },
    { week: 'W8', present: Math.round(base * 0.97) },
  ];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ebeef2" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#596065' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#596065' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ebeef2', fontSize: 12 }} />
        <Line type="monotone" dataKey="present" stroke="#515f74" strokeWidth={2.5}
          dot={{ r: 4, fill: '#515f74' }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MembersByGroupChart({ members, groups }) {
  const data = groups
    .map(g => ({ name: g.name.length > 14 ? g.name.slice(0, 14) + '…' : g.name, members: g.memberIds.length }))
    .filter(d => d.members > 0)
    .sort((a, b) => b.members - a.members)
    .slice(0, 5);
  const COLORS = ['#515f74', '#506076', '#526073', '#455368', '#acb3b8'];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="members" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ebeef2', fontSize: 12 }} />
        <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#596065' }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// =============================================================================
// LEADER GROUP OVERVIEW — shown at top of dashboard when role = leader
// =============================================================================

function LeaderGroupOverview({ user, members, stages, groups, navigate }) {
  const leaderGroupIds = getLeaderGroupIds(user);
  const myGroups       = groups.filter(g => leaderGroupIds.includes(g.id));
  if (myGroups.length === 0) return null;

  const allMyMembers = members.filter(m => myGroups.some(g => g.memberIds.includes(m.id)));

  const stageColors = [
    'bg-blue-100 text-blue-700',
    'bg-cyan-100 text-cyan-700',
    'bg-violet-100 text-violet-700',
    'bg-green-100 text-green-700',
  ];

  const getProgress = m => {
    const s = stages[m.currentStageIndex ?? 0];
    if (!s) return 0;
    const tasks = m.tasks[s.id] || [];
    return s.requirements.length > 0
      ? Math.round((tasks.filter(Boolean).length / s.requirements.length) * 100)
      : 100;
  };

  return (
    <section className="space-y-4">
      {/* Group cards */}
      <div className={`grid gap-5 ${myGroups.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {myGroups.map(g => {
          const gMembers = members.filter(m => g.memberIds.includes(m.id));
          const avgProgress = gMembers.length === 0 ? 0
            : Math.round(gMembers.reduce((s, m) => s + getProgress(m), 0) / gMembers.length);
          return (
            <div key={g.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-4 border-b border-surface-container">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: g.iconBg ?? '#d5e3fd', color: g.iconColor ?? '#515f74' }}>
                  <span className="material-symbols-outlined text-2xl">{g.icon ?? 'groups'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Your Group</p>
                  <h3 className="text-lg font-bold font-headline text-on-surface truncate">{g.name}</h3>
                  {g.schedule && <p className="text-xs text-on-surface-variant">{g.schedule}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-3xl font-extrabold font-headline text-primary">{gMembers.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Members</p>
                </div>
              </div>

              {/* Stage distribution */}
              <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-surface-container">
                {stages.map((s, i) => {
                  const count = gMembers.filter(m => (m.currentStageIndex ?? 0) === i).length;
                  if (count === 0) return null;
                  return (
                    <span key={s.id} className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${stageColors[i] ?? 'bg-surface-container text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-xs">{s.icon}</span>{s.name} · {count}
                    </span>
                  );
                })}
                {gMembers.length === 0 && <span className="text-xs text-on-surface-variant italic">No members yet</span>}
              </div>

              {/* Avg progress bar */}
              <div className="px-6 py-3 flex items-center gap-3 border-b border-surface-container">
                <span className="text-xs text-on-surface-variant font-semibold flex-shrink-0">Avg Blueprint</span>
                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${avgProgress}%` }} />
                </div>
                <span className="text-xs font-bold text-primary flex-shrink-0">{avgProgress}%</span>
              </div>

              {/* Member rows */}
              <div className="divide-y divide-surface-container max-h-48 overflow-y-auto">
                {gMembers.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-2 block text-outline-variant">group_off</span>
                    <p className="text-sm font-semibold">No members assigned yet</p>
                  </div>
                ) : gMembers.map(m => {
                  const progress  = getProgress(m);
                  const stIdx     = m.currentStageIndex ?? 0;
                  const stageName = stages[stIdx]?.name ?? '—';
                  return (
                    <div key={m.id}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-surface-container-low transition-colors cursor-pointer"
                      onClick={() => navigate(`/members/${m.id}`)}>
                      <MemberAvatar member={m} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{m.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${stageColors[stIdx] ?? 'bg-surface-container text-on-surface-variant'}`}>
                            {stageName}
                          </span>
                          <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden max-w-[80px]">
                            <div className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                              style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-semibold">{progress}%</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline-variant text-sm flex-shrink-0">chevron_right</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick action buttons for leaders */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => navigate('/members')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary-dim transition-colors shadow-sm">
          <span className="material-symbols-outlined text-sm">group</span>View My Members
        </button>
        <button onClick={() => navigate('/messages')}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-sm">chat</span>Messages
        </button>
        <button onClick={() => navigate('/attendance')}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-sm">how_to_reg</span>Attendance
        </button>
      </div>
    </section>
  );
}

// =============================================================================
// DASHBOARD
// =============================================================================

export function Dashboard({ members, groups, stages, setSelectedMember, onAddMember }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLeader = user?.role === 'leader';

  const visibleMembers = getVisibleMembers(user, members, groups);
  const active         = visibleMembers.filter(m => m.status === 'active').length;
  const newApplicants  = visibleMembers.filter(m => m.enrollmentStage === 'new_applicant').length;
  const inDiscipleship = visibleMembers.filter(m => m.enrollmentStage === 'in_discipleship').length;

  const stageCounts = stages.map((s, i) => ({
    ...s,
    count: visibleMembers.filter(m => m.currentStageIndex >= i).length,
    color: STAGE_BAR_COLORS[i] ?? 'bg-primary',
  }));

  const recentMembers = [...visibleMembers]
    .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
    .slice(0, 4);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 fade-in">

      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
            {isLeader ? 'Group Overview' : 'Sanctuary Overview'}
          </h1>
          <p className="text-on-surface-variant mt-2">
            {isLeader
              ? `Welcome, ${user.name}. Here's your group's pulse today.`
              : 'Here is the pulse of your community today.'}
          </p>
        </div>
        {hasPermission(user, 'enrol') && onAddMember && (
          <button onClick={onAddMember}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-dim transition-all shadow-sm text-sm">
            <span className="material-symbols-outlined text-xl">add</span>Add New Member
          </button>
        )}
      </header>

      {/* ── LEADER VIEW — show group details prominently ── */}
      {isLeader && (
        <LeaderGroupOverview
          user={user} members={members} stages={stages} groups={groups} navigate={navigate} />
      )}

      {/* ── STAT CARDS — scoped to visible members ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            icon: 'group', label: isLeader ? 'Group Members' : 'Total Members',
            value: visibleMembers.length,
            badge: `+${visibleMembers.filter(m => m.joinDate > '2024-01-01').length} this year`,
            badgeClass: 'text-primary bg-primary-container',
          },
          {
            icon: 'how_to_reg', label: 'Active Members',
            value: active,
            badge: 'Steady', badgeClass: 'text-secondary bg-secondary-container',
          },
          {
            icon: 'pending', label: 'New Applicants',
            value: newApplicants,
            badge: newApplicants > 0 ? 'Needs Review' : 'All Clear',
            badgeClass: newApplicants > 0 ? 'text-amber-700 bg-amber-100' : 'text-tertiary bg-tertiary-container',
          },
          {
            icon: 'auto_awesome', label: 'In Blueprint',
            value: inDiscipleship,
            badge: 'Active', badgeClass: 'text-green-700 bg-green-100',
          },
        ].map(card => (
          <div key={card.label}
            className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${card.badgeClass}`}>{card.badge}</span>
            </div>
            <p className="text-on-surface-variant text-sm font-medium">{card.label}</p>
            <h3 className="text-3xl font-bold font-headline mt-1">{card.value}</h3>
          </div>
        ))}
      </section>

      {/* ── CHARTS — only shown to pastor/admin (leaders see their group details above) ── */}
      {!isLeader && (
        <>
          {/* Funnel + Activity */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold font-headline text-on-surface">Blueprint Journey</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Members at each stage</p>
                </div>
                <button onClick={() => navigate('/engine')}
                  className="text-xs font-semibold text-primary uppercase tracking-widest hover:underline">
                  Configure →
                </button>
              </div>
              <DiscipleshipFunnelChart members={visibleMembers} stages={stages} />
            </div>

            <div className="lg:col-span-5 bg-surface-container-low rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold font-headline text-on-surface">Recent Activity</h2>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">trending_up</span>
              </div>
              <div className="space-y-5">
                {seedActivity.map(a => (
                  <div key={a.id} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/10">
                      <span className="material-symbols-outlined text-primary text-sm">{a.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-on-surface">
                        <strong>{a.person}</strong> {a.action}{' '}
                        <span className="text-primary font-semibold">{a.highlight}</span>
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-tighter">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom charts */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/5">
              <h2 className="text-base font-bold font-headline text-on-surface mb-0.5">Weekly Attendance</h2>
              <p className="text-xs text-on-surface-variant mb-4">Present members per week (last 8 weeks)</p>
              <AttendanceTrendChart totalMembers={visibleMembers.length} />
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/5">
              <h2 className="text-base font-bold font-headline text-on-surface mb-0.5">Stage Distribution</h2>
              <p className="text-xs text-on-surface-variant mb-4">Members at each Blueprint stage</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stages.map((s, i) => ({
                      name: s.name,
                      value: visibleMembers.filter(m => m.currentStageIndex === i).length,
                    })).filter(d => d.value > 0)}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                    {stages.map((_, i) => <Cell key={i} fill={['#515f74','#506076','#526073','#455368'][i % 4]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ebeef2', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#596065' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/5">
              <h2 className="text-base font-bold font-headline text-on-surface mb-0.5">Members by Group</h2>
              <p className="text-xs text-on-surface-variant mb-4">Top 5 groups by membership</p>
              <MembersByGroupChart members={visibleMembers} groups={groups} />
            </div>
          </section>
        </>
      )}

      {/* ── RECENTLY JOINED — always shown, scoped ── */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold font-headline">
            {isLeader ? 'Group Members — Recent' : 'Recently Joined'}
          </h2>
          <button onClick={() => navigate('/members')}
            className="text-xs font-semibold text-primary hover:underline">
            View All →
          </button>
        </div>
        {recentMembers.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">group_off</span>
            <p className="text-sm font-semibold">No members yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container">
            {recentMembers.map(m => (
              <div key={m.id}
                className="flex items-center gap-4 py-4 hover:bg-surface-container-low -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => navigate(`/members/${m.id}`)}>
                <SmAvatar member={m} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface truncate">{m.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{m.group || 'New Enrolment'}</p>
                </div>
                <StatusBadge status={m.status} enrollmentStage={m.enrollmentStage} />
                <span className="text-xs text-on-surface-variant hidden sm:block">{m.joinDate}</span>
                <span className="material-symbols-outlined text-outline-variant text-sm">chevron_right</span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
