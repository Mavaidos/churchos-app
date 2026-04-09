import { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';

const SAMPLE_EVENTS = [
  { id:1, title:'Sunday Service',         date:'2026-04-13', start_time:'09:00', location:'Main Auditorium', type:'service',     description:'Weekly Sunday worship service.' },
  { id:2, title:'Blueprint Belong Class', date:'2026-04-16', start_time:'18:30', location:'Room 4',          type:'training',    description:'Monthly Belong class for new members.' },
  { id:3, title:'iConnect Leaders Meeting', date:'2026-04-18', start_time:'19:00', location:'Conference Room', type:'fellowship', description:'Monthly meeting for all iConnect group leaders.' },
  { id:4, title:'Good Friday Service',    date:'2026-04-18', start_time:'18:00', location:'Main Auditorium', type:'service',     description:'Good Friday commemorative service.' },
];

function EventCard({ event }) {
  const d = new Date(event.date);
  const month = d.toLocaleString('default', { month:'short' });
  const day   = d.getDate();
  const typeColors = { service:'bg-primary-container text-on-primary-container', training:'bg-secondary-container text-on-secondary-container', fellowship:'bg-tertiary-container text-on-tertiary-container', conference:'bg-amber-100 text-amber-700', outreach:'bg-green-100 text-green-700' };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 flex gap-4 hover:shadow-md transition-all">
      <div className="w-14 h-14 rounded-xl bg-primary-container/40 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-primary">{month}</span>
        <span className="text-xl font-extrabold text-primary leading-none">{day}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-on-surface">{event.title}</h3>
        {event.description && <p className="text-sm text-on-surface-variant mt-0.5">{event.description}</p>}
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-on-surface-variant">
          {event.start_time && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{event.start_time}</span>}
          {event.location    && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{event.location}</span>}
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize self-start ${typeColors[event.type] ?? 'bg-surface-container text-on-surface-variant'}`}>
        {event.type}
      </span>
    </div>
  );
}

export function Events() {
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', date:'', start_time:'', location:'', type:'service', description:'' });
  const f = (k,v) => setForm(p => ({ ...p, [k]:v }));

  const now      = new Date();
  const upcoming = events.filter(e => new Date(e.date) >= now);
  const past     = events.filter(e => new Date(e.date) < now);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    setEvents(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ title:'', date:'', start_time:'', location:'', type:'service', description:'' });
    setShowForm(false);
  };

  const inputCls  = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';
  const labelCls  = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block';

  return (
    <div className="fade-in">
      <TopBar title="Events" onAdd={() => setShowForm(true)} addLabel="New Event"/>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight">Events</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Manage church events and services.</p>
        </div>

        {showForm && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-7 slide-in">
            <h3 className="font-bold font-headline text-lg mb-5">New Event</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Title *</label>
                  <input value={form.title} onChange={e => f('title', e.target.value)} required className={inputCls} placeholder="e.g. Sunday Service"/>
                </div>
                <div>
                  <label className={labelCls}>Date *</label>
                  <input type="date" value={form.date} onChange={e => f('date', e.target.value)} required className={inputCls}/>
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.type} onChange={e => f('type', e.target.value)} className={inputCls}>
                    {['service','conference','outreach','fellowship','training','other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => f('start_time', e.target.value)} className={inputCls}/>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input value={form.location} onChange={e => f('location', e.target.value)} className={inputCls} placeholder="e.g. Main Auditorium"/>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} className={inputCls + ' resize-none'}/>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors">Create Event</button>
              </div>
            </form>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Upcoming</p>
            <div className="space-y-3">{upcoming.map(e => <EventCard key={e.id} event={e}/>)}</div>
          </div>
        )}
        {past.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Past</p>
            <div className="space-y-3 opacity-60">{past.map(e => <EventCard key={e.id} event={e}/>)}</div>
          </div>
        )}
        {events.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">event</span>
            <p className="font-semibold">No events yet</p>
            <p className="text-sm mt-1">Create your first event to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}