import { ConfidenceLevel } from '../types';

interface ConfidenceCheckProps {
  selected?: ConfidenceLevel;
  onSelect: (level: ConfidenceLevel) => void;
  disabled?: boolean;
}

export function ConfidenceCheck({ selected, onSelect, disabled = false }: ConfidenceCheckProps) {
  const options: Array<{ level: ConfidenceLevel; label: string; icon: string; style: string }> = [
    {
      level: 'confident',
      label: 'Em chắc chắn',
      icon: '😎',
      style: 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800',
    },
    {
      level: 'guessing',
      label: 'Em hơi đoán',
      icon: '🤔',
      style: 'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800',
    },
    {
      level: 'confused',
      label: 'Em chưa hiểu',
      icon: '😵',
      style: 'hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800',
    },
  ];

  return (
    <div className="mt-4 p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
      <p className="text-xs md:text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
        <span>💬</span>
        <span>Em cảm thấy thế nào với câu này?</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const isChosen = selected === opt.level;
          return (
            <button
              key={opt.level}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(opt.level)}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs md:text-sm font-medium border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isChosen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : `bg-slate-50 text-slate-700 border-slate-200 ${opt.style}`
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="text-base">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
