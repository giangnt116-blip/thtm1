import { useState, useEffect } from 'react';
import { CHALLENGE_QUESTIONS } from '../data/week01';
import { ChallengeRecord, ConfidenceLevel, ChallengeQuestion } from '../types';
import { checkAnswer, getChallengeGrade } from '../utils/scoring';
import { triggerBigWinConfetti, triggerSmallWinConfetti } from '../utils/confetti';
import { storage } from '../utils/storage';
import { ConfidenceCheck } from '../components/ConfidenceCheck';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Wrench,
  Lock,
  ChevronRight,
  HelpCircle,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ChallengeProps {
  onNavigate: (path: string) => void;
  savedChallenge: ChallengeRecord | null;
  onSaveChallenge: (record: ChallengeRecord) => void;
}

export function Challenge({ onNavigate, savedChallenge, onSaveChallenge }: ChallengeProps) {
  // Check if Mission 3 (Robot) is completed
  const isRobotCompleted =
    localStorage.getItem('week01.missions.machine.completed') === 'true' ||
    localStorage.getItem('week01.missions.robot.completed') === 'true' ||
    localStorage.getItem('week01.machine.completed') === 'true' ||
    localStorage.getItem('week01.robot.completed') === 'true' ||
    localStorage.getItem('week01.badges.ky_su_nhi') === 'true';

  // Read existing challenge state from storage or props
  const existingChallenge = savedChallenge || storage.getChallenge();
  const initialCompleted = existingChallenge?.completed === true;

  const [mode, setMode] = useState<'start' | 'test' | 'results'>(
    initialCompleted ? 'results' : 'start'
  );

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [userMulti, setUserMulti] = useState<Record<string, string[]>>({});
  const [confidences, setConfidences] = useState<Record<string, ConfidenceLevel>>({});
  const [finalScore, setFinalScore] = useState<number>(existingChallenge?.score || 0);
  const [answersState, setAnswersState] = useState<ChallengeRecord['answers']>(
    existingChallenge?.answers || {}
  );
  const [repairsState, setRepairsState] = useState<Record<string, { used: boolean; success: boolean }>>(
    () => {
      try {
        const raw = localStorage.getItem('week01.challenge.repairs');
        return raw ? JSON.parse(raw) : existingChallenge?.repairs || {};
      } catch {
        return existingChallenge?.repairs || {};
      }
    }
  );

  // Repair mode state
  const [repairQId, setRepairQId] = useState<string | null>(null);
  const [repairInput, setRepairInput] = useState<string>('');
  const [repairMulti, setRepairMulti] = useState<string[]>([]);
  const [repairStep, setRepairStep] = useState<'drill' | 'drill_passed' | 'retry_challenge'>('drill');
  const [retryInput, setRetryInput] = useState<string>('');
  const [retryMulti, setRetryMulti] = useState<string[]>([]);
  const [retryFeedback, setRetryFeedback] = useState<string | null>(null);

  // Week completion modal view
  const [showWeekCompletedModal, setShowWeekCompletedModal] = useState<boolean>(false);

  // Active question in test mode
  const currentQ: ChallengeQuestion = CHALLENGE_QUESTIONS[currentIdx];

  // Populate answer records if loaded from existing
  useEffect(() => {
    if (existingChallenge && existingChallenge.completed) {
      setFinalScore(existingChallenge.score);
      setAnswersState(existingChallenge.answers);
      if (existingChallenge.repairs) {
        setRepairsState(existingChallenge.repairs);
      }
    }
  }, [existingChallenge]);

  // Handle single choice selection
  const handleSelectOption = (qId: string, opt: string) => {
    setUserInputs((prev) => ({ ...prev, [qId]: opt }));
  };

  // Handle multi-select toggle
  const handleToggleMulti = (qId: string, val: string) => {
    const list = userMulti[qId] || [];
    if (list.includes(val)) {
      setUserMulti((prev) => ({ ...prev, [qId]: list.filter((i) => i !== val) }));
    } else {
      setUserMulti((prev) => ({ ...prev, [qId]: [...list, val] }));
    }
  };

  // Check if current question has an answer recorded
  const hasCurrentAnswer = () => {
    if (currentQ.type === 'multi-select') {
      return (userMulti[currentQ.id] || []).length > 0;
    }
    return !!userInputs[currentQ.id];
  };

  // Submit test and calculate final scores
  const handleFinishChallenge = () => {
    let correctCount = 0;
    const answersRecord: ChallengeRecord['answers'] = {};
    const misconceptions: string[] = [];

    CHALLENGE_QUESTIONS.forEach((q) => {
      let ans = '';
      if (q.type === 'multi-select') {
        ans = (userMulti[q.id] || []).join(', ');
      } else {
        ans = userInputs[q.id] || '';
      }

      const isCorr = checkAnswer(ans, q.answer, q.acceptedAnswers);
      if (isCorr) {
        correctCount += 1;
      } else {
        // Track misconceptions for specific questions
        if (q.id === 'C05') {
          const selectedItems = userMulti[q.id] || [];
          if (!selectedItems.includes('5')) {
            misconceptions.push('or_exactly_one');
            try {
              localStorage.setItem('week01.challenge.C05.misconception', 'or_exactly_one');
            } catch {
              // ignore
            }
          }
        } else if (q.id === 'C08') {
          if (ans === 'Đúng') {
            misconceptions.push('fits_one_example_only');
            try {
              localStorage.setItem('week01.challenge.C08.misconception', 'fits_one_example_only');
            } catch {
              // ignore
            }
          }
        }
      }

      answersRecord[q.id] = {
        userAnswer: ans,
        isCorrect: isCorr,
        confidence: confidences[q.id] || 'confident',
      };
    });

    const score = correctCount * 10;

    // Categorize into 3 skill zones
    const patternQuestions = CHALLENGE_QUESTIONS.filter((q) => q.category === 'pattern');
    const logicQuestions = CHALLENGE_QUESTIONS.filter((q) => q.category === 'logic');
    const machineQuestions = CHALLENGE_QUESTIONS.filter((q) => q.category === 'machine');

    const skillResults = {
      pattern: {
        total: patternQuestions.length,
        correct: patternQuestions.filter((q) => answersRecord[q.id]?.isCorrect).length,
      },
      logic: {
        total: logicQuestions.length,
        correct: logicQuestions.filter((q) => answersRecord[q.id]?.isCorrect).length,
      },
      machine: {
        total: machineQuestions.length,
        correct: machineQuestions.filter((q) => answersRecord[q.id]?.isCorrect).length,
      },
    };

    const record: ChallengeRecord = {
      completed: true,
      score,
      answers: answersRecord,
      completedAt: Date.now(),
      repairs: repairsState,
      skillResults,
      misconceptions,
    };

    // Save into localStorage as requested
    try {
      localStorage.setItem('week01.challenge.completed', 'true');
      localStorage.setItem('week01.challenge.score', score.toString());
      localStorage.setItem('week01.challenge.answers', JSON.stringify(answersRecord));
      localStorage.setItem('week01.challenge.repairs', JSON.stringify(repairsState));
      localStorage.setItem('week01.challenge.skillResults', JSON.stringify(skillResults));
      localStorage.setItem('week01.badges.tham_tu_quy_luat', 'true');
    } catch (e) {
      console.warn('LocalStorage challenge save error', e);
    }

    setFinalScore(score);
    setAnswersState(answersRecord);
    setMode('results');
    onSaveChallenge(record);
    triggerBigWinConfetti();
  };

  // Retake challenge from scratch
  const handleRetake = () => {
    setCurrentIdx(0);
    setUserInputs({});
    setUserMulti({});
    setConfidences({});
    setMode('test');
  };

  // Open Repair Mode for a specific question
  const openRepairMode = (qId: string) => {
    setRepairQId(qId);
    setRepairInput('');
    setRepairMulti([]);
    setRepairStep('drill');
    setRetryInput('');
    setRetryMulti([]);
    setRetryFeedback(null);
  };

  // Close Repair Mode
  const closeRepairMode = () => {
    setRepairQId(null);
    setRepairInput('');
    setRepairMulti([]);
    setRepairStep('drill');
    setRetryInput('');
    setRetryMulti([]);
    setRetryFeedback(null);
  };

  // Handle Repair Drill answer check
  const handleCheckRepairDrill = () => {
    if (!repairQId) return;
    const q = CHALLENGE_QUESTIONS.find((item) => item.id === repairQId);
    if (!q || !q.repairAnswer) return;

    let ans = '';
    if (q.repairType === 'multi-select') {
      ans = repairMulti.join(', ');
    } else {
      ans = repairInput;
    }

    const isCorr = checkAnswer(ans, q.repairAnswer, q.repairAcceptedAnswers);
    if (isCorr) {
      triggerSmallWinConfetti();
      setRepairStep('drill_passed');
    } else {
      // Gentle hint feedback
      setRetryFeedback('Chưa hoàn toàn khớp rồi, con thử xem lại kỹ nhé!');
      setTimeout(() => setRetryFeedback(null), 3000);
    }
  };

  // Handle Retrying the main Challenge Question after passing repair
  const handleCheckRetryChallenge = () => {
    if (!repairQId) return;
    const q = CHALLENGE_QUESTIONS.find((item) => item.id === repairQId);
    if (!q) return;

    let ans = '';
    if (q.type === 'multi-select') {
      ans = retryMulti.join(', ');
    } else {
      ans = retryInput;
    }

    const isCorr = checkAnswer(ans, q.answer, q.acceptedAnswers);
    if (isCorr) {
      triggerBigWinConfetti();
      // Update answersState
      const updatedAnswers = {
        ...answersState,
        [q.id]: {
          userAnswer: ans,
          isCorrect: true,
          confidence: 'confident' as ConfidenceLevel,
        },
      };

      // Mark repair success
      const updatedRepairs = {
        ...repairsState,
        [q.id]: { used: true, success: true },
      };

      // Recalculate score
      const newScore = Math.min(100, finalScore + 10);
      setFinalScore(newScore);
      setAnswersState(updatedAnswers);
      setRepairsState(updatedRepairs);

      // Persist to localStorage
      try {
        localStorage.setItem('week01.challenge.score', newScore.toString());
        localStorage.setItem('week01.challenge.answers', JSON.stringify(updatedAnswers));
        localStorage.setItem('week01.challenge.repairs', JSON.stringify(updatedRepairs));
      } catch {
        // ignore
      }

      onSaveChallenge({
        completed: true,
        score: newScore,
        answers: updatedAnswers,
        repairs: updatedRepairs,
      });

      // Close repair modal and return to results screen
      closeRepairMode();
    } else {
      setRetryFeedback('Vẫn chưa đúng quy tắc rồi. Con quan sát lại thật kỹ nhé!');
      setTimeout(() => setRetryFeedback(null), 3500);
    }
  };

  // Grade badge configuration
  const grade = getChallengeGrade(finalScore);
  const correctCount = Object.values(answersState).filter((a: any) => Boolean(a?.isCorrect)).length;

  // 1. LOCKED VIEW (If Mission 3 is not done)
  if (!isRobotCompleted) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-4xl mx-auto shadow-sm">
          🔒
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Thử thách Thám tử chưa mở
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto">
            Để sẵn sàng cho 10 thử thách thám tử, con hãy hoàn thành{' '}
            <strong className="text-purple-700">Nhiệm vụ 3: Xưởng Robot</strong> trước nhé!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 max-w-md mx-auto space-y-1 text-left">
          <div className="font-bold text-slate-700">Điều kiện mở khóa:</div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Nhiệm vụ 1: Phòng Quan sát</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Nhiệm vụ 2: Cổng Logic</span>
          </div>
          <div className="flex items-center gap-2 text-purple-700 font-bold">
            <span>⏳</span>
            <span>Nhiệm vụ 3: Xưởng Robot (Đang đợi con hoàn thành)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
          >
            Về Trang chủ
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/sim/machine')}
            className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm cursor-pointer shadow-sm flex items-center gap-2"
          >
            <span>🤖 Đến Xưởng Robot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. START SCREEN (Màn Mở Đầu)
  if (mode === 'start') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang chủ</span>
          </button>
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-black text-xs border border-orange-200">
            Chặng 4 / 4
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-b from-orange-500 via-amber-500 to-amber-600 rounded-3xl p-6 sm:p-10 text-white text-center space-y-5 shadow-lg">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-4xl mx-auto shadow-inner">
            🏆
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Thử thách Thám tử
            </h1>
            <p className="text-base sm:text-lg font-bold text-amber-100">
              10 thử thách mới đang chờ con!
            </p>
          </div>

          <div className="bg-black/15 backdrop-blur-xs rounded-2xl p-4 sm:p-5 max-w-md mx-auto text-xs sm:text-sm font-medium leading-relaxed text-amber-50 space-y-2">
            <p>
              Không cần làm thật nhanh.
              <br />
              Hãy dùng những bí quyết con vừa khám phá nhé.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3 text-[11px] text-amber-200 font-bold border-t border-white/10">
              <span>● 10 câu thử thách</span>
              <span>● Tự do suy nghĩ</span>
              <span>● Không giới hạn giờ</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setCurrentIdx(0);
                setMode('test');
              }}
              className="min-h-[50px] px-8 py-3.5 rounded-2xl bg-white hover:bg-amber-50 active:scale-95 text-slate-900 font-black text-sm sm:text-base shadow-xl flex items-center gap-2.5 mx-auto cursor-pointer transition-transform"
            >
              <span>🚀 Bắt đầu thử thách</span>
              <ArrowRight className="w-5 h-5 text-orange-600" />
            </button>
          </div>
        </div>

        {/* Friendly Guidance Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 text-xs sm:text-sm text-slate-600 space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Lời nhắn gửi thám tử nhí:</span>
          </div>
          <p className="leading-relaxed">
            Các câu đố này kết hợp kỹ năng của cả 3 nhiệm vụ: <strong>Quan sát chu kỳ</strong>,{' '}
            <strong>Kiểm tra cổng logic</strong> và <strong>Đoán quy tắc robot</strong>. Con có thể
            xem lại từng câu trước khi quyết định nộp bài.
          </p>
        </div>
      </div>
    );
  }

  // 3. ACTIVE TEST MODE
  if (mode === 'test') {
    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn pb-16">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang chủ</span>
          </button>

          <div className="text-xs font-black text-slate-500">
            Con đang ở câu <span className="text-orange-600 font-black">{currentIdx + 1}</span>/10
          </div>
        </div>

        {/* Progress step dots (● ● ● ○ ○ ○ ○ ○ ○ ○) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
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
                  className={`h-4 sm:h-5 flex-1 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                    isCurrent
                      ? 'bg-orange-500 ring-3 ring-orange-200 scale-105'
                      : answered
                      ? 'bg-blue-600 text-white text-[10px]'
                      : 'bg-slate-100 border border-slate-200 text-slate-400 text-[10px]'
                  }`}
                  title={`Câu ${idx + 1}: ${answered ? 'Đã ghi' : 'Chưa làm'}`}
                >
                  <span className="sr-only">Câu {idx + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
            <span>Bắt đầu</span>
            <span className="font-bold text-slate-600">Câu 10: 👑 Boss</span>
          </div>
        </div>

        {/* Main Question Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xs space-y-6">
          {/* Card Top Pill */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-orange-50 text-orange-700 font-black text-xs border border-orange-200">
                Thử thách {currentIdx + 1}
              </span>
              {currentQ.isBoss && (
                <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-xs animate-pulse">
                  👑 BOSS
                </span>
              )}
            </div>

            {/* Answer Recorded Notification */}
            {hasCurrentAnswer() && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>✅ Đã ghi câu trả lời.</span>
              </span>
            )}
          </div>

          {/* Question Prompt */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-xl font-black text-slate-900 leading-relaxed whitespace-pre-line">
              {currentQ.prompt}
            </h2>

            {/* If question has special card visual details (e.g. Câu 9) */}
            {currentQ.cards && currentQ.cards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {currentQ.cards.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-1 shadow-2xs"
                  >
                    <div className="text-xs font-black text-slate-800">Thẻ {c.id}</div>
                    <div className="text-sm font-bold text-slate-900">
                      {c.color} – {c.shape}
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-black text-purple-700">
                      Số: {c.number}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interaction Choices */}
          <div className="space-y-3 pt-2">
            {/* Single Choice Options */}
            {currentQ.type === 'choice' && currentQ.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options.map((opt) => {
                  const isSelected = userInputs[currentQ.id] === opt;

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`min-h-[52px] p-4 rounded-2xl text-left font-bold text-sm sm:text-base border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-950 ring-2 ring-orange-200 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span className="leading-snug">{opt}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs ${
                          isSelected
                            ? 'border-orange-600 bg-orange-600 text-white font-black'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Multi-Select Options */}
            {currentQ.type === 'multi-select' && currentQ.options && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500">
                  👉 Con hãy bấm chọn tất cả các số thỏa mãn:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {currentQ.options.map((opt) => {
                    const isSelected = (userMulti[currentQ.id] || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleToggleMulti(currentQ.id, opt)}
                        className={`min-h-[48px] px-5 py-2.5 rounded-2xl text-sm sm:text-base font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 border-orange-500 text-white shadow-xs scale-105 ring-2 ring-orange-300'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt}</span>
                        <span className="text-xs font-black opacity-90">
                          {isSelected ? '✓' : '+'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Confidence Check */}
          <div className="pt-2 border-t border-slate-100">
            <ConfidenceCheck
              selected={confidences[currentQ.id]}
              onSelect={(lvl) => setConfidences((prev) => ({ ...prev, [currentQ.id]: lvl }))}
            />
          </div>

          {/* Bottom Nav Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm disabled:opacity-30 cursor-pointer"
            >
              ← Câu trước
            </button>

            {currentIdx < CHALLENGE_QUESTIONS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishChallenge}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm cursor-pointer shadow-md flex items-center gap-2 transition-transform hover:scale-105"
              >
                <span>🚀 Hoàn thành thử thách</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. RESULTS SCREEN (Màn Kết Quả)
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang chủ</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
            Hoàn thành Challenge
          </span>
        </div>
      </div>

      {/* Result Hero Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 mx-auto flex items-center justify-center text-3xl shadow-md">
          🏆
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black">
            🎉 Con đã hoàn thành Thử thách Thám tử!
          </h1>
          <p className="text-sm sm:text-base font-bold text-amber-300">
            Con đã vượt qua {correctCount} / 10 thử thách.
          </p>
        </div>

        {/* Score & Grade Display */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <div className="px-5 py-2 rounded-2xl bg-white/15 border border-white/20">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 mr-1.5">
              {finalScore}
            </span>
            <span className="text-xs sm:text-sm text-slate-200 font-bold">/ 100 điểm</span>
          </div>

          <span
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black border shadow-xs ${grade.badgeColor}`}
          >
            {grade.label}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto leading-relaxed">
          {grade.description}
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowWeekCompletedModal(true)}
            className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-md transition-transform hover:scale-105 flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Xem Huy hiệu Week 01</span>
          </button>
          <button
            type="button"
            onClick={handleRetake}
            className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm cursor-pointer border border-white/20 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại từ đầu</span>
          </button>
        </div>
      </div>

      {/* 3 SKILL ZONES BREAKDOWN */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Kết quả theo 3 khu kỹ năng
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Zone 1: Quan sat */}
          {(() => {
            const list = CHALLENGE_QUESTIONS.filter((q) => q.category === 'pattern');
            const passed = list.filter((q) => answersState[q.id]?.isCorrect).length;
            return (
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-black text-blue-900">
                    <span>🔍 Quan sát</span>
                    <span>
                      {passed}/{list.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                    Lặp, bước tăng & chữ số
                  </div>
                </div>
                <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${(passed / list.length) * 100}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Zone 2: Logic */}
          {(() => {
            const list = CHALLENGE_QUESTIONS.filter((q) => q.category === 'logic');
            const passed = list.filter((q) => answersState[q.id]?.isCorrect).length;
            return (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                    <span>🚦 Logic</span>
                    <span>
                      {passed}/{list.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    Cổng VÀ, HOẶC & đa điều kiện
                  </div>
                </div>
                <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${(passed / list.length) * 100}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Zone 3: Robot */}
          {(() => {
            const list = CHALLENGE_QUESTIONS.filter((q) => q.category === 'machine');
            const passed = list.filter((q) => answersState[q.id]?.isCorrect).length;
            return (
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-black text-purple-900">
                    <span>🤖 Robot</span>
                    <span>
                      {passed}/{list.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                    Suy luận, thử giả thuyết & Boss
                  </div>
                </div>
                <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{ width: `${(passed / list.length) * 100}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 10 QUESTIONS REVIEW & REPAIR MODE ACCESS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-base sm:text-lg">
            Chi tiết 10 câu thử thách
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Có thể bấm <strong>Sửa câu</strong> để lấy lại điểm
          </span>
        </div>

        <div className="space-y-3">
          {CHALLENGE_QUESTIONS.map((q, idx) => {
            const rec = answersState[q.id];
            const isCorr = rec?.isCorrect || false;
            const repaired = repairsState[q.id];

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCorr ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800">
                      Câu {idx + 1}
                    </span>
                    {q.isBoss && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                        👑 BOSS
                      </span>
                    )}
                    {repaired?.success && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✨ Đã sửa thành công
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      isCorr ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isCorr ? '✓ Đúng (+10đ)' : '✕ Chưa tìm ra'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-slate-800 whitespace-pre-line mb-2 leading-relaxed">
                  {q.prompt}
                </p>

                {/* If user was correct: gentle explanation */}
                {isCorr ? (
                  <div className="text-xs space-y-1 text-slate-600 bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                    <div>
                      <span className="text-slate-500">Câu trả lời: </span>
                      <span className="font-bold text-emerald-800">{rec?.userAnswer}</span>
                    </div>
                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 italic pt-0.5">
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ) : (
                  /* If user was NOT correct: DO NOT SHOW ANSWER! Show friendly message and Repair Button */
                  <div className="bg-white/90 p-3 rounded-xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-rose-900">
                        Câu này còn một bí mật con chưa tìm ra.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Đừng lo, con có thể làm bài nhỏ để tìm lại bí quyết nhé!
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openRepairMode(q.id)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>🔧 Sửa câu này</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* REPAIR MODE MODAL OVERLAY */}
      {repairQId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          {(() => {
            const rq = CHALLENGE_QUESTIONS.find((q) => q.id === repairQId);
            if (!rq) return null;

            return (
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-black">
                      🔧
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Chế độ Sửa câu – Tìm lại bí quyết
                      </h3>
                      <p className="text-xs text-slate-500">
                        {rq.id} • Dạng bài: {rq.category === 'pattern' ? 'Quan sát' : rq.category === 'logic' ? 'Logic' : 'Robot'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeRepairMode}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Step 1: Mini Drill Question */}
                {repairStep === 'drill' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium leading-relaxed">
                      💡 <strong>Bài luyện nhỏ:</strong> Hãy thử sức với bài toán đơn giản này để
                      nhìn rõ quy tắc nhé!
                    </div>

                    <div className="text-sm sm:text-base font-black text-slate-900 whitespace-pre-line leading-relaxed">
                      {rq.repairPrompt}
                    </div>

                    {/* Options for Drill */}
                    {rq.repairOptions && rq.repairType === 'choice' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {rq.repairOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRepairInput(opt)}
                            className={`min-h-[48px] p-3 rounded-xl font-bold text-xs sm:text-sm border text-left flex items-center justify-between cursor-pointer ${
                              repairInput === opt
                                ? 'bg-orange-50 border-orange-500 text-orange-950 font-black'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt}</span>
                            <span className="text-xs">{repairInput === opt ? '✓' : ''}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {rq.repairOptions && rq.repairType === 'multi-select' && (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs text-slate-500">👉 Chọn tất cả đáp án đúng:</p>
                        <div className="flex flex-wrap gap-2">
                          {rq.repairOptions.map((opt) => {
                            const isSelected = repairMulti.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setRepairMulti(repairMulti.filter((i) => i !== opt));
                                  } else {
                                    setRepairMulti([...repairMulti, opt]);
                                  }
                                }}
                                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                {opt} {isSelected ? '✓' : '+'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {retryFeedback && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 animate-fadeIn">
                        {retryFeedback}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeRepairMode}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Bỏ qua
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckRepairDrill}
                        disabled={
                          (rq.repairType === 'multi-select' && repairMulti.length === 0) ||
                          (!repairInput && rq.repairType !== 'multi-select')
                        }
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs disabled:opacity-40 cursor-pointer shadow-xs"
                      >
                        Kiểm tra bí quyết
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Passed Drill -> Ready to retry challenge */}
                {repairStep === 'drill_passed' && (
                  <div className="space-y-4 animate-fadeIn text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mx-auto shadow-sm">
                      👍
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-black text-slate-900">
                        Con đã tìm lại được bí quyết!
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                        {rq.repairExplanation}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setRepairStep('retry_challenge')}
                        className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm cursor-pointer shadow-md transition-transform hover:scale-105"
                      >
                        Thử lại câu Challenge 🚀
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Retrying original challenge question */}
                {repairStep === 'retry_challenge' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                      🎯 Bây giờ hãy áp dụng bí quyết để chọn lại đáp án cho câu <strong>{rq.id}</strong> nhé!
                    </div>

                    <div className="text-sm sm:text-base font-black text-slate-900 whitespace-pre-line">
                      {rq.prompt}
                    </div>

                    {rq.type === 'choice' && rq.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {rq.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRetryInput(opt)}
                            className={`min-h-[48px] p-3 rounded-xl font-bold text-xs sm:text-sm border text-left flex items-center justify-between cursor-pointer ${
                              retryInput === opt
                                ? 'bg-orange-50 border-orange-500 text-orange-950 font-black'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt}</span>
                            <span className="text-xs">{retryInput === opt ? '✓' : ''}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {rq.type === 'multi-select' && rq.options && (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs text-slate-500">👉 Chọn tất cả số thỏa mãn:</p>
                        <div className="flex flex-wrap gap-2">
                          {rq.options.map((opt) => {
                            const isSelected = retryMulti.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setRetryMulti(retryMulti.filter((i) => i !== opt));
                                  } else {
                                    setRetryMulti([...retryMulti, opt]);
                                  }
                                }}
                                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                {opt} {isSelected ? '✓' : '+'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {retryFeedback && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 animate-fadeIn">
                        {retryFeedback}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeRepairMode}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Để sau
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckRetryChallenge}
                        disabled={
                          (rq.type === 'multi-select' && retryMulti.length === 0) ||
                          (!retryInput && rq.type !== 'multi-select')
                        }
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs disabled:opacity-40 cursor-pointer shadow-xs"
                      >
                        Chốt đáp án & Sửa điểm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* WEEK 01 COMPLETION MODAL */}
      {showWeekCompletedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-md animate-bounce">
              🏆
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                🎉 Con đã hoàn thành Week 01!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                M1 Thinking Lab • Thám tử Quy luật
              </p>
            </div>

            {/* 4 Badges Collection */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-2xl">🦉</div>
                <div className="text-[10px] font-black text-slate-900 mt-1">Mắt Cú</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-2xl">🛡️</div>
                <div className="text-[10px] font-black text-slate-900 mt-1">Người Gác Cổng</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-2xl">⚙️</div>
                <div className="text-[10px] font-black text-slate-900 mt-1">Kỹ Sư Nhí</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-200 border-2 border-amber-400 text-center shadow-xs">
                <div className="text-2xl">🏆</div>
                <div className="text-[10px] font-black text-amber-950 mt-1">Thám tử Quy luật</div>
              </div>
            </div>

            {/* Key takeaways */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 text-left space-y-2">
              <div className="font-bold text-slate-900">Tuần này con đã biết:</div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✅</span>
                <span>Tìm điều đang lặp</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✅</span>
                <span>Kiểm tra từng điều kiện</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✅</span>
                <span>Đoán và thử quy tắc</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowWeekCompletedModal(false);
                  onNavigate('/practice');
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                🔄 Luyện lại kỹ năng
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWeekCompletedModal(false);
                  onNavigate('/');
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Về Trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
