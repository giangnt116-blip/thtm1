import { useState } from 'react';
import { Lightbulb, Eye, AlertCircle, ChevronRight, Lock } from 'lucide-react';

interface HintPanelProps {
  hints: [string, string, string];
  hintsUsed: number;
  onUseHint: (level: number) => void;
  onRevealSolution: () => void;
  solutionRevealed: boolean;
  explanation: string;
  isSolved: boolean;
}

export function HintPanel({
  hints,
  hintsUsed,
  onUseHint,
  onRevealSolution,
  solutionRevealed,
  explanation,
  isSolved,
}: HintPanelProps) {
  const [showConfirmSolution, setShowConfirmSolution] = useState(false);

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 mt-4 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              💡 Con đang bí? ({hintsUsed}/3)
            </h4>
            <p className="text-xs text-slate-500">
              Cố gắng tự suy luận trước khi mở gợi ý để giành đủ 3 ⭐ nhé!
            </p>
          </div>
        </div>
      </div>

      {/* Render already unlocked hints */}
      <div className="space-y-2 mb-3">
        {hintsUsed >= 1 && (
          <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs md:text-sm text-slate-800 animate-fadeIn flex gap-2">
            <span className="font-bold text-amber-700 shrink-0">1. Gợi ý nhỏ:</span>
            <span>{hints[0]}</span>
          </div>
        )}

        {hintsUsed >= 2 && (
          <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs md:text-sm text-slate-800 animate-fadeIn flex gap-2">
            <span className="font-bold text-amber-700 shrink-0">2. Gợi ý thêm:</span>
            <span>{hints[1]}</span>
          </div>
        )}

        {hintsUsed >= 3 && (
          <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs md:text-sm text-slate-800 animate-fadeIn flex gap-2">
            <span className="font-bold text-amber-700 shrink-0">3. Cùng làm một bước nhé:</span>
            <span>{hints[2]}</span>
          </div>
        )}
      </div>

      {/* Buttons to unlock next hint */}
      <div className="flex flex-wrap items-center gap-2">
        {hintsUsed === 0 && (
          <button
            onClick={() => onUseHint(1)}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs md:text-sm transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Mở: 1. Gợi ý nhỏ</span>
          </button>
        )}

        {hintsUsed === 1 && (
          <button
            onClick={() => onUseHint(2)}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs md:text-sm transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Mở: 2. Gợi ý thêm</span>
          </button>
        )}

        {hintsUsed === 2 && (
          <button
            onClick={() => onUseHint(3)}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs md:text-sm transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Mở: 3. Cùng làm một bước nhé</span>
          </button>
        )}

        {/* After Hint 3: allow solution */}
        {hintsUsed >= 3 && !solutionRevealed && !isSolved && (
          <>
            {!showConfirmSolution ? (
              <button
                onClick={() => setShowConfirmSolution(true)}
                className="px-3.5 py-2 min-h-[44px] rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium text-xs md:text-sm transition-colors flex items-center gap-1.5 border border-rose-200 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Xem lời giải chi tiết</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span className="text-xs text-rose-700">
                  Lưu ý: Mở lời giải sẽ không nhận sao ở bài này!
                </span>
                <button
                  onClick={() => {
                    onRevealSolution();
                    setShowConfirmSolution(false);
                  }}
                  className="px-3 py-1.5 min-h-[40px] rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  Vẫn xem
                </button>
                <button
                  onClick={() => setShowConfirmSolution(false)}
                  className="px-2.5 py-1.5 min-h-[40px] text-xs text-slate-600 hover:text-slate-900"
                >
                  Thử nghĩ tiếp
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Show solution / explanation if student solved or revealed */}
      {(solutionRevealed || isSolved) && (
        <div className="mt-3 p-3.5 bg-blue-50/90 rounded-xl border border-blue-200 text-xs md:text-sm text-slate-800 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-blue-800 mb-1">
            <Eye className="w-4 h-4" />
            <span>Giải thích bí quyết của Thám tử:</span>
          </div>
          <div className="leading-relaxed pl-6">{explanation}</div>
        </div>
      )}
    </div>
  );
}
