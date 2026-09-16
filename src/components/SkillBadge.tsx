import { SkillType } from '../types';
import { SKILL_LABELS } from '../data/week01';

interface SkillBadgeProps {
  skill: SkillType;
  showCategory?: boolean;
}

export function SkillBadge({ skill, showCategory = false }: SkillBadgeProps) {
  const meta = SKILL_LABELS[skill] || {
    name: skill,
    category: 'Tổng hợp',
    color: 'slate',
  };

  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const style = colorStyles[meta.color] || colorStyles.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      {showCategory && (
        <span className="opacity-70 font-medium">[{meta.category}]</span>
      )}
      <span>{meta.name}</span>
    </span>
  );
}
