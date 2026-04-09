import { mkOverride } from './members';

export function canAdvance(member, stages) {
  if (member.override?.enabled) return true;
  const currentStage = stages[member.currentStageIndex];
  if (!currentStage) return false;
  const tasks = member.tasks[currentStage.id] || [];
  if (tasks.length === 0) return true;
  return tasks.every(t => t === true);
}

export function advanceMember(member, stages) {
  if (!canAdvance(member, stages)) return { success:false, message:'Complete all requirements before advancing' };
  if (member.currentStageIndex >= stages.length - 1) return { success:false, message:'Already at the final stage' };
  return { success:true, updatedMember:{ ...member, currentStageIndex:member.currentStageIndex+1, override:mkOverride() } };
}

export function applyOverride(member, adminName, reason, targetId = null) {
  return { ...member, override:{ enabled:true, overriddenBy:adminName, reason, date:new Date().toISOString(), targetId } };
}

export function clearOverride(member) {
  return { ...member, override:mkOverride() };
}

export function getMemberStageName(member, stages) {
  return stages[member.currentStageIndex]?.name ?? 'Unknown';
}

export function getMemberStageProgress(member, stages) {
  const stage = stages[member.currentStageIndex];
  if (!stage) return 0;
  const tasks = member.tasks[stage.id] || [];
  if (tasks.length === 0) return 100;
  return Math.round((tasks.filter(Boolean).length / stage.requirements.length) * 100);
}

export function evaluateRule(member, rule, stages) {
  for (const condition of rule.conditions) {
    if (condition.type === 'stage') {
      const reqIdx = stages.findIndex(s => s.id === condition.value);
      if (reqIdx === -1) return false;
      if (condition.operator === '>=' && !(member.currentStageIndex >= reqIdx)) return false;
      if (condition.operator === '==' && !(member.currentStageIndex === reqIdx)) return false;
    }
    if (condition.type === 'task') {
      const tasks = member.tasks[condition.stageId] || [];
      if (tasks.length > 0 && !tasks.every(t => t === true)) return false;
    }
    if (condition.type === 'mentor') {
      if (condition.operator === 'exists' && !member.mentorId) return false;
    }
    if (condition.type === 'group') {
      if (condition.operator === 'exists' && !member.group) return false;
    }
  }
  return true;
}

export function getRuleFailures(member, rule, stages) {
  return rule.conditions.map(condition => {
    let passed = false, label = '';
    if (condition.type === 'stage') {
      const reqIdx = stages.findIndex(s => s.id === condition.value);
      if (reqIdx === -1) return { label:'Required stage not found (configuration error)', passed:false, condition };
      passed = condition.operator === '>=' ? member.currentStageIndex >= reqIdx : member.currentStageIndex === reqIdx;
      label = `Stage ${condition.operator === '>=' ? '≥' : '='} ${stages[reqIdx].name}`;
    } else if (condition.type === 'task') {
      const tasks = member.tasks[condition.stageId] || [];
      passed = tasks.length === 0 || tasks.every(t => t === true);
      label = `${stages.find(s => s.id === condition.stageId)?.name ?? 'Unknown'} — all tasks complete`;
    } else if (condition.type === 'mentor') {
      passed = !!member.mentorId; label = 'Mentor assigned';
    } else if (condition.type === 'group') {
      passed = !!member.group; label = 'Group assigned';
    }
    return { label, passed, condition };
  });
}

export function checkEligibility(member, rules, targetId, stages) {
  const isLeadership = targetId === 'leadership';
  const relevant = rules.filter(r => {
    if (r.targetId !== targetId && r.targetId !== 'all') return false;
    if (isLeadership) return r.appliesTo === 'leadership';
    return r.appliesTo === 'team' || r.appliesTo === 'group';
  });
  const failedRules = relevant.filter(rule => !evaluateRule(member, rule, stages));
  if (failedRules.length === 0) return { allowed:true, type:'allow', failures:[] };
  const worstRule = failedRules.find(r => r.action.type === 'block') ?? failedRules[0];
  return { allowed:worstRule.action.type !== 'block', type:worstRule.action.type, message:worstRule.action.message, rule:worstRule, failures:getRuleFailures(member, worstRule, stages) };
}