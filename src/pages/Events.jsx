import { useState } from 'react';
import { MemberAvatar } from '../components/shared/Avatar';

const CATEGORY_META = {
  service:   { bg: 'bg-primary-container/40',   text: 'text-primary',    icon: 'church',             label: 'Service'   },
  group:     { bg: 'bg-tertiary-container/40',  text: 'text-tertiary',   icon: 'diversity_3',        label: 'Group'     },
  milestone: { bg: 'bg-green-100',              text: 'text-green-700',  icon: 'water_drop',         label: 'Milestone' },
  team:      { bg: 'bg-secondary-container/40', text: 'text-secondary',  icon: 'groups',             label: 'Team'      },
  outreach:  { bg: 'bg-amber-100',              text: 'text-amber-700',  icon: 'volunteer_activism', label: 'Outreach'  },
  workshop:  { bg: 'bg-purple-100',             text: 'text-purple-700', icon: 'school',             label: 'Workshop'  },
};

// =============================================================================
// RSVP DRAWER
// =============================================================================

function RSVPDrawer({ event, members, onClose }) {
  const rsvpMembers = members.filter(m => event.rsvpIds?.includes(m.id));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 slide-in overflow-hidden flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="p-7 pb-5 border-b border-surface-container flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">RSVP List</p>
              <h3 className="text-lg font-bold font-headline text-on-surface">{event.title}</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {new Date(event.date).toLocaleDateString('en-ZA', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
                {event.startTime ? ` · ${event.startTime}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Summary pill */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-container/30 rounded-xl">
              <span className="material-symbols-outlined text-primary text-sm ms-filled">how_to_reg</span>
              <span className="text-sm font-bold text-primary">{rsvpMembers.length} confirmed</span>
            </div>
            {event.rsvpIds?.length > rsvpMembers.length && (
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-outline-variant text-sm">person_outline</span>
                <span className="text-sm font-semibold text-on-surface-variant">
                  +{event.rsvpIds.length - rsvpMembers.length} guests not in system
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Member list */}
        <div className="overflow-y-auto flex-1 p-4">
          {rsvpMembers.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">event_busy</span>
              <p className="font-semibold text-sm">No RSVPs yet</p>
              <p className="text-xs mt-1 opacity-70">Members can RSVP via their portal.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rsvpMembers.map(m => (
                <div key={m.id}
                  className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl">
                  {/* ── Photo-aware avatar ── */}
                  <MemberAvatar member={m} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{m.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{m.group || 'No group'}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    <span className="material-symbols-outlined text-xs ms-filled">check_circle</span>Going
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-surface-container flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EVENT CARD
// =============================================================================

function EventCard({ event, members, onViewRsvp }) {
  const d          = new Date(event.date);
  const cat        = CATEGORY_META[event.category] ?? CATEGORY_META.service;
  const rsvpCount  = event.rsvpIds?.length ?? 0;
  const rsvpMembers = members.filter(m => event.rsvpIds?.includes(m.id));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-surface-container-lowest border-2 border-outline-variant/10 rounded-2xl overflow-hidden hover:shadow-md hover:border-outline-variant/30 transition-all">
      <div className="p-5 flex gap-4">
        {/* Date block */}
        <div className={`w-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 gap-0.5 py-3 ${cat.bg}`}>
          <span className={`text-[9px] font-bold uppercase ${cat.text}`}>{days[d.getDay()]}</span>
          <span className={`text-2xl font-extrabold leading-none ${cat.text}`}>{d.getDate()}</span>
          <span className={`text-[9px] font-bold uppercase ${cat.text}`}>{d.toLocaleString('default', { month: 'short' })}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-on-surface text-base leading-tight">{event.title}</h3>
            <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${cat.bg} ${cat.text}`}>
              {cat.label}
            </span>
          </div>

          {event.description && (
            <p className="text-sm text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-on-surface-variant">
            {event.startTime && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">schedule</span>
                {event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">location_on</span>
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RSVP footer */}
      <div className="px-5 py-3 border-t border-surface-container bg-surface-container-low/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {rsvpMembers.length > 0 ? (
            <div className="flex items-center gap-2">
              {/* ── Photo-aware avatar stack ── */}
              <div className="flex -space-x-2">
                {rsvpMembers.slice(0, 4).map(m => (
                  <MemberAvatar key={m.id} member={m} size={28} ring />
                ))}
                {rsvpCount > 4 && (
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant flex-shrink-0">
                    +{rsvpCount - 4}
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-on-surface-variant">
                {rsvpCount} {rsvpCount === 1 ? 'person' : 'people'} going
              </span>
            </div>
          ) : (
            <span className="text-xs text-outline-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">event_busy</span>
              No RSVPs yet
            </span>
          )}
        </div>

        <button
          onClick={() => onViewRsvp(event)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-primary bg-primary-container/30 hover:bg-primary-container/50 rounded-lg transition-colors flex-shrink-0">
          <span className="material-symbols-outlined text-xs ms-filled">group</span>
          View RSVPs
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// EVENTS PAGE
// =============================================================================

export function Events({ events = [], setEvents, members = [] }) {
  const [showForm, setShowForm]         = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterCat, setFilterCat]       = useState('all');
  const [form, setForm]                 = useState({
    title: '', date: '', startTime: '', endTime: '',
    location: '', category: 'service', description: '',
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const now       = new Date(); now.setHours(0, 0, 0, 0);
  const allEvents = filterCat === 'all' ? events : events.filter(e => e.category === filterCat);
  const upcoming  = allEvents.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past      = allEvents.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalRsvps = events.reduce((sum, e) => sum + (e.rsvpIds?.length ?? 0), 0);

  const handleCreate = () => {
    if (!form.title.trim() || !form.date) return;
    setEvents(prev => [...prev, { ...form, id: Date.now(), rsvpIds: [] }]);
    setForm({ title: '', date: '', startTime: '', endTime: '', location: '', category: 'service', description: '' });
    setShowForm(false);
  };

  const inputCls = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';
  const labelCls = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block';

  return (
    <div className="fade-in">

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-8">
        <span className="text-lg font-bold text-on-surface font-headline">Events</span>
        <button onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary-dim text-on-primary px-5 py-2 rounded-md flex items-center gap-2 font-semibold text-sm transition-all shadow-sm">
          <span className="material-symbols-outlined text-lg">add</span>New Event
        </button>
      </div>

      <div className="p-8 max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold font-headline tracking-tight">Events</h1>
            <p className="text-on-surface-variant mt-1 text-sm">Manage events and track member RSVPs.</p>
          </div>
          <div className="bg-primary-container/30 rounded-xl px-5 py-3 text-right border border-primary/10">
            <p className="text-2xl font-extrabold font-headline text-primary">{totalRsvps}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Total RSVPs</p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl flex-wrap">
          {[
            { id: 'all',       label: 'All',        icon: 'event'              },
            { id: 'service',   label: 'Services',   icon: 'church'             },
            { id: 'group',     label: 'Groups',     icon: 'diversity_3'        },
            { id: 'team',      label: 'Teams',      icon: 'groups'             },
            { id: 'outreach',  label: 'Outreach',   icon: 'volunteer_activism' },
            { id: 'milestone', label: 'Milestones', icon: 'water_drop'         },
            { id: 'workshop',  label: 'Workshops',  icon: 'school'             },
          ].map(cat => (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${filterCat === cat.id ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm">{cat.icon}</span>
              {cat.label}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container text-outline ml-0.5">
                {cat.id === 'all' ? events.length : events.filter(e => e.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-7 slide-in">
            <h3 className="font-bold font-headline text-lg mb-5">New Event</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Title *</label>
                  <input value={form.title} onChange={e => f('title', e.target.value)}
                    className={inputCls} placeholder="e.g. Sunday Service" />
                </div>
                <div>
                  <label className={labelCls}>Date *</label>
                  <input type="date" value={form.date} onChange={e => f('date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={form.category} onChange={e => f('category', e.target.value)} className={inputCls}>
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => f('startTime', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Time</label>
                  <input type="time" value={form.endTime} onChange={e => f('endTime', e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Location</label>
                  <input value={form.location} onChange={e => f('location', e.target.value)}
                    className={inputCls} placeholder="e.g. Main Auditorium" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)}
                    rows={2} className={inputCls + ' resize-none'} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreate}
                  className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors">
                  Create Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
              Upcoming{' '}
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[9px]">
                {upcoming.length}
              </span>
            </p>
            <div className="space-y-4">
              {upcoming.map(e => (
                <EventCard key={e.id} event={e} members={members} onViewRsvp={setSelectedEvent} />
              ))}
            </div>
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Past Events</p>
            <div className="space-y-4 opacity-60">
              {past.map(e => (
                <EventCard key={e.id} event={e} members={members} onViewRsvp={setSelectedEvent} />
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">event</span>
            <p className="font-semibold">No events yet</p>
            <p className="text-sm mt-1">Create your first event to get started.</p>
            <button onClick={() => setShowForm(true)}
              className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-md font-semibold text-sm hover:bg-primary-dim transition-colors">
              Create First Event
            </button>
          </div>
        )}
      </div>

      {/* RSVP drawer */}
      {selectedEvent && (
        <RSVPDrawer event={selectedEvent} members={members} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
