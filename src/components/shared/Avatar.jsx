export function Avatar({ member, size = 12 }) {
  const px = size * 4;
  if (member?.avatarUrl) {
    return (
      <img src={member.avatarUrl} alt={member?.name ?? ''}
        style={{ width: px, height: px, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{ width: px, height: px, borderRadius: 14, flexShrink: 0,
      background: member?.avatarColor ?? '#d5e3fd', color: '#515f74',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size <= 8 ? '0.7rem' : '1rem' }}>
      {member?.initials}
    </div>
  );
}

export function SmAvatar({ member }) {
  if (member?.avatarUrl) {
    return (
      <img src={member.avatarUrl} alt={member?.name ?? ''}
        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: member?.avatarColor ?? '#d5e3fd', color: '#515f74',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '0.7rem' }}>
      {member?.initials}
    </div>
  );
}

export function MemberAvatar({ member, size = 36, ring = false }) {
  const style = {
    width: size, height: size, flexShrink: 0, borderRadius: '50%',
    ...(ring ? { boxShadow: '0 0 0 2px white' } : {}),
  };
  if (member?.avatarUrl) {
    return <img src={member.avatarUrl} alt={member?.name ?? ''} style={{ ...style, objectFit: 'cover' }} />;
  }
  return (
    <div style={{ ...style, background: member?.avatarColor ?? '#d5e3fd', color: '#515f74',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.round(size * 0.36) }}>
      {member?.initials}
    </div>
  );
}