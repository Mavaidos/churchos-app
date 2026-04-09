export const mkOverride = () => ({
  enabled: false, reason: '', overriddenBy: '', date: null, targetId: null
});

export function createMemberDefaults(partial) {
  return { status: 'active', enrollmentStage: 'new_applicant', spouseId: null, spouseName: null, ...partial };
}

export function approveMember(member) {
  return { ...member, enrollmentStage: 'approved' };
}

export function startDiscipleship(member) {
  return { ...member, enrollmentStage: 'in_discipleship' };
}