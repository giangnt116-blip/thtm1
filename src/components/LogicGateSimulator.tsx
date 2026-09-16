import { useState, useEffect } from 'react';
import {
  Check,
  X,
  Sparkles,
  RefreshCw,
  Lock,
  ArrowRight,
  HelpCircle,
  Shield,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { triggerConfetti, triggerBigWinConfetti } from '../utils/confetti';
import { storage } from '../utils/storage';

interface LogicGateSimulatorProps {
  onNavigate?: (path: string) => void;
}

// Card interface for the logic simulator
interface CardItem {
  id: number;
  color: 'blue' | 'red' | 'yellow';
  shape: 'circle' | 'square' | 'triangle';
  number: number;
  label?: string;
}

export function LogicGateSimulator({ onNavigate }: LogicGateSimulatorProps) {
  // Current stage: 0 = Intro, 1 = Single gate, 2 = AND gate, 3 = OR gate, 4 = NOT gate, 5 = Boss/Multi-filter, 6 = Celebration
  const [currentStage, setCurrentStage] = useState<number>(0);

  // Check if Mission 1 (Pattern) is completed
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);

  // Stars per stage: { 1: 3, 2: 3, ... }
  const [stageStars, setStageStars] = useState<Record<number, number>>(() => {
    try {
      const raw = localStorage.getItem('week01.logic.stars');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Stages completed map: { 1: true, 2: true, ... }
  const [stagesDone, setStagesDone] = useState<Record<number, boolean>>(() => {
    try {
      const raw = localStorage.getItem('week01.logic.stages_done');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Hint level per stage: 0 = none, 1 = hint 1, 2 = hint 2, 3 = step-by-step
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [showHintBox, setShowHintBox] = useState<boolean>(false);

  // Confidence check modal
  const [showConfidenceModal, setShowConfidenceModal] = useState<boolean>(false);
  const [confidenceStage, setConfidenceStage] = useState<number>(3);

  // --- STAGE 1 STATE: Single Condition (Chỉ thẻ màu XANH) ---
  const s1Cards: CardItem[] = [
    { id: 1, color: 'red', shape: 'circle', number: 2 },
    { id: 2, color: 'blue', shape: 'square', number: 4 },
    { id: 3, color: 'blue', shape: 'circle', number: 5 },
    { id: 4, color: 'yellow', shape: 'triangle', number: 6 },
    { id: 5, color: 'blue', shape: 'triangle', number: 8 },
    { id: 6, color: 'red', shape: 'square', number: 9 },
  ];
  const [s1Selected, setS1Selected] = useState<number[]>([]);
  const [s1Feedback, setS1Feedback] = useState<string>('');
  const [s1Done, setS1Done] = useState<boolean>(false);

  // --- STAGE 2 STATE: AND (Màu XANH VÀ Số CHẴN) ---
  const s2Cards: CardItem[] = [
    { id: 201, color: 'blue', shape: 'circle', number: 6 }, // Blue + Even -> PASS
    { id: 202, color: 'blue', shape: 'square', number: 4 }, // Blue + Even -> PASS
    { id: 203, color: 'blue', shape: 'triangle', number: 5 }, // Blue + Odd -> FAIL
    { id: 204, color: 'blue', shape: 'circle', number: 7 }, // Blue + Odd -> FAIL
    { id: 205, color: 'red', shape: 'square', number: 8 }, // Not Blue + Even -> FAIL
    { id: 206, color: 'yellow', shape: 'circle', number: 10 }, // Not Blue + Even -> FAIL
    { id: 207, color: 'red', shape: 'triangle', number: 3 }, // Not Blue + Odd -> FAIL
    { id: 208, color: 'yellow', shape: 'square', number: 9 }, // Not Blue + Odd -> FAIL
  ];
  const [s2TestedCard, setS2TestedCard] = useState<CardItem | null>(null);
  const [s2PassedCards, setS2PassedCards] = useState<number[]>([]);
  const [s2Feedback, setS2Feedback] = useState<string>('');
  const [s2Done, setS2Done] = useState<boolean>(false);

  // --- STAGE 3 STATE: OR (Số < 5 HOẶC Chia hết cho 4) ---
  const s3Numbers = [2, 4, 5, 6, 8, 9, 12];
  const [s3Selected, setS3Selected] = useState<number[]>([]);
  const [s3TestedNumber, setS3TestedNumber] = useState<number | null>(null);
  const [s3Feedback, setS3Feedback] = useState<string>('');
  const [s3Done, setS3Done] = useState<boolean>(false);

  // --- STAGE 4 STATE: NOT (KHÔNG PHẢI HÌNH VUÔNG) ---
  const s4Cards: CardItem[] = [
    { id: 401, color: 'red', shape: 'circle', number: 3 },
    { id: 402, color: 'blue', shape: 'square', number: 4 },
    { id: 403, color: 'yellow', shape: 'triangle', number: 1 },
    { id: 404, color: 'blue', shape: 'circle', number: 6 },
    { id: 405, color: 'red', shape: 'square', number: 7 },
    { id: 406, color: 'yellow', shape: 'circle', number: 8 },
    { id: 407, color: 'yellow', shape: 'square', number: 2 },
    { id: 408, color: 'red', shape: 'triangle', number: 5 },
    { id: 409, color: 'blue', shape: 'triangle', number: 9 },
  ];
  const [s4PassedCards, setS4PassedCards] = useState<number[]>([]);
  const [s4Feedback, setS4Feedback] = useState<string>('');
  const [s4Done, setS4Done] = useState<boolean>(false);

  // --- STAGE 5 STATE: BOSS (Multi-Step Filter + Bonus 3 Conditions) ---
  const s5BossCards: CardItem[] = [
    { id: 501, label: 'Thẻ A', color: 'red', shape: 'circle', number: 3 },
    { id: 502, label: 'Thẻ B', color: 'red', shape: 'square', number: 6 },
    { id: 503, label: 'Thẻ C', color: 'blue', shape: 'circle', number: 5 },
    { id: 504, label: 'Thẻ D', color: 'blue', shape: 'square', number: 8 },
  ];
  // Sub-step: 1 = Filter Red, 2 = Eliminate Square, 3 = Pick final winner, 4 = Bonus Challenge
  const [s5Step, setS5Step] = useState<number>(1);
  const [s5Step1Selected, setS5Step1Selected] = useState<number[]>([]);
  const [s5Step2Eliminated, setS5Step2Eliminated] = useState<number[]>([]);
  const [s5FinalChoice, setS5FinalChoice] = useState<number | null>(null);
  const [s5Feedback, setS5Feedback] = useState<string>('');

  // Bonus 3 conditions in Stage 5: Chẵn VÀ >11 VÀ <20. Numbers: 10, 12, 15, 18, 21, 24.
  const s5BonusNumbers = [10, 12, 15, 18, 21, 24];
  const [s5BonusSelected, setS5BonusSelected] = useState<number[]>([]);
  const [s5BonusTested, setS5BonusTested] = useState<number | null>(null);
  const [s5BonusFeedback, setS5BonusFeedback] = useState<string>('');
  const [s5BonusDone, setS5BonusDone] = useState<boolean>(false);

  // Initialize and check unlock status on mount
  useEffect(() => {
    const explored = storage.getExploredSimulations();
    const completed = storage.getCompletedLessons();
    const allAnswers = storage.getAnswers();
    const q1to7Done = ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07'].filter(
      (id) => allAnswers[id]?.isCorrect
    ).length;
    const patternMissionDone =
      localStorage.getItem('week01.missions.pattern.completed') === 'true' ||
      localStorage.getItem('week01.pattern.completed') === 'true' ||
      explored.includes('pattern') ||
      completed.includes('pattern') ||
      q1to7Done >= 4;

    // Unlocked if Mission 1 is done
    setIsUnlocked(patternMissionDone);
  }, []);

  // Save stars & completion helper
  const awardStageStars = (stageNum: number) => {
    let earned = 3;
    if (hintLevel === 1) earned = 2;
    else if (hintLevel >= 2) earned = 1;

    const existingStars = stageStars[stageNum] || 0;
    const finalStars = Math.max(existingStars, earned);

    const updatedStars = { ...stageStars, [stageNum]: finalStars };
    setStageStars(updatedStars);
    localStorage.setItem('week01.logic.stars', JSON.stringify(updatedStars));

    const updatedDone = { ...stagesDone, [stageNum]: true };
    setStagesDone(updatedDone);
    localStorage.setItem('week01.logic.stages_done', JSON.stringify(updatedDone));

    // Save individual stage diagnostics
    const stageKey = `week01.logic.stage0${stageNum}`;
    const prev = JSON.parse(localStorage.getItem(stageKey) || '{}');
    localStorage.setItem(
      stageKey,
      JSON.stringify({
        ...prev,
        stageId: stageNum,
        stars: finalStars,
        completed: true,
        hintLevel,
      })
    );
  };

  // Reset hint when stage changes
  const switchStage = (st: number) => {
    setCurrentStage(st);
    setHintLevel(0);
    setShowHintBox(false);
  };

  // --- STAGE 1 HANDLERS ---
  const handleS1CardClick = (card: CardItem) => {
    if (s1Done) return;

    if (card.color === 'blue') {
      if (!s1Selected.includes(card.id)) {
        const next = [...s1Selected, card.id];
        setS1Selected(next);
        setS1Feedback('✅ Đúng rồi! Thẻ này màu Xanh.');
        // If all 3 blue cards are selected (ids 2, 3, 5)
        if (next.length === 3) {
          setS1Done(true);
          awardStageStars(1);
          triggerConfetti();
          setS1Feedback('🎉 Tuyệt! Con đã biết kiểm tra một điều kiện.');
        }
      }
    } else {
      setS1Feedback('🤔 Cổng đang cần màu Xanh. Con nhìn lại màu của thẻ nhé.');
      // Record misconception for teacher view
      localStorage.setItem('week01.logic.stage01.misconception', 'ignores_single_condition');
    }
  };

  // --- STAGE 2 HANDLERS ---
  const handleS2TestCard = (card: CardItem) => {
    setS2TestedCard(card);
    const isBlue = card.color === 'blue';
    const isEven = card.number % 2 === 0;
    const canPass = isBlue && isEven;

    if (canPass) {
      if (!s2PassedCards.includes(card.id)) {
        const next = [...s2PassedCards, card.id];
        setS2PassedCards(next);
        setS2Feedback(
          `✅ Cửa 1 (Màu Xanh): Đúng | Cửa 2 (Số chẵn): Đúng. Cả hai điều kiện đều đúng nên thẻ ${card.number} được qua cổng!`
        );
        // Both 201 and 202 passed
        if (next.length >= 2) {
          setS2Done(true);
          awardStageStars(2);
          triggerConfetti();
        }
      } else {
        setS2Feedback(`Thẻ ${card.number} đã vượt qua cổng rồi!`);
      }
    } else {
      // Diagnostic check for misconception: student thought partial match was enough
      if (isBlue && !isEven) {
        setS2Feedback(
          `Cửa 1 (Màu Xanh): Đúng | Cửa 2 (Số chẵn): Sai (số ${card.number} là số lẻ). Với từ VÀ, tất cả điều kiện đều phải đúng mới được qua!`
        );
        localStorage.setItem('week01.logic.stage02.misconception', 'logic_and_partial');
      } else if (!isBlue && isEven) {
        setS2Feedback(
          `Cửa 1 (Màu Xanh): Sai (thẻ màu ${card.color === 'red' ? 'Đỏ' : 'Vàng'}) | Cửa 2 (Số chẵn): Đúng. Với từ VÀ, tất cả điều kiện đều phải đúng mới được qua!`
        );
        localStorage.setItem('week01.logic.stage02.misconception', 'logic_and_partial');
      } else {
        setS2Feedback(
          `Cửa 1 (Màu Xanh): Sai | Cửa 2 (Số chẵn): Sai. Cả hai điều kiện đều sai nên bị chặn lại.`
        );
      }
    }
  };

  // --- STAGE 3 HANDLERS ---
  const handleS3TestNumber = (num: number) => {
    setS3TestedNumber(num);
    const cond1 = num < 5;
    const cond2 = num % 4 === 0;
    const canPass = cond1 || cond2;

    if (canPass) {
      if (!s3Selected.includes(num)) {
        const next = [...s3Selected, num];
        setS3Selected(next);

        if (num === 4) {
          setS3Feedback(
            '👀 Số 4 vượt qua CẢ HAI cửa (< 5 và chia hết cho 4). Đúng cả hai vẫn được chọn.'
          );
        } else {
          setS3Feedback(
            `✅ Số ${num} thỏa mãn ít nhất một cửa nên được qua cổng! Đúng cả hai vẫn được chọn.`
          );
        }

        // Correct passing numbers are 2, 4, 8, 12 (4 numbers)
        if (next.length >= 4 && [2, 4, 8, 12].every((n) => next.includes(n))) {
          setS3Done(true);
          awardStageStars(3);
          triggerConfetti();
          setTimeout(() => {
            setConfidenceStage(3);
            setShowConfidenceModal(true);
          }, 1000);
        }
      }
    } else {
      setS3Feedback(`Số ${num} không nhỏ hơn 5 và cũng không chia hết cho 4, nên bị dừng lại.`);
      localStorage.setItem('week01.logic.stage03.misconception', 'or_invalid_candidate');
    }
  };

  // --- STAGE 4 HANDLERS ---
  const handleS4CardClick = (card: CardItem) => {
    const isSquare = card.shape === 'square';
    if (isSquare) {
      setS4Feedback('🚫 Thẻ này mang đặc điểm bị cấm (hình Vuông) nên phải dừng lại!');
      localStorage.setItem('week01.logic.stage04.misconception', 'not_confusion');
    } else {
      if (!s4PassedCards.includes(card.id)) {
        const next = [...s4PassedCards, card.id];
        setS4PassedCards(next);
        setS4Feedback('✅ Đúng rồi! Thẻ này không mang đặc điểm bị cấm.');
        // 6 non-square cards (3 circles + 3 triangles)
        if (next.length === 6) {
          setS4Done(true);
          awardStageStars(4);
          triggerConfetti();
        }
      }
    }
  };

  // --- STAGE 5 HANDLERS ---
  const handleS5Step1Toggle = (cardId: number) => {
    if (s5Step1Selected.includes(cardId)) {
      setS5Step1Selected(s5Step1Selected.filter((id) => id !== cardId));
    } else {
      setS5Step1Selected([...s5Step1Selected, cardId]);
    }
  };

  const handleS5Step1Confirm = () => {
    // Red cards are 501 (A) and 502 (B)
    const isCorrect =
      s5Step1Selected.length === 2 &&
      s5Step1Selected.includes(501) &&
      s5Step1Selected.includes(502);

    if (isCorrect) {
      setS5Feedback('✅ Tuyệt vời! Con đã lọc đúng hai thẻ màu ĐỎ (Thẻ A và Thẻ B).');
      setS5Step(2);
    } else {
      setS5Feedback('Con nhìn lại màu sắc: Chỉ giữ lại những thẻ có màu ĐỎ (Thẻ A và Thẻ B) nhé!');
      localStorage.setItem('week01.logic.stage05.misconception', 'skips_filtering');
    }
  };

  const handleS5Step2Eliminate = (cardId: number) => {
    if (cardId === 502) {
      // 502 is Card B (Square) -> eliminate!
      setS5Step2Eliminated([502]);
      setS5Feedback('✅ Chính xác! Thẻ B có hình Vuông nên bị loại bỏ.');
      setTimeout(() => {
        setS5Step(3);
      }, 700);
    } else {
      setS5Feedback('Thẻ A có hình Tròn, đâu phải hình Vuông! Con chỉ loại thẻ có hình Vuông thôi.');
    }
  };

  const handleS5FinalSelect = (cardId: number) => {
    setS5FinalChoice(cardId);
    if (cardId === 501) {
      // 501 is Card A
      setS5Feedback('🎯 Xuất sắc! Con không cần đoán. Chỉ cần lọc từng điều kiện là tìm ra Thẻ A!');
      awardStageStars(5);
      triggerConfetti();
      setTimeout(() => {
        setS5Step(4); // Advance to bonus challenge
      }, 1200);
    } else {
      setS5Feedback('Chưa đúng rồi. Sau khi lọc màu Đỏ và bỏ hình Vuông, chỉ còn lại Thẻ A thôi!');
    }
  };

  // Bonus 3 conditions handler
  const handleS5BonusTestNumber = (num: number) => {
    setS5BonusTested(num);
    const condEven = num % 2 === 0;
    const condGreater = num > 11;
    const condLess = num < 20;
    const passAll = condEven && condGreater && condLess;

    if (passAll) {
      if (!s5BonusSelected.includes(num)) {
        const next = [...s5BonusSelected, num];
        setS5BonusSelected(next);
        setS5BonusFeedback(`✅ Tuyệt vời! Số ${num} là số chẵn, lớn hơn 11 VÀ nhỏ hơn 20.`);

        if (next.length >= 2 && next.includes(12) && next.includes(18)) {
          setS5BonusDone(true);
          triggerBigWinConfetti();
          setTimeout(() => {
            setConfidenceStage(5);
            setShowConfidenceModal(true);
          }, 1000);
        }
      }
    } else {
      setS5BonusFeedback(`Số ${num} chưa thỏa mãn đủ cả 3 điều kiện cùng lúc.`);
    }
  };

  // Completion of Mission 2
  const handleFinishMission = () => {
    storage.markSimulationExplored('logic');
    storage.markLessonComplete('logic');
    localStorage.setItem('week01.missions.logic.completed', 'true');
    localStorage.setItem('week01.logic.completed', 'true');
    localStorage.setItem('week01.missions.machine.unlocked', 'true');
    localStorage.setItem('week01.badges.nguoi_gac_cong', 'true');
    setCurrentStage(6);
    triggerBigWinConfetti();
  };

  // Handle confidence selection
  const handleSelectConfidence = (level: 'confident' | 'guessing' | 'confused') => {
    const key = `week01.logic.stage0${confidenceStage}.confidence`;
    localStorage.setItem(key, level);
    setShowConfidenceModal(false);

    if (confidenceStage === 3) {
      switchStage(4);
    } else if (confidenceStage === 5) {
      handleFinishMission();
    }
  };

  // Total stars calculated
  const totalEarnedStars = Object.values(stageStars).reduce((a: number, b: number) => a + b, 0);

  // SVG Shape renderer
  const renderShapeIcon = (shape: string, color: string) => {
    const colorClasses =
      color === 'blue'
        ? 'fill-blue-500 stroke-blue-600'
        : color === 'red'
        ? 'fill-rose-500 stroke-rose-600'
        : 'fill-amber-400 stroke-amber-500';

    if (shape === 'circle') {
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-xs">
          <circle cx="20" cy="20" r="16" className={colorClasses} strokeWidth="2.5" />
        </svg>
      );
    }
    if (shape === 'square') {
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-xs">
          <rect x="5" y="5" width="30" height="30" rx="4" className={colorClasses} strokeWidth="2.5" />
        </svg>
      );
    }
    // triangle
    return (
      <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-xs">
        <polygon points="20,4 36,36 4,36" className={colorClasses} strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    );
  };

  // Hints per stage
  const stageHints: Record<number, string[]> = {
    1: [
      'Gợi ý 1: Nhìn vào màu sắc của thẻ trước tiên.',
      'Gợi ý 2: Cổng chỉ nhận màu xanh dương. Hãy bỏ qua thẻ màu đỏ và màu vàng.',
      'Cùng làm nhé: Thẻ số 4, số 5 và số 8 đều có màu Xanh!',
    ],
    2: [
      'Gợi ý 1: Kiểm tra từng cửa một cách riêng biệt.',
      'Gợi ý 2: Với từ VÀ, cả hai cửa đều phải ĐÚNG (vừa màu Xanh, vừa số Chẵn).',
      'Cùng làm nhé: Thẻ Xanh số 4 và thẻ Xanh số 6 đều là số chẵn!',
    ],
    3: [
      'Gợi ý 1: Với luật HOẶC, chỉ cần vượt qua ÍT NHẤT MỘT cửa là được.',
      'Gợi ý 2: Thẻ thỏa mãn CẢ HAI cửa (như số 4) vẫn được chọn nhé!',
      'Cùng làm nhé: Số 2 (< 5), số 4 (< 5 và chia hết cho 4), số 8 và 12 (chia hết cho 4) đều được qua.',
    ],
    4: [
      'Gợi ý 1: Tìm đặc điểm bị cấm trước.',
      'Gợi ý 2: Biển cấm hình Vuông, nên ta loại bỏ tất cả các thẻ hình Vuông.',
      'Cùng làm nhé: Tất cả các thẻ hình Tròn và Tam giác đều được đi qua cổng!',
    ],
    5: [
      'Gợi ý 1: Đừng đoán mò! Hãy lọc lần lượt từng điều kiện.',
      'Gợi ý 2: Bước 1 tìm màu Đỏ trước (Thẻ A, B). Bước 2 loại thẻ Vuông (Thẻ B).',
      'Cùng làm nhé: Sau hai bước lọc, chỉ còn lại Thẻ A!',
    ],
  };

  // --- RENDER LOCKED SCREEN IF MISSION 1 IS NOT DONE ---
  if (!isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto">
          🔒
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          Cổng Logic đang đóng
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Con hãy hoàn thành <strong>Nhiệm vụ 1 • Phòng Quan sát</strong> trước để nhận chiếc chìa khóa thông minh mở Cổng Logic nhé!
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate?.('/sim/pattern')}
            className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center gap-2 mx-auto cursor-pointer shadow-sm"
          >
            <span>🔍 Đến Phòng Quan sát ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER SCREEN 0: INTRO ---
  if (currentStage === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/20">
            <span>Nhiệm vụ 2 • Chọn đúng để mở cổng 🚦</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl sm:text-5xl shadow-inner shrink-0">
              🤖
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Cổng Logic
              </h1>
              <p className="text-sm sm:text-base text-blue-100 font-medium">
                “Chào Thám tử! Có rất nhiều thẻ bài muốn đi qua cổng. Con hãy giúp chọn đúng thẻ nhé!”
              </p>
            </div>
          </div>

          {/* 5 Dots Indicator */}
          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold text-blue-200 mr-1">5 Cửa ải:</span>
            {[1, 2, 3, 4, 5].map((st) => (
              <span
                key={st}
                className={`w-3 h-3 rounded-full transition-all ${
                  stagesDone[st]
                    ? 'bg-emerald-400 ring-2 ring-emerald-300'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => switchStage(1)}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform"
            >
              <span>🚪 Mở cổng đầu tiên</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Cards Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="text-lg">🔎</div>
            <div className="font-black text-sm text-slate-900">Kiểm tra từng điều kiện</div>
            <div className="text-xs text-slate-500">Xem xét màu, hình, số một cách cẩn thận.</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="text-lg">⚖️</div>
            <div className="font-black text-sm text-slate-900">VÀ – HOẶC – KHÔNG</div>
            <div className="text-xs text-slate-500">Khám phá quy luật kỳ diệu bằng trực giác.</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="text-lg">🛡️</div>
            <div className="font-black text-sm text-slate-900">Huy hiệu Người Gác Cổng</div>
            <div className="text-xs text-slate-500">Mở khóa Xưởng Robot sau khi hoàn thành.</div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER SCREEN 6: CELEBRATION ---
  if (currentStage === 6) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12 text-center">
        <div className="bg-white rounded-3xl border-2 border-emerald-300 p-6 sm:p-8 shadow-md space-y-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-4xl sm:text-5xl mx-auto shadow-xs">
            🛡️
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              NHIỆM VỤ HOÀN THÀNH
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              🎉 Con đã mở được tất cả Cổng Logic!
            </h2>
            <p className="text-sm text-slate-600 font-medium max-w-md mx-auto">
              Huy hiệu danh dự: <strong>NGƯỜI GÁC CỔNG</strong> 🛡️
            </p>
          </div>

          {/* 3 Key Takeaways */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 max-w-md mx-auto text-xs sm:text-sm text-slate-700 font-semibold">
            <div className="font-black text-slate-900 mb-1 text-center sm:text-left">
              3 điều Thám tử vừa làm chủ:
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kiểm tra từng điều kiện riêng biệt.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hiểu sâu sắc cách hoạt động của VÀ – HOẶC – KHÔNG.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Lọc từng bước cẩn thận thay vì đoán mò.</span>
            </div>
          </div>

          {/* Stars tally */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-sm">
            <span>⭐ Sao khám phá đã đạt:</span>
            <span className="text-amber-600 text-base">{totalEarnedStars} / 15</span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('/sim/machine')}
              className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform active:scale-95"
            >
              <span>🤖 Đi đến Xưởng Robot</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('/')}
              className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>🏠 Về Trang chủ</span>
            </button>

            <button
              type="button"
              onClick={() => switchStage(1)}
              className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi lại</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN ACTIVE STAGES (1 to 5) ---
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* TOP HEADER: Title + 5 Dots Progress + Star Pill */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black shrink-0">
            🚦
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Cổng Logic
            </h1>
            <div className="text-xs text-slate-500 font-semibold">
              Nhiệm vụ 2 • Chọn đúng để mở cổng
            </div>
          </div>
        </div>

        {/* 5 Dots Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm sm:text-base">
            {[1, 2, 3, 4, 5].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  if (stagesDone[st] || stagesDone[st - 1] || st === 1) {
                    switchStage(st);
                  }
                }}
                className={`px-1.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  currentStage === st
                    ? 'text-amber-600 scale-125 font-black'
                    : stagesDone[st]
                    ? 'text-emerald-500 hover:scale-110'
                    : 'text-slate-300'
                }`}
                title={`Cửa ải ${st}`}
              >
                ●
              </button>
            ))}
          </div>

          <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black flex items-center gap-1 ml-2">
            <span>⭐</span>
            <span>{totalEarnedStars}/15</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          STAGE 1: MỘT CỔNG ĐƠN GIẢN (CHỈ THẺ MÀU XANH ĐƯỢC QUA)
      ========================================================================= */}
      {currentStage === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Gate Sign */}
            <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔵</span>
                <div>
                  <div className="text-xs font-black text-blue-600 uppercase tracking-wide">
                    CỬA ẢI 1 • KIỂM TRA MỘT ĐIỀU KIỆN
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900">
                    CHỈ THẺ MÀU XANH ĐƯỢC QUA
                  </div>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                Đã chọn: {s1Selected.length}/3 thẻ
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Con bấm vào các thẻ có thể đi qua cổng nhé:
            </p>

            {/* 6 Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {s1Cards.map((card) => {
                const isSelected = s1Selected.includes(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleS1CardClick(card)}
                    className={`min-h-[110px] sm:min-h-[120px] p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 ring-4 ring-emerald-200 scale-102 shadow-sm'
                        : card.color === 'blue'
                        ? 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
                        : card.color === 'red'
                        ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                        : 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                        ✓
                      </span>
                    )}
                    {renderShapeIcon(card.shape, card.color)}
                    <span className="text-base sm:text-lg font-black text-slate-800">
                      Số {card.number}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Immediate Feedback Banner */}
            {s1Feedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                  s1Done
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : s1Feedback.startsWith('✅')
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <span>{s1Feedback}</span>
              </div>
            )}

            {/* Next stage button */}
            {s1Done && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => switchStage(2)}
                  className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-transform"
                >
                  <span>Đi tiếp sang Cổng VÀ →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: CỔNG VÀ (AND: MÀU XANH VÀ SỐ CHẴN)
      ========================================================================= */}
      {currentStage === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Gate Sign with 2 Lights and "VÀ" */}
            <div className="p-4 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
              {/* Light 1 */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 w-full sm:w-auto justify-center">
                <span className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                <span className="text-xs sm:text-sm font-black text-blue-200">
                  MÀU XANH
                </span>
              </div>

              {/* Big "VÀ" */}
              <div className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-sm">
                VÀ
              </div>

              {/* Light 2 */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 w-full sm:w-auto justify-center">
                <span className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                <span className="text-xs sm:text-sm font-black text-emerald-200">
                  SỐ CHẴN
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Muốn qua cổng, mỗi thẻ phải vượt qua <strong>CẢ HAI</strong> cửa. Con bấm vào từng thẻ để thử nhé!
            </p>

            {/* 8 Cards to test */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {s2Cards.map((card) => {
                const isPassed = s2PassedCards.includes(card.id);
                const isCurrent = s2TestedCard?.id === card.id;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleS2TestCard(card)}
                    className={`min-h-[105px] p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                      isPassed
                        ? 'border-emerald-500 bg-emerald-50/70 ring-3 ring-emerald-200 shadow-sm'
                        : isCurrent
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {isPassed && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    )}
                    {renderShapeIcon(card.shape, card.color)}
                    <span className="text-sm sm:text-base font-black text-slate-800">
                      Số {card.number}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Inspection Checklist Box when a card is clicked */}
            {s2TestedCard && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span>
                    Đang kiểm tra: Thẻ số {s2TestedCard.number} ({s2TestedCard.color === 'blue' ? 'Màu xanh' : s2TestedCard.color === 'red' ? 'Màu đỏ' : 'Màu vàng'})
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Bảng kiểm định
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>1. Màu Xanh:</span>
                    <span>
                      {s2TestedCard.color === 'blue' ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Đúng
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Sai
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>2. Số Chẵn:</span>
                    <span>
                      {s2TestedCard.number % 2 === 0 ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Đúng
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Sai
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-xs font-bold">
                  {s2TestedCard.color === 'blue' && s2TestedCard.number % 2 === 0 ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      🚪 CẢ HAI CỬA ĐỀU ĐÚNG → ĐƯỢC QUA CỔNG!
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1">
                      🚫 CHƯA ĐẠT CẢ HAI CỬA → BỊ CHẶN LẠI!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Immediate Feedback */}
            {s2Feedback && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm font-semibold text-blue-900">
                {s2Feedback}
              </div>
            )}

            {/* Discovery Revelation Card */}
            {(s2PassedCards.length > 0 || s2Done) && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>🧠 Con vừa khám phá quy luật VÀ:</span>
                </div>
                <p className="text-xs sm:text-sm text-indigo-950 font-medium">
                  Với từ <strong>VÀ</strong>, tất cả điều kiện đều phải đúng thì mới được chọn.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[11px] font-bold text-center">
                  <div className="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700">
                    Đúng + Đúng → 🎉 ĐƯỢC
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-700">
                    Đúng + Sai → 🚫 DỪNG
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-700">
                    Sai + Đúng → 🚫 DỪNG
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-700">
                    Sai + Sai → 🚫 DỪNG
                  </div>
                </div>
              </div>
            )}

            {/* Next stage button */}
            {s2Done && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => switchStage(3)}
                  className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-transform"
                >
                  <span>Đi tiếp sang Cổng HOẶC →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 3: CỔNG HOẶC (OR: NHỎ HƠN 5 HOẶC CHIA HẾT CHO 4)
      ========================================================================= */}
      {currentStage === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Gate Sign with HOẶC */}
            <div className="p-4 rounded-3xl bg-amber-500 text-white flex flex-col sm:flex-row items-center justify-around gap-3 text-center shadow-xs">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/20 border border-white/30 text-xs sm:text-sm font-black">
                Số nhỏ hơn 5 (&lt; 5)
              </div>

              <div className="px-4 py-1 rounded-xl bg-slate-950 text-white font-black text-sm sm:text-base">
                HOẶC
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-white/20 border border-white/30 text-xs sm:text-sm font-black">
                Chia hết cho 4 (4, 8, 12...)
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Lần này chỉ cần vượt qua <strong>ÍT NHẤT MỘT</strong> cửa là được. Con bấm thử các số nhé:
            </p>

            {/* Number Cards Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {s3Numbers.map((num) => {
                const isSelected = s3Selected.includes(num);
                const isCurrent = s3TestedNumber === num;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleS3TestNumber(num)}
                    className={`min-h-[85px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 ring-3 ring-emerald-200 shadow-sm'
                        : isCurrent
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    )}
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">
                      {num}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {isSelected ? 'ĐÃ QUA' : 'Thử'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Inspection Checklist for tested number */}
            {s3TestedNumber !== null && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="font-black text-slate-700">
                  Kiểm tra số {s3TestedNumber}:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>Nhỏ hơn 5:</span>
                    <span>
                      {s3TestedNumber < 5 ? (
                        <span className="text-emerald-600 font-bold">✅ Đúng</span>
                      ) : (
                        <span className="text-slate-400">❌ Không</span>
                      )}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>Chia hết cho 4:</span>
                    <span>
                      {s3TestedNumber % 4 === 0 ? (
                        <span className="text-emerald-600 font-bold">✅ Đúng</span>
                      ) : (
                        <span className="text-slate-400">❌ Không</span>
                      )}
                    </span>
                  </div>
                </div>

                {s3TestedNumber === 4 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                    👀 Số 4 vượt qua CẢ HAI cửa (&lt; 5 và chia hết cho 4). Đúng cả hai vẫn được chọn.
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            {s3Feedback && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm font-semibold text-blue-900">
                {s3Feedback}
              </div>
            )}

            {/* Discovery Revelation Box */}
            {(s3Selected.length > 0 || s3Done) && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>🧠 Con vừa khám phá quy luật HOẶC:</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-950 font-medium">
                  Với <strong>HOẶC</strong>, chỉ cần ít nhất một điều kiện đúng là được qua. <strong>Đúng cả hai vẫn được chọn.</strong>
                </p>
              </div>
            )}

            {/* Next button */}
            {s3Done && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => switchStage(4)}
                  className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-transform"
                >
                  <span>Đi tiếp sang Cổng KHÔNG →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 4: CỔNG KHÔNG (NOT: KHÔNG PHẢI HÌNH VUÔNG)
      ========================================================================= */}
      {currentStage === 4 && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Gate Sign: Prohibition Sign */}
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl font-black shrink-0">
                  🚫
                </div>
                <div>
                  <div className="text-xs font-black text-rose-600 uppercase tracking-wide">
                    CỬA ẢI 4 • LUẬT KHÔNG (LOẠI BỎ ĐẶC ĐIỂM BỊ CẤM)
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900">
                    KHÔNG PHẢI HÌNH VUÔNG
                  </div>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                Đã chọn: {s4PassedCards.length}/6 thẻ
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Hãy bấm vào tất cả các thẻ <strong>KHÔNG</strong> mang hình Vuông để cho qua cổng:
            </p>

            {/* 9 Cards Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {s4Cards.map((card) => {
                const isPassed = s4PassedCards.includes(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleS4CardClick(card)}
                    className={`min-h-[105px] p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                      isPassed
                        ? 'border-emerald-500 bg-emerald-50/70 ring-3 ring-emerald-200 shadow-sm'
                        : card.shape === 'square'
                        ? 'border-slate-200 bg-slate-50/40 hover:border-rose-300'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    {isPassed && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    )}
                    {renderShapeIcon(card.shape, card.color)}
                    <span className="text-xs sm:text-sm font-black text-slate-800">
                      Số {card.number}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {s4Feedback && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm font-semibold text-blue-900">
                {s4Feedback}
              </div>
            )}

            {/* Discovery Card */}
            {(s4PassedCards.length > 0 || s4Done) && (
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>🧠 Con vừa khám phá quy luật KHÔNG:</span>
                </div>
                <p className="text-xs sm:text-sm text-rose-950 font-medium">
                  Từ <strong>KHÔNG</strong> có nghĩa là loại bỏ những thứ có đặc điểm bị cấm. Chỉ những thứ còn lại mới được qua cổng.
                </p>
              </div>
            )}

            {/* Next stage button */}
            {s4Done && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => switchStage(5)}
                  className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-transform"
                >
                  <span>Đi tiếp sang Cổng Bí Mật (Boss) →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 5: CỔNG BÍ MẬT (BOSS: LỌC TỪNG BƯỚC + BONUS CHALLENGE)
      ========================================================================= */}
      {currentStage === 5 && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Gate Secret Rule Sign */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <div className="text-xs font-black text-amber-400 uppercase tracking-wide">
                  CỔNG BÍ MẬT (BOSS) • LỌC TỪNG BƯỚC
                </div>
                <div className="text-base sm:text-lg font-black text-white mt-0.5">
                  🔐 MÀU ĐỎ &nbsp;VÀ&nbsp; KHÔNG PHẢI HÌNH VUÔNG
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold shrink-0">
                {s5Step <= 3 ? `Bước lọc ${s5Step}/3` : '🌟 Thử thách nâng cao'}
              </div>
            </div>

            {/* Steps 1 to 3: Guided decomposition */}
            {s5Step <= 3 && (
              <div className="space-y-4">
                {/* 4 Cards A, B, C, D */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {s5BossCards.map((card) => {
                    const isStep1Selected = s5Step1Selected.includes(card.id);
                    const isStep2Eliminated = s5Step2Eliminated.includes(card.id);
                    const isStep1Kept = card.color === 'red';
                    const isGrayedOut = s5Step >= 2 && !isStep1Kept;

                    return (
                      <div
                        key={card.id}
                        className={`min-h-[130px] p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all relative ${
                          isStep2Eliminated
                            ? 'opacity-30 border-slate-300 bg-slate-100 line-through'
                            : isGrayedOut
                            ? 'opacity-25 border-slate-200 bg-slate-100'
                            : isStep1Selected
                            ? 'border-rose-400 bg-rose-50/70 ring-3 ring-rose-200'
                            : 'border-slate-200 bg-white shadow-2xs'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-500">
                          {card.label}
                        </span>
                        {renderShapeIcon(card.shape, card.color)}
                        <span className="text-xs font-bold text-slate-700">
                          {card.color === 'red' ? 'Màu đỏ' : 'Màu xanh'} •{' '}
                          {card.shape === 'circle' ? 'Hình tròn' : 'Hình vuông'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Substep 1: Filter Red */}
                {s5Step === 1 && (
                  <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-3">
                    <div className="font-black text-xs sm:text-sm text-rose-950">
                      👉 Bước 1: Chọn tất cả các thẻ có màu ĐỎ để giữ lại.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s5BossCards.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleS5Step1Toggle(card.id)}
                          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            s5Step1Selected.includes(card.id)
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Giữ {card.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleS5Step1Confirm}
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-xs"
                      >
                        Xác nhận Bước 1 →
                      </button>
                    </div>
                  </div>
                )}

                {/* Substep 2: Eliminate Square */}
                {s5Step === 2 && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                    <div className="font-black text-xs sm:text-sm text-amber-950">
                      👉 Bước 2: Trong các thẻ Đỏ còn lại (Thẻ A và Thẻ B), bấm vào thẻ có hình VUÔNG để gạt bỏ:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleS5Step2Eliminate(501)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        Gạt bỏ Thẻ A (Hình tròn)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleS5Step2Eliminate(502)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-bold text-xs hover:bg-rose-100 cursor-pointer"
                      >
                        Gạt bỏ Thẻ B (Hình vuông)
                      </button>
                    </div>
                  </div>
                )}

                {/* Substep 3: Final Winner Pick */}
                {s5Step === 3 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                    <div className="font-black text-xs sm:text-sm text-emerald-950">
                      👉 Bước 3: Thẻ nào là thẻ duy nhất được qua cổng?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s5BossCards.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleS5FinalSelect(card.id)}
                          className={`min-h-[44px] px-5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                            s5FinalChoice === card.id
                              ? card.id === 501
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-rose-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Chọn {card.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Substep 4: BONUS CHALLENGE (3 điều kiện VÀ cùng lúc) */}
            {s5Step === 4 && (
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-indigo-700 uppercase">
                    🌟 Thử sức nâng cao • Cổng 3 điều kiện
                  </span>
                  <div className="p-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-black flex flex-wrap items-center justify-center gap-2">
                    <span>SỐ CHẴN</span>
                    <span className="text-amber-400 font-bold">• VÀ •</span>
                    <span>LỚN HƠN 11</span>
                    <span className="text-amber-400 font-bold">• VÀ •</span>
                    <span>NHỎ HƠN 20</span>
                  </div>
                </div>

                <p className="text-xs text-indigo-950 font-medium">
                  Hãy bấm vào các số thỏa mãn <strong>ĐỒNG THỜI CẢ 3 ĐIỀU KIỆN</strong> trên:
                </p>

                {/* 6 Bonus Numbers */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {s5BonusNumbers.map((num) => {
                    const isSelected = s5BonusSelected.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleS5BonusTestNumber(num)}
                        className={`min-h-[75px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 ring-3 ring-emerald-200'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-xl sm:text-2xl font-black text-slate-800">
                          {num}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {isSelected ? '✅ ĐẠT' : 'Thử'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {s5BonusFeedback && (
                  <div className="p-3 rounded-xl bg-white border border-indigo-200 text-xs font-semibold text-indigo-950">
                    {s5BonusFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Boss Feedback */}
            {s5Feedback && s5Step <= 3 && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm font-semibold text-blue-900">
                {s5Feedback}
              </div>
            )}

            {/* Finish Action at Step 4 */}
            {s5Step === 4 && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-semibold text-center sm:text-left">
                  {s5BonusDone
                    ? '🎉 Xuất sắc! Con đã giải được cả bài toán mở rộng 3 điều kiện.'
                    : 'Con đã vượt qua Cổng Bí Mật! Con có thể thử nốt các số mở rộng hoặc nhận huy hiệu ngay.'}
                </div>
                <button
                  type="button"
                  onClick={handleFinishMission}
                  className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform shrink-0"
                >
                  <span>🎉 Nhận Huy hiệu Người Gác Cổng →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          "💡 CON ĐANG BÍ" BUTTON & 3-LEVEL HINT ACCORDION
          Placed directly below the problem area in every stage
      ========================================================================= */}
      {currentStage >= 1 && currentStage <= 5 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setShowHintBox(!showHintBox);
                if (!showHintBox && hintLevel === 0) {
                  setHintLevel(1);
                }
              }}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>💡 Con đang bí (Bấm để nhận trợ giúp)</span>
            </button>
          </div>

          {/* Hint Expansion Box */}
          {showHintBox && (
            <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-950 flex items-center gap-1">
                  <span>Trợ giúp Thám tử • Mức {hintLevel}/3</span>
                </span>
                <span className="text-[11px] text-amber-700">
                  {hintLevel === 1
                    ? '⭐ Giữ được 2 sao'
                    : '⭐ Giữ được 1 sao'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-amber-200 text-slate-800 leading-relaxed font-medium">
                {stageHints[currentStage]?.[hintLevel - 1] || 'Hãy quan sát kỹ các thẻ bài nhé!'}
              </div>

              {hintLevel < 3 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setHintLevel(hintLevel + 1)}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs cursor-pointer"
                  >
                    Gợi ý thêm một chút nữa →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CONFIDENCE CHECK MODAL
      ========================================================================= */}
      {showConfidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mx-auto">
              🤔
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-base">
                Con thấy phần này thế nào?
              </h3>
              <p className="text-xs text-slate-500">
                Chia sẻ cảm nghĩ thật để hệ thống đồng hành cùng con tốt hơn nhé.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleSelectConfidence('confident')}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>😎 Con biết cách làm</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectConfidence('guessing')}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>🤔 Con phải thử một chút</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectConfidence('confused')}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>🆘 Con vẫn chưa hiểu lắm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
