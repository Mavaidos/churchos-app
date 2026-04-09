import { ENROLLMENT_STAGE_COLORS, ENROLLMENT_STAGE_LABELS, STAGE_COLORS, STAGE_ICONS } from '../../lib/constants';

export function StatusBadge({ status, enrollmentStage }) {
  if (enrollmentStage) {
    const cls   = ENROLLMENT_STAGE_COLORS[enrollmentStage] ?? 'bg-surface-container text-on-surface-variant';
    const label = ENROLLMENT_STAGE_LABELS[enrollmentStage] ?? enrollmentStage;
    return <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${cls}`}>{label}</span>;
  }
  return <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${STAGE_COLORS[status] || 'bg-surface-container text-on-surface-variant'}`}>{status}</span>;
}

export function StageBadge({ stageName, stageIndex = 0 }) {
  const icon = STAGE_ICONS[stageIndex] ?? 'star';
  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      <span className="text-xs font-semibold text-tertiary">{stageName} Stage</span>
    </div>
  );
}