// ─── src/pages/Engine.jsx ────────────────────────────────────────────────────
import { useState } from 'react';

// ── Rule Card ─────────────────────────────────────────────────────────────────
function RuleCard({ rule, stages, groups, onDelete }) {
  const ac = {
    block: { bg: 'bg-error-container/30',  text: 'text-error',       icon: 'block',         label: 'BLOCK' },
    warn:  { bg: 'bg-amber-100',            text: 'text-amber-700',   icon: 'warning',       label: 'WARN'  },
    allow: { bg: 'bg-green-100',            text: 'text-green-700',   icon: 'check_circle',  label: 'ALLOW' },
  }[rule.action.type] || { bg: 'bg-error-container/30', text: 'text-error', icon: 'block', label: 'BLOCK' };

  const targetName = rule.targetId === 'leadership'
    ? 'All Leadership'
    : (groups.find(g => g.id === rule.targetId)?.name ?? `Target #${rule.targetId}`);

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden hover:shadow-md transition-all group">
      <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-surface-container">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{rule.appliesTo}</span>
            <span className="text-outline-variant">·</span>
            <span className="text-[10px] font-bold text-primary">{targetName}</span>
          </div>
          <h4 className="text-base font-bold font-headline text-on-surface">{rule.name}</h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ac.bg} ${ac.text}`}>
            <span className="material-symbols-outlined text-xs ms-filled">{ac.icon}</span>{ac.label}
          </span>
          <button onClick={() => onDelete(rule.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error-container/20 rounded-lg transition-all">
            <span className="material-symbols-outlined text-sm text-outline-variant hover:text-error">delete</span>
          </button>
        </div>
      </div>
      <div className="px-6 py-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">IF ALL CONDITIONS MET</p>
        {rule.conditions.map((c, i) => {
          let label = '';
          if (c.type === 'stage')  label = `Stage ${c.operator === '>=' ? '≥' : '='} ${stages.find(s => s.id === c.value)?.name ?? '?'}`;
          if (c.type === 'task')   label = `${stages.find(s => s.id === c.stageId)?.name ?? '?'} — all tasks complete`;
          if (c.type === 'mentor') label = 'Mentor assigned';
          if (c.type === 'group')  label = 'Group assigned';
          return (
            <div key={i} className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-sm">{{ stage: 'trending_up', task: 'task_alt', mentor: 'person', group: 'diversity_3' }[c.type] || 'rule'}</span>
              <span className="font-medium">{label}</span>
            </div>
          );
        })}
      </div>
      <div className={`mx-6 mb-5 px-4 py-3 rounded-xl text-xs font-medium leading-relaxed ${ac.bg} ${ac.text}`}>{rule.action.message}</div>
    </div>
  );
}

// ── Create Rule Modal ─────────────────────────────────────────────────────────
function CreateRuleModal({ stages, groups, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', appliesTo: 'team', targetId: groups[0]?.id ?? '', action: { type: 'block', message: '' } });
  const [conditions, setConditions] = useState([{ id: `c-${Date.now()}`, type: 'stage', operator: '>=', value: stages[0]?.id ?? 1, stageId: null }]);
  const [errors, setErrors] = useState({});
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addCondition    = () => setConditions(prev => [...prev, { id: `c-${Date.now()}-${prev.length}`, type: 'stage', operator: '>=', value: stages[0]?.id ?? 1, stageId: null }]);
  const removeCondition = id => { if (conditions.length <= 1) return; setConditions(prev => prev.filter(c => c.id !== id)); };
  const updateCondition = (id, patch) => setConditions(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Rule name is required';
    if (!form.action.message.trim()) e.message = 'Action message is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    const targetId = form.appliesTo === 'leadership' ? 'leadership' : Number(form.targetId);
    onSave({ id: `rule-${Date.now()}`, name: form.name.trim(), appliesTo: form.appliesTo, targetId, conditions, action: { type: form.action.type, message: form.action.message.trim() } });
  };

  const ic = k => `w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low ${errors[k] ? 'border-error' : 'border-outline-variant/30'}`;
  const lc = 'text-[10px] uppercase font-bold tracking-[0.1em] text-outline mb-2 block';
  const sc = 'w-full border border-outline-variant/30 bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 slide-in overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-7 pb-5 border-b border-surface-container flex-shrink-0 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Rules Engine</p>
            <h3 className="text-xl font-bold font-headline">Create New Rule</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-7 space-y-6 overflow-y-auto flex-1">
          <div>
            <label className={lc}>Rule Name *</label>
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Worship Team Eligibility" className={ic('name')} />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Applies To</label>
              <select value={form.appliesTo} onChange={e => f('appliesTo', e.target.value)} className={sc}>
                <option value="team">Team</option><option value="group">Group</option><option value="leadership">Leadership</option>
              </select>
            </div>
            <div>
              <label className={lc}>Target</label>
              {form.appliesTo === 'leadership' ? (
                <div className="border border-outline-variant/30 bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface-variant italic">All Leadership</div>
              ) : (
                <select value={form.targetId} onChange={e => f('targetId', e.target.value)} className={sc}>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={lc + ' mb-0'}>Conditions (ALL must be met)</label>
              <button onClick={addCondition} className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">add</span>Add
              </button>
            </div>
            <div className="space-y-3">
              {conditions.map(cond => (
                <div key={cond.id} className="bg-surface-container-low rounded-xl p-4 space-y-3 relative">
                  {conditions.length > 1 && (
                    <button onClick={() => removeCondition(cond.id)} className="absolute top-3 right-3 p-1 hover:bg-error-container/20 rounded-lg">
                      <span className="material-symbols-outlined text-sm text-outline-variant hover:text-error">close</span>
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className={lc}>Field</label>
                      <select value={cond.type} onChange={e => updateCondition(cond.id, { type: e.target.value, value: e.target.value === 'stage' ? (stages[0]?.id ?? 1) : null, stageId: null, operator: (e.target.value === 'mentor' || e.target.value === 'group') ? 'exists' : '>=' })}
                        className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="stage">Stage</option><option value="task">Task</option><option value="mentor">Mentor</option><option value="group">Group</option>
                      </select>
                    </div>
                    <div>
                      <label className={lc}>Operator</label>
                      {cond.type === 'mentor' || cond.type === 'group' ? (
                        <div className="border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm text-on-surface-variant italic">exists</div>
                      ) : cond.type === 'task' ? (
                        <div className="border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm text-on-surface-variant italic">all complete</div>
                      ) : (
                        <select value={cond.operator} onChange={e => updateCondition(cond.id, { operator: e.target.value })}
                          className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none">
                          <option value=">=">≥ (or higher)</option><option value="==">= (exactly)</option>
                        </select>
                      )}
                    </div>
                  </div>
                  {cond.type === 'stage' && (
                    <div>
                      <label className={lc}>Required Stage</label>
                      <select value={cond.value} onChange={e => updateCondition(cond.id, { value: Number(e.target.value) })}
                        className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none">
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  {cond.type === 'task' && (
                    <div>
                      <label className={lc}>Stage whose tasks must be complete</label>
                      <select value={cond.stageId ?? ''} onChange={e => updateCondition(cond.id, { stageId: Number(e.target.value) })}
                        className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="">Select stage…</option>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className={lc}>Action when conditions are not met</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: 'block', l: '🚫 Block' }, { v: 'warn', l: '⚠️ Warn' }, { v: 'allow', l: '✅ Allow' }].map(a => (
                <button key={a.v} type="button" onClick={() => f('action', { ...form.action, type: a.v })}
                  className={`py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${form.action.type === a.v ? 'border-primary bg-primary-container/30 text-primary' : 'border-outline-variant/20 hover:border-outline-variant text-on-surface-variant'}`}>
                  {a.l}
                </button>
              ))}
            </div>
            <div>
              <label className={lc}>Message shown to admin *</label>
              <textarea value={form.action.message} onChange={e => f('action', { ...form.action, message: e.target.value })}
                placeholder="e.g. Member must be baptized before joining this team." rows={2}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low resize-none ${errors.message ? 'border-error' : 'border-outline-variant/30'}`} />
              {errors.message && <p className="text-xs text-error mt-1">{errors.message}</p>}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-surface-container flex gap-3 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2.5 text-sm font-semibold bg-primary text-on-primary rounded-xl shadow-sm hover:bg-primary-dim transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">rule</span>Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Engine Page ───────────────────────────────────────────────────────────────
export function Engine({ stages, setStages, rules, setRules, groups, toast }) {
  const [tab, setTab]               = useState('journey');
  const [editingTask, setEditingTask] = useState(null);
  const [taskDraft, setTaskDraft]   = useState('');
  const [newTaskDraft, setNewTaskDraft] = useState({});
  const [saved, setSaved]           = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [ruleFilter, setRuleFilter] = useState('all');
  const [editingStageId, setEditingStageId] = useState(null);
  const [stageTitleDraft, setStageTitleDraft] = useState('');
  const [dragStage, setDragStage]   = useState(null);
  const [dragTask, setDragTask]     = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);

  const colorMap     = { primary: '#d5e3fd', secondary: '#d3e4fe', tertiary: '#cfdef5' };
  const textColorMap = { primary: '#515f74', secondary: '#506076', tertiary: '#526073' };

  // Stage actions
  const toggleStage    = id => setStages(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  const toggleRequires = id => setStages(prev => prev.map(s => s.id === id ? { ...s, requiresPrevious: !s.requiresPrevious } : s));
  const deleteStage    = id => {
    if (stages.length <= 1) { toast('Cannot delete the only stage'); return; }
    if (!window.confirm('Delete this stage? This cannot be undone.')) return;
    setStages(prev => prev.filter(s => s.id !== id));
    toast('Stage removed');
  };
  const saveStageTitle = id => {
    if (!stageTitleDraft.trim()) return;
    setStages(prev => prev.map(s => s.id === id ? { ...s, name: stageTitleDraft.trim() } : s));
    setEditingStageId(null);
    toast('Stage name updated');
  };
  const addStage = () => {
    const icons = ['star', 'explore', 'bolt', 'emoji_events'];
    setStages(prev => [...prev, { id: Date.now(), name: `Stage ${prev.length + 1}`, icon: icons[prev.length % 4], color: 'primary', description: 'New growth stage', active: true, requiresPrevious: true, requirements: [] }]);
  };

  // Task actions
  const removeTask = (stageId, idx) => setStages(prev => prev.map(s => s.id === stageId ? { ...s, requirements: s.requirements.filter((_, i) => i !== idx) } : s));
  const addTask    = stageId => {
    const d = newTaskDraft[stageId]?.trim();
    if (!d) return;
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, requirements: [...s.requirements, d] } : s));
    setNewTaskDraft(prev => ({ ...prev, [stageId]: '' }));
  };
  const updateTask = (stageId, idx, val) => setStages(prev => prev.map(s => s.id === stageId ? { ...s, requirements: s.requirements.map((r, i) => i === idx ? val : r) } : s));
  const saveEngine = () => { setSaved(true); toast('Blueprint saved'); setTimeout(() => setSaved(false), 2000); };

  // Stage drag
  const onStageDragStart = (e, id) => { setDragStage(id); e.dataTransfer.effectAllowed = 'move'; };
  const onStageDragOver  = (e, id) => { e.preventDefault(); setDragOverStage(id); };
  const onStageDrop      = (e, targetId) => {
    e.preventDefault();
    if (!dragStage || dragStage === targetId) { setDragStage(null); setDragOverStage(null); return; }
    setStages(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(s => s.id === dragStage);
      const toIdx   = arr.findIndex(s => s.id === targetId);
      const [item]  = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    setDragStage(null); setDragOverStage(null);
    toast('Stage order updated');
  };

  // Task drag
  const onTaskDragStart = (e, stageId, idx) => { setDragTask({ stageId, idx }); e.dataTransfer.effectAllowed = 'move'; e.stopPropagation(); };
  const onTaskDragOver  = (e, stageId, idx) => { e.preventDefault(); e.stopPropagation(); setDragOverTask({ stageId, idx }); };
  const onTaskDrop      = (e, stageId, toIdx) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragTask || dragTask.stageId !== stageId || dragTask.idx === toIdx) { setDragTask(null); setDragOverTask(null); return; }
    setStages(prev => prev.map(s => {
      if (s.id !== stageId) return s;
      const arr = [...s.requirements];
      const [item] = arr.splice(dragTask.idx, 1);
      arr.splice(toIdx, 0, item);
      return { ...s, requirements: arr };
    }));
    setDragTask(null); setDragOverTask(null);
  };

  const filteredRules = ruleFilter === 'all' ? rules : rules.filter(r => r.appliesTo === ruleFilter);

  return (
    <div className="fade-in">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center px-8">
        <span className="text-lg font-bold text-slate-800 font-headline">{tab === 'journey' ? 'Blueprint Builder' : 'Rules Engine'}</span>
      </div>
      <div className="sticky top-16 z-20 bg-white border-b border-slate-100">
        <div className="flex max-w-4xl mx-auto px-10 gap-0">
          {[{ id: 'journey', label: 'Journey Builder', icon: 'route' }, { id: 'rules', label: 'Rules Engine', icon: 'rule' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules tab */}
      {tab === 'rules' && (
        <div className="p-10 max-w-4xl mx-auto space-y-8 fade-in">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Rules Engine</h2>
              <p className="text-on-surface-variant text-sm max-w-lg leading-relaxed">Define eligibility rules for who can serve, lead, or join a group.</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="bg-primary text-on-primary px-5 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-primary-dim transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">add</span>New Rule
            </button>
          </div>
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            {[{ id: 'all', label: 'All Rules', icon: 'rule' }, { id: 'team', label: 'Serving', icon: 'music_note' }, { id: 'leadership', label: 'Leadership', icon: 'verified' }, { id: 'group', label: 'Groups', icon: 'diversity_3' }].map(fi => (
              <button key={fi.id} onClick={() => setRuleFilter(fi.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${ruleFilter === fi.id ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-sm">{fi.icon}</span>
                <span className="hidden sm:inline">{fi.label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container text-outline ml-1">
                  {fi.id === 'all' ? rules.length : rules.filter(r => r.appliesTo === fi.id).length}
                </span>
              </button>
            ))}
          </div>
          {filteredRules.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4 block text-outline-variant">rule_folder</span>
              <p className="font-semibold">No rules defined</p>
              <button onClick={() => setShowCreate(true)} className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-md font-semibold text-sm hover:bg-primary-dim transition-colors">Create First Rule</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} stages={stages} groups={groups}
                  onDelete={id => { setRules(prev => prev.filter(r => r.id !== id)); toast('Rule removed'); }} />
              ))}
            </div>
          )}
          {showCreate && (
            <CreateRuleModal stages={stages} groups={groups} onClose={() => setShowCreate(false)}
              onSave={r => { setRules(prev => [...prev, r]); setShowCreate(false); toast('Rule created'); }} />
          )}
        </div>
      )}

      {/* Journey Builder tab */}
      {tab === 'journey' && (
        <div className="p-10 max-w-4xl mx-auto">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Blueprint Builder</h2>
              <p className="text-on-surface-variant leading-relaxed max-w-lg text-sm">
                Drag <span className="material-symbols-outlined text-sm align-middle">drag_indicator</span> to reorder stages and tasks. Click a stage name to rename it.
              </p>
            </div>
            <button onClick={saveEngine} className={`px-5 py-2.5 font-semibold text-sm rounded-md shadow-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-primary text-on-primary hover:bg-primary-dim'}`}>
              {saved ? '✓ Saved!' : 'Save Blueprint'}
            </button>
          </div>

          <div className="space-y-8">
            {stages.map((stage, idx) => (
              <div key={stage.id} draggable onDragStart={e => onStageDragStart(e, stage.id)} onDragOver={e => onStageDragOver(e, stage.id)} onDrop={e => onStageDrop(e, stage.id)} onDragEnd={() => { setDragStage(null); setDragOverStage(null); }}
                className={`relative transition-all ${dragOverStage === stage.id && dragStage !== stage.id ? 'scale-[1.02] opacity-80' : ''}`}>
                {idx < stages.length - 1 && (
                  <div className="absolute left-7 top-[88px] bottom-[-32px] w-0.5 z-0" style={{ background: 'repeating-linear-gradient(to bottom,#acb3b8 0%,#acb3b8 50%,transparent 50%,transparent 100%)', backgroundSize: '1px 10px' }} />
                )}
                <div className={`bg-surface-container-lowest rounded-2xl p-6 shadow-sm ring-1 ring-black/[0.03] hover:shadow-md relative z-10 border-l-4 transition-all ${stage.active ? 'border-primary' : 'border-outline-variant/30'} ${dragStage === stage.id ? 'opacity-40' : ''}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline-variant cursor-grab active:cursor-grabbing select-none">drag_indicator</span>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colorMap[stage.color] || colorMap.primary, color: textColorMap[stage.color] || textColorMap.primary }}>
                        <span className="material-symbols-outlined text-2xl">{stage.icon}</span>
                      </div>
                      <div>
                        {editingStageId === stage.id ? (
                          <div className="flex items-center gap-2">
                            <input value={stageTitleDraft} onChange={e => setStageTitleDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveStageTitle(stage.id); if (e.key === 'Escape') setEditingStageId(null); }} autoFocus
                              className="text-lg font-bold border-b-2 border-primary bg-transparent outline-none font-headline text-on-surface w-40" />
                            <button onClick={() => saveStageTitle(stage.id)} className="text-primary hover:text-primary-dim"><span className="material-symbols-outlined text-sm ms-filled">check_circle</span></button>
                            <button onClick={() => setEditingStageId(null)} className="text-outline-variant hover:text-on-surface"><span className="material-symbols-outlined text-sm">cancel</span></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title">
                            <h3 className="text-lg font-bold font-headline text-on-surface">{stage.name}</h3>
                            <button onClick={() => { setEditingStageId(stage.id); setStageTitleDraft(stage.name); }} className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 hover:bg-surface-container rounded-lg">
                              <span className="material-symbols-outlined text-sm text-outline-variant hover:text-primary">edit</span>
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] font-bold uppercase text-outline-variant tracking-wider">Stage {String(idx + 1).padStart(2, '0')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-on-surface-variant">{stage.active ? 'Active' : 'Inactive'}</span>
                      <input type="checkbox" className="apple-toggle" checked={stage.active} onChange={() => toggleStage(stage.id)} />
                      <button onClick={() => deleteStage(stage.id)} className="ml-2 p-1.5 hover:bg-error-container/20 rounded-lg transition-colors text-outline-variant hover:text-error">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-xl ${stage.requiresPrevious && idx > 0 ? 'bg-primary-container/30 border border-primary-container' : 'bg-surface border border-transparent'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${stage.requiresPrevious && idx > 0 ? 'text-primary' : 'text-outline-variant'}`}>{stage.requiresPrevious && idx > 0 ? 'lock' : 'lock_open'}</span>
                        <span className={`text-sm font-medium ${stage.requiresPrevious && idx > 0 ? 'font-semibold text-primary' : ''}`}>{idx === 0 ? 'Entry point — no prerequisites' : 'Must complete previous stage'}</span>
                      </div>
                      {idx > 0 && <input type="checkbox" className="apple-toggle" checked={stage.requiresPrevious} onChange={() => toggleRequires(stage.id)} />}
                    </div>

                    <div className="pt-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Required Tasks — drag to reorder</h4>
                      <div className="space-y-1">
                        {stage.requirements.map((req, ri) => (
                          <div key={ri} draggable onDragStart={e => onTaskDragStart(e, stage.id, ri)} onDragOver={e => onTaskDragOver(e, stage.id, ri)} onDrop={e => onTaskDrop(e, stage.id, ri)} onDragEnd={() => { setDragTask(null); setDragOverTask(null); }}
                            className={`group flex items-center gap-3 p-3 rounded-lg transition-colors ${dragOverTask?.stageId === stage.id && dragOverTask?.idx === ri && dragTask?.idx !== ri ? 'bg-primary-container/30 border border-primary/30' : 'hover:bg-surface-container-low'} ${dragTask?.stageId === stage.id && dragTask?.idx === ri ? 'opacity-40' : ''}`}>
                            <span className="material-symbols-outlined text-outline-variant cursor-grab active:cursor-grabbing select-none">drag_indicator</span>
                            <div className="w-2 h-2 rounded-full bg-primary-dim flex-shrink-0" />
                            {editingTask?.stageId === stage.id && editingTask?.taskIdx === ri ? (
                              <input value={taskDraft} onChange={e => setTaskDraft(e.target.value)} autoFocus
                                onBlur={() => { updateTask(stage.id, ri, taskDraft); setEditingTask(null); }}
                                onKeyDown={e => { if (e.key === 'Enter') { updateTask(stage.id, ri, taskDraft); setEditingTask(null); } if (e.key === 'Escape') setEditingTask(null); }}
                                className="flex-1 border border-primary/30 rounded-md px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/30" />
                            ) : (
                              <span className="text-sm flex-1">{req}</span>
                            )}
                            <button onClick={() => { setEditingTask({ stageId: stage.id, taskIdx: ri }); setTaskDraft(req); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-outline-variant text-sm hover:text-primary">edit</span>
                            </button>
                            <button onClick={() => removeTask(stage.id, ri)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-outline-variant text-sm hover:text-error">delete</span>
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 p-3">
                          <span className="material-symbols-outlined text-outline-variant/30">drag_indicator</span>
                          <div className="w-2 h-2 rounded-full bg-outline-variant/30 flex-shrink-0" />
                          <input value={newTaskDraft[stage.id] || ''} onChange={e => setNewTaskDraft(prev => ({ ...prev, [stage.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTask(stage.id)}
                            placeholder="Add new requirement…"
                            className="flex-1 text-sm text-on-surface-variant bg-transparent outline-none border-b border-outline-variant/20 pb-1 focus:border-primary placeholder:text-outline-variant" />
                          <button onClick={() => addTask(stage.id)} className="text-primary text-xs font-bold hover:underline whitespace-nowrap flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add</span>Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center pt-4">
              <button onClick={addStage} className="group flex items-center gap-3 px-8 py-4 bg-surface-container-lowest rounded-full shadow-lg hover:shadow-xl transition-all border border-outline-variant/10 text-primary hover:scale-105 active:scale-95 duration-200">
                <span className="material-symbols-outlined">add_circle</span>
                <span className="font-bold text-sm">Add New Blueprint Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
