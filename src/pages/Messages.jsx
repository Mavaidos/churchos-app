import { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';

const SAMPLE_MESSAGES = [
  { id:1, title:'Welcome to April!',             body:'This month we have the Blueprint Belong class and Good Friday service. Please mark your calendars.',  type:'announcement', target:'All Members',  sentAt:'2026-04-01T09:00:00Z' },
  { id:2, title:'iConnect Leaders — Action Item', body:'Please submit your group attendance for March by end of this week. Thank you for your faithfulness!', type:'reminder',      target:'Leaders',      sentAt:'2026-04-03T14:00:00Z' },
];

export function Messages({ groups = [] }) {
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', body:'', type:'announcement', target:'All Members' });
  const f = (k,v) => setForm(p => ({ ...p, [k]:v }));

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setMessages(prev => [{ ...form, id:Date.now(), sentAt:new Date().toISOString() }, ...prev]);
    setForm({ title:'', body:'', type:'announcement', target:'All Members' });
    setShowForm(false);
  };

  const inputCls = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';
  const labelCls = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-1.5 block';

  const typeColors = { announcement:'bg-primary-container text-on-primary-container', reminder:'bg-amber-100 text-amber-700', group_message:'bg-secondary-container text-on-secondary-container', broadcast:'bg-tertiary-container text-on-tertiary-container' };

  return (
    <div className="fade-in">
      <TopBar title="Messages" onAdd={() => setShowForm(true)} addLabel="New Message"/>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight">Communications</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Send announcements and messages to your congregation.</p>
        </div>

        {showForm && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-7 slide-in">
            <h3 className="font-bold font-headline text-lg mb-5">New Message</h3>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.type} onChange={e => f('type', e.target.value)} className={inputCls}>
                    <option value="announcement">Announcement</option>
                    <option value="reminder">Reminder</option>
                    <option value="group_message">Group Message</option>
                    <option value="broadcast">Broadcast</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Audience</label>
                  <select value={form.target} onChange={e => f('target', e.target.value)} className={inputCls}>
                    <option value="All Members">All Members</option>
                    <option value="Leaders">Leaders</option>
                    {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Title *</label>
                <input value={form.title} onChange={e => f('title', e.target.value)} required className={inputCls} placeholder="Message title"/>
              </div>
              <div>
                <label className={labelCls}>Message *</label>
                <textarea value={form.body} onChange={e => f('body', e.target.value)} required rows={4} className={inputCls + ' resize-none'}/>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">send</span>Send
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${typeColors[msg.type] ?? 'bg-surface-container text-on-surface-variant'}`}>{msg.type.replace('_',' ')}</span>
                    <span className="text-xs text-on-surface-variant">{msg.target}</span>
                  </div>
                  <h3 className="font-bold text-on-surface">{msg.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{msg.body}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-sm ms-filled text-green-500">check_circle</span>
                  {new Date(msg.sentAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}