// ─── src/lib/auth.js ─────────────────────────────────────────────────────────
import { createContext, useContext } from 'react';

// =============================================================================
// AUTH CONTEXT
// =============================================================================

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

// =============================================================================
// ROLE METADATA
// =============================================================================

export const ROLE_META = {
  pastor: { label: 'Pastor',       color: 'bg-primary-container text-primary'             },
  admin:  { label: 'Administrator', color: 'bg-secondary-container text-secondary'         },
  leader: { label: 'Leader',        color: 'bg-tertiary-container text-on-tertiary-container' },
  member: { label: 'Member',        color: 'bg-surface-container-high text-on-surface-variant' },
};

// =============================================================================
// HELPER — get all group IDs a leader manages
// Supports both old `groupId` (single int) and new `groupIds` (array)
// =============================================================================

export function getLeaderGroupIds(user) {
  if (!user) return [];
  if (Array.isArray(user.groupIds) && user.groupIds.length > 0) return user.groupIds;
  if (user.groupId) return [user.groupId];
  return [];
}

// =============================================================================
// PERMISSIONS
//
// Leaders have VIEW-ONLY access to their group members:
//   - Can navigate to member detail pages
//   - Cannot enrol, approve, edit, or delete members
//   - Can send messages to their group members
//   - Can take attendance for their groups
//
// Pastor / Admin have full access.
// =============================================================================

export function hasPermission(user, action, _member) {
  if (!user) return false;
  const { role } = user;

  switch (action) {
    // Only pastor and admin can enrol new members
    case 'enrol':
      return role === 'pastor' || role === 'admin';

    // Only pastor and admin can approve pending members
    case 'approve':
      return role === 'pastor' || role === 'admin';

    // Only pastor and admin can edit member profiles
    case 'edit_member':
      return role === 'pastor' || role === 'admin';

    // Only pastor and admin can delete members
    case 'delete_member':
      return role === 'pastor' || role === 'admin';

    // Only pastor and admin can assign members to groups / appoint leaders
    case 'assign':
      return role === 'pastor' || role === 'admin';

    // Only pastor and admin can appoint group leaders
    case 'assign_leader':
      return role === 'pastor' || role === 'admin';

    // Only pastor and admin can manage engine / rules
    case 'manage_engine':
      return role === 'pastor' || role === 'admin';

    // All staff can view member details
    case 'view':
      return role === 'pastor' || role === 'admin' || role === 'leader';

    default:
      return false;
  }
}

// =============================================================================
// VISIBLE MEMBERS
//
// Pastor / Admin → all members
// Leader         → only members in ANY of their managed groups
// Member         → [] (handled by member portal separately)
// =============================================================================

export function getVisibleMembers(user, members, groups) {
  if (!user) return [];
  if (user.role === 'pastor' || user.role === 'admin') return members;

  if (user.role === 'leader') {
    const leaderGroupIds = getLeaderGroupIds(user);
    const visibleMemberIds = new Set();
    groups
      .filter(g => leaderGroupIds.includes(g.id))
      .forEach(g => g.memberIds.forEach(id => visibleMemberIds.add(id)));
    return members.filter(m => visibleMemberIds.has(m.id));
  }

  return [];
}

// =============================================================================
// CAN ACCESS FULL APP
// Returns false if the user's linked member account is still pending approval.
// Members without a linked member record (e.g. new@church.org) are also blocked
// until approved and linked.
// =============================================================================

export function canAccessFullApp(user, members) {
  if (!user) return false;
  // Pastor and admin always have full access
  if (user.role === 'pastor' || user.role === 'admin') return true;
  // Leaders always have access (they've been manually appointed)
  if (user.role === 'leader') return true;
  // Members need an approved linked record
  if (user.role === 'member') {
    if (!user.memberId) return false;
    const linked = members.find(m => m.id === user.memberId);
    if (!linked) return false;
    return linked.enrollmentStage !== 'new_applicant';
  }
  return false;
}

// =============================================================================
// BLUEPRINT COMPLETION CHECK
// A member is eligible to be appointed as leader only when:
//   1. They have reached the final stage (Build)
//   2. All tasks in all stages are complete
// =============================================================================

export function hasBlueprintComplete(member, stages) {
  if (!member || !stages?.length) return false;
  const lastStageIdx = stages.length - 1;
  if ((member.currentStageIndex ?? 0) < lastStageIdx) return false;
  // All tasks in all stages must be complete
  return stages.every(s => {
    const tasks = member.tasks?.[s.id] ?? [];
    return s.requirements.every((_, i) => tasks[i] === true);
  });
}

// =============================================================================
// PASSWORD HASH
// Simple deterministic hash — replace with bcrypt in production.
// =============================================================================

export function hashPassword(password) {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) ^ password.charCodeAt(i);
    hash = hash & hash; // 32-bit int
  }
  return `hashed_${Math.abs(hash).toString(36)}`;
}

// =============================================================================
// CREATE USER FOR MEMBER
// Called when a new member is enrolled. Creates a user account and generates
// a temporary password.
// =============================================================================

export function createUserForMember(member) {
  const base         = member.name.toLowerCase().replace(/\s+/g, '.');
  const email        = `${base}@members.church.org`;
  const tempPassword = Math.random().toString(36).slice(2, 8).toUpperCase();

  const user = {
    id:             `u_${Date.now()}`,
    email,
    name:           member.name,
    initials:       member.initials ?? member.name.slice(0, 2).toUpperCase(),
    role:           'member',
    groupIds:       [],
    memberId:       member.id,
    password:       tempPassword,
    passwordHash:   null,
    mustSetPassword: true,
  };

  return { user, tempPassword };
}
