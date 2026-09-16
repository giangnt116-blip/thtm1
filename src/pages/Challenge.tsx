import { useState, useEffect } from 'react';
import { CHALLENGE_QUESTIONS } from '../data/week01';
import { ChallengeRecord, ConfidenceLevel, ChallengeQuestion } from '../types';
import { checkAnswer, getChallengeGrade } from '../utils/scoring';
import { triggerBigWinConfetti } from '../utils/confetti';
import { storage } from '../utils/storage';
import { ConfidenceCheck } from '../components/ConfidenceCheck';
import { ArrowLeft, Award, Clock, CheckCircle2, RotateCcw, Send, Sparkles, AlertCircle } from 'lucide-react';

interface ChallengeProps {
  onNavigate: (path: string) => void;
  savedChallenge: ChallengeRecord | null;
  onSaveChallenge: (record: ChallengeRecord) => void;
}

export function Challenge({ onNavigate, savedChallenge, onSaveChallenge }: ChallengeProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [userMulti, setUserMulti] = useState<Record<string, string[]>>({});
  const [confidences, setConfidences] = useState<Record<string, ConfidenceLevel>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(savedChallenge?.completed || false);
  const [finalScore, setFinalScore] = useState<number>(savedChallenge?.score || 0);

  // Active question
  const currentQ: ChallengeQuestion = CHALLENGE_QUESTIONS[currentIdx];

  const handleSelectOption = (qId: string, opt: string) => {
    // If option has format "B. C D A B", store 'B' or whole text
    let clean = opt;
    if (opt.match(/^[A-D]\.\s/)) {
      clean = opt[0];
    }
    setUserInputs((prev) => ({ ...prev, [qId]: clean }));
  };

  const handleToggleMulti = (qId: string, val: string) => {
    const list = userMulti[qId] || [];
    if (list.includes(val)) {
      setUserMulti((prev) => ({ ...prev, [qId]: list.filter((i) => i !== val) }));
    } else {
      setUserMulti((prev) => ({ ...prev, [qId]: [...list, val] }));
    }
  };

  const handleConfidence = (qId: string, level: ConfidenceLevel) => {
    setConfidences((prev) => ({ ...prev, [qId]: level }));
  };

  const handleFinishChallenge = () => {
    let correctCount = 0;
    const answersRecord: ChallengeRecord['answers'] = {};

    CHALLENGE_QUESTIONS.forEach((q) => {
      let ans = '';
      if (q.type === 'multi-select') {
        ans = (userMulti[q.id] || []).join(', ');
      } else {
        ans = userInputs[q.id] || '';
      }

      const isCorr = checkAnswer(ans, q.answer, q.acceptedAnswers);
      if (isCorr) correctCount += 1;

      answersRecord[q.id] = {
        userAnswer: ans,
        isCorrect: isCorr,
        confidence: confidences[q.id] || 'guessing',
      };
    });

    const score = correctCount * 10;
    const record: ChallengeRecord = {
      completed: true,
      score,
      answers: answersRecord,
      completedAt: Date.now(),
    };

    setFinalScore(score);
    setIsCompleted(true);
    onSaveChallenge(record);
    triggerBigWinConfetti();
  };

  const handleRetake = () => {
    setIsCompleted(false);
    setCurrentIdx(0);
    setUserInputs({});
    setUserMulti({});
    setConfidences({});
  };

  // Check if current question has an answer provided
  const hasCurrentAnswer = () => {
    if (currentQ.type === 'multi-select') {
      return (userMulti[currentQ.id] || []).length > 0;
    }
    return !!userInputs[currentQ.id];
  };

  const grade = getChallengeGrade(finalScore);

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

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black border border-orange-200 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Mini Challenge 01 • 10 Câu</span>
          </span>
        </div>
      </div>

      {/* When completed: Result Board */}
      {isCompleted ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Trophy Header */}
          <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 md:p-10 shadow-xl text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 mx-auto flex items-center justify-center text-4xl shadow-lg animate-bounce">
              🏆
            </div>

            <h2 className="text-2xl md:text-3xl font-black">
              Hoàn thành Mini Challenge 01!
            </h2>

            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-white/15 border border-white/20">
              <span className="text-3xl md:text-5xl font-black text-amber-300">
                {finalScore}
              </span>
              <span className="text-sm md:text-base font-bold text-slate-200">
                / 100 điểm ({finalScore / 10}/10 câu đúng)
              </span>
            </div>

            {/* Classification Badge */}
            <div className="pt-2">
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-black border ${grade.badgeColor}`}
              >
                Xếp loại: {grade.label}
              </span>
              <p className="text-xs md:text-sm text-blue-100 max-w-md mx-auto mt-2 leading-relaxed">
                {grade.description}
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer shadow-md transition-transform hover:scale-105"
              >
                Làm lại Thách đấu để cải thiện
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/progress')}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm cursor-pointer border border-white/20"
              >
                Xem Bảng tiến độ
              </button>
            </div>
          </div>

          {/* Breakdown Review of 10 Questions */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 space-y-4">
            <h3 className="font-black text-slate-900 text-base md:text-lg">
              Chi tiết bài làm từng câu:
            </h3>

            <div className="space-y-3">
              {CHALLENGE_QUESTIONS.map((q, idx) => {
                const rec = savedChallenge?.answers[q.id];
                const isCorr = rec?.isCorrect || false;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCorr
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800">
                          {q.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          Kỹ năng: {q.skill}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                          isCorr
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorr ? '✓ Đúng (+10đ)' : '✕ Chưa đúng'}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm font-bold text-slate-800 whitespace-pre-line mb-2">
                      {q.prompt}
                    </p>

                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-slate-500">Câu trả lời của em: </span>
                        <span className="font-bold text-slate-800">
                          {rec?.userAnswer || '(Bỏ trống)'}
                        </span>
                      </div>
                      {!isCorr && (
                        <div>
                          <span className="text-slate-500">Đáp án chính xác: </span>
                          <span className="font-bold text-emerald-700">{q.answer}</span>
                        </div>
                      )}
                      {q.explanation && (
                        <div className="text-slate-600 pt-1 text-[11px] italic">
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Active Challenge Test Mode */
        <div className="space-y-6">
          {/* Banner */}
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex items-center justify-between text-xs md:text-sm text-orange-900 font-bold">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span>Đấu trường Thách đấu M1: Tự lực làm bài, không có gợi ý!</span>
            </div>
            <span>Câu {currentIdx + 1}/10</span>
          </div>

          {/* Progress step dots */}
          <div className="flex items-center justify-between gap-1">
            {CHALLENGE_QUESTIONS.map((q, idx) => {
              const answered =
                (q.type === 'multi-select' && (userMulti[q.id] || []).length > 0) ||
                !!userInputs[q.id];
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-2.5 flex-1 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-orange-500 scale-y-150'
                      : answered
                      ? 'bg-blue-600'
                      : 'bg-slate-200'
                  }`}
                  title={`${q.id} (Bấm để nhảy đến)`}
                />
              );
            })}
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="px-3 py-1 rounded-xl bg-orange-600 text-white font-black text-sm">
                {currentQ.id}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Câu {currentIdx + 1} trong 10 câu
              </span>
            </div>

            {/* Prompt */}
            <h3 className="text-base md:text-xl font-black text-slate-900 leading-relaxed whitespace-pre-line">
              {currentQ.prompt}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.type === 'choice' && currentQ.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.options.map((opt) => {
                    const isSelected =
                      userInputs[currentQ.id] === opt ||
                      (opt.match(/^[A-D]\.\s/) && userInputs[currentQ.id] === opt[0]);

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`min-h-[50px] p-3.5 rounded-2xl text-left font-bold text-sm md:text-base border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                            isSelected
                              ? 'border-orange-600 bg-orange-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'multi-select' && currentQ.options && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">
                    👉 Bấm chọn tất cả các số thỏa mãn:
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {currentQ.options.map((opt) => {
                      const isSelected = (userMulti[currentQ.id] || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleToggleMulti(currentQ.id, opt)}
                          className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-sm md:text-base font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-orange-500 border-orange-500 text-white shadow-xs scale-105'
                              : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className="text-xs opacity-80">
                            {isSelected ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Check for Challenge */}
            <ConfidenceCheck
              selected={confidences[currentQ.id]}
              onSelect={(lvl) => handleConfidence(currentQ.id, lvl)}
            />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs md:text-sm disabled:opacity-40 cursor-pointer"
              >
                ← Câu trước
              </button>

              {currentIdx < CHALLENGE_QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm cursor-pointer shadow-xs"
                >
                  Câu tiếp theo →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishChallenge}
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm cursor-pointer shadow-md flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                  <span>Nộp bài & Xem điểm</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
