import { createContext, useContext } from 'react';
import { seedGroups } from '../data/seed';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const ROLE_META = {
  pastor: { label:'Pastor',       color:'bg-primary text-on-primary',                              icon:'church'               },
  admin:  { label:'Admin',        color:'bg-secondary-container text-on-secondary-container',      icon:'admin_panel_settings' },
  leader: { label:'Group Leader', color:'bg-tertiary-container text-on-tertiary-container',        icon:'groups'               },
  member: { label:'Member',       color:'bg-surface-container-high text-on-surface-variant',      icon:'person'               },
};

function getGroupName(groupId) {
  return seedGroups.find(g => g.id === groupId)?.name ?? null;
}

export function hasPermission(user, action, targetMember = null) {
  if (!user) return false;
  if (user.role === 'pastor') return true;
  switch (action) {
    case 'view':
      if (user.role === 'admin') return true;
      if (user.role === 'leader') {
        if (!user.groupId) return false;
        return !targetMember || targetMember.groupId === user.groupId || (targetMember.group && targetMember.group === getGroupName(user.groupId));
      }
      if (user.role === 'member') return targetMember?.id === user.memberId;
      return false;
    case 'approve':
      if (user.role === 'admin') return true;
      if (user.role === 'leader') {
        if (!user.groupId || !targetMember) return false;
        return targetMember.groupId === user.groupId || (targetMember.group && targetMember.group === getGroupName(user.groupId));
      }
      return false;
    case 'assign':   return user.role === 'admin';
    case 'enrol':    return user.role === 'admin' || user.role === 'pastor';
    case 'engine':   return user.role === 'admin' || user.role === 'pastor';
    case 'settings': return user.role === 'admin' || user.role === 'pastor';
    default:         return false;
  }
}

export function getVisibleMembers(user, members, groups) {
  if (!user) return [];
  if (user.role === 'pastor' || user.role === 'admin') return members;
  if (user.role === 'leader') {
    if (!user.groupId) return [];
    const groupName = getGroupName(user.groupId) ?? '';
    return members.filter(m => m.groupId === user.groupId || m.group === groupName);
  }
  if (user.role === 'member') return members.filter(m => m.id === user.memberId);
  return [];
}

export function canAccessFullApp(user, members) {
  if (!user) return false;
  if (user.mustSetPassword) return false;
  if (!user.memberId) return true;
  const member = members.find(m => m.id === user.memberId);
  if (!member) return false;
  return member.enrollmentStage === 'approved' || member.enrollmentStage === 'in_discipleship';
}

function generateTempPassword(member) {
  const firstName = (member.name || '').split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  const phoneDigits = (member.phone || '').replace(/\D/g, '');
  const last4 = phoneDigits.slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
  return `${firstName}${last4}`;
}

export function createUserForMember(member) {
  const tempPassword = generateTempPassword(member);
  const email = member.email?.trim().toLowerCase() || `${member.phone?.replace(/\D/g,'') || member.id}@member.church`;
  return {
    user: {
      id:              `u_${member.id}`,
      email,
      username:        member.phone?.trim() || `user_${member.id}`,
      password:        tempPassword,
      passwordHash:    null,
      role:            'member',
      groupId:         null,
      memberId:        member.id,
      name:            member.name,
      initials:        member.initials ?? member.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2),
      mustSetPassword: true,
    },
    tempPassword,
  };
}

export function hashPassword(plain) {
  return `hashed::${plain}`;
}