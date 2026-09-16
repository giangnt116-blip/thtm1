import { UserAnswerRecord, ChallengeRecord, SkillType } from '../types';
import { calculateSkillMastery } from '../utils/scoring';
import { storage } from '../utils/storage';
import { ArrowLeft, Award, Star, CheckCircle2, BookOpen, Cpu, Sparkles, Trophy, Bookmark } from 'lucide-react';

interface ProgressProps {
  answers: Record<string, UserAnswerRecord>;
  challenge: ChallengeRecord | null;
  onNavigate: (path: string) => void;
}

export function Progress({ answers, challenge, onNavigate }: ProgressProps) {
  const completedLessons = storage.getCompletedLessons();
  const exploredSims = storage.getExploredSimulations();
  const reflections = storage.getReflections();

  const skillAnalytics = calculateSkillMastery(answers);
  const practiceCount = Object.values(answers).filter((a) => a.isCorrect).length;
  const totalStars = Object.values(answers).reduce((acc, curr) => acc + (curr.starsEarned || 0), 0);

  // Overall Week 01 calculation
  const lessonProgress = (completedLessons.length / 3) * 20; // 20%
  const simProgress = (exploredSims.length / 3) * 20; // 20%
  const practiceProgress = (practiceCount / 20) * 40; // 40%
  const challengeProgress = challenge?.completed ? ((challenge.score || 0) / 100) * 20 : 0; // 20%

  const overallMastery = Math.min(
    100,
    Math.round(lessonProgress + simProgress + practiceProgress + challengeProgress)
  );

  const skillsList: { key: SkillType; label: string }[] = [
    { key: 'repeating-pattern', label: '1. Quy luật lặp' },
    { key: 'numeric-pattern', label: '2. Quy luật số tăng/giảm' },
    { key: 'direction-pattern', label: '3. Hướng xoay & Chiều' },
    { key: 'alternating-rule', label: '4. Hai quy tắc xen kẽ' },
    { key: 'dual-track', label: '5. Hai quy luật song song (Dual Track)' },
    { key: 'AND', label: '6. Cổng AND (VÀ)' },
    { key: 'OR', label: '7. Cổng OR (HOẶC)' },
    { key: 'NOT', label: '8. Cổng NOT (KHÔNG)' },
    { key: 'rule-machine', label: '9. Suy ra Input → Output' },
    { key: 'constraints', label: '10. Ràng buộc & Giả thuyết' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang chủ</span>
        </button>

        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black border border-blue-200 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" />
          <span>Bảng tiến độ & Thành tích</span>
        </span>
      </div>

      {/* Main Overall Progress Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 md:p-8 rounded-3xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Đánh giá tổng quan Week 01:
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-1">
              Độ thành thạo thám tử: {overallMastery}%
            </h1>
            <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-lg">
              Kết hợp từ việc học lý thuyết, thực hành mô phỏng, làm 20 bài luyện và kết quả thi Thách đấu.
            </p>
          </div>

          <div className="w-24 h-24 rounded-full border-4 border-amber-400 bg-white/10 flex flex-col items-center justify-center font-black">
            <span className="text-2xl text-amber-300">{overallMastery}%</span>
            <span className="text-[10px] text-blue-200 uppercase">Mastery</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3.5 bg-black/20 rounded-full mt-6 overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${overallMastery}%` }}
          />
        </div>
      </div>

      {/* 4 Pillars Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>3 Bài giảng</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {completedLessons.length}/3
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>3 Mô phỏng</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {exploredSims.length}/3
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Sao tích lũy</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {totalStars}/60 ⭐
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
            <Award className="w-4 h-4 text-orange-500" />
            <span>Mini Challenge</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {challenge?.completed ? `${challenge.score}/100` : 'Chưa thi'}
          </div>
        </div>
      </div>

      {/* 10 Skill Competency Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-black text-slate-900">
            📊 Phân tích năng lực 10 kỹ năng trọng tâm:
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Dựa trên kết quả bài làm
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {skillsList.map((sk) => {
            const stat = skillAnalytics[sk.key] || { correct: 0, total: 1, percent: 0 };
            const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;

            return (
              <div key={sk.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{sk.label}</span>
                  <span
                    className={
                      pct >= 80
                        ? 'text-emerald-600'
                        : pct >= 50
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }
                  >
                    {stat.correct}/{stat.total} câu đúng ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 80
                        ? 'bg-emerald-500'
                        : pct >= 50
                        ? 'bg-amber-400'
                        : pct > 0
                        ? 'bg-blue-400'
                        : 'bg-slate-200'
                    }`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sổ tay Thám tử (Reflections) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-orange-600" />
          <h2 className="text-base md:text-lg font-black text-slate-900">
            Sổ tay ghi chép thám tử (Phản tư sau mô phỏng)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
            <span className="text-xs font-bold text-blue-900 block mb-1">
              🔍 Phòng Pattern Lab:
            </span>
            <p className="text-xs text-slate-700 italic">
              {reflections['pattern'] || 'Chưa có ghi chép. Hãy vào phòng mô phỏng để ghi lại phát hiện của em!'}
            </p>
          </div>

          <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100">
            <span className="text-xs font-bold text-orange-900 block mb-1">
              🚦 Cổng Logic Gate:
            </span>
            <p className="text-xs text-slate-700 italic">
              {reflections['logic'] || 'Chưa có ghi chép. Hãy vào phòng mô phỏng để ghi lại phát hiện của em!'}
            </p>
          </div>

          <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100">
            <span className="text-xs font-bold text-purple-900 block mb-1">
              🤖 Secret Rule Machine:
            </span>
            <p className="text-xs text-slate-700 italic">
              {reflections['machine'] || 'Chưa có ghi chép. Hãy vào phòng mô phỏng để ghi lại phát hiện của em!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
