import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw, Lightbulb, Star, Award, ShieldCheck, HeartHandshake } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { storage } from '../utils/storage';

interface PatternSimulatorProps {
  onNavigate?: (path: string) => void;
}

export function PatternSimulator({ onNavigate }: PatternSimulatorProps) {
  // Current screen: 0 = Intro, 1..5 = Stages 1 to 5, 6 = Celebration
  const [currentStage, setCurrentStage] = useState<number>(() => {
    // Check if stage was saved or start at intro
    return 0;
  });

  // Tracking for all 5 stages
  const [stageStars, setStageStars] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('week01.pattern.stars');
    return saved ? JSON.parse(saved) : {};
  });

  const [stageCompleted, setStageCompleted] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('week01.pattern.stages_done');
    return saved ? JSON.parse(saved) : {};
  });

  // Hints state
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);

  // Confidence checks (after stage 3 and stage 5)
  const [confidenceStage3, setConfidenceStage3] = useState<string | null>(null);
  const [confidenceStage5, setConfidenceStage5] = useState<string | null>(null);
  const [showConfidenceModal, setShowConfidenceModal] = useState<boolean>(false);

  // STAGE 1 STATE: Two Colors Alternate
  // 🔴 🔵 🔴 🔵 🔴 ?
  const [s1Selected, setS1Selected] = useState<string | null>(null);
  const [s1Feedback, setS1Feedback] = useState<string | null>(null);
  const [s1Correct, setS1Correct] = useState<boolean>(false);

  // STAGE 2 STATE: Find Repeating Chunk
  // 🔴 🔵 🔵 | 🔴 🔵 🔵 | 🔴 ? ?
  const [s2Step, setS2Step] = useState<'SELECT_CHUNK' | 'CONFIRM_REPEAT' | 'FILL_BLANKS'>('SELECT_CHUNK');
  const [s2SelectedChunk, setS2SelectedChunk] = useState<string | null>(null);
  const [s2IsRepeatConfirmed, setS2IsRepeatConfirmed] = useState<boolean | null>(null);
  const [s2Slots, setS2Slots] = useState<{ slot1: string | null; slot2: string | null }>({
    slot1: null,
    slot2: null,
  });
  const [s2ActiveSlot, setS2ActiveSlot] = useState<'slot1' | 'slot2'>('slot1');
  const [s2Feedback, setS2Feedback] = useState<string | null>(null);
  const [s2Correct, setS2Correct] = useState<boolean>(false);

  // STAGE 3 STATE: Number Train
  // [4] -> [7] -> [10] -> [13] -> [?]
  const [s3Step, setS3Step] = useState<'SELECT_STEP' | 'ANIMATING' | 'ENTER_NEXT'>('SELECT_STEP');
  const [s3AnimStep, setS3AnimStep] = useState<number>(0);
  const [s3SelectedOp, setS3SelectedOp] = useState<string | null>(null);
  const [s3InputVal, setS3InputVal] = useState<string>('');
  const [s3Feedback, setS3Feedback] = useState<string | null>(null);
  const [s3Correct, setS3Correct] = useState<boolean>(false);

  // STAGE 4 STATE: Alternating Rules
  // 2 -> 4 -> 5 -> 10 -> 11 -> 22 -> ?
  const [s4Step, setS4Step] = useState<'DISCOVER_1' | 'DISCOVER_2' | 'RECOGNIZE_PATTERN'>('DISCOVER_1');
  const [s4Op1, setS4Op1] = useState<string | null>(null);
  const [s4Op2, setS4Op2] = useState<string | null>(null);
  const [s4InputVal, setS4InputVal] = useState<string>('');
  const [s4Feedback, setS4Feedback] = useState<string | null>(null);
  const [s4Correct, setS4Correct] = useState<boolean>(false);

  // STAGE 5 STATE: Split Letter and Number
  // A1 -> B3 -> C5 -> D7 -> ?
  const [s5IsSplit, setS5IsSplit] = useState<boolean>(false);
  const [s5LetterAnswer, setS5LetterAnswer] = useState<string | null>(null);
  const [s5NumberAnswer, setS5NumberAnswer] = useState<string | null>(null);
  const [s5Combined, setS5Combined] = useState<boolean>(false);
  const [s5Feedback, setS5Feedback] = useState<string | null>(null);
  const [s5Correct, setS5Correct] = useState<boolean>(false);

  // Reset hints when switching stage
  useEffect(() => {
    setHintLevel(0);
    setShowHintModal(false);
  }, [currentStage]);

  // Hints dictionary for each stage
  const HINTS_DATA: Record<number, [string, string, string]> = {
    1: [
      'Con thử đọc to nhịp màu xem: Đỏ, Xanh, Đỏ, Xanh...',
      'Sau màu Đỏ luôn là màu gì nhỉ?',
      'Sau 🔴 là 🔵. Con chọn màu Xanh nhé!',
    ],
    2: [
      'Con đếm xem nhóm đầu có bao nhiêu hình: 1 Đỏ và 2 Xanh.',
      'Nhóm thứ hai cũng là: 1 Đỏ và 2 Xanh.',
      'Ở nhóm cuối đã có 🔴 rồi, con chỉ cần điền tiếp hai màu 🔵 🔵.',
    ],
    3: [
      'Lấy toa thứ hai trừ toa thứ nhất: 7 - 4 = bao nhiêu?',
      '7 - 4 = 3, và 10 - 7 = 3. Vậy mỗi bước đều cộng 3.',
      'Toa cuối cùng là 13 + 3 = 16.',
    ],
    4: [
      'Hãy nhìn riêng hai bước đầu tiên: từ 2 lên 4 và từ 4 lên 5.',
      'Từ 2 đến 4 là ×2. Từ 4 đến 5 là +1. Chúng đang thay phiên nhau!',
      'Hai luật ×2 và +1 luân phiên. Bước trước là ×2 (11 × 2 = 22), vậy bước này là +1: 22 + 1 = 23.',
    ],
    5: [
      'Bấm nút "✂️ Tách ra xem" để quan sát riêng chữ cái và con số.',
      'Dãy chữ: A, B, C, D... Chữ tiếp theo trong bảng chữ cái là gì?',
      'Chữ là E. Dãy số: 1, 3, 5, 7... mỗi lần tăng 2, nên số là 9. Ghép lại là E9!',
    ],
  };

  // Helper to award stars for a stage
  const awardStageStars = (stageNum: number) => {
    let stars = 3;
    if (hintLevel === 1) stars = 2;
    else if (hintLevel >= 2) stars = 1;

    setStageStars((prev) => {
      const best = Math.max(prev[stageNum] || 0, stars);
      const updated = { ...prev, [stageNum]: best };
      localStorage.setItem('week01.pattern.stars', JSON.stringify(updated));
      return updated;
    });

    setStageCompleted((prev) => {
      const updated = { ...prev, [stageNum]: true };
      localStorage.setItem('week01.pattern.stages_done', JSON.stringify(updated));
      return updated;
    });

    // Save stage record
    try {
      const stageRecord = {
        stageId: `stage0${stageNum}`,
        stars,
        hintLevel,
        completed: true,
        timestamp: Date.now(),
      };
      localStorage.setItem(`week01.pattern.stage0${stageNum}`, JSON.stringify(stageRecord));
    } catch (e) {
      console.warn(e);
    }
  };

  // Total stars calculated
  const totalEarnedStars = (Object.values(stageStars) as number[]).reduce(
    (acc: number, curr: number) => acc + curr,
    0
  );

  // --- STAGE 1 HANDLERS ---
  const handleStage1Choice = (choice: string) => {
    setS1Selected(choice);
    if (choice === '🔵') {
      setS1Correct(true);
      setS1Feedback('🎉 Đúng rồi! Đỏ và Xanh đang thay phiên nhau.');
      awardStageStars(1);
      triggerConfetti();
    } else if (choice === '🔴') {
      setS1Feedback('🤔 Nếu đặt thêm Đỏ thì sẽ có hai Đỏ đứng cạnh nhau. Con nhìn lại nhịp Đỏ – Xanh nhé.');
      // Track misconception
      localStorage.setItem('week01.pattern.stage01.misconception', 'repeats_same_color');
    } else {
      setS1Feedback('🧐 Trong dãy chưa có màu Vàng. Con thử chọn một màu đã xuất hiện nhé.');
      // Track misconception
      localStorage.setItem('week01.pattern.stage01.misconception', 'chooses_new_color');
    }
  };

  // --- STAGE 2 HANDLERS ---
  const handleStage2ChunkSelect = (chunk: string) => {
    setS2SelectedChunk(chunk);
    if (chunk === '🔴🔵🔵') {
      setS2Step('CONFIRM_REPEAT');
    } else {
      setS2Feedback('🔎 Con đếm kỹ lại xem: 1 Đỏ và mấy Xanh thì bắt đầu lặp lại?');
      localStorage.setItem('week01.pattern.stage02.misconception', 'cannot_identify_chunk');
    }
  };

  const handleStage2FillSlot = (color: string) => {
    const updated = { ...s2Slots, [s2ActiveSlot]: color };
    setS2Slots(updated);

    // Auto-advance active slot
    if (s2ActiveSlot === 'slot1') {
      setS2ActiveSlot('slot2');
    }

    // Check if both filled
    if (updated.slot1 && updated.slot2) {
      if (updated.slot1 === '🔵' && updated.slot2 === '🔵') {
        setS2Correct(true);
        setS2Feedback('🌟 Con vừa tìm được cả một nhóm lặp!');
        awardStageStars(2);
        triggerConfetti();
      } else if (updated.slot1 === '🔵' || updated.slot2 === '🔵') {
        setS2Feedback('👍 Một ô đúng rồi! Con nhìn lại cả nhóm 3 hình nhé.');
      } else {
        setS2Feedback('🔎 Nhìn nhóm đầu: 🔴 🔵 🔵. Sau 🔴 cần có gì?');
      }
    }
  };

  // --- STAGE 3 HANDLERS ---
  const handleStage3OpSelect = (op: string) => {
    setS3SelectedOp(op);
    if (op === '+3') {
      setS3Feedback(null);
      setS3Step('ANIMATING');
      setS3AnimStep(1);
      setTimeout(() => {
        setS3AnimStep(2);
      }, 700);
      setTimeout(() => {
        setS3AnimStep(3);
      }, 1400);
      setTimeout(() => {
        setS3Step('ENTER_NEXT');
      }, 2200);
    } else {
      setS3Feedback('Con thử lấy số sau trừ số trước nhé.');
      localStorage.setItem('week01.pattern.stage03.misconception', 'cannot_find_constant_difference');
    }
  };

  const handleStage3SubmitNumber = (val: string) => {
    setS3InputVal(val);
    const num = parseInt(val.trim(), 10);
    if (num === 16) {
      setS3Correct(true);
      setS3Feedback('🚂 Chính xác! Mỗi toa tăng thêm 3.');
      awardStageStars(3);
      triggerConfetti();
      // Trigger confidence modal for stage 3
      setTimeout(() => {
        setShowConfidenceModal(true);
      }, 1200);
    } else {
      setS3Feedback('Quy luật của con đúng rồi! Giờ thử tính 13 + 3 nhé.');
    }
  };

  // --- STAGE 4 HANDLERS ---
  const handleStage4Step1 = (op: string) => {
    setS4Op1(op);
    if (op === '×2') {
      setS4Feedback(null);
      setS4Step('DISCOVER_2');
    } else if (op === '+2') {
      setS4Feedback('2 + 2 = 4 cũng đúng, nhưng ở máy này quy luật là phép nhân: 2 × 2 = 4 nhé!');
    } else {
      setS4Feedback('Từ 2 sang 4 làm sao ra nhỉ? Con thử chọn ×2 xem sao nhé.');
    }
  };

  const handleStage4Step2 = (op: string) => {
    setS4Op2(op);
    if (op === '+1') {
      setS4Feedback(null);
      setS4Step('RECOGNIZE_PATTERN');
    } else {
      setS4Feedback('Từ 4 lên 5 chỉ tăng thêm 1 đơn vị. Con chọn +1 nhé!');
    }
  };

  const handleStage4SubmitFinal = (val: string) => {
    setS4InputVal(val);
    const num = parseInt(val.trim(), 10);
    if (num === 23) {
      setS4Correct(true);
      setS4Feedback('🔥 Chính xác! Hai luật thay phiên: ×2 rồi +1. 22 + 1 = 23.');
      awardStageStars(4);
      triggerConfetti();
    } else if (num === 44) {
      setS4Feedback('Con vừa dùng ×2 thêm một lần. Nhưng hai luật đang thay phiên nhau nhé!');
      localStorage.setItem('week01.pattern.stage04.misconception', 'repeats_same_operation');
    } else {
      setS4Feedback('Sau phép ×2 (11 × 2 = 22) sẽ là phép +1. Con thử tính 22 + 1 nhé.');
    }
  };

  // --- STAGE 5 HANDLERS ---
  const handleStage5Solve = () => {
    if (s5LetterAnswer === 'E' && s5NumberAnswer === '9') {
      setS5Combined(true);
      setS5Correct(true);
      setS5Feedback('🧠 Xuất sắc! Tách chữ riêng và số riêng giúp quy luật trở nên thật dễ nhìn.');
      awardStageStars(5);
      triggerConfetti();
      // Show confidence check after stage 5
      setTimeout(() => {
        setShowConfidenceModal(true);
      }, 1200);
    } else {
      setS5Feedback('Con kiểm tra lại xem: Chữ sau D là gì? Số sau 7 là mấy?');
      localStorage.setItem('week01.pattern.stage05.misconception', 'cannot_separate_components');
    }
  };

  // When completing stage 5 & finishing confidence check, advance to celebration
  const handleFinishMission = () => {
    // Mark simulation and lesson complete in storage
    storage.markSimulationExplored('pattern');
    storage.markLessonComplete('pattern');
    localStorage.setItem('week01.missions.pattern.completed', 'true');
    localStorage.setItem('week01.pattern.completed', 'true');
    localStorage.setItem('week01.missions.logic.unlocked', 'true');
    localStorage.setItem('week01.badges.mat_cu', 'true');
    setCurrentStage(6);
    triggerConfetti();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-10">
      {/* TOP BAR: Room Title + 5 Dots Progress + Hint Button */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-black">
            🔍
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Phòng Quan sát
            </h1>
            <div className="text-xs text-slate-500 font-semibold">
              Nhiệm vụ 1 • Tìm quy luật bí mật
            </div>
          </div>
        </div>

        {/* 5 Dots Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-base sm:text-lg" title="5 Màn khám phá">
            {[1, 2, 3, 4, 5].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  if (stageCompleted[st - 1] || st === 1 || stageCompleted[st]) {
                    setCurrentStage(st);
                  }
                }}
                className={`transition-all ${
                  stageCompleted[st]
                    ? 'text-emerald-500 hover:scale-110'
                    : currentStage === st
                    ? 'text-amber-500 scale-125'
                    : 'text-slate-300'
                }`}
              >
                ●
              </button>
            ))}
          </div>

          <div className="pl-2 border-l border-slate-200 flex items-center gap-1 text-xs font-black text-amber-600">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{totalEarnedStars}/15</span>
          </div>

          {/* Hint Button ("Con đang bí") - only in stages 1, 2, 4, 5 (in stage 3 it is placed near the problem area) */}
          {/* Hint Button ("Con đang bí") - for stages 1 and 2 (stages 3, 4, 5 have it placed right below problem options) */}
          {currentStage >= 1 && currentStage <= 2 && (
            <button
              type="button"
              onClick={() => {
                const nextLvl = Math.min(3, hintLevel + 1);
                setHintLevel(nextLvl);
                setShowHintModal(true);
              }}
              className="px-3 py-1.5 min-h-[38px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Con đang bí</span>
            </button>
          )}
        </div>
      </div>

      {/* =======================================================
          SCREEN 0: INTRO SCREEN
      ======================================================= */}
      {currentStage === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-4xl shadow-md">
            🐻
          </div>

          <div className="space-y-3 max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Gấu M1 đang làm mất vài mảnh trong các dãy bí mật.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              Con hãy quan sát thật kỹ và giúp bạn ấy tìm lại nhé!
            </p>
            <p className="text-xs text-blue-600 font-bold">
              Chỉ cần quan sát kỹ, thử và tự tìm ra quy luật. 👀
            </p>
          </div>

          {/* 5 Dots preview */}
          <div className="pt-2 flex justify-center items-center gap-2 text-xl text-slate-300">
            <span className="text-blue-600 font-black">●</span>
            <span>○</span>
            <span>○</span>
            <span>○</span>
            <span>○</span>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => setCurrentStage(1)}
              className="min-h-[48px] px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-base shadow-md transition-transform cursor-pointer inline-flex items-center gap-2"
            >
              <span>👀 Bắt đầu quan sát</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          SCREEN 1: HAI MÀU THAY PHIÊN (🔴 🔵 🔴 🔵 🔴 ?)
      ======================================================= */}
      {currentStage === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 inline-block mb-1">
              Màn 1 / 5 • Nhịp màu thay phiên
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Con tìm hình còn thiếu nhé!
            </h2>
          </div>

          {/* Sequence Display */}
          <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-4xl sm:text-5xl">
            <span className="transition-transform hover:scale-110">🔴</span>
            <span className="transition-transform hover:scale-110">🔵</span>
            <span className="transition-transform hover:scale-110">🔴</span>
            <span className="transition-transform hover:scale-110">🔵</span>
            <span className="transition-transform hover:scale-110">🔴</span>
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-dashed flex items-center justify-center text-3xl font-black transition-all ${
                s1Correct
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-blue-400 text-slate-400'
              }`}
            >
              {s1Correct ? '🔵' : '?'}
            </div>
          </div>

          {/* Choices */}
          {!s1Correct ? (
            <div className="space-y-3">
              <div className="text-center text-xs font-bold text-slate-500">
                Bấm vào một màu để điền vào ô trống:
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {[
                  { label: '🔴', name: 'Đỏ', val: '🔴' },
                  { label: '🔵', name: 'Xanh', val: '🔵' },
                  { label: '🟡', name: 'Vàng', val: '🟡' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleStage1Choice(opt.val)}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 active:scale-95 text-4xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs min-h-[72px]"
                  >
                    <span>{opt.label}</span>
                    <span className="text-xs font-bold text-slate-600">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Feedback Message */}
          {s1Feedback && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold text-center transition-all ${
                s1Correct
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              {s1Feedback}
            </div>
          )}

          {/* Next Button */}
          {s1Correct && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStage(2);
                }}
                className="min-h-[48px] px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition-transform cursor-pointer inline-flex items-center gap-2"
              >
                <span>Tiếp tục sang Màn 2 →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          SCREEN 2: TÌM NHÓM LẶP (🔴 🔵 🔵 | 🔴 🔵 🔵 | 🔴 ? ?)
      ======================================================= */}
      {currentStage === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 inline-block mb-1">
              Màn 2 / 5 • Tìm nhóm lặp
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Có một nhóm hình đang lặp lại. Con tìm hai hình cuối nhé!
            </h2>
          </div>

          {/* Sequence with Visual Groups */}
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-3xl sm:text-4xl">
            {/* Group 1 */}
            <div className={`p-2 sm:p-3 rounded-2xl border-2 flex items-center gap-1.5 sm:gap-2 transition-all ${
              s2Step !== 'SELECT_CHUNK' ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200'
            }`}>
              <span>🔴</span>
              <span>🔵</span>
              <span>🔵</span>
            </div>

            <span className="text-slate-300 font-bold text-2xl">|</span>

            {/* Group 2 */}
            <div className={`p-2 sm:p-3 rounded-2xl border-2 flex items-center gap-1.5 sm:gap-2 transition-all ${
              s2Step !== 'SELECT_CHUNK' ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200'
            }`}>
              <span>🔴</span>
              <span>🔵</span>
              <span>🔵</span>
            </div>

            <span className="text-slate-300 font-bold text-2xl">|</span>

            {/* Group 3 (with blanks) */}
            <div className="p-2 sm:p-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex items-center gap-1.5 sm:gap-2">
              <span>🔴</span>
              {/* Slot 1 */}
              <div
                onClick={() => setS2ActiveSlot('slot1')}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold cursor-pointer transition-all ${
                  s2Slots.slot1
                    ? 'bg-blue-100 border-blue-500'
                    : s2ActiveSlot === 'slot1'
                    ? 'bg-white border-blue-500 ring-2 ring-blue-300'
                    : 'bg-white border-slate-300'
                }`}
              >
                {s2Slots.slot1 || '?'}
              </div>
              {/* Slot 2 */}
              <div
                onClick={() => setS2ActiveSlot('slot2')}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold cursor-pointer transition-all ${
                  s2Slots.slot2
                    ? 'bg-blue-100 border-blue-500'
                    : s2ActiveSlot === 'slot2'
                    ? 'bg-white border-blue-500 ring-2 ring-blue-300'
                    : 'bg-white border-slate-300'
                }`}
              >
                {s2Slots.slot2 || '?'}
              </div>
            </div>
          </div>

          {/* STEP 1: SELECT REPEATING CHUNK */}
          {s2Step === 'SELECT_CHUNK' && (
            <div className="space-y-3 text-center">
              <div className="text-xs sm:text-sm font-bold text-slate-700">
                Bước 1: Con khoanh xem nhóm nào đang lặp lại nhé:
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { label: '🔴 🔵', val: '🔴🔵' },
                  { label: '🔴 🔵 🔵', val: '🔴🔵🔵' },
                  { label: '🔴 🔴 🔵', val: '🔴🔴🔵' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleStage2ChunkSelect(opt.val)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 active:scale-95 text-xl font-bold cursor-pointer shadow-2xs transition-all min-h-[44px]"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1.5: CONFIRM REPEAT */}
          {s2Step === 'CONFIRM_REPEAT' && (
            <div className="space-y-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <div className="text-xs sm:text-sm font-bold text-blue-950">
                Nhóm <strong className="text-blue-700">[🔴 🔵 🔵]</strong> này có xuất hiện lại giống hệt không?
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setS2Step('FILL_BLANKS')}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xs cursor-pointer"
                >
                  Có, lặp lại!
                </button>
                <button
                  type="button"
                  onClick={() => setS2Feedback('Con nhìn lại 2 nhóm đầu xem có giống nhau không nhé!')}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                >
                  Không
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FILL BLANKS */}
          {s2Step === 'FILL_BLANKS' && !s2Correct && (
            <div className="space-y-3 text-center">
              <div className="text-xs font-bold text-slate-500">
                Bước 2: Chọn màu để điền vào ô đang chọn ({s2ActiveSlot === 'slot1' ? 'ô 1' : 'ô 2'}):
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {['🔴', '🔵', '🟡'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleStage2FillSlot(col)}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 active:scale-95 text-3xl cursor-pointer shadow-2xs min-h-[56px]"
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {s2Feedback && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold text-center transition-all ${
                s2Correct
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              {s2Feedback}
            </div>
          )}

          {/* Next Button */}
          {s2Correct && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStage(3);
                }}
                className="min-h-[48px] px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition-transform cursor-pointer inline-flex items-center gap-2"
              >
                <span>Tiếp tục sang Màn 3 →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          SCREEN 3: ĐOÀN TÀU SỐ ([4] -> [7] -> [10] -> [13] -> [?])
      ======================================================= */}
      {currentStage === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 inline-block mb-1">
              Màn 3 / 5 • Đoàn tàu số
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              🚂 Mỗi toa đang tăng giống nhau. Con tìm xem tăng bao nhiêu nhé!
            </h2>
          </div>

          {/* Train cars display with arrows connecting */}
          <div className="overflow-x-auto py-3">
            <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-[360px]">
              {[4, 7, 10, 13].map((val, idx) => (
                <div key={idx} className="flex items-center">
                  <div
                    className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 text-white font-black text-xl sm:text-2xl flex flex-col items-center justify-center shadow-md relative transition-transform ${
                      s3Step === 'ANIMATING' && (s3AnimStep === idx || s3AnimStep === idx + 1)
                        ? 'ring-4 ring-amber-300 scale-105'
                        : ''
                    }`}
                  >
                    <span className="text-[10px] text-blue-200 absolute top-1 font-bold">
                      Toa {idx + 1}
                    </span>
                    <span className="mt-2">{val}</span>
                  </div>

                  {/* Arrow connector between cars (NOT a button) */}
                  {idx < 3 && (
                    <div className="flex flex-col items-center justify-center px-1.5 sm:px-2 select-none">
                      <span
                        className={`text-xs font-black transition-all duration-300 ${
                          (s3Step === 'ANIMATING' && s3AnimStep >= idx + 1) ||
                          s3Step === 'ENTER_NEXT' ||
                          s3Correct
                            ? 'text-amber-600 scale-110'
                            : 'opacity-0'
                        }`}
                      >
                        +3
                      </span>
                      <span
                        className={`text-base sm:text-lg transition-colors ${
                          (s3Step === 'ANIMATING' && s3AnimStep >= idx + 1) ||
                          s3Step === 'ENTER_NEXT' ||
                          s3Correct
                            ? 'text-amber-500 font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        ➔
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Arrow connector to the 5th car */}
              <div className="flex flex-col items-center justify-center px-1.5 sm:px-2 select-none">
                <span
                  className={`text-xs font-black transition-all duration-300 ${
                    s3Step === 'ENTER_NEXT' || s3Correct
                      ? 'text-emerald-600 scale-110'
                      : 'opacity-0'
                  }`}
                >
                  +3
                </span>
                <span
                  className={`text-base sm:text-lg transition-colors ${
                    s3Step === 'ENTER_NEXT' || s3Correct
                      ? 'text-emerald-500 font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  ➔
                </span>
              </div>

              {/* Next car */}
              <div
                className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center font-black text-xl sm:text-2xl transition-all ${
                  s3Correct
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-105'
                    : 'bg-amber-50 border-amber-400 text-amber-800'
                }`}
              >
                <span className="text-[10px] opacity-75">Toa 5</span>
                <span>{s3Correct ? '16' : '?'}</span>
              </div>
            </div>
          </div>

          {/* STEP 1: SELECT CONSTANT STEP */}
          {s3Step === 'SELECT_STEP' && (
            <div className="space-y-4 text-center">
              <div className="text-xs sm:text-sm font-bold text-slate-700">
                Bước 1: Mỗi bước tăng bao nhiêu?
              </div>
              <div className="flex justify-center gap-3">
                {['+2', '+3', '+4'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleStage3OpSelect(op)}
                    className="w-24 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-400 active:scale-95 text-lg font-black text-blue-700 cursor-pointer shadow-2xs transition-all min-h-[48px]"
                  >
                    {op}
                  </button>
                ))}
              </div>

              {/* Relocated Hint Button directly below +2, +3, +4 */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const nextLvl = Math.min(3, hintLevel + 1);
                    setHintLevel(nextLvl);
                    setShowHintModal(true);
                  }}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>💡 Con đang bí</span>
                </button>
              </div>
            </div>
          )}

          {/* ANIMATING STEP: 4 +3 -> 7, 7 +3 -> 10, 10 +3 -> 13 */}
          {s3Step === 'ANIMATING' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3 animate-fadeIn">
              <div className="text-xs font-black text-amber-900 uppercase tracking-wide">
                Đoàn tàu đang kiểm tra nhịp bước nhảy:
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base font-black">
                <span
                  className={`px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    s3AnimStep >= 1
                      ? 'bg-amber-300 text-amber-950 scale-105 shadow-2xs ring-2 ring-amber-400'
                      : 'bg-white/70 text-slate-400 border border-amber-100'
                  }`}
                >
                  4 <span className="text-amber-700">+3</span> → 7
                </span>
                <span className="text-amber-300 font-bold">|</span>
                <span
                  className={`px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    s3AnimStep >= 2
                      ? 'bg-amber-300 text-amber-950 scale-105 shadow-2xs ring-2 ring-amber-400'
                      : 'bg-white/70 text-slate-400 border border-amber-100'
                  }`}
                >
                  7 <span className="text-amber-700">+3</span> → 10
                </span>
                <span className="text-amber-300 font-bold">|</span>
                <span
                  className={`px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    s3AnimStep >= 3
                      ? 'bg-amber-300 text-amber-950 scale-105 shadow-2xs ring-2 ring-amber-400'
                      : 'bg-white/70 text-slate-400 border border-amber-100'
                  }`}
                >
                  10 <span className="text-amber-700">+3</span> → 13
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: ENTER NEXT NUMBER (Choice buttons OR text input) */}
          {s3Step === 'ENTER_NEXT' && !s3Correct && (
            <div className="space-y-4 text-center max-w-sm mx-auto">
              <div className="text-xs sm:text-sm font-bold text-slate-700">
                Vậy toa tiếp theo là số nào?
              </div>

              {/* Quick Choice Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[14, 15, 16, 17].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleStage3SubmitNumber(num.toString())}
                    className="py-3 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-400 font-black text-lg text-slate-900 cursor-pointer shadow-2xs min-h-[48px] active:scale-95 transition-all"
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Or manual input for flexibility */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  value={s3InputVal}
                  onChange={(e) => setS3InputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && s3InputVal) {
                      handleStage3SubmitNumber(s3InputVal);
                    }
                  }}
                  placeholder="Hoặc tự gõ số..."
                  className="flex-1 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (s3InputVal) handleStage3SubmitNumber(s3InputVal);
                  }}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  Kiểm tra
                </button>
              </div>

              {/* Hint button also available in step 2 */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const nextLvl = Math.min(3, hintLevel + 1);
                    setHintLevel(nextLvl);
                    setShowHintModal(true);
                  }}
                  className="px-4 py-2 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>💡 Con đang bí</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {s3Feedback && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold text-center transition-all ${
                s3Correct
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              {s3Feedback}
            </div>
          )}

          {/* Next Button */}
          {s3Correct && !showConfidenceModal && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStage(4);
                }}
                className="min-h-[48px] px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition-transform cursor-pointer inline-flex items-center gap-2"
              >
                <span>Tiếp tục sang Màn 4 →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          SCREEN 4: HAI LUẬT THAY PHIÊN (2 -> 4 -> 5 -> 10 -> 11 -> 22 -> ?)
      ======================================================= */}
      {currentStage === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 inline-block mb-1">
              Màn 4 / 5 • Hai luật thay phiên
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              🤔 Lần này mỗi bước không giống nhau đâu!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Quan sát kỹ: hai quy luật đang thay phiên nhau nhảy số.
            </p>
          </div>

          {/* Number sequence display - Rules x2 and +1 are NOT revealed immediately */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 overflow-x-auto">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-[360px] text-sm sm:text-base font-black">
              {/* 2 */}
              <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">2</span>

              {/* 2 -> 4: only revealed after step 1 */}
              {s4Step === 'DISCOVER_1' ? (
                <span className="text-slate-400 font-bold px-1">➔</span>
              ) : (
                <span className="text-xs text-orange-600 font-bold bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded-md animate-fadeIn">×2</span>
              )}

              {/* 4 */}
              <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">4</span>

              {/* 4 -> 5: revealed from step 3 onwards */}
              {s4Step === 'RECOGNIZE_PATTERN' || s4Correct ? (
                <span className="text-xs text-blue-600 font-bold bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-md animate-fadeIn">+1</span>
              ) : (
                <span className="text-slate-400 font-bold px-1">➔</span>
              )}

              {/* 5 */}
              <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">5</span>

              {/* 5 -> 10 */}
              {s4Step === 'RECOGNIZE_PATTERN' || s4Correct ? (
                <span className="text-xs text-orange-600 font-bold bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded-md animate-fadeIn">×2</span>
              ) : (
                <span className="text-slate-400 font-bold px-1">➔</span>
              )}

              {/* 10 */}
              <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">10</span>

              {/* 10 -> 11 */}
              {s4Step === 'RECOGNIZE_PATTERN' || s4Correct ? (
                <span className="text-xs text-blue-600 font-bold bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-md animate-fadeIn">+1</span>
              ) : (
                <span className="text-slate-400 font-bold px-1">➔</span>
              )}

              {/* 11 */}
              <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">11</span>

              {/* 11 -> 22 */}
              {s4Step === 'RECOGNIZE_PATTERN' || s4Correct ? (
                <span className="text-xs text-orange-600 font-bold bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded-md animate-fadeIn">×2</span>
              ) : (
                <span className="text-slate-400 font-bold px-1">➔</span>
              )}

              {/* 22 */}
              <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">22</span>

              {/* 22 -> ? */}
              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md">
                {s4Correct ? '+1' : '?'}
              </span>

              {/* Target slot */}
              <span className={`w-12 h-10 rounded-xl border-2 border-dashed flex items-center justify-center font-black transition-all ${
                s4Correct ? 'bg-emerald-500 text-white border-emerald-600 animate-fadeIn' : 'bg-amber-50 border-amber-400 text-amber-800'
              }`}>
                {s4Correct ? '23' : '?'}
              </span>
            </div>
          </div>

          {/* STEP 1: DISCOVER 2 -> 4 */}
          {s4Step === 'DISCOVER_1' && (
            <div className="space-y-4 text-center">
              <div className="text-sm font-bold text-slate-800">
                Bước 1: Từ <strong className="text-blue-600">2</strong> sang <strong className="text-blue-600">4</strong> là phép tính gì?
              </div>
              <div className="flex justify-center gap-3">
                {['+1', '+2', '×2'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleStage4Step1(op)}
                    className="w-20 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 active:scale-95 font-black text-base text-blue-700 cursor-pointer shadow-2xs min-h-[44px] transition-all"
                  >
                    {op}
                  </button>
                ))}
              </div>

              {/* Localized Hint Button */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const nextLvl = Math.min(3, hintLevel + 1);
                    setHintLevel(nextLvl);
                    setShowHintModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 cursor-pointer transition-colors shadow-2xs"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>💡 Con đang bí</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DISCOVER 4 -> 5 */}
          {s4Step === 'DISCOVER_2' && (
            <div className="space-y-4 text-center">
              <div className="text-sm font-bold text-slate-800">
                Bước 2: Tiếp theo, từ <strong className="text-blue-600">4</strong> sang <strong className="text-blue-600">5</strong> là phép tính gì?
              </div>
              <div className="flex justify-center gap-3">
                {['+1', '+2', '×2'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleStage4Step2(op)}
                    className="w-20 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 active:scale-95 font-black text-base text-blue-700 cursor-pointer shadow-2xs min-h-[44px] transition-all"
                  >
                    {op}
                  </button>
                ))}
              </div>

              {/* Localized Hint Button */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const nextLvl = Math.min(3, hintLevel + 1);
                    setHintLevel(nextLvl);
                    setShowHintModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 cursor-pointer transition-colors shadow-2xs"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>💡 Con đang bí</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: RECOGNIZE PATTERN & ASK 22 -> ? */}
          {s4Step === 'RECOGNIZE_PATTERN' && !s4Correct && (
            <div className="space-y-4 text-center max-w-md mx-auto">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs sm:text-sm font-bold text-blue-900">
                ✨ Hai quy luật đang thay phiên nhau: <strong>×2</strong> rồi <strong>+1</strong>, rồi <strong>×2</strong> rồi <strong>+1</strong>...
              </div>

              <div className="text-sm sm:text-base font-black text-slate-800">
                Vậy sau số <strong>22</strong> (22 → ?), số tiếp theo là bao nhiêu?
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                {[23, 24, 44].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleStage4SubmitFinal(num.toString())}
                    className="py-3 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-400 active:scale-95 font-black text-xl text-slate-900 cursor-pointer shadow-2xs min-h-[48px] transition-all"
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Localized Hint Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const nextLvl = Math.min(3, hintLevel + 1);
                    setHintLevel(nextLvl);
                    setShowHintModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 cursor-pointer transition-colors shadow-2xs"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>💡 Con đang bí</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {s4Feedback && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold text-center transition-all ${
                s4Correct
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              {s4Feedback}
            </div>
          )}

          {/* Next Button */}
          {s4Correct && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStage(5);
                }}
                className="min-h-[48px] px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition-transform cursor-pointer inline-flex items-center gap-2"
              >
                <span>Tiếp tục sang Màn 5 →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          SCREEN 5: TÁCH CHỮ VÀ SỐ (A1 -> B3 -> C5 -> D7 -> ?)
      ======================================================= */}
      {currentStage === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 inline-block mb-1">
              Màn 5 / 5 • Tách chữ và số
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              🧩 Chữ và số đang chơi hai trò khác nhau.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Mỗi ô gồm một chữ cái và một con số. Hãy tách riêng ra để tìm quy luật!
            </p>
          </div>

          {/* Original Sequence Display */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xl sm:text-2xl font-black">
            {['A1', 'B3', 'C5', 'D7'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  {item}
                </span>
                <span className="text-slate-300">→</span>
              </div>
            ))}
            <div className={`px-4 py-2 rounded-xl border-2 border-dashed font-black transition-all ${
              s5Combined ? 'bg-emerald-500 text-white border-emerald-600 animate-fadeIn' : 'bg-amber-50 border-amber-400 text-amber-800'
            }`}>
              {s5Combined ? 'E9' : '?'}
            </div>
          </div>

          {/* Button "✂️ Tách ra xem" */}
          {!s5IsSplit && (
            <div className="text-center pt-2 space-y-4">
              <button
                type="button"
                onClick={() => setS5IsSplit(true)}
                className="min-h-[48px] px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-base shadow-md transition-transform cursor-pointer inline-flex items-center gap-2"
              >
                <span>✂️ Tách ra xem</span>
              </button>

              {/* Localized Hint Button */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const nextLvl = Math.min(3, hintLevel + 1);
                    setHintLevel(nextLvl);
                    setShowHintModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 cursor-pointer transition-colors shadow-2xs"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>💡 Con đang bí</span>
                </button>
              </div>
            </div>
          )}

          {/* Split streams visual */}
          {s5IsSplit && (
            <div className="space-y-4 pt-2 animate-fadeIn">
              {/* Stream 1: Letters (A -> B -> C -> D -> ?) */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 uppercase">
                    Dòng chữ: A → B → C → D → ?
                  </span>
                  {s5LetterAnswer === 'E' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      ✓ Đã tìm được: E
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-base font-black text-slate-800 overflow-x-auto py-1">
                  {['A', 'B', 'C', 'D'].map((ltr) => (
                    <div key={ltr} className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                        {ltr}
                      </span>
                      <span className="text-slate-300">→</span>
                    </div>
                  ))}
                  <span className={`w-9 h-9 rounded-lg border-2 border-dashed flex items-center justify-center font-black transition-all ${
                    s5LetterAnswer === 'E'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white border-blue-300 text-blue-700'
                  }`}>
                    {s5LetterAnswer === 'E' ? 'E' : '?'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <span className="text-xs font-medium text-slate-700">Chọn chữ cái tiếp theo:</span>
                  <div className="flex gap-2">
                    {['D', 'E', 'F'].map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => {
                          setS5LetterAnswer(ch);
                          if (ch !== 'E') {
                            setS5Feedback('Con thử nhẩm bảng chữ cái: A, B, C, D... Chữ tiếp theo là gì?');
                          } else {
                            setS5Feedback(null);
                          }
                        }}
                        className={`w-12 h-11 rounded-xl font-black text-sm border transition-all cursor-pointer min-h-[44px] ${
                          s5LetterAnswer === ch
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-blue-50'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stream 2: Numbers (1 -> 3 -> 5 -> 7 -> ?) */}
              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-900 uppercase">
                    Dòng số: 1 → 3 → 5 → 7 → ?
                  </span>
                  {s5NumberAnswer === '9' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      ✓ Đã tìm được: 9
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-base font-black text-slate-800 overflow-x-auto py-1">
                  {['1', '3', '5', '7'].map((num) => (
                    <div key={num} className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                        {num}
                      </span>
                      <span className="text-slate-300">→</span>
                    </div>
                  ))}
                  <span className={`w-9 h-9 rounded-lg border-2 border-dashed flex items-center justify-center font-black transition-all ${
                    s5NumberAnswer === '9'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white border-orange-300 text-orange-700'
                  }`}>
                    {s5NumberAnswer === '9' ? '9' : '?'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <span className="text-xs font-medium text-slate-700">Chọn con số tiếp theo:</span>
                  <div className="flex gap-2">
                    {['8', '9', '11'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setS5NumberAnswer(num);
                          if (num !== '9') {
                            setS5Feedback('Nhìn nhịp nhảy số: 1 (+2) 3 (+2) 5 (+2) 7. Vậy 7 + 2 = ?');
                          } else {
                            setS5Feedback(null);
                          }
                        }}
                        className={`w-12 h-11 rounded-xl font-black text-sm border transition-all cursor-pointer min-h-[44px] ${
                          s5NumberAnswer === num
                            ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-orange-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Combined Button - ONLY appears when BOTH E and 9 are found */}
              {!s5Combined && s5LetterAnswer === 'E' && s5NumberAnswer === '9' && (
                <div className="text-center pt-2 animate-fadeIn">
                  <button
                    type="button"
                    onClick={handleStage5Solve}
                    className="min-h-[48px] px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition-transform cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>✨ Ghép lại: E + 9 → E9</span>
                  </button>
                </div>
              )}

              {/* Localized Hint Button */}
              {!s5Correct && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nextLvl = Math.min(3, hintLevel + 1);
                      setHintLevel(nextLvl);
                      setShowHintModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>💡 Con đang bí</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feedback Message */}
          {s5Feedback && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold text-center transition-all ${
                s5Correct
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              {s5Feedback}
            </div>
          )}

          {/* Finish Button */}
          {s5Correct && !showConfidenceModal && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleFinishMission}
                className="min-h-[48px] px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition-transform cursor-pointer inline-flex items-center gap-2"
              >
                <span>Xem kết quả nhiệm vụ 🎉</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          SCREEN 6: CELEBRATION SCREEN
      ======================================================= */}
      {currentStage === 6 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400 text-slate-900 flex items-center justify-center text-4xl shadow-lg ring-4 ring-amber-200 animate-bounce">
            🦉
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              🎉 Con đã hoàn thành Phòng Quan sát!
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs sm:text-sm font-black text-blue-700">
              <span>Mở khóa huy hiệu:</span>
              <span className="text-blue-900 font-extrabold">🔍 MẮT CÚ</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Con biết nhìn thật kỹ để tìm ra quy luật bí mật.
            </p>
          </div>

          {/* Stars badge summary */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>Sao khám phá: {totalEarnedStars} / 15</span>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('/sim/logic');
                } else {
                  window.location.href = '#/sim/logic';
                }
              }}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-base shadow-md cursor-pointer transition-transform inline-flex items-center justify-center gap-2"
            >
              <span>🚦 Đi đến Cổng Logic</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStage(1);
                setS1Correct(false);
                setS2Correct(false);
                setS3Correct(false);
                setS4Correct(false);
                setS5Correct(false);
              }}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm cursor-pointer transition-colors"
            >
              🔄 Chơi lại Phòng Quan sát
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          HINT MODAL ("CON ĐANG BÍ")
      ======================================================= */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-600 font-black text-base">
              <Lightbulb className="w-5 h-5" />
              <span>
                {hintLevel === 1 && 'Gợi ý nhỏ (1/3)'}
                {hintLevel === 2 && 'Gợi ý thêm (2/3)'}
                {hintLevel >= 3 && 'Cùng làm một bước nhé (3/3)'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm font-bold text-amber-950 leading-relaxed">
              {HINTS_DATA[currentStage]?.[hintLevel - 1] || 'Hãy quan sát kỹ các phần tử đã xuất hiện nhé!'}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHintModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Con hiểu rồi!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          CONFIDENCE MODAL (STAGE 3 & STAGE 5)
      ======================================================= */}
      {showConfidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-2xl font-bold">
              🤔
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Con thấy phần này thế nào?
              </h3>
              <p className="text-xs text-slate-500">
                Hãy chọn cảm nhận thật của con nhé:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {[
                { label: '😎 Con biết cách làm', val: 'confident' },
                { label: '🤔 Con phải thử một chút', val: 'guessing' },
                { label: '🆘 Con vẫn chưa hiểu', val: 'confused' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    if (currentStage === 3) {
                      setConfidenceStage3(opt.val);
                      localStorage.setItem('week01.pattern.stage03.confidence', opt.val);
                      setShowConfidenceModal(false);
                      setCurrentStage(4);
                    } else if (currentStage === 5) {
                      setConfidenceStage5(opt.val);
                      localStorage.setItem('week01.pattern.stage05.confidence', opt.val);
                      setShowConfidenceModal(false);
                      handleFinishMission();
                    }
                  }}
                  className="py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 font-bold text-xs sm:text-sm text-slate-800 text-left flex items-center gap-2 cursor-pointer transition-colors min-h-[44px]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
