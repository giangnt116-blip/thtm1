import { useState } from 'react';
import { PRACTICE_QUESTIONS } from '../data/week01';
import { QuestionCard } from '../components/QuestionCard';
import { DetectiveStepsCard } from '../components/DetectiveStepsCard';
import { UserAnswerRecord, SkillType } from '../types';
import { MasteryStars } from '../components/MasteryStars';
import { ArrowLeft, Filter, CheckCircle2, Star, Sparkles, BookOpen } from 'lucide-react';

interface PracticeProps {
  answers: Record<string, UserAnswerRecord>;
  onSaveRecord: (rec: UserAnswerRecord) => void;
  onNavigate: (path: string) => void;
}

export function Practice({ answers, onSaveRecord, onNavigate }: PracticeProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Filter questions
  const categories = [
    { id: 'all', label: 'Tất cả 20 câu' },
    { id: 'pattern', label: 'Quy luật (Q1-Q6)' },
    { id: 'observation', label: 'Cấu trúc (Q7)' },
    { id: 'logic', label: 'Cổng Logic (Q8-Q14)' },
    { id: 'machine', label: 'Máy & Chuỗi (Q15-Q20)' },
  ];

  const filteredQuestions = PRACTICE_QUESTIONS.filter((q) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pattern') {
      return ['repeating-pattern', 'numeric-pattern', 'direction-pattern', 'alternating-rule', 'dual-track'].includes(q.skill);
    }
    if (selectedFilter === 'observation') {
      return q.skill === 'structural-observation';
    }
    if (selectedFilter === 'logic') {
      return ['AND', 'OR', 'NOT', 'AND-NOT', 'multiple-AND', 'constraints'].includes(q.skill);
    }
    if (selectedFilter === 'machine') {
      return ['rule-machine', 'transformation'].includes(q.skill) || q.id === 'Q20';
    }
    return true;
  });

  // Calculate practice stats
  const completedCount = Object.values(answers).filter((a) => a.isCorrect).length;
  const totalStars = Object.values(answers).reduce((acc, curr) => acc + (curr.starsEarned || 0), 0);

  const currentQ = filteredQuestions[activeQuestionIndex] || filteredQuestions[0] || PRACTICE_QUESTIONS[0];
  const currentRecord = answers[currentQ.id];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('/')}
          className="px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang chủ</span>
        </button>

        {/* Counters banner */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs md:text-sm font-black flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Đã hoàn thành: {completedCount}/20</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs md:text-sm font-black flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Tổng sao: {totalStars}/60</span>
          </div>
        </div>
      </div>

      <DetectiveStepsCard />

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Lọc bài:
        </span>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedFilter(cat.id);
              setActiveQuestionIndex(0);
            }}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedFilter === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Quick Question Picker Dots/Buttons */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Danh sách câu hỏi:</span>
          <span>Chọn câu để mở</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredQuestions.map((q, idx) => {
            const isDone = answers[q.id]?.isCorrect;
            const stars = answers[q.id]?.starsEarned || 0;
            const isSelected = idx === activeQuestionIndex;

            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIndex(idx)}
                className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105 ring-2 ring-blue-300'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{q.id}</span>
                {isDone && (
                  <span className="text-[10px] text-amber-500 leading-none">
                    {'★'.repeat(stars)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Question Card */}
      {currentQ && (
        <div className="space-y-4">
          <QuestionCard
            question={currentQ}
            existingRecord={currentRecord}
            onSaveRecord={onSaveRecord}
            index={activeQuestionIndex}
            totalQuestions={filteredQuestions.length}
          />

          {/* Bottom Next/Prev buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeQuestionIndex === 0}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              ← Câu trước
            </button>

            <span className="text-xs font-semibold text-slate-500">
              Câu {activeQuestionIndex + 1} / {filteredQuestions.length}
            </span>

            <button
              onClick={() =>
                setActiveQuestionIndex((prev) =>
                  Math.min(filteredQuestions.length - 1, prev + 1)
                )
              }
              disabled={activeQuestionIndex === filteredQuestions.length - 1}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              Câu tiếp theo →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
