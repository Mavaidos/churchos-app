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

  // Direct message — key = direct-{staffUserId}-{memberId}
  if (msg.fromRole === 'member') {
    // Member reply: fromId = member, toId = staff user ID (set by MemberInbox)
    if (msg.toId != null) return `direct-${msg.toId}-${msg.fromId}`;
    // Legacy / unaddressed fallback — treated as unrouted
    return `unrouted-${msg.fromId}`;
  }

  // Staff → member: fromId = staff user, toId = member
  return `direct-${msg.fromId}-${msg.toId}`;
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

  // ── Pastor: full oversight, sees everything ──────────────────────────────
  if (user.role === 'pastor') return messages;

  // ── Admin: broadcasts + group messages + OWN direct threads only ─────────
  if (user.role === 'admin') {
    return messages.filter(msg => {
      if (msg.toType === 'all')   return true;  // broadcasts visible to admin
      if (msg.toType === 'group') return true;  // admin can see all group messages

      if (msg.toType === 'member') {
        // Only threads where admin is the staff side of the conversation
        if (String(msg.fromId) === String(user.id)) return true;
        if (msg.fromRole === 'member' && String(msg.toId) === String(user.id)) return true;
        // Unrouted first contact from a member — admin is the catch-all inbox
        if (msg.fromRole === 'member' && msg.toId == null) return true;
        return false;
      }
      return false;
    });
  }

  // ── Leader: own group threads + own direct threads only ──────────────────
  if (user.role === 'leader') {
    const leaderGroupIds = getLeaderGroupIds(user);

    return messages.filter(msg => {
      // Group messages — only for groups this leader manages
      if (msg.toType === 'group') {
        return leaderGroupIds.includes(msg.toId);
      }

      if (msg.toType === 'member') {
        // Only direct threads this leader personally participated in
        if (String(msg.fromId) === String(user.id)) return true;
        if (msg.fromRole === 'member' && String(msg.toId) === String(user.id)) return true;
        return false;
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
      let name         = '';
      let member       = null;
      let group        = null;
      let resolvedToId = msg.toId;  // will be overridden below for direct threads

      if (msg.toType === 'all') {
        name = 'All Members';

      } else if (msg.toType === 'group') {
        group = groups.find(g => g.id === msg.toId);
        name  = group?.name ?? msg.toName ?? 'Group';

      } else {
        // Direct thread — display the MEMBER's name (staff is always the viewer)
        // member side = fromId when member sent, toId when staff sent
        const mId = msg.fromRole === 'member' ? msg.fromId : msg.toId;
        member       = members.find(m => String(m.id) === String(mId));
        name         = member?.name
          ?? (msg.fromRole === 'member' ? msg.fromName : msg.toName)
          ?? 'Member';
        // toId stored on thread = member's numeric id so replies go to the right person
        resolvedToId = mId != null ? Number(mId) : null;
      }

      map[key] = {
        key, type: msg.toType, toId: resolvedToId,
        name, member, group,
        msgs: [], unread: 0, last: null,
      };
    }

    // If an earlier message had a null toId, patch it once we have the real value
    if (msg.toType === 'member' && map[key].toId == null) {
      const mId = msg.fromRole === 'member' ? msg.fromId : msg.toId;
      if (mId != null) map[key].toId = Number(mId);
    }

    map[key].msgs.push(msg);

    // Unread = not read AND not sent by the current viewer
    if (!msg.read && String(msg.fromId) !== String(user?.id)) {
      map[key].unread++;
    }

    // Most recent message for sorting
    if (!map[key].last || new Date(msg.timestamp) > new Date(map[key].last.timestamp)) {
      map[key].last = msg;
    }
  });

  return map;
}