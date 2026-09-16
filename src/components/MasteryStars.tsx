import { Star } from 'lucide-react';

interface MasteryStarsProps {
  stars: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function MasteryStars({ stars, maxStars = 3, size = 'md', showLabel = false }: MasteryStarsProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const getLabel = () => {
    if (stars === 3) return 'Tuyệt đỉnh (3/3 ⭐)';
    if (stars === 2) return 'Rất giỏi (2/3 ⭐)';
    if (stars === 1) return 'Đã vượt qua (1/3 ⭐)';
    return 'Chưa có sao';
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStars }).map((_, idx) => {
          const filled = idx < stars;
          return (
            <Star
              key={idx}
              className={`${sizeClasses[size]} transition-all duration-300 ${
                filled
                  ? 'fill-amber-400 text-amber-400 drop-shadow-xs scale-105'
                  : 'text-slate-200 fill-slate-100'
              }`}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-600 ml-1">{getLabel()}</span>
      )}
    </div>
  );
}
