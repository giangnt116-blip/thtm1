import { useState, useEffect } from 'react';
import { Question, UserAnswerRecord, ConfidenceLevel } from '../types';
import { SkillBadge } from './SkillBadge';
import { MasteryStars } from './MasteryStars';
import { HintPanel } from './HintPanel';
import { ConfidenceCheck } from './ConfidenceCheck';
import { checkAnswer, calculateStars } from '../utils/scoring';
import { triggerConfetti } from '../utils/confetti';
import { CheckCircle2, AlertCircle, RotateCcw, Send, Sparkles } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  existingRecord?: UserAnswerRecord;
  onSaveRecord: (record: UserAnswerRecord) => void;
  index: number;
  totalQuestions: number;
}

export function QuestionCard({
  question,
  existingRecord,
  onSaveRecord,
  index,
  totalQuestions,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [hintsUsed, setHintsUsed] = useState<number>(existingRecord?.hintsUsed || 0);
  const [solutionRevealed, setSolutionRevealed] = useState<boolean>(
    existingRecord?.revealedSolution || false
  );
  const [confidence, setConfidence] = useState<ConfidenceLevel | undefined>(
    existingRecord?.confidence
  );
  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'incorrect' | 'partial' | null;
    message: string;
  }>(
    existingRecord
      ? existingRecord.isCorrect
        ? {
            status: 'correct',
            message: 'Chính xác! 🎉 Nhưng quan trọng hơn: em đã tìm ra quy luật.',
          }
        : {
            status: 'incorrect',
            message: 'Chưa đúng rồi 🤔 Hãy kiểm tra lại quy luật.',
          }
      : { status: null, message: '' }
  );
  const [attemptsCount, setAttemptsCount] = useState<number>(
    existingRecord?.attemptsCount || 0
  );
  const [isAnswered, setIsAnswered] = useState<boolean>(!!existingRecord);

  // Sync state if question or existingRecord changes
  useEffect(() => {
    if (existingRecord) {
      if (question.type === 'multi-select') {
        const parts = existingRecord.userAnswer.split(/[, ]+/).map((s) => s.trim());
        setSelectedMulti(parts);
      } else if (question.type === 'choice') {
        setSelectedOption(existingRecord.userAnswer);
      } else {
        setTextInput(existingRecord.userAnswer);
      }
      setHintsUsed(existingRecord.hintsUsed);
      setSolutionRevealed(existingRecord.revealedSolution);
      setConfidence(existingRecord.confidence);
      setAttemptsCount(existingRecord.attemptsCount);
      setIsAnswered(true);
      setFeedback(
        existingRecord.isCorrect
          ? {
              status: 'correct',
              message: 'Chính xác! 🎉 Nhưng quan trọng hơn: em đã tìm ra quy luật.',
            }
          : {
              status: 'incorrect',
              message: 'Chưa đúng rồi 🤔 Hãy kiểm tra lại quy luật.',
            }
      );
    } else {
      setSelectedOption('');
      setSelectedMulti([]);
      setTextInput('');
      setHintsUsed(0);
      setSolutionRevealed(false);
      setConfidence(undefined);
      setAttemptsCount(0);
      setIsAnswered(false);
      setFeedback({ status: null, message: '' });
    }
  }, [question.id, existingRecord]);

  const handleToggleMulti = (opt: string) => {
    if (isAnswered && feedback.status === 'correct') return;
    if (selectedMulti.includes(opt)) {
      setSelectedMulti(selectedMulti.filter((item) => item !== opt));
    } else {
      setSelectedMulti([...selectedMulti, opt]);
    }
  };

  const handleUseHint = (level: number) => {
    const nextLevel = Math.max(hintsUsed, level);
    setHintsUsed(nextLevel);
  };

  const handleRevealSolution = () => {
    setSolutionRevealed(true);
    setHintsUsed(3);
    const newRecord: UserAnswerRecord = {
      questionId: question.id,
      userAnswer: question.answer,
      isCorrect: false,
      hintsUsed: 3,
      revealedSolution: true,
      confidence: confidence || 'confused',
      starsEarned: 0,
      attemptsCount: attemptsCount + 1,
      timestamp: Date.now(),
    };
    onSaveRecord(newRecord);
  };

  const handleSubmitAnswer = () => {
    let finalAnswer = '';
    if (question.type === 'choice') {
      finalAnswer = selectedOption;
    } else if (question.type === 'multi-select') {
      finalAnswer = selectedMulti.join(', ');
    } else {
      finalAnswer = textInput.trim();
    }

    if (!finalAnswer) return;

    const nextAttempts = attemptsCount + 1;
    setAttemptsCount(nextAttempts);

    const isCorrect = checkAnswer(
      finalAnswer,
      question.answer,
      question.acceptedAnswers
    );

    // Partial correctness check for multi-select
    let isPartial = false;
    if (!isCorrect && question.type === 'multi-select' && selectedMulti.length > 0) {
      const correctParts = question.answer.split(/[, ]+/).map((s) => s.trim().toLowerCase());
      const selectedParts = selectedMulti.map((s) => s.trim().toLowerCase());
      const matches = selectedParts.filter((s) => correctParts.includes(s));
      if (matches.length > 0) {
        isPartial = true;
      }
    }

    const stars = calculateStars(
      isCorrect,
      hintsUsed,
      solutionRevealed,
      nextAttempts
    );

    if (isCorrect) {
      setFeedback({
        status: 'correct',
        message: 'Chính xác! 🎉 Nhưng quan trọng hơn: em đã tìm ra quy luật.',
      });
      if (stars === 3) {
        triggerConfetti();
      }
    } else if (isPartial) {
      setFeedback({
        status: 'partial',
        message: 'Em đã tìm đúng một phần. Còn một điều kiện nữa, hãy nhìn kỹ lại nhé! 🤔',
      });
    } else {
      setFeedback({
        status: 'incorrect',
        message: 'Chưa đúng rồi 🤔 Hãy kiểm tra lại quy luật theo 5 bước thám tử.',
      });
    }

    setIsAnswered(true);

    const newRecord: UserAnswerRecord = {
      questionId: question.id,
      userAnswer: finalAnswer,
      isCorrect,
      hintsUsed,
      revealedSolution: solutionRevealed,
      confidence,
      starsEarned: stars,
      attemptsCount: nextAttempts,
      timestamp: Date.now(),
    };

    onSaveRecord(newRecord);
  };

  const handleConfidenceSelect = (level: ConfidenceLevel) => {
    setConfidence(level);
    if (existingRecord) {
      onSaveRecord({
        ...existingRecord,
        confidence: level,
      });
    }
  };

  const handleRetry = () => {
    setSelectedOption('');
    setSelectedMulti([]);
    setTextInput('');
    setIsAnswered(false);
    setFeedback({ status: null, message: '' });
  };

  return (
    <div
      id={`question-${question.id}`}
      className="bg-white rounded-3xl border border-slate-200/90 p-5 md:p-7 shadow-xs transition-all"
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-extrabold text-xs md:text-sm tracking-wider shadow-2xs">
            {question.id}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Câu {index + 1} / {totalQuestions}
          </span>
          <SkillBadge skill={question.skill} />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Độ khó:
            <span className="ml-1 text-amber-500">
              {'★'.repeat(question.difficulty)}
              <span className="text-slate-200">{'★'.repeat(3 - question.difficulty)}</span>
            </span>
          </div>
          <MasteryStars stars={existingRecord?.starsEarned || 0} showLabel={false} />
        </div>
      </div>

      {/* Prompt Area */}
      <div className="mb-6">
        <h3 className="text-base md:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">
          {question.prompt}
        </h3>
      </div>

      {/* Interaction Area based on type */}
      <div className="mb-5">
        {question.type === 'choice' && question.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {question.options.map((opt) => {
              // Option might start with "A. " or "Thẻ A" etc.
              const optClean = opt.replace(/^[A-D]\.\s*/, '').trim();
              const isSelected =
                selectedOption === opt ||
                selectedOption === optClean ||
                (opt.startsWith('A.') && selectedOption === 'A') ||
                (opt.startsWith('B.') && selectedOption === 'B') ||
                (opt.startsWith('C.') && selectedOption === 'C') ||
                (opt.startsWith('D.') && selectedOption === 'D');

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    // For Q07/Q18 where answer is 'D' or 'C', handle cleanly
                    if (question.options?.some((o) => o.startsWith('A.')) && opt.match(/^[A-D]\./)) {
                      setSelectedOption(opt[0]); // pass 'A', 'B', 'C', 'D'
                    } else {
                      setSelectedOption(opt);
                    }
                  }}
                  className={`min-h-[50px] p-3.5 rounded-2xl text-left font-medium text-sm md:text-base border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span>{opt}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
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

        {question.type === 'multi-select' && question.options && (
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">
              👉 Bấm vào các số/thẻ để chọn hoặc bỏ chọn:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {question.options.map((opt) => {
                const isSelected = selectedMulti.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleToggleMulti(opt)}
                    className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-sm md:text-base font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs scale-105'
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
            <div className="mt-2 text-xs text-slate-500">
              Đang chọn:{' '}
              <span className="font-bold text-slate-800">
                {selectedMulti.length > 0 ? selectedMulti.join(', ') : 'Chưa chọn'}
              </span>
            </div>
          </div>
        )}

        {question.type === 'text' && (
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Nhập câu trả lời của em..."
              className="flex-1 min-h-[48px] px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-sm md:text-base font-medium"
            />
          </div>
        )}
      </div>

      {/* Action Submit / Retry Row */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmitAnswer}
          disabled={
            (question.type === 'choice' && !selectedOption) ||
            (question.type === 'multi-select' && selectedMulti.length === 0) ||
            (question.type === 'text' && !textInput.trim())
          }
          className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-sm md:text-base shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Kiểm tra đáp án</span>
        </button>

        {isAnswered && (
          <button
            type="button"
            onClick={handleRetry}
            className="min-h-[46px] px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại bài này</span>
          </button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback.status && (
        <div
          className={`mt-4 p-4 rounded-2xl border text-sm font-medium flex items-start gap-3 animate-fadeIn ${
            feedback.status === 'correct'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : feedback.status === 'partial'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {feedback.status === 'correct' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold">{feedback.message}</p>
            {feedback.status === 'correct' && (
              <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700">
                <span>Số sao nhận được:</span>
                <MasteryStars stars={existingRecord?.starsEarned || 0} showLabel={true} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confidence Check */}
      {isAnswered && (
        <ConfidenceCheck
          selected={confidence}
          onSelect={handleConfidenceSelect}
        />
      )}

      {/* Hint & Solution Panel */}
      <HintPanel
        hints={question.hints}
        hintsUsed={hintsUsed}
        onUseHint={handleUseHint}
        onRevealSolution={handleRevealSolution}
        solutionRevealed={solutionRevealed}
        explanation={question.explanation}
        isSolved={existingRecord?.isCorrect || false}
      />
    </div>
  );
}
