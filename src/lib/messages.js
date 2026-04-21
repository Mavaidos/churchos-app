// ─── src/lib/messages.js ─────────────────────────────────────────────────────
// Shared messaging utilities used by both the admin/leader Messages page
// and the member portal MemberInbox. Keeping thread keys consistent ensures
// that a message sent from the admin side lands in the same thread the
// member sees on their side.
// ─────────────────────────────────────────────────────────────────────────────

import { getLeaderGroupIds } from './auth';

// =============================================================================
// CANONICAL THREAD KEY
//
// Rules:
//   'broadcast'       → toType === 'all'  (pastor → everyone)
//   'group-{id}'      → toType === 'group' (pastor/leader → a group)
//   'member-{id}'     → toType === 'member' direct thread
//                       The id is ALWAYS the member's id (non-admin side)
//                       so both directions land in the same thread.
// =============================================================================

export function threadKey(msg) {
  if (msg.toType === 'all')   return 'broadcast';
  if (msg.toType === 'group') return `group-${msg.toId}`;
  // direct: always key on the member's id regardless of direction
  const memberId = msg.fromRole === 'member' ? msg.fromId : msg.toId;
  return `member-${memberId}`;
}

// =============================================================================
// TIME AGO
// =============================================================================

export function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m    = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

// =============================================================================
// GET VISIBLE MESSAGES
//
// Pastor / Admin → everything
// Leader         → messages in any of their managed groups + direct threads
//                  with members IN any of their groups
// Member         → not called here (MemberInbox handles member filtering)
// =============================================================================

export function getVisibleMessages(user, messages, members, groups) {
  if (!user) return [];
  if (user.role === 'pastor' || user.role === 'admin') return messages;

  if (user.role === 'leader') {
    const leaderGroupIds  = getLeaderGroupIds(user);          // array of group IDs
    const myGroups        = groups.filter(g => leaderGroupIds.includes(g.id));
    const myMemberIdSet   = new Set(
      myGroups.flatMap(g => (g.memberIds ?? []).map(String))
    );

    return messages.filter(msg => {
      // Group thread for any of this leader's groups
      if (msg.toType === 'group' && leaderGroupIds.includes(msg.toId)) return true;
      // Direct thread where the member side is one of this leader's members
      if (msg.toType === 'member') {
        const mId = msg.fromRole === 'member' ? String(msg.fromId) : String(msg.toId);
        return myMemberIdSet.has(mId);
      }
      return false;
    });
  }

  return [];
}

// =============================================================================
// BUILD THREAD MAP
//
// Takes a filtered list of visible messages and groups them into thread objects.
// Returns: { [threadKey]: { key, type, toId, name, member, group, msgs, unread, last } }
// =============================================================================

export function buildThreads(visibleMessages, members, groups, user) {
  const map = {};

  visibleMessages.forEach(msg => {
    const key = threadKey(msg);

    if (!map[key]) {
      let name   = '';
      let member = null;
      let group  = null;
      // For direct threads, toId is ALWAYS the member's (non-admin) id
      // so replies from admin correctly target the member even when the
      // member's outgoing message has toId: null
      let resolvedToId = msg.toId;

      if (msg.toType === 'all') {
        name = 'All Members';
      } else if (msg.toType === 'group') {
        group = groups.find(g => g.id === msg.toId);
        name  = group?.name ?? msg.toName ?? 'Group';
      } else {
        // direct — member side is always the non-admin
        const mId = msg.fromRole === 'member' ? msg.fromId : msg.toId;
        member    = members.find(m => String(m.id) === String(mId));
        name      = member?.name
          ?? (msg.fromRole === 'member' ? msg.fromName : msg.toName)
          ?? 'Member';
        // Always use the member's id, never null
        resolvedToId = mId != null ? Number(mId) : msg.toId;
      }

      map[key] = {
        key, type: msg.toType, toId: resolvedToId,
        name, member, group,
        msgs: [], unread: 0, last: null,
      };
    }

    // Keep toId resolved — if a later message in the thread has the real
    // member id, update it (handles case where member message comes first)
    if (msg.toType === 'member' && map[key].toId == null) {
      const mId = msg.fromRole === 'member' ? msg.fromId : msg.toId;
      if (mId != null) map[key].toId = Number(mId);
    }

    map[key].msgs.push(msg);

    // Unread = not read AND not sent by the current user
    if (!msg.read && String(msg.fromId) !== String(user?.id)) {
      map[key].unread++;
    }

    // Track most recent message for sorting
    if (!map[key].last || new Date(msg.timestamp) > new Date(map[key].last.timestamp)) {
      map[key].last = msg;
    }
  });

  return map;
}
