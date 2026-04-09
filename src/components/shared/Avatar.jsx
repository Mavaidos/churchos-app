export function Avatar({ member, size = 12 }) {
  return (
    <div className={`w-${size} h-${size} rounded-2xl flex items-center justify-center font-bold text-primary`}
      style={{ background: member.avatarColor, fontSize: size <= 8 ? '0.7rem' : '1rem' }}>
      {member.initials}
    </div>
  );
}

export function SmAvatar({ member }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-primary flex-shrink-0"
      style={{ background: member.avatarColor }}>
      {member.initials}
    </div>
  );
}