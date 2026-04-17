import { useState, useRef, useEffect } from 'react';
import { MemberAvatar } from '../components/shared/Avatar';

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Canonical thread key for any message.
 * - 'broadcast'         → admin-to-all
 * - 'group-{id}'        → group thread
 * - 'member-{memberId}' → direct (admin↔member OR leader↔member)
 *   The memberId is ALWAYS the non-admin/leader side so both directions
 *   land in the same thread.
 */
function threadKey(msg) {
  if (msg.toType === 'all') return 'broadcast';
  if (msg.toType === 'group') return `group-${msg.toId}`;
  // direct: key on the member's id regardless of direction
  const mId = msg.fromRole === 'member' ? msg.fromId : msg.toId;
  return `member-${mId}`;
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

/**
 * Returns only the messages this user is allowed to see.
 * - Pastor / Admin: everything
 * - Leader: their group thread + direct threads with members IN their group
 * - Member: this function is not called for members (they have their own portal view)
 */
function getVisibleMessages(user, messages, members, groups) {
  if (!user) return [];
  if (user.role === 'pastor' || user.role === 'admin') return messages;

  if (user.role === 'leader') {
    const myGroup = groups.find(g => g.id === user.groupId);
    const myMemberIdSet = new Set((myGroup?.memberIds ?? []).map(String));
    return messages.filter(msg => {
      if (msg.toType === 'group' && msg.toId === user.groupId) return true;
      if (msg.toType === 'member') {
        const mId = msg.fromRole === 'member' ? String(msg.fromId) : String(msg.toId);
        return myMemberIdSet.has(mId);
      }
      return false;
    });
  }
  return [];
}

/**
 * Build a map of threadKey → thread object from visible messages.
 */
function buildThreads(visibleMessages, members, groups, user) {
  const map = {};
  visibleMessages.forEach(msg => {
    const key = threadKey(msg);
    if (!map[key]) {
      let name = '', member = null, group = null;
      if (msg.toType === 'all') {
        name = 'All Members';
      } else if (msg.toType === 'group') {
        group = groups.find(g => g.id === msg.toId);
        name = group?.name ?? msg.toName ?? 'Group';
      } else {
        const mId = msg.fromRole === 'member' ? msg.fromId : msg.toId;
        member = members.find(m => String(m.id) === String(mId));
        name = member?.name ?? (msg.fromRole === 'member' ? msg.fromName : msg.toName) ?? 'Member';
      }
      map[key] = { key, type: msg.toType, toId: msg.toId, name, member, group, msgs: [], unread: 0, last: null };
    }
    map[key].msgs.push(msg);
    if (!msg.read && String(msg.fromId) !== String(user?.id)) map[key].unread++;
    if (!map[key].last || new Date(msg.timestamp) > new Date(map[key].last.timestamp)) map[key].last = msg;
  });
  return map;
}

// =============================================================================
// THREAD AVATAR
// =============================================================================

function ThreadAvatar({ thread, size = 40 }) {
  if (thread.type === 'all') {
    return (
      <div style={{ width: size, height: size }}
        className="rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-secondary ms-filled" style={{ fontSize: 18 }}>groups</span>
      </div>
    );
  }
  if (thread.type === 'group') {
    const g = thread.group;
    return (
      <div style={{ width: size, height: size, background: g?.iconBg ?? '#d5e3fd', color: g?.iconColor ?? '#515f74' }}
        className="rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{g?.icon ?? 'diversity_3'}</span>
      </div>
    );
  }
  if (thread.member) return <MemberAvatar member={thread.member} size={size} />;
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
      <span className="material-symbols-outlined text-outline" style={{ fontSize: 16 }}>person</span>
    </div>
  );
}

// =============================================================================
// COMPOSE MODAL
// =============================================================================

function ComposeModal({ user, groups, members, onClose, onSend }) {
  const isLeader  = user?.role === 'leader';
  const myGroup   = isLeader ? groups.find(g => g.id === user.groupId) : null;
  const myMembers = isLeader
    ? members.filter(m => myGroup?.memberIds?.includes(m.id))
    : members;

  // Leaders can only send to their own group or its members
  const allowedToTypes = isLeader
    ? [{ val: 'member', label: 'Member in my group', icon: 'person' },
       { val: 'group',  label: 'My whole group',    icon: 'diversity_3' }]
    : [{ val: 'member', label: 'Member',             icon: 'person' },
       { val: 'group',  label: 'Group',              icon: 'diversity_3' },
       { val: 'all',    label: 'Everyone',            icon: 'groups' }];

  const [toType, setToType]     = useState(allowedToTypes[0].val);
  const [toId, setToId]         = useState('');
  const [body, setBody]         = useState('');
  const [search, setSearch]     = useState('');

  const recipientList =
    toType === 'group'
      ? (isLeader ? (myGroup ? [myGroup] : []) : groups)
          .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()))
      : myMembers.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  const selectedGroup  = toType === 'group'  ? groups.find(g => String(g.id) === String(toId)) : null;
  const selectedMember = toType === 'member' ? members.find(m => String(m.id) === String(toId)) : null;
  const canSend = body.trim() && (toType === 'all' || toId);

  // For leader + group type, auto-select their group
  useEffect(() => {
    if (isLeader && toType === 'group' && myGroup) setToId(String(myGroup.id));
  }, [toType]);

  const handleSend = () => {
    if (!canSend) return;
    const toName =
      toType === 'all'    ? 'All Members' :
      toType === 'group'  ? (selectedGroup?.name ?? myGroup?.name ?? '') :
                            (selectedMember?.name ?? '');
    onSend({ toType, toId: toType === 'all' ? null : Number(toId), toName, body: body.trim() });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 slide-in overflow-hidden flex flex-col max-h-[88vh]">
        <div className="p-7 pb-5 border-b border-surface-container flex justify-between items-start flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">New Message</p>
            <h3 className="text-xl font-bold font-headline">Compose</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-7 space-y-5 overflow-y-auto flex-1">
          {/* To type */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">Send To</label>
            <div className={`grid gap-2 ${allowedToTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {allowedToTypes.map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => { setToType(opt.val); setToId(''); setSearch(''); }}
                  className={`py-3 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                    toType === opt.val
                      ? 'border-primary bg-primary-container/30 text-primary'
                      : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant'
                  }`}>
                  <span className={`material-symbols-outlined text-base ${toType === opt.val ? 'ms-filled' : ''}`}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient picker */}
          {toType !== 'all' && !(isLeader && toType === 'group') && (
            <div>
              <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">
                {toType === 'group' ? 'Select Group' : 'Select Member'}
              </label>

              {toId && (selectedGroup || selectedMember) ? (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-primary-container/30 rounded-xl">
                  {toType === 'member' && selectedMember && <MemberAvatar member={selectedMember} size={28} />}
                  {toType === 'group' && selectedGroup && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: selectedGroup.iconBg, color: selectedGroup.iconColor }}>
                      <span className="material-symbols-outlined text-sm">{selectedGroup.icon}</span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-primary flex-1 truncate">
                    {toType === 'group' ? selectedGroup?.name : selectedMember?.name}
                  </span>
                  <button onClick={() => { setToId(''); setSearch(''); }}
                    className="text-primary hover:opacity-70 flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">search</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
                      placeholder={`Search ${toType === 'group' ? 'groups' : 'members'}…`}
                      className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-outline-variant/10 rounded-xl bg-surface-container-low/50 divide-y divide-outline-variant/5">
                    {recipientList.length === 0 ? (
                      <p className="text-xs text-outline text-center py-4">No results</p>
                    ) : recipientList.map(opt => (
                      <button key={opt.id} type="button"
                        onClick={() => { setToId(String(opt.id)); setSearch(''); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-lowest transition-colors text-left">
                        {toType === 'member' ? (
                          <MemberAvatar member={opt} size={32} />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: opt.iconBg ?? '#d5e3fd', color: opt.iconColor ?? '#515f74' }}>
                            <span className="material-symbols-outlined text-sm">{opt.icon ?? 'diversity_3'}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{opt.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {toType === 'member' ? (opt.group || 'No group assigned') : `${opt.memberIds?.length ?? 0} members`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Leader group auto-selection label */}
          {isLeader && toType === 'group' && myGroup && (
            <div className="flex items-center gap-3 px-4 py-3 bg-primary-container/20 rounded-xl">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: myGroup.iconBg, color: myGroup.iconColor }}>
                <span className="material-symbols-outlined text-sm">{myGroup.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-primary">{myGroup.name}</p>
                <p className="text-xs text-on-surface-variant">{myGroup.memberIds?.length ?? 0} members will receive this</p>
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
              placeholder="Write your message…"
              className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>

        <div className="p-6 border-t border-surface-container flex gap-3 justify-end flex-shrink-0">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSend} disabled={!canSend}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${
              canSend ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-sm' : 'bg-surface-container-high text-outline cursor-not-allowed'
            }`}>
            <span className="material-symbols-outlined text-sm">send</span>Send
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LEADER GROUP DASHBOARD (shown at top when role = leader)
// =============================================================================

function LeaderGroupDashboard({ user, members, stages, groups }) {
  const myGroup   = groups.find(g => g.id === user.groupId);
  const myMembers = members.filter(m => myGroup?.memberIds?.includes(m.id));

  if (!myGroup) return null;

  const stageColors = ['bg-blue-100 text-blue-700', 'bg-cyan-100 text-cyan-700', 'bg-violet-100 text-violet-700', 'bg-green-100 text-green-700'];

  const getStageName = (m) => stages[m.currentStageIndex ?? 0]?.name ?? 'Unknown';
  const getProgress = (m) => {
    const s = stages[m.currentStageIndex ?? 0];
    if (!s) return 0;
    const tasks = m.tasks[s.id] || [];
    return s.requirements.length > 0 ? Math.round((tasks.filter(Boolean).length / s.requirements.length) * 100) : 100;
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-6 py-5 border-b border-surface-container flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: myGroup.iconBg, color: myGroup.iconColor }}>
          <span className="material-symbols-outlined text-2xl">{myGroup.icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Your Group</p>
          <h3 className="text-lg font-bold font-headline">{myGroup.name}</h3>
          <p className="text-xs text-on-surface-variant">{myGroup.description} · {myGroup.schedule}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-3xl font-extrabold font-headline text-primary">{myMembers.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Members</p>
        </div>
      </div>

      {/* Stage summary pills */}
      <div className="px-6 py-4 border-b border-surface-container flex flex-wrap gap-2">
        {stages.map((s, i) => {
          const count = myMembers.filter(m => (m.currentStageIndex ?? 0) === i).length;
          return (
            <span key={s.id}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${stageColors[i] ?? 'bg-surface-container text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-xs">{s.icon}</span>
              {s.name} · {count}
            </span>
          );
        })}
      </div>

      {/* Member rows */}
      <div className="divide-y divide-surface-container">
        {myMembers.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl mb-2 block text-outline-variant">group_off</span>
            <p className="text-sm font-semibold">No members assigned yet</p>
          </div>
        ) : myMembers.map(m => {
          const progress = getProgress(m);
          const stageName = getStageName(m);
          const stIdx = m.currentStageIndex ?? 0;
          return (
            <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors">
              <MemberAvatar member={m} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">{m.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${stageColors[stIdx] ?? 'bg-surface-container text-on-surface-variant'}`}>
                    {stageName}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden max-w-[120px]">
                    <div className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-semibold">{progress}%</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                  m.enrollmentStage === 'in_discipleship' ? 'bg-green-100 text-green-700' :
                  m.enrollmentStage === 'approved' ? 'bg-primary-container text-primary' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {m.enrollmentStage === 'in_discipleship' ? 'Blueprint' :
                   m.enrollmentStage === 'approved' ? 'Approved' : 'New'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MESSAGES PAGE (admin + leader)
// =============================================================================

export function Messages({ groups, members = [], stages = [], messages = [], setMessages, user }) {
  const [selectedKey, setSelectedKey]   = useState(null);
  const [showCompose, setShowCompose]   = useState(false);
  const [reply, setReply]               = useState('');
  const bottomRef = useRef(null);
  const isLeader = user?.role === 'leader';

  const visible   = getVisibleMessages(user, messages, members, groups);
  const threadMap = buildThreads(visible, members, groups, user);
  const threadList = Object.values(threadMap)
    .sort((a, b) => new Date(b.last?.timestamp ?? 0) - new Date(a.last?.timestamp ?? 0));

  const active       = selectedKey ? threadMap[selectedKey] : null;
  const threadMsgs   = [...(active?.msgs ?? [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const totalUnread  = threadList.reduce((s, t) => s + t.unread, 0);

  // Auto-select the most recent thread on mount (so the right pane isn't blank)
  useEffect(() => {
    if (threadList.length > 0 && !selectedKey) {
      setSelectedKey(threadList[0].key);
    }
  }, [threadList.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedKey, messages.length]);

  const selectThread = (key) => {
    setSelectedKey(key);
    setMessages(prev => prev.map(m => threadKey(m) === key ? { ...m, read: true } : m));
  };

  const sendReply = () => {
    if (!reply.trim() || !active) return;
    const msg = {
      id: Date.now(),
      fromId: user?.id ?? 'admin',
      fromName: user?.name ?? 'Admin',
      fromRole: user?.role ?? 'admin',
      toType: active.type,
      toId:   active.toId,
      toName: active.name,
      body:   reply.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    setMessages(prev => [...prev, msg]);
    setReply('');
  };

  const handleComposeSend = ({ toType, toId, toName, body }) => {
    const msg = {
      id: Date.now(),
      fromId: user?.id ?? 'admin',
      fromName: user?.name ?? 'Admin',
      fromRole: user?.role ?? 'admin',
      toType, toId, toName,
      body,
      timestamp: new Date().toISOString(),
      read: true,
    };
    setMessages(prev => [...prev, msg]);
    const k = threadKey(msg);
    setSelectedKey(k);
    setShowCompose(false);
  };

  return (
    <div className="fade-in flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-slate-800 font-headline">Messages</span>
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-primary text-on-primary rounded-full">{totalUnread}</span>
          )}
        </div>
        <button onClick={() => setShowCompose(true)}
          className="bg-primary hover:bg-primary-dim text-on-primary px-5 py-2 rounded-md flex items-center gap-2 font-semibold text-sm transition-all shadow-sm">
          <span className="material-symbols-outlined text-lg">edit_square</span>New Message
        </button>
      </div>

      {/* Leader group overview (only for leaders) */}
      {isLeader && (
        <div className="px-8 pt-6 max-w-7xl mx-auto w-full">
          <div className="mb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-outline">My Group Overview</h2>
          </div>
          <LeaderGroupDashboard user={user} members={members} stages={stages} groups={groups} />
        </div>
      )}

      {/* Two-pane layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Thread list ── */}
        <div className="w-80 flex-shrink-0 border-r border-surface-container flex flex-col overflow-hidden bg-surface-container-lowest">
          <div className="px-4 py-3 border-b border-surface-container flex-shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
              {threadList.length > 0 ? `${threadList.length} Conversation${threadList.length > 1 ? 's' : ''}` : 'No Conversations'}
            </p>
          </div>

          {threadList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-3 text-outline-variant">chat_bubble_outline</span>
              <p className="font-semibold text-sm">No messages yet</p>
              <p className="text-xs mt-1 opacity-70">Click "New Message" to start</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {threadList.map(thread => {
                const isActive  = selectedKey === thread.key;
                const hasUnread = thread.unread > 0;
                return (
                  <button key={thread.key} onClick={() => selectThread(thread.key)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-surface-container/50 transition-colors text-left ${
                      isActive
                        ? 'bg-primary-container/20 border-l-2 border-l-primary pl-3.5'
                        : 'hover:bg-surface-container-low border-l-2 border-l-transparent'
                    }`}>
                    <div className="flex-shrink-0 mt-0.5">
                      <ThreadAvatar thread={thread} size={40} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-sm truncate ${hasUnread ? 'font-bold text-on-surface' : 'font-semibold text-on-surface'}`}>
                          {thread.name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {hasUnread && (
                            <span className="min-w-[20px] h-5 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                              {thread.unread}
                            </span>
                          )}
                          <span className="text-[10px] text-outline-variant">{thread.last ? timeAgo(thread.last.timestamp) : ''}</span>
                        </div>
                      </div>
                      <p className={`text-xs truncate ${hasUnread ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {thread.last ? (
                          <>
                            {String(thread.last.fromId) === String(user?.id) && <span className="text-outline">You: </span>}
                            {thread.last.body}
                          </>
                        ) : ''}
                      </p>
                      {/* Thread type badge */}
                      <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        thread.type === 'all'   ? 'bg-secondary-container text-secondary' :
                        thread.type === 'group' ? 'bg-tertiary-container text-tertiary' :
                        'bg-primary-container text-primary'
                      }`}>
                        {thread.type === 'all' ? 'Broadcast' : thread.type === 'group' ? 'Group' : 'Direct'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Conversation view ── */}
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-surface p-8 text-on-surface-variant">
            <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-outline-variant">forum</span>
            </div>
            <h2 className="text-xl font-extrabold font-headline text-on-surface mb-2">Select a Conversation</h2>
            <p className="text-sm max-w-xs mb-6 opacity-70">Choose a thread on the left or start a new one.</p>
            <button onClick={() => setShowCompose(true)}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">edit_square</span>New Message
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-surface">

            {/* Thread header */}
            <div className="px-6 py-4 border-b border-surface-container bg-surface-container-lowest flex items-center gap-4 flex-shrink-0">
              <ThreadAvatar thread={active} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface truncate">{active.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {active.type === 'all'   ? 'Sent to all members' :
                   active.type === 'group' ? `${active.group?.memberIds?.length ?? 0} members in group` :
                   active.member?.group    ? `Member · ${active.member.group}` : 'Direct message'}
                </p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full flex-shrink-0 ${
                active.type === 'all'   ? 'bg-secondary-container text-secondary' :
                active.type === 'group' ? 'bg-tertiary-container text-tertiary' :
                'bg-primary-container text-primary'
              }`}>
                {active.type === 'all' ? 'Broadcast' : active.type === 'group' ? 'Group' : 'Direct'}
              </span>
            </div>

            {/* Message bubbles */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {threadMsgs.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">chat_bubble_outline</span>
                  <p className="text-sm font-semibold">No messages yet</p>
                  <p className="text-xs mt-1">Send the first one below!</p>
                </div>
              ) : threadMsgs.map(msg => {
                const isMe = String(msg.fromId) === String(user?.id);
                const senderMember = !isMe ? members.find(m => String(m.id) === String(msg.fromId)) : null;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      <div className="flex-shrink-0 self-end mb-5">
                        {senderMember ? (
                          <MemberAvatar member={senderMember} size={30} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-sm ms-filled">
                              {msg.fromRole === 'pastor' ? 'church' : msg.fromRole === 'leader' ? 'star' : 'person'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[65%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <p className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">
                          {msg.fromName}
                          {msg.fromRole !== 'member' && (
                            <span className="ml-1 normal-case text-outline-variant font-normal capitalize">({msg.fromRole})</span>
                          )}
                        </p>
                      )}
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isMe
                          ? 'bg-primary text-on-primary rounded-tr-sm'
                          : 'bg-surface-container-lowest border border-outline-variant/10 text-on-surface rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.body}
                      </div>
                      <p className="text-[10px] text-outline-variant px-1">{timeAgo(msg.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="px-6 py-4 border-t border-surface-container bg-surface-container-lowest flex-shrink-0">
              <div className="flex gap-3 items-end">
                <div className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
                    }}
                    placeholder={`Reply to ${active.name}…`}
                    rows={2}
                    className="w-full bg-transparent text-sm outline-none resize-none text-on-surface placeholder:text-outline-variant"
                  />
                </div>
                <button onClick={sendReply} disabled={!reply.trim()}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                    reply.trim() ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-sm' : 'bg-surface-container-high text-outline cursor-not-allowed'
                  }`}>
                  <span className="material-symbols-outlined text-sm ms-filled">send</span>
                </button>
              </div>
              <p className="text-[10px] text-outline-variant mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        )}
      </div>

      {showCompose && (
        <ComposeModal
          user={user}
          groups={groups}
          members={members}
          onClose={() => setShowCompose(false)}
          onSend={handleComposeSend}
        />
      )}
    </div>
  );
}
