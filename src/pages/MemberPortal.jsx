// ─── src/pages/MemberPortal.jsx ──────────────────────────────────────────────
// Member-facing mobile portal. Contains:
//   - MemberInbox  — messages tab component
//   - MemberPortal — main portal shell with 5-tab bottom nav
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/auth";
import { MemberAvatar } from "../components/shared/Avatar";
import { threadKey, timeAgo } from "../lib/messages";

// =============================================================================
// CONSTANTS (portal-scoped, not shared globally)
// =============================================================================

const CATEGORY_META = {
  service:   { bg: "bg-primary-container/40",   text: "text-primary",    icon: "church"             },
  group:     { bg: "bg-tertiary-container/40",  text: "text-tertiary",   icon: "diversity_3"        },
  milestone: { bg: "bg-green-100",              text: "text-green-700",  icon: "water_drop"         },
  team:      { bg: "bg-secondary-container/40", text: "text-secondary",  icon: "groups"             },
  outreach:  { bg: "bg-amber-100",              text: "text-amber-700",  icon: "volunteer_activism" },
  workshop:  { bg: "bg-purple-100",             text: "text-purple-700", icon: "school"             },
};

const SERVICES = [
  "Sunday Morning Service",
  "Wednesday Prayer",
  "Youth Ministry Night",
  "Community Outreach",
  "Worship Rehearsal",
];

// =============================================================================
// MEMBER INBOX — Messages tab for the member portal
// =============================================================================

function MemberInbox({ member, members, groups, messages, setMessages }) {
  const memberGroup = groups.find(g => g.memberIds?.includes(member?.id));

  // ── Filter messages relevant to this member ──────────────────────────────
  const myMessages = messages.filter(msg => {
    const myId = String(member?.id);
    const isIncomingDirect = msg.toType === "member" && String(msg.toId) === myId;
    const isOutgoingDirect = msg.fromRole === "member" && String(msg.fromId) === myId;
    const isGroupMsg = memberGroup && msg.toType === "group" && msg.toId === memberGroup.id;
    return isIncomingDirect || isOutgoingDirect || isGroupMsg;
  });

  // ── Build thread map using shared threadKey ───────────────────────────────
  // For the member's view, we rename 'member-{id}' threads to 'Pastoral Team'
  const threadMap = {};
  myMessages.forEach(msg => {
    const key  = threadKey(msg);  // uses shared canonical key
    const name = msg.toType === "group" ? (memberGroup?.name ?? "My Group") : "Pastoral Team";
    const type = msg.toType === "group" ? "group" : "direct";
    if (!threadMap[key]) threadMap[key] = { key, name, type, msgs: [], unread: 0, last: null };
    threadMap[key].msgs.push(msg);
    const myId = String(member?.id);
    if (!msg.read && msg.toType === "member" && String(msg.toId) === myId) {
      threadMap[key].unread++;
    }
    if (!threadMap[key].last || new Date(msg.timestamp) > new Date(threadMap[key].last.timestamp)) {
      threadMap[key].last = msg;
    }
  });

  const threads = Object.values(threadMap).sort(
    (a, b) => new Date(b.last?.timestamp ?? 0) - new Date(a.last?.timestamp ?? 0)
  );

  const [selectedKey, setSelectedKey] = useState(null);
  const [reply, setReply]             = useState("");
  const [newMessage, setNewMessage]   = useState("");
  const bottomRef = useRef(null);

  // Auto-select first thread on mount / when threads appear
  useEffect(() => {
    if (threads.length > 0 && !selectedKey) setSelectedKey(threads[0].key);
  }, [threads.length]);

  // Scroll to bottom when thread changes or a new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedKey, messages.length]);

  const openThread = key => {
    setSelectedKey(key);
    // Mark messages as read using shared threadKey for consistency
    setMessages(prev => prev.map(m => {
      const myId = String(member?.id);
      return threadKey(m) === key && !m.read && m.toType === "member" && String(m.toId) === myId
        ? { ...m, read: true } : m;
    }));
  };

  const activeThread = selectedKey ? threadMap[selectedKey] : null;
  const threadMsgs   = [...(activeThread?.msgs ?? [])].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const sendReply = () => {
    const body = (activeThread ? reply : newMessage).trim();
    if (!body) return;
    const isGroup = activeThread?.type === "group";
    setMessages(prev => [...prev, {
      id: Date.now(),
      fromId:   member?.id,
      fromName: member?.name,
      fromRole: "member",
      toType:   isGroup ? "group"  : "member",
      toId:     isGroup ? memberGroup?.id : null,
      toName:   isGroup ? (memberGroup?.name ?? "Group") : "Admin",
      body,
      timestamp: new Date().toISOString(),
      read: false,
    }]);
    if (activeThread) setReply(""); else setNewMessage("");
    if (!activeThread) setSelectedKey("direct");
  };

  // timeAgo imported from lib/messages

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 fade-in">
      <div>
        <h2 className="text-xl font-extrabold font-headline text-on-surface">Messages</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Stay connected with your pastor and group leader.</p>
      </div>

      {/* Thread selector pills — only shown when there are multiple threads */}
      {threads.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {threads.map(t => (
            <button key={t.key} onClick={() => openThread(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedKey === t.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}>
              <span className="material-symbols-outlined text-xs">
                {t.type === "group" ? "diversity_3" : "church"}
              </span>
              {t.name}
              {t.unread > 0 && (
                <span className="px-1 rounded-full bg-error text-white text-[9px] font-bold">{t.unread}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty state — no messages yet */}
      {threads.length === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
          <div className="p-6 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl mb-2 block text-outline-variant">chat_bubble_outline</span>
            <p className="font-semibold text-sm">No messages yet</p>
            <p className="text-xs mt-1 opacity-70">Send your first message below.</p>
          </div>
          <div className="px-4 pb-4 border-t border-surface-container pt-3">
            <div className="flex gap-2 items-end">
              <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
                placeholder="Message your pastoral team…" rows={3}
                className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              <button onClick={sendReply} disabled={!newMessage.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${newMessage.trim() ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline cursor-not-allowed"}`}>
                <span className="material-symbols-outlined text-sm ms-filled">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active conversation */}
      {activeThread && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-surface-container flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary ms-filled text-base">
                {activeThread.type === "group" ? "diversity_3" : "church"}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{activeThread.name}</p>
              <p className="text-xs text-on-surface-variant">
                {activeThread.type === "group" ? "Group thread" : "Direct with pastoral team"}
              </p>
            </div>
          </div>

          {/* Bubbles */}
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {threadMsgs.length === 0 ? (
              <p className="text-center text-xs text-outline-variant py-4">No messages yet — say hi!</p>
            ) : threadMsgs.map(msg => {
              const isMe = String(msg.fromId) === String(member?.id);
              const senderMember = !isMe ? members.find(m => String(m.id) === String(msg.fromId)) : null;
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!isMe && (
                    <div className="self-end flex-shrink-0 mb-4">
                      {senderMember ? (
                        <MemberAvatar member={senderMember} size={28} />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary ms-filled" style={{ fontSize: 14 }}>
                            {msg.fromRole === "leader" ? "star" : "church"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[80%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">{msg.fromName}</p>
                    )}
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-on-primary rounded-tr-sm"
                        : "bg-surface-container-low text-on-surface rounded-tl-sm"
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
          <div className="px-4 py-3 border-t border-surface-container">
            <div className="flex gap-2 items-end">
              <textarea value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
                placeholder="Type a reply…" rows={2}
                className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              <button onClick={sendReply} disabled={!reply.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${reply.trim() ? "bg-primary text-on-primary hover:bg-primary-dim" : "bg-surface-container-high text-outline cursor-not-allowed"}`}>
                <span className="material-symbols-outlined text-sm ms-filled">send</span>
              </button>
            </div>
            <p className="text-[10px] text-outline-variant mt-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}

      {/* Church contacts */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Church Contacts</p>
        {[
          { label: "Lead Pastor",  value: "pastor@church.org", icon: "church" },
          { label: "Admin Office", value: "admin@church.org",  icon: "mail"   },
        ].map(c => (
          <div key={c.label} className="flex items-center gap-3 py-2">
            <span className="material-symbols-outlined text-primary text-sm">{c.icon}</span>
            <div>
              <p className="text-[10px] text-outline uppercase font-bold tracking-wider">{c.label}</p>
              <p className="text-sm text-on-surface font-medium">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MEMBER PORTAL — main shell
// Tabs: Journey | Events | Check In (serving only) | Messages | My Info
// =============================================================================

export function MemberPortal({
  members, stages, setMembers, groups,
  events = [], setEvents,
  messages = [], setMessages,
  toast, onLogout,
}) {
  const { user } = useAuth();
  const member   = members.find(m => m.id === user?.memberId) ?? null;

  const [activeTab, setActiveTab] = useState("journey");

  // ── Profile edit ─────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState({});
  const fd = (k, v) => setDraft(p => ({ ...p, [k]: v }));

  const openEdit = () => {
    if (!member) return;
    setDraft({ phone: member.phone ?? "", email: member.email ?? "", homeAddress: member.homeAddress ?? "" });
    setEditing(true);
  };
  const saveEdit = () => {
    if (!member) return;
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, ...draft } : m));
    setEditing(false);
    toast("✓ Profile updated");
  };

  // ── Serving team detection ────────────────────────────────────────────────
  const memberGroups    = groups.filter(g => g.memberIds.includes(member?.id));
  const isServingMember = memberGroups.some(g => g.servingTeam === true);

  // ── Events ───────────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingEvents = [...events].filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const myRsvps = upcomingEvents.filter(e => e.rsvpIds?.includes(member?.id));

  const handleRsvp = eventId => {
    if (!member) return;
    const evt     = events.find(e => e.id === eventId);
    const hasRsvp = evt?.rsvpIds?.includes(member.id);
    setEvents(prev => prev.map(e => e.id !== eventId ? e : {
      ...e,
      rsvpIds: hasRsvp
        ? e.rsvpIds.filter(id => id !== member.id)
        : [...(e.rsvpIds || []), member.id],
    }));
    toast(hasRsvp ? "RSVP removed" : "✓ RSVP confirmed!");
  };

  // ── Check-in ──────────────────────────────────────────────────────────────
  const [checkIns, setCheckIns] = useState([
    { id: 1, date: "2026-04-06", service: "Sunday Morning Service", time: "09:05" },
    { id: 2, date: "2026-03-30", service: "Sunday Morning Service", time: "09:12" },
    { id: 3, date: "2026-03-23", service: "Sunday Morning Service", time: "09:03" },
    { id: 4, date: "2026-03-19", service: "Wednesday Prayer",       time: "18:08" },
  ]);
  const [selectedService, setSelectedService] = useState("Sunday Morning Service");
  const [checkedInToday, setCheckedInToday]   = useState(false);

  const todayStr         = new Date().toISOString().split("T")[0];
  const thisMonth        = new Date().toISOString().slice(0, 7);
  const checkInsThisMonth = checkIns.filter(c => c.date.startsWith(thisMonth)).length;

  const handleCheckIn = () => {
    const now = new Date();
    setCheckIns(prev => [{ id: Date.now(), date: todayStr, service: selectedService, time: now.toTimeString().slice(0, 5) }, ...prev]);
    setCheckedInToday(true);
    toast("✓ Checked in — thank you for serving!");
  };

  // ── Journey data ─────────────────────────────────────────────────────────
  const currentStageIdx = member?.currentStageIndex ?? 0;
  const currentStage    = stages[currentStageIdx];
  const isLastStage     = currentStageIdx >= stages.length - 1;
  const activeTasks     = member?.tasks[currentStage?.id] || [];
  const completedTasks  = activeTasks.filter(Boolean).length;
  const totalTasks      = currentStage?.requirements?.length ?? 0;
  const stageProgress   = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  const overallProgress = stages.length > 0
    ? Math.round(((currentStageIdx + stageProgress / 100) / stages.length) * 100) : 0;

  const faithLabel = f => ({ born_again: "Born Again", not_born_again: "Not Born Again", visitor: "Visitor" }[f] ?? f ?? "—");

  // ── Unread count for badge ────────────────────────────────────────────────
  const myUnread = messages.filter(msg => {
    const myId = String(member?.id);
    return !msg.read && msg.toType === "member" && String(msg.toId) === myId;
  }).length;

  // ── Bottom nav ────────────────────────────────────────────────────────────
  const navItems = [
    { id: "journey", icon: "explore",     label: "Journey"  },
    { id: "events",  icon: "event",       label: "Events"   },
    ...(isServingMember ? [{ id: "checkin", icon: "how_to_reg", label: "Check In" }] : []),
    { id: "inbox",   icon: "chat",        label: "Messages" },
    { id: "info",    icon: "person",      label: "My Info"  },
  ];

  // ── Status banners ────────────────────────────────────────────────────────
  const stageKey   = member?.enrollmentStage ?? "new_applicant";
  const STATUS_INFO = {
    new_applicant:   { label: "New Applicant", color: "text-amber-600", bg: "from-amber-50",              border: "border-amber-200",  icon: "schedule",     msg: "Your application is being reviewed by your pastor."                        },
    approved:        { label: "Approved",      color: "text-primary",   bg: "from-primary-container/20",  border: "border-primary/20", icon: "verified",     msg: "Welcome! Reach out to your group leader to begin your journey."            },
    in_discipleship: { label: "In Blueprint",  color: "text-green-600", bg: "from-green-50",              border: "border-green-200",  icon: "auto_awesome", msg: "You're on the journey. Keep going — every step matters!"                  },
  };
  const si = STATUS_INFO[stageKey] ?? STATUS_INFO.new_applicant;

  // ── No member record guard ────────────────────────────────────────────────
  if (!member) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-6 mx-auto">
            <span className="material-symbols-outlined text-outline text-3xl">person_off</span>
          </div>
          <h2 className="text-xl font-extrabold font-headline text-on-surface mb-2">Profile Not Found</h2>
          <p className="text-on-surface-variant text-sm max-w-xs mb-6">
            Your account is not linked to a member record yet. Please contact your administrator.
          </p>
          <button onClick={onLogout} className="text-sm font-semibold text-primary hover:underline">Sign Out</button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Sticky header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-sm">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-on-primary flex-shrink-0">
          <span className="material-symbols-outlined ms-filled text-base">church</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-on-surface font-headline truncate">ChurchOS</p>
          <p className="text-[9px] uppercase tracking-widest text-outline font-bold">Member Portal</p>
        </div>
        <div className="flex items-center gap-2">
          <MemberAvatar member={member} size={32} ring />
          <button onClick={onLogout}
            className="p-2 text-outline-variant hover:text-error transition-colors rounded-full hover:bg-error-container/20">
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* ══ JOURNEY TAB ══════════════════════════════════════════════════ */}
        {activeTab === "journey" && (
          <div className="p-4 max-w-lg mx-auto space-y-4 fade-in">
            {/* Hero status card */}
            <div className={`rounded-2xl border-2 ${si.border} bg-gradient-to-br ${si.bg} to-surface-container-lowest p-5`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className={`material-symbols-outlined ms-filled text-2xl ${si.color}`}>{si.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">Welcome back</p>
                  <h2 className="text-xl font-extrabold font-headline text-on-surface leading-tight">{member.name.split(" ")[0]}'s Journey</h2>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${si.color} bg-white/60`}>{si.label}</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4 bg-white/50 rounded-xl px-4 py-2.5">{si.msg}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-on-surface-variant">Overall Blueprint Progress</span>
                  <span className="text-primary font-bold">{overallProgress}%</span>
                </div>
                <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${overallProgress}%`, background: "rgb(var(--c-primary))" }} />
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap mt-4">
                {stages.map((s, i) => {
                  const done   = i < currentStageIdx;
                  const active = i === currentStageIdx;
                  return (
                    <span key={s.id} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${done ? "bg-green-500 text-white" : active ? "bg-primary text-on-primary shadow-sm" : "bg-white/40 text-outline-variant"}`}>
                      <span className="material-symbols-outlined text-xs ms-filled">{done ? "check" : active ? s.icon : "lock"}</span>
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Completed stages */}
            {stages.slice(0, currentStageIdx).map(s => (
              <div key={s.id} className="bg-surface-container-lowest rounded-xl border border-green-100 p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-green-600 ms-filled text-xl">check_circle</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">{s.name}</p>
                  <p className="text-xs text-green-600 font-semibold">Stage completed</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Done</span>
              </div>
            ))}

            {/* Current stage */}
            {currentStage && (
              <div className="bg-surface-container-lowest rounded-2xl border-2 border-primary/20 overflow-hidden shadow-sm">
                <div className="bg-primary-container/30 px-5 py-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-on-primary text-xl ms-filled">{currentStage.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Current Stage</p>
                    <h3 className="text-base font-extrabold font-headline text-on-surface">{currentStage.name}</h3>
                    <p className="text-xs text-on-surface-variant">{currentStage.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-extrabold font-headline text-primary">{stageProgress}%</p>
                    <p className="text-[10px] text-on-surface-variant">{completedTasks}/{totalTasks} tasks</p>
                  </div>
                </div>
                <div className="px-5 pt-4">
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${stageProgress}%` }} />
                  </div>
                </div>
                <div className="px-5 py-4 space-y-2">
                  {(currentStage.requirements || []).map((task, i) => {
                    const done = activeTasks[i] === true;
                    return (
                      <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${done ? "bg-green-50 border border-green-100" : "bg-surface-container-low"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-500" : "border-2 border-outline-variant/30 bg-white"}`}>
                          {done && <span className="material-symbols-outlined text-white text-xs ms-filled">check</span>}
                        </div>
                        <span className={`text-sm flex-1 ${done ? "line-through text-green-700 opacity-70" : "text-on-surface font-medium"}`}>{task}</span>
                        {done && <span className="text-[10px] font-bold text-green-600 uppercase">Done</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 pb-5">
                  {stageProgress < 100 ? (
                    <div className="bg-primary-container/20 rounded-xl px-4 py-3">
                      <p className="text-xs text-primary font-semibold flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">info</span>
                        Complete all tasks to advance. Your pastor or mentor can help — don't hesitate to reach out!
                      </p>
                    </div>
                  ) : isLastStage ? (
                    <div className="bg-green-50 rounded-xl px-4 py-3 text-center">
                      <span className="material-symbols-outlined text-green-500 ms-filled text-2xl block mb-1">verified</span>
                      <p className="text-green-700 font-bold text-sm">Blueprint Complete!</p>
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-green-700 font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm ms-filled">celebration</span>
                        All tasks complete! Your pastor will advance you to the next stage soon.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Locked upcoming stages */}
            {stages.slice(currentStageIdx + 1).map(s => (
              <div key={s.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-4 flex items-center gap-4 opacity-40">
                <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-outline">lock</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{s.name}</p>
                  <p className="text-xs text-on-surface-variant">Complete your current stage to unlock</p>
                </div>
              </div>
            ))}

            {/* Mentor card */}
            {member.mentor && (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/5 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/40 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary ms-filled">person_pin</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Your Mentor</p>
                  <p className="text-sm font-bold text-on-surface">{member.mentor}</p>
                  <p className="text-xs text-on-surface-variant">Reach out if you need guidance on your journey</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ EVENTS TAB ═══════════════════════════════════════════════════ */}
        {activeTab === "events" && (
          <div className="p-4 max-w-lg mx-auto space-y-5 fade-in">
            <div>
              <h2 className="text-xl font-extrabold font-headline text-on-surface">Upcoming Events</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">RSVP to events and keep track of what's on.</p>
            </div>
            {myRsvps.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">
                  My RSVPs <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[9px]">{myRsvps.length}</span>
                </p>
                <div className="space-y-2">
                  {myRsvps.map(evt => {
                    const cat = CATEGORY_META[evt.category] ?? CATEGORY_META.service;
                    const d   = new Date(evt.date);
                    return (
                      <div key={evt.id} className="bg-surface-container-lowest rounded-xl border border-primary/15 p-4 flex items-center gap-3 shadow-sm">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${cat.bg}`}>
                          <span className={`text-[10px] font-bold uppercase ${cat.text}`}>{d.toLocaleString("default", { month: "short" })}</span>
                          <span className={`text-xl font-extrabold leading-none ${cat.text}`}>{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{evt.title}</p>
                          <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">schedule</span>{evt.startTime}</span>
                          </p>
                        </div>
                        <button onClick={() => handleRsvp(evt.id)}
                          className="flex-shrink-0 text-xs font-bold text-error hover:text-error/70 transition-colors px-2 py-1 rounded-lg hover:bg-error-container/10">
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              {myRsvps.length > 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">All Events</p>}
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                  <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">event_busy</span>
                  <p className="font-semibold text-sm">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(evt => {
                    const cat     = CATEGORY_META[evt.category] ?? CATEGORY_META.service;
                    const hasRsvp = evt.rsvpIds?.includes(member.id);
                    const d       = new Date(evt.date);
                    const days    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                    return (
                      <div key={evt.id} className={`bg-surface-container-lowest rounded-2xl border-2 transition-all ${hasRsvp ? "border-primary/20 shadow-md" : "border-outline-variant/10 hover:border-outline-variant/30"} overflow-hidden`}>
                        <div className="p-4 flex gap-3">
                          <div className={`w-14 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${cat.bg} gap-0.5`}>
                            <span className={`text-[9px] font-bold uppercase ${cat.text}`}>{days[d.getDay()]}</span>
                            <span className={`text-2xl font-extrabold leading-none ${cat.text}`}>{d.getDate()}</span>
                            <span className={`text-[9px] font-bold uppercase ${cat.text}`}>{d.toLocaleString("default", { month: "short" })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-on-surface leading-tight">{evt.title}</p>
                              {hasRsvp && (
                                <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary-container/40 px-2 py-0.5 rounded-full">
                                  <span className="material-symbols-outlined text-xs ms-filled">check_circle</span>RSVP'd
                                </span>
                              )}
                            </div>
                            {evt.description && <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">{evt.description}</p>}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-on-surface-variant">
                              {evt.startTime && <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">schedule</span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ""}</span>}
                              {evt.location  && <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">location_on</span><span className="line-clamp-1">{evt.location}</span></span>}
                            </div>
                          </div>
                        </div>
                        <div className={`px-4 py-3 border-t flex items-center justify-between ${hasRsvp ? "border-primary/10 bg-primary-container/10" : "border-outline-variant/10 bg-surface-container-low/50"}`}>
                          <p className="text-xs text-on-surface-variant">{evt.rsvpIds?.length ?? 0} {evt.rsvpIds?.length === 1 ? "person" : "people"} going</p>
                          <button onClick={() => handleRsvp(evt.id)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${hasRsvp ? "bg-error-container/20 text-error hover:bg-error-container/30" : "bg-primary text-on-primary hover:bg-primary-dim shadow-sm"}`}>
                            {hasRsvp ? "✕ Cancel RSVP" : "+ RSVP Now"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CHECK IN TAB ════════════════════════════════════════════════ */}
        {activeTab === "checkin" && isServingMember && (
          <div className="p-4 max-w-lg mx-auto space-y-5 fade-in">
            <div>
              <h2 className="text-xl font-extrabold font-headline text-on-surface">Team Check In</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Log your attendance for today's service or event.</p>
            </div>
            <div className={`rounded-2xl border-2 p-5 ${checkedInToday ? "border-green-200 bg-green-50" : "border-primary/20 bg-primary-container/10"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${checkedInToday ? "bg-green-500" : "bg-primary"}`}>
                  <span className="material-symbols-outlined text-white ms-filled text-xl">{checkedInToday ? "task_alt" : "how_to_reg"}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Today</p>
                  <p className="text-base font-extrabold font-headline text-on-surface">
                    {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              {checkedInToday ? (
                <div className="text-center py-4">
                  <span className="material-symbols-outlined text-green-500 text-5xl ms-filled block mb-2">verified</span>
                  <p className="text-green-700 font-extrabold font-headline text-lg">You're checked in!</p>
                  <p className="text-green-600 text-sm mt-1 font-medium">{checkIns[0]?.service} · {checkIns[0]?.time}</p>
                  <p className="text-xs text-green-600/70 mt-2">Thank you for serving your community today 🙏</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Select Service / Event</p>
                    <div className="space-y-2">
                      {SERVICES.map(s => (
                        <button key={s} onClick={() => setSelectedService(s)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${selectedService === s ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 bg-white text-on-surface-variant hover:border-primary/30"}`}>
                          <span className="flex items-center gap-2">
                            {selectedService === s && <span className="material-symbols-outlined text-sm ms-filled">check_circle</span>}
                            {s}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleCheckIn}
                    className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:bg-primary-dim transition-all flex items-center justify-center gap-2 text-sm mt-2">
                    <span className="material-symbols-outlined ms-filled">how_to_reg</span>Check In Now
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "This Month", value: checkInsThisMonth + (checkedInToday ? 1 : 0) },
                { label: "All Time",   value: checkIns.length + (checkedInToday ? 1 : 0) },
                { label: "Streak",     value: "4 wks" },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-lowest rounded-xl border border-outline-variant/5 p-3 text-center">
                  <p className="text-2xl font-extrabold font-headline text-primary">{s.value}</p>
                  <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Recent History</p>
              <div className="space-y-2">
                {checkIns.map(ci => {
                  const d = new Date(ci.date);
                  return (
                    <div key={ci.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-green-600 ms-filled text-sm">check</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{ci.service}</p>
                        <p className="text-xs text-on-surface-variant">{d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}</p>
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant flex-shrink-0">{ci.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ MESSAGES TAB ════════════════════════════════════════════════ */}
        {activeTab === "inbox" && (
          <MemberInbox
            member={member}
            members={members}
            groups={groups}
            messages={messages}
            setMessages={setMessages}
          />
        )}

        {/* ══ MY INFO TAB ═════════════════════════════════════════════════ */}
        {activeTab === "info" && (
          <div className="p-4 max-w-lg mx-auto space-y-4 fade-in">
            <div>
              <h2 className="text-xl font-extrabold font-headline text-on-surface">My Info</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Your personal details on file with the church.</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/5 overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-surface-container">
                <div className="flex items-center gap-4">
                  <div className="rounded-full overflow-hidden ring-4 ring-surface-container-low flex-shrink-0">
                    <MemberAvatar member={member} size={64} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{member.name}</p>
                    <label className="mt-1.5 cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      {member.avatarUrl ? "Change Photo" : "Upload Photo"}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => setMembers(prev => prev.map(m => m.id === member.id ? { ...m, avatarUrl: ev.target.result } : m));
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    {member.avatarUrl && (
                      <button onClick={() => setMembers(prev => prev.map(m => m.id === member.id ? { ...m, avatarUrl: null } : m))}
                        className="block text-xs text-error hover:underline mt-0.5">Remove photo</button>
                    )}
                  </div>
                  {!editing && (
                    <button onClick={openEdit} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline self-start flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">edit</span>Edit
                    </button>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="px-5 py-5 space-y-4">
                  <div className="bg-primary-container/20 rounded-lg px-4 py-2.5">
                    <p className="text-xs text-primary font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">info</span>
                      You can update your contact details. Other fields are managed by your church administrator.
                    </p>
                  </div>
                  {[
                    { label: "Phone",        key: "phone",       type: "tel"   },
                    { label: "Email",        key: "email",       type: "email" },
                    { label: "Home Address", key: "homeAddress", type: "text"  },
                  ].map(fi => (
                    <div key={fi.key}>
                      <label className="text-[10px] uppercase font-bold tracking-widest text-outline mb-1.5 block">{fi.label}</label>
                      <input type={fi.type} value={draft[fi.key] ?? ""} onChange={e => fd(fi.key, e.target.value)}
                        className="w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  ))}
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 py-3 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">Cancel</button>
                    <button onClick={saveEdit}
                      className="flex-1 py-3 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors shadow-sm">Save Changes</button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-5">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { label: "Full Name",      value: member.name                    },
                      { label: "Faith Status",   value: faithLabel(member.faithStatus) },
                      { label: "Phone",          value: member.phone                   },
                      { label: "Email",          value: member.email                   },
                      { label: "Marital Status", value: member.maritalStatus           },
                      { label: "Group",          value: member.group || "Not assigned" },
                      { label: "Joined",         value: member.joinDate                },
                      { label: "Address",        value: member.homeAddress, span: true },
                    ].filter(fi => fi?.value).map(fi => (
                      <div key={fi.label} className={fi.span ? "col-span-2" : ""}>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-outline mb-0.5">{fi.label}</p>
                        <p className="text-sm text-on-surface font-medium">{fi.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Blueprint snapshot */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Blueprint Summary</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-on-surface-variant">Progress</span>
                    <span className="text-primary">{overallProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${overallProgress}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-extrabold font-headline text-primary">{currentStage?.name ?? "—"}</p>
                  <p className="text-[10px] text-on-surface-variant">Current Stage</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>{/* end scrollable */}

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/10 z-40 shadow-lg">
        <div className="flex max-w-lg mx-auto">
          {navItems.map(n => (
            <button key={n.id} onClick={() => setActiveTab(n.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all ${activeTab === n.id ? "text-primary" : "text-on-surface-variant"}`}>
              {activeTab === n.id && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
              <span className={`material-symbols-outlined text-[22px] transition-all ${activeTab === n.id ? "ms-filled" : ""}`}>{n.icon}</span>
              <span className={`text-[10px] font-bold transition-all ${activeTab === n.id ? "opacity-100" : "opacity-50"}`}>{n.label}</span>
              {/* Events dot */}
              {n.id === "events" && upcomingEvents.filter(e => !e.rsvpIds?.includes(member.id)).length > 0 && activeTab !== "events" && (
                <div className="absolute top-2 right-[calc(50%-14px)] w-1.5 h-1.5 bg-primary rounded-full" />
              )}
              {/* Check-in dot */}
              {n.id === "checkin" && !checkedInToday && activeTab !== "checkin" && (
                <div className="absolute top-2 right-[calc(50%-14px)] w-1.5 h-1.5 bg-amber-500 rounded-full" />
              )}
              {/* Unread messages dot */}
              {n.id === "inbox" && myUnread > 0 && activeTab !== "inbox" && (
                <div className="absolute top-2 right-[calc(50%-14px)] w-1.5 h-1.5 bg-error rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
