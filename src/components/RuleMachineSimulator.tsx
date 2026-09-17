import { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Award,
  Lock,
  ChevronRight,
  Check,
  Split,
  Eye,
  Settings,
  Flame,
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { storage } from '../utils/storage';

interface RuleMachineSimulatorProps {
  onNavigate?: (path: string) => void;
}

interface StageState {
  stageId: number;
  attempts: number;
  wrongChoices: string[];
  testedInputs: number[];
  hypotheses: string[];
  hintLevel: number;
  stars: number;
  confidence?: 'confident' | 'guessing' | 'struggling';
  completed: boolean;
  timeSpent: number;
  misconceptions: string[];
}

export function RuleMachineSimulator({ onNavigate }: RuleMachineSimulatorProps) {
  // Current active stage: 0 = Intro, 1..5 = Game stages, 6 = Victory
  const [currentStage, setCurrentStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('week01.robot.current_stage');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Stages completed map: { 1: true, 2: true, ... }
  const [stagesDone, setStagesDone] = useState<Record<number, boolean>>(() => {
    try {
      const raw = localStorage.getItem('week01.robot.stages_done');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Stars per stage map: { 1: 3, 2: 2, ... }
  const [stageStars, setStageStars] = useState<Record<number, number>>(() => {
    try {
      const raw = localStorage.getItem('week01.robot.stars');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Hint panel state
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [showHintBox, setShowHintBox] = useState<boolean>(false);

  // Confidence check modal state
  const [showConfidenceModal, setShowConfidenceModal] = useState<boolean>(false);
  const [confidenceStage, setConfidenceStage] = useState<number>(3);
  const [hasAskedConfidence, setHasAskedConfidence] = useState<Record<number, boolean>>({});
  const [, setStagePhase] = useState<'playing' | 'completed' | 'confidence' | 'ready-next'>('playing');

  // Unlocked check: Mission 2 (Logic Gate) must be completed
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  useEffect(() => {
    const explored = storage.getExploredSimulations();
    const completed = storage.getCompletedLessons();
    const allAnswers = storage.getAnswers();
    const q8to14Done = ['Q08', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14'].filter(
      (id) => allAnswers[id]?.isCorrect
    ).length;

    const logicMissionDone =
      localStorage.getItem('week01.missions.logic.completed') === 'true' ||
      localStorage.getItem('week01.logic.completed') === 'true' ||
      localStorage.getItem('week01.badges.nguoi_gac_cong') === 'true' ||
      explored.includes('logic') ||
      completed.includes('logic') ||
      q8to14Done >= 4 ||
      localStorage.getItem('week01.missions.machine.unlocked') === 'true';

    setIsUnlocked(logicMissionDone);
  }, []);

  // --- STAGE 1 STATE: Máy cộng đơn giản (1->3, 2->4, 3->5) ---
  const [s1Hypothesis, setS1Hypothesis] = useState<string | null>(null);
  const [s1Feedback, setS1Feedback] = useState<string>('');
  const [s1FollowUpAnswer, setS1FollowUpAnswer] = useState<number | null>(null);
  const [s1FollowUpFeedback, setS1FollowUpFeedback] = useState<string>('');
  const [s1IsRunningMachine, setS1IsRunningMachine] = useState<boolean>(false);
  const [s1Done, setS1Done] = useState<boolean>(false);

  // --- STAGE 2 STATE: Máy hai bước (1->4, 2->7, 3->10) ---
  const [s2ChosenHypo, setS2ChosenHypo] = useState<string | null>(null);
  const [s2TestInput, setS2TestInput] = useState<number | null>(null);
  const [s2Comparison, setS2Comparison] = useState<{
    input: number;
    predicted: number;
    actual: number;
    isMatch: boolean;
  } | null>(null);
  const [s2Feedback, setS2Feedback] = useState<string>('');
  const [s2Done, setS2Done] = useState<boolean>(false);
  const [s2TestedInputs, setS2TestedInputs] = useState<number[]>([]);
  const [s2HypothesesTried, setS2HypothesesTried] = useState<string[]>([]);

  // --- STAGE 3 STATE: Đừng vội kết luận (2->5, 3->7, 4->9) ---
  const [s3ChosenHypo, setS3ChosenHypo] = useState<string | null>(null);
  const [s3CounterCheck, setS3CounterCheck] = useState<{
    firstCheckText: string;
    testNumber: number;
    predicted: number;
    actual: number;
    isMisconception: boolean;
  } | null>(null);
  const [s3Feedback, setS3Feedback] = useState<string>('');
  const [s3Done, setS3Done] = useState<boolean>(false);
  const [s3HypothesesTried, setS3HypothesesTried] = useState<string[]>([]);

  // --- STAGE 4 STATE: Tự chọn số để thử (2->3, 4->7, 6->11, 8->15) ---
  const [s4ChosenHypo, setS4ChosenHypo] = useState<string | null>(null);
  const [s4CustomInputText, setS4CustomInputText] = useState<string>('10');
  const [s4Comparison, setS4Comparison] = useState<{
    input: number;
    predicted: number;
    actual: number;
    isMatch: boolean;
  } | null>(null);
  const [s4Feedback, setS4Feedback] = useState<string>('');
  const [s4Done, setS4Done] = useState<boolean>(false);
  const [s4TestedInputs, setS4TestedInputs] = useState<number[]>([]);
  const [s4HypothesesTried, setS4HypothesesTried] = useState<string[]>([]);

  // --- STAGE 5 STATE: Robot chữ và số (ABC123 -> BCA231 -> CAB312 -> ?) ---
  const [s5Separated, setS5Separated] = useState<boolean>(false);
  const [s5LetterAnswer, setS5LetterAnswer] = useState<string | null>(null);
  const [s5LetterFeedback, setS5LetterFeedback] = useState<string>('');
  const [s5NumberAnswer, setS5NumberAnswer] = useState<string | null>(null);
  const [s5NumberFeedback, setS5NumberFeedback] = useState<string>('');
  const [s5Combined, setS5Combined] = useState<boolean>(false);
  const [s5Done, setS5Done] = useState<boolean>(false);

  // ----------------------------------------------------
  // HINT CONTENT DEFINITIONS (3 LEVELS PER STAGE)
  // ----------------------------------------------------
  const HINT_DATA: Record<number, { title: string; hints: [string, string, string] }> = {
    1: {
      title: 'Màn 1: Máy cộng đơn giản',
      hints: [
        'Quan sát xem số đi ra lớn hơn số đi vào bao nhiêu đơn vị.',
        '1 cộng mấy thì bằng 3? 2 cộng mấy thì bằng 4?',
        'Robot đang lấy số đầu vào rồi cộng thêm 2 (+2).',
      ],
    },
    2: {
      title: 'Màn 2: Máy hai bước',
      hints: [
        'So sánh Input với Output xem khoảng cách tăng lên thế nào.',
        'Thử nhân Input lên trước (ví dụ nhân 3), rồi xem còn thiếu mấy đơn vị.',
        'Robot làm theo cách: lấy số đó nhân 3 rồi cộng 1 (×3 rồi +1).',
      ],
    },
    3: {
      title: 'Màn 3: Đừng vội kết luận',
      hints: [
        'Đừng vội chọn phép tính chỉ khớp với 1 số đầu tiên.',
        'Hãy thử nhân số vào với 2 trước, xem kết quả cách số ra bao nhiêu.',
        'Robot thực hiện: nhân số vào với 2 rồi cộng thêm 1 (×2 +1).',
      ],
    },
    4: {
      title: 'Màn 4: Tự chọn số để thử',
      hints: [
        'Nhìn các cặp số: 2→3, 4→7, 6→11. Hãy thử phép nhân 2.',
        '2×2=4 (thừa 1), 4×2=8 (thừa 1), 6×2=12 (thừa 1).',
        'Quy tắc bí mật là: nhân với 2 rồi bớt đi 1 (×2 -1). Chọn quy tắc này rồi thử nhé!',
      ],
    },
    5: {
      title: 'Màn 5: Robot chữ và số',
      hints: [
        'Bấm nút "Tách chữ và số" để quan sát từng phần riêng biệt.',
        'Nhìn xem ký tự đứng đầu tiên được chuyển đi đâu ở bước tiếp theo.',
        'Robot chuyển ký tự đầu tiên xuống cuối hàng: ABC thành BCA, rồi CAB, và tiếp theo sẽ quay lại ban đầu.',
      ],
    },
  };

  // Helper: Mark stage complete and calculate stars
  const markStageDone = (stageNum: number) => {
    const nextDone = { ...stagesDone, [stageNum]: true };
    setStagesDone(nextDone);
    localStorage.setItem('week01.robot.stages_done', JSON.stringify(nextDone));

    // Calculate stars: no deduction for wrong attempts, only for hint level
    let earnedStars = 3;
    if (hintLevel === 1) earnedStars = 2;
    if (hintLevel >= 2) earnedStars = 1;

    const nextStars = { ...stageStars, [stageNum]: earnedStars };
    setStageStars(nextStars);
    localStorage.setItem('week01.robot.stars', JSON.stringify(nextStars));

    // Save detailed stage record
    saveStageRecord(stageNum, earnedStars);

    // If Stage 3 completed -> Trigger Confidence Check 1
    if (stageNum === 3) {
      setStagePhase('completed');
      if (!hasAskedConfidence[3]) {
        setConfidenceStage(3);
        console.log('[CONFIDENCE] OPEN EFFECT', {
          stageCompleted: true,
          confidence: null,
          hasAskedConfidence: hasAskedConfidence[3],
          currentStage: 3,
        });
        setTimeout(() => {
          setShowConfidenceModal(true);
          setStagePhase('confidence');
        }, 800);
      }
    }
    // If Stage 5 completed -> Trigger Confidence Check 2
    if (stageNum === 5) {
      setStagePhase('completed');
      if (!hasAskedConfidence[5]) {
        setConfidenceStage(5);
        console.log('[CONFIDENCE] OPEN EFFECT', {
          stageCompleted: true,
          confidence: null,
          hasAskedConfidence: hasAskedConfidence[5],
          currentStage: 5,
        });
        setTimeout(() => {
          setShowConfidenceModal(true);
          setStagePhase('confidence');
        }, 800);
      }
    }
  };

  const saveStageRecord = (stageNum: number, earnedStars: number) => {
    let hypotheses: string[] = [];
    let testedInputs: number[] = [];
    const misconceptions: string[] = [];

    if (stageNum === 1) {
      hypotheses = s1Hypothesis ? [s1Hypothesis] : [];
      testedInputs = [6];
    } else if (stageNum === 2) {
      hypotheses = s2HypothesesTried;
      testedInputs = s2TestedInputs;
      if (s2HypothesesTried.includes('+3')) misconceptions.push('fits_one_example_only');
    } else if (stageNum === 3) {
      hypotheses = s3HypothesesTried.length > 0 ? s3HypothesesTried : (s3ChosenHypo ? [s3ChosenHypo] : []);
      testedInputs = [3, 5];
      if (hypotheses.includes('+3') || s3ChosenHypo === '+3') misconceptions.push('fits_one_example_only');
    } else if (stageNum === 4) {
      hypotheses = s4HypothesesTried;
      testedInputs = s4TestedInputs;
      if (s4HypothesesTried.some((h) => h !== '×2 -1')) misconceptions.push('cannot_compare_prediction');
    } else if (stageNum === 5) {
      hypotheses = ['shift_to_end'];
      testedInputs = [];
      if (!s5Separated) misconceptions.push('cannot_separate_text_number');
    }

    const record: StageState = {
      stageId: stageNum,
      attempts: 1,
      wrongChoices: [],
      testedInputs,
      hypotheses,
      hintLevel,
      stars: earnedStars,
      completed: true,
      timeSpent: 30,
      misconceptions,
    };

    localStorage.setItem(`week01.robot.stage0${stageNum}`, JSON.stringify(record));
  };

  const switchStage = (newStage: number) => {
    setCurrentStage(newStage);
    setHintLevel(0);
    setShowHintBox(false);
    localStorage.setItem('week01.robot.current_stage', newStage.toString());
  };

  // ----------------------------------------------------
  // STAGE 1 HANDLERS: Máy cộng đơn giản
  // ----------------------------------------------------
  const handleS1SelectHypothesis = (hypo: string) => {
    setS1Hypothesis(hypo);
    if (hypo === '+2') {
      setS1Feedback('🎉 Đúng rồi! Robot cộng thêm 2.');
    } else if (hypo === '+1') {
      setS1Feedback('🤔 Chưa khớp: 1 + 1 = 2, nhưng Robot nhả ra 3. Con hãy thử lại nhé!');
    } else if (hypo === '×2') {
      setS1Feedback('🤔 Chưa khớp: 1 × 2 = 2, nhưng Robot nhả ra 3. Con hãy thử lại nhé!');
    }
  };

  const handleS1SubmitFollowUp = (ans: number) => {
    setS1FollowUpAnswer(ans);
    setS1IsRunningMachine(true);

    setTimeout(() => {
      setS1IsRunningMachine(false);
      if (ans === 8) {
        setS1FollowUpFeedback('✅ Chính xác! 6 + 2 = 8. Robot đã trả ra số 8!');
        setS1Done(true);
        triggerConfetti();
        markStageDone(1);
      } else {
        setS1FollowUpFeedback(`Số ${ans} chưa đúng rồi. Quy tắc là cộng 2, vậy 6 + 2 bằng mấy nhỉ?`);
      }
    }, 600);
  };

  // ----------------------------------------------------
  // STAGE 2 HANDLERS: Máy hai bước
  // ----------------------------------------------------
  const handleS2SelectHypothesis = (hypo: string) => {
    setS2ChosenHypo(hypo);
    setS2Comparison(null);
    setS2Feedback('');
    if (!s2HypothesesTried.includes(hypo)) {
      setS2HypothesesTried((prev) => [...prev, hypo]);
    }
  };

  const handleS2TestInput = (inputNum: number) => {
    setS2TestInput(inputNum);
    if (!s2TestedInputs.includes(inputNum)) {
      setS2TestedInputs((prev) => [...prev, inputNum]);
    }

    // Actual machine rule: x * 3 + 1
    const actual = inputNum * 3 + 1;

    // Predicted by chosen hypothesis
    let predicted = 0;
    if (s2ChosenHypo === '+3') predicted = inputNum + 3;
    else if (s2ChosenHypo === '×3') predicted = inputNum * 3;
    else if (s2ChosenHypo === '×3 rồi +1') predicted = inputNum * 3 + 1;
    else if (s2ChosenHypo === '×2 rồi +2') predicted = inputNum * 2 + 2;

    const isMatch = predicted === actual;

    setS2Comparison({
      input: inputNum,
      predicted,
      actual,
      isMatch,
    });

    if (isMatch) {
      setS2Feedback(
        `🎉 Xuất sắc! Con dự đoán ra ${predicted} và Robot thật cũng trả ra ${actual}. Quy tắc [×3 rồi +1] đúng với mọi trường hợp!`
      );
      setS2Done(true);
      triggerConfetti();
      markStageDone(2);
    } else {
      if (s2ChosenHypo === '+3') {
        setS2Feedback(
          `🤔 Quy tắc này chưa đúng với mọi trường hợp. Với số 1 thì 1+3=4 có vẻ đúng, nhưng sang số ${inputNum} thì ${inputNum}+3=${predicted} khác ${actual}. Con thử lại nhé!`
        );
        localStorage.setItem('week01.robot.stage02.misconception', 'fits_one_example_only');
      } else {
        setS2Feedback(
          `🤔 Kết quả khác nhau: Con dự đoán là ${predicted}, nhưng Robot thật trả ra ${actual}. Con thử đổi quy tắc khác nhé!`
        );
      }
    }
  };

  // ----------------------------------------------------
  // STAGE 3 HANDLERS: Đừng vội kết luận
  // ----------------------------------------------------
  const handleS3SelectHypothesis = (hypo: string) => {
    setS3ChosenHypo(hypo);
    if (!s3HypothesesTried.includes(hypo)) {
      setS3HypothesesTried((prev) => [...prev, hypo]);
    }

    if (hypo === '+3') {
      // Pedagogy: 2+3=5 fits row 1, but test with 3 fails!
      setS3CounterCheck({
        firstCheckText: 'Với số 2 thì 2 + 3 = 5 có vẻ đúng!',
        testNumber: 3,
        predicted: 6,
        actual: 7,
        isMisconception: true,
      });
      setS3Feedback(
        '👀 À! Một ví dụ đúng chưa đủ. Với số 3 thì 3+3=6, nhưng Robot thật trả ra 7! Mình phải kiểm tra thêm.'
      );
      localStorage.setItem('week01.robot.stage03.misconception', 'fits_one_example_only');
    } else if (hypo === '×2') {
      setS3CounterCheck({
        firstCheckText: 'Thử với số đầu tiên (số 2):',
        testNumber: 2,
        predicted: 4,
        actual: 5,
        isMisconception: false,
      });
      setS3Feedback('Chưa đúng rồi: 2 × 2 = 4, nhưng Robot thật trả ra 5. Con hãy thử lại!');
    } else if (hypo === '+5') {
      setS3CounterCheck({
        firstCheckText: 'Thử với số đầu tiên (số 2):',
        testNumber: 2,
        predicted: 7,
        actual: 5,
        isMisconception: false,
      });
      setS3Feedback('Chưa đúng rồi: 2 + 5 = 7, nhưng Robot thật trả ra 5. Con hãy thử lại!');
    } else if (hypo === '×2 +1') {
      setS3CounterCheck({
        firstCheckText: 'Kiểm tra với tất cả các số:',
        testNumber: 5,
        predicted: 11,
        actual: 11,
        isMisconception: false,
      });
      setS3Feedback(
        '🎉 Chuẩn xác! 2×2+1=5, 3×2+1=7, 4×2+1=9. Quy tắc [×2 +1] đúng với tất cả các ví dụ!'
      );
      setS3Done(true);
      triggerConfetti();
      markStageDone(3);
    }
  };

  // ----------------------------------------------------
  // STAGE 4 HANDLERS: Tự chọn số để thử
  // ----------------------------------------------------
  const handleS4SelectHypothesis = (hypo: string) => {
    setS4ChosenHypo(hypo);
    setS4Comparison(null);
    setS4Feedback('');
    if (!s4HypothesesTried.includes(hypo)) {
      setS4HypothesesTried((prev) => [...prev, hypo]);
    }
  };

  const handleS4RunCustomTest = (numToTest: number) => {
    if (isNaN(numToTest) || numToTest <= 0) return;

    if (!s4TestedInputs.includes(numToTest)) {
      setS4TestedInputs((prev) => [...prev, numToTest]);
    }

    // Actual secret rule: x * 2 - 1
    const actual = numToTest * 2 - 1;

    let predicted = 0;
    if (s4ChosenHypo === '×2 -1') predicted = numToTest * 2 - 1;
    else if (s4ChosenHypo === '+1') predicted = numToTest + 1;
    else if (s4ChosenHypo === '×2 +1') predicted = numToTest * 2 + 1;
    else if (s4ChosenHypo === '+3') predicted = numToTest + 3;

    const isMatch = predicted === actual;

    setS4Comparison({
      input: numToTest,
      predicted,
      actual,
      isMatch,
    });

    if (isMatch) {
      setS4Feedback(
        `🎉 Tuyệt vời! Cả hai kết quả đều là ${actual}. Con đã tìm ra quy tắc bí mật [×2 -1]!`
      );
      setS4Done(true);
      triggerConfetti();
      markStageDone(4);
    } else {
      setS4Feedback(
        `🧪 Hai kết quả khác nhau (Con dự đoán: ${predicted}, Robot thật: ${actual}). Vậy mình cần đổi quy tắc.`
      );
      localStorage.setItem('week01.robot.stage04.misconception', 'cannot_compare_prediction');
    }
  };

  // ----------------------------------------------------
  // STAGE 5 HANDLERS: Robot chữ và số
  // ----------------------------------------------------
  const handleS5ChooseLetter = (choice: string) => {
    setS5LetterAnswer(choice);
    if (choice === 'ABC') {
      setS5LetterFeedback(
        '✅ Đúng rồi! Chữ C ở đầu chuyển xuống cuối thì CAB thành ABC!'
      );
    } else {
      setS5LetterFeedback(
        'Chưa chính xác. Quan sát kỹ: chữ đứng đầu sẽ chuyển xuống cuối hàng nhé!'
      );
    }
  };

  const handleS5ChooseNumber = (choice: string) => {
    setS5NumberAnswer(choice);
    if (choice === '123') {
      setS5NumberFeedback(
        '✅ Đúng rồi! Số 3 ở đầu chuyển xuống cuối thì 312 thành 123!'
      );
    } else {
      setS5NumberFeedback(
        'Chưa chính xác. Số đứng đầu sẽ chuyển xuống cuối hàng nhé!'
      );
    }
  };

  const handleS5Combine = () => {
    setS5Combined(true);
    setS5Done(true);
    triggerConfetti();
    markStageDone(5);
  };

  // ----------------------------------------------------
  // CONFIDENCE SUBMIT HANDLER
  // ----------------------------------------------------
  const handleSaveConfidence = (level: string) => {
    console.log('[CONFIDENCE] CLICK', level);
    console.log('[CONFIDENCE] CLOSING');

    const targetStage = confidenceStage;

    // 1. Immediately close modal synchronously & update flags
    setShowConfidenceModal(false);
    setHasAskedConfidence((prev) => ({ ...prev, [targetStage]: true }));
    setStagePhase('ready-next');

    // 2. Persist safely
    try {
      const storageKey = `week01.robot.stage0${targetStage}.confidence`;
      localStorage.setItem(storageKey, level);
      console.log(
        '[CONFIDENCE] SAVED',
        storageKey,
        localStorage.getItem(storageKey)
      );
    } catch (error) {
      console.error(error);
    }

    // 3. Advance to next stage smoothly
    requestAnimationFrame(() => {
      console.log('[CONFIDENCE] NEXT', targetStage);
      if (targetStage === 3) {
        switchStage(4);
      } else if (targetStage === 5) {
        handleFinishMission();
      }
    });
  };

  // ----------------------------------------------------
  // MISSION 3 FINISH & BADGE UNLOCK
  // ----------------------------------------------------
  const handleFinishMission = () => {
    localStorage.setItem('week01.missions.machine.completed', 'true');
    localStorage.setItem('week01.missions.robot.completed', 'true');
    localStorage.setItem('week01.machine.completed', 'true');
    localStorage.setItem('week01.robot.completed', 'true');
    localStorage.setItem('week01.badges.ky_su_nhi', 'true');
    localStorage.setItem('week01.missions.challenge.unlocked', 'true');

    storage.markSimulationExplored('machine');
    storage.markLessonComplete('machine');

    triggerConfetti();
    setCurrentStage(6); // Go to Victory screen
  };

  // Total stars calculated
  const totalStarsEarned = Object.values(stageStars).reduce((sum: number, s: number) => sum + Number(s || 0), 0);

  // ----------------------------------------------------
  // RENDER: LOCKED SCREEN
  // ----------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center space-y-5 max-w-xl mx-auto my-8 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600">
            Nhiệm vụ 3 • Tạm khóa
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Xưởng Robot đang đợi con!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Để khởi động được Xưởng Robot, con cần hoàn thành <strong>Nhiệm vụ 2 (Cổng Logic)</strong> và nhận Huy hiệu <strong>Người Gác Cổng</strong> 🛡️ trước nhé.
          </p>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate?.('/sim/logic')}
            className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>🚀 Đến Cổng Logic ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center cursor-pointer"
          >
            <span>Về Trang chủ</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: STAGE 0 (MÀN HÌNH MỞ ĐẦU)
  // ----------------------------------------------------
  if (currentStage === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-2xl mx-auto space-y-6 animate-fadeIn">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
            Nhiệm vụ 03 • 5 Màn thử thách
          </span>
        </div>

        {/* Mascot & Intro Banner */}
        <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-4xl shadow-inner mx-auto">
              🤖
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
              M1
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black">🤖 Xưởng Robot</h1>
            <p className="text-xs sm:text-sm text-purple-200 font-medium">
              Nhiệm vụ 3 • Đoán xem chiếc máy đang làm gì
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 text-xs sm:text-sm text-purple-50 leading-relaxed font-medium">
            “Robo M1 bị quên mất chương trình của mình. Con hãy giúp bạn ấy tìm lại nhé!”
          </div>
        </div>

        {/* 5 Stage Dots Rail */}
        <div className="space-y-2 text-center">
          <div className="text-xs font-bold text-slate-500">Tiến độ 5 màn thử thách:</div>
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => switchStage(st)}
                className={`w-10 h-10 rounded-2xl font-black text-xs flex items-center justify-center transition-all cursor-pointer ${
                  stagesDone[st]
                    ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={`Màn ${st}`}
              >
                {stagesDone[st] ? '✓' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => switchStage(1)}
            className="w-full sm:w-auto min-h-[50px] px-8 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform mx-auto"
          >
            <span>⚙️ Khởi động Robot</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: STAGE 6 (MÀN HOÀN THÀNH - VICTORY)
  // ----------------------------------------------------
  if (currentStage === 6) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-2xl mx-auto space-y-6 text-center animate-fadeIn">
        {/* Top Trophy Banner */}
        <div className="bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 mx-auto flex items-center justify-center text-4xl shadow-lg animate-bounce">
            🤖
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
              HOÀN THÀNH NHIỆM VỤ 3
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              🎉 Robo M1 đã nhớ lại chương trình!
            </h2>
          </div>

          {/* Badge Presentation Card */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 max-w-sm mx-auto flex items-center gap-3.5 text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-3xl shrink-0 shadow-md">
              ⚙️
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                HUY HIỆU DANH DỰ
              </div>
              <div className="text-base font-black text-white">KỸ SƯ NHÍ</div>
              <div className="text-xs text-purple-200 mt-0.5">
                “Con biết đoán quy tắc và thử lại.”
              </div>
            </div>
          </div>
        </div>

        {/* 3 Key Takeaways */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5">
          <div className="text-xs font-black text-slate-600 uppercase tracking-wide">
            Ba điều con vừa làm chủ hôm nay:
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-slate-800 font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Quan sát Input và Output để tìm mối liên hệ.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đoán quy tắc rồi chủ động thử lại với số mới.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sửa suy nghĩ khi kết quả chưa đúng (một ví dụ chưa đủ!).</span>
            </div>
          </div>
        </div>

        {/* Total Stars Summary */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm">
          <span>⭐ Sao khám phá đạt được:</span>
          <span className="font-black text-amber-600 text-base">
            {totalStarsEarned} / 15 sao
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate?.('/challenge')}
            className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform"
          >
            <span>🏆 Mở Thử thách cuối tuần</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>🏠 Về Trang chủ</span>
          </button>

          <button
            type="button"
            onClick={() => switchStage(1)}
            className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi lại</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: STAGES 1 TO 5 (INTERACTIVE GAMEPLAY)
  // ----------------------------------------------------
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-7 space-y-6 animate-fadeIn">
      {/* Top Header & Stage Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Xưởng Robot • Màn {currentStage}/5
            </h2>
            {stagesDone[currentStage] && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đã qua</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Tự đoán quy tắc và kiểm chứng bằng dữ liệu mới
          </p>
        </div>

        {/* 5 Stage Quick Selector Tabs */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => switchStage(st)}
              className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center transition-all cursor-pointer ${
                currentStage === st
                  ? 'bg-purple-600 text-white shadow-xs scale-105'
                  : stagesDone[st]
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {stagesDone[st] ? '✓' : st}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* STAGE 1: MÁY CỘNG ĐƠN GIẢN                         */}
      {/* -------------------------------------------------- */}
      {currentStage === 1 && (
        <div className="space-y-5 animate-fadeIn">
          {/* Card instruction */}
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
            <div className="text-xs font-black text-purple-700 uppercase tracking-wide">
              MÀN 1 • MÁY CỘNG ĐƠN GIẢN
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900">
              Mô hình: INPUT (Đầu vào) → ROBOT → OUTPUT (Đầu ra)
            </div>
            <p className="text-xs text-slate-600">
              Quan sát các số đi vào và đi ra khỏi Robot để khám phá quy tắc:
            </p>
          </div>

          {/* Observed Examples Visual Table */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 1</span>
              <span className="text-base sm:text-lg font-black text-purple-900">1 → 3</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 2</span>
              <span className="text-base sm:text-lg font-black text-purple-900">2 → 4</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-purple-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 3</span>
              <span className="text-base sm:text-lg font-black text-purple-900">3 → 5</span>
            </div>
          </div>

          {/* Question 1: What is Robot doing? */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-black text-slate-900">
              ❓ Robot đang làm gì với mỗi số?
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {['+1', '+2', '×2'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleS1SelectHypothesis(opt)}
                  className={`min-h-[48px] p-3 rounded-2xl font-black text-sm sm:text-base border-2 transition-all cursor-pointer ${
                    s1Hypothesis === opt
                      ? opt === '+2'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 hover:border-purple-300 text-slate-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {s1Feedback && (
              <div
                className={`p-3 rounded-xl text-xs sm:text-sm font-bold animate-fadeIn ${
                  s1Hypothesis === '+2'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {s1Feedback}
              </div>
            )}
          </div>

          {/* Question 2: Follow-up test with number 6 (only if hypothesis +2 chosen) */}
          {s1Hypothesis === '+2' && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 animate-fadeIn">
              <div className="text-xs sm:text-sm font-black text-indigo-950">
                🚀 Thử thách kế tiếp: Nếu cho số 6 vào thì Robot trả ra số nào?
              </div>

              {/* Interactive Machine Animation Chute */}
              <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-indigo-100">
                <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                  6
                </span>
                <span className="text-slate-400 font-bold">→</span>
                <div
                  className={`w-14 h-12 rounded-xl border flex items-center justify-center font-black text-base transition-all ${
                    s1IsRunningMachine
                      ? 'bg-amber-100 border-amber-400 text-amber-800 animate-pulse'
                      : s1Done
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                      : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}
                >
                  {s1IsRunningMachine ? '⚙️' : s1Done ? '8' : '🤖'}
                </div>
                <span className="text-slate-400 font-bold">→</span>
                <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 font-black text-sm flex items-center justify-center text-slate-700">
                  {s1Done ? '8' : '?'}
                </span>
              </div>

              {/* Fast Option Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[7, 8, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleS1SubmitFollowUp(num)}
                    disabled={s1IsRunningMachine}
                    className={`min-h-[44px] py-2 px-3 rounded-xl font-black text-sm border transition-all cursor-pointer ${
                      s1FollowUpAnswer === num
                        ? num === 8
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-950'
                    }`}
                  >
                    Số {num}
                  </button>
                ))}
              </div>

              {s1FollowUpFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs sm:text-sm font-bold ${
                    s1Done
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {s1FollowUpFeedback}
                </div>
              )}
            </div>
          )}

          {/* Next Stage Button */}
          {s1Done && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => switchStage(2)}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Sang Màn 2 →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* STAGE 2: MÁY HAI BƯỚC                              */}
      {/* -------------------------------------------------- */}
      {currentStage === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
            <div className="text-xs font-black text-blue-700 uppercase tracking-wide">
              MÀN 2 • MÁY HAI BƯỚC
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900">
              Đoán quy tắc rồi kiểm chứng với dữ liệu mới
            </div>
            <p className="text-xs text-slate-600">
              Đừng vội kết luận khi chỉ khớp một dòng. Hãy chọn giả thuyết rồi thử với số mới!
            </p>
          </div>

          {/* Observed Examples Table */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 1</span>
              <span className="text-base sm:text-lg font-black text-blue-950">1 → 4</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 2</span>
              <span className="text-base sm:text-lg font-black text-blue-950">2 → 7</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 3</span>
              <span className="text-base sm:text-lg font-black text-blue-950">3 → 10</span>
            </div>
          </div>

          {/* Question: Choose Hypothesis */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-black text-slate-900">
              ❓ Robot có thể đang làm theo cách nào?
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['+3', '×3', '×3 rồi +1', '×2 rồi +2'].map((hypo) => (
                <button
                  key={hypo}
                  type="button"
                  onClick={() => handleS2SelectHypothesis(hypo)}
                  className={`min-h-[48px] p-2.5 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer ${
                    s2ChosenHypo === hypo
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800'
                  }`}
                >
                  {hypo}
                </button>
              ))}
            </div>
          </div>

          {/* Core Verification Step: Test with new input */}
          {s2ChosenHypo && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-900">
                <span>🧪 Thử xem con đoán đúng chưa!</span>
                <span className="text-xs text-slate-500 font-normal">
                  (Đang thử giả thuyết: <strong className="text-blue-700">{s2ChosenHypo}</strong>)
                </span>
              </div>

              <div className="text-xs text-slate-600">
                Hãy chọn một số mới để cho vào Robot:
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[4, 5, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleS2TestInput(num)}
                    className={`min-h-[44px] py-2 px-3 rounded-xl font-black text-sm border transition-all cursor-pointer ${
                      s2TestInput === num
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white hover:bg-purple-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    Cho số {num} vào máy
                  </button>
                ))}
              </div>

              {/* Comparison Box: Prediction vs Actual Robot */}
              {s2Comparison && (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 text-center">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-xs font-black text-blue-900 block">Con dự đoán</span>
                      <span className="text-[11px] text-blue-700 font-bold block mt-0.5">
                        (khi cho số {s2Comparison.input} vào)
                      </span>
                      <span className="text-xl font-black text-blue-950 mt-1 block">
                        {s2Comparison.predicted}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                      <span className="text-xs font-black text-indigo-900 block">Robot thật</span>
                      <span className="text-[11px] text-indigo-700 font-bold block mt-0.5">
                        (kết quả Robot trả ra)
                      </span>
                      <span className="text-xl font-black text-indigo-950 mt-1 block">
                        {s2Comparison.actual}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl text-xs sm:text-sm font-bold ${
                      s2Comparison.isMatch
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {s2Feedback}
                  </div>

                  {!s2Comparison.isMatch && (
                    <button
                      type="button"
                      onClick={() => {
                        setS2ChosenHypo(null);
                        setS2Comparison(null);
                        setS2Feedback('');
                      }}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Chọn quy tắc khác để thử lại</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {s2Done && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => switchStage(3)}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Sang Màn 3 →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* STAGE 3: ĐỪNG VỘI KẾT LUẬN                         */}
      {/* -------------------------------------------------- */}
      {currentStage === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
            <div className="text-xs font-black text-amber-800 uppercase tracking-wide">
              MÀN 3 • ĐỪNG VỘI KẾT LUẬN
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900">
              Một ví dụ đúng chưa đủ — Phải kiểm tra thêm!
            </div>
            <p className="text-xs text-slate-600">
              Đôi khi một quy tắc có vẻ đúng với số đầu tiên, nhưng lại sai với các số sau.
            </p>
          </div>

          {/* Observed Examples Table */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 1</span>
              <span className="text-base sm:text-lg font-black text-amber-950">2 → 5</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 2</span>
              <span className="text-base sm:text-lg font-black text-amber-950">3 → 7</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 3</span>
              <span className="text-base sm:text-lg font-black text-amber-950">4 → 9</span>
            </div>
          </div>

          {/* Prompt: What does Robot do? */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-black text-slate-900">
              ❓ Con đoán Robot làm gì?
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['+3', '×2 +1', '×2', '+5'].map((hypo) => (
                <button
                  key={hypo}
                  type="button"
                  onClick={() => handleS3SelectHypothesis(hypo)}
                  className={`min-h-[48px] p-2.5 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer ${
                    s3ChosenHypo === hypo
                      ? hypo === '×2 +1'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800'
                  }`}
                >
                  {hypo}
                </button>
              ))}
            </div>
          </div>

          {/* Counter check display & pedagogical feedback */}
          {s3CounterCheck && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-fadeIn">
              <div className="text-xs font-bold text-slate-600">
                {s3CounterCheck.firstCheckText}
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200 text-center">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[11px] text-slate-500 font-bold block">
                    Con dự đoán (với số {s3CounterCheck.testNumber}):
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {s3CounterCheck.predicted}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-indigo-50">
                  <span className="text-[11px] text-indigo-700 font-bold block">
                    Robot thật trả ra:
                  </span>
                  <span className="text-base font-black text-indigo-950">
                    {s3CounterCheck.actual}
                  </span>
                </div>
              </div>

              {s3CounterCheck.isMisconception && (
                <div className="p-3.5 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-950 space-y-1">
                  <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                    <span>💡</span>
                    <span>“Một ví dụ đúng chưa đủ. Mình phải kiểm tra thêm.”</span>
                  </div>
                  <div className="text-xs text-amber-900 font-semibold">
                    Với số 2 thì 2 + 3 = 5 có vẻ đúng, nhưng khi thử với số 3 thì 3 + 3 = 6 (Robot thật lại trả ra 7).
                  </div>
                </div>
              )}

              <div
                className={`p-3 rounded-xl text-xs sm:text-sm font-bold ${
                  s3Done
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {s3Feedback}
              </div>

              {!s3Done && (
                <button
                  type="button"
                  onClick={() => {
                    setS3ChosenHypo(null);
                    setS3CounterCheck(null);
                    setS3Feedback('');
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đổi giả thuyết khác</span>
                </button>
              )}
            </div>
          )}

          {/* Next Button */}
          {s3Done && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => switchStage(4)}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Sang Màn 4 →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* STAGE 4: TỰ CHỌN SỐ ĐỂ THỬ                         */}
      {/* -------------------------------------------------- */}
      {currentStage === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">
              MÀN 4 • TỰ CHỌN SỐ ĐỂ THỬ
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900">
              Học sinh tự chọn số bất kỳ để thử nghiệm máy
            </div>
            <p className="text-xs text-slate-600">
              Chọn một giả thuyết, sau đó cho máy chạy với số con muốn để so sánh dự đoán!
            </p>
          </div>

          {/* Secret Machine Examples */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 1</span>
              <span className="text-base font-black text-emerald-950">2 → 3</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 2</span>
              <span className="text-base font-black text-emerald-950">4 → 7</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 3</span>
              <span className="text-base font-black text-emerald-950">6 → 11</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold block">Ví dụ 4</span>
              <span className="text-base font-black text-emerald-950">8 → 15</span>
            </div>
          </div>

          {/* Step 1: Choose Hypothesis */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-black text-slate-900">
              Bước 1: Chọn quy tắc con đoán:
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['×2 -1', '+1', '×2 +1', '+3'].map((hypo) => (
                <button
                  key={hypo}
                  type="button"
                  onClick={() => handleS4SelectHypothesis(hypo)}
                  className={`min-h-[48px] p-2.5 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer ${
                    s4ChosenHypo === hypo
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800'
                  }`}
                >
                  {hypo}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Choose number to test */}
          {s4ChosenHypo && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
              <div className="text-xs sm:text-sm font-black text-slate-900">
                Bước 2: Con muốn thử Robot với số nào?
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[10, 12, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setS4CustomInputText(num.toString());
                      handleS4RunCustomTest(num);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm cursor-pointer shadow-2xs"
                  >
                    Thử số {num}
                  </button>
                ))}
              </div>

              {/* Or type any custom number */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
                  Hoặc tự nhập:
                </span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={s4CustomInputText}
                  onChange={(e) => setS4CustomInputText(e.target.value)}
                  className="w-24 min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-black text-center text-sm"
                  placeholder="Nhập số..."
                />
                <button
                  type="button"
                  onClick={() => handleS4RunCustomTest(parseInt(s4CustomInputText, 10))}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-2xs"
                >
                  Kiểm tra
                </button>
              </div>

              {/* Side-by-Side Comparison */}
              {s4Comparison && (
                <div className="space-y-2 pt-2 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-xs font-black text-emerald-900 block">
                        Con dự đoán
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                        (khi đưa số {s4Comparison.input} vào)
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 block">
                        {s4Comparison.predicted}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                      <span className="text-xs font-black text-indigo-900 block">
                        Robot thật
                      </span>
                      <span className="text-[11px] text-indigo-700 font-bold block mt-0.5">
                        (kết quả Robot trả ra)
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-indigo-950 mt-1 block">
                        {s4Comparison.actual}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl text-xs sm:text-sm font-bold ${
                      s4Comparison.isMatch
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {s4Feedback}
                  </div>

                  {!s4Comparison.isMatch && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setS4ChosenHypo(null);
                          setS4Comparison(null);
                          setS4Feedback('');
                        }}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Sửa giả thuyết và thử lại</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {s4Done && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => switchStage(5)}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Sang Màn 5 →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* STAGE 5: ROBOT CHỮ VÀ SỐ                           */}
      {/* -------------------------------------------------- */}
      {currentStage === 5 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
            <div className="text-xs font-black text-purple-700 uppercase tracking-wide">
              MÀN 5 • ROBOT CHỮ VÀ SỐ
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900">
              Tách chữ và số riêng biệt để tìm trạng thái quay lại ban đầu
            </div>
            <p className="text-xs text-slate-600">
              Robot đang di chuyển cả chữ và số. Đừng nhìn chung cả cụm, hãy tách ra từng dòng!
            </p>
          </div>

          {/* Initial Combined Sequence Display */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <div className="text-xs font-bold text-slate-500">Chuỗi dữ liệu của Robot:</div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-mono font-black text-base sm:text-lg">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-purple-900 shadow-2xs">
                ABC123
              </span>
              <span className="text-slate-400">↓</span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-purple-900 shadow-2xs">
                BCA231
              </span>
              <span className="text-slate-400">↓</span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-purple-900 shadow-2xs">
                CAB312
              </span>
              <span className="text-slate-400">↓</span>
              <span className="px-4 py-1.5 rounded-xl bg-purple-100 border-2 border-purple-300 text-purple-950 font-black">
                ?
              </span>
            </div>

            {/* Crucial Action: Button to separate text and numbers */}
            {!s5Separated && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setS5Separated(true)}
                  className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs mx-auto"
                >
                  <Split className="w-4 h-4" />
                  <span>✂️ Tách chữ và số</span>
                </button>
              </div>
            )}
          </div>

          {/* After clicking separate: Two Tracks */}
          {s5Separated && (
            <div className="space-y-4 animate-fadeIn">
              {/* TRACK 1: LETTER LINE */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-blue-800 uppercase tracking-wide">
                    1. DÒNG CHỮ: ABC → BCA → CAB → ?
                  </div>
                  {s5LetterAnswer === 'ABC' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xong chữ</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600">
                  Robot làm gì với chữ đầu tiên? Chữ đứng đầu được chuyển xuống cuối hàng!
                  (A chuyển xuống cuối → BCA; B chuyển xuống cuối → CAB).
                </div>

                <div className="text-xs font-bold text-slate-800">
                  ❓ Lần tiếp theo, chữ C ở đầu chuyển xuống cuối sẽ thành gì?
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['ABC', 'CAB', 'BAC', 'ACB'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleS5ChooseLetter(opt)}
                      className={`min-h-[44px] p-2 rounded-xl font-mono font-black text-sm border transition-all cursor-pointer ${
                        s5LetterAnswer === opt
                          ? opt === 'ABC'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-white hover:bg-blue-100 border-blue-200 text-blue-950'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {s5LetterFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold ${
                      s5LetterAnswer === 'ABC'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {s5LetterFeedback}
                  </div>
                )}
              </div>

              {/* TRACK 2: NUMBER LINE (Open when Letter is solved) */}
              {s5LetterAnswer === 'ABC' && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-purple-800 uppercase tracking-wide">
                      2. DÒNG SỐ: 123 → 231 → 312 → ?
                    </div>
                    {s5NumberAnswer === '123' && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Xong số</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600">
                    Tương tự như chữ: số đứng đầu chuyển xuống cuối hàng!
                  </div>

                  <div className="text-xs font-bold text-slate-800">
                    ❓ Lần tiếp theo, số 3 ở đầu chuyển xuống cuối sẽ thành gì?
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['123', '312', '213', '132'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleS5ChooseNumber(opt)}
                        className={`min-h-[44px] p-2 rounded-xl font-mono font-black text-sm border transition-all cursor-pointer ${
                          s5NumberAnswer === opt
                            ? opt === '123'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-white hover:bg-purple-100 border-purple-200 text-purple-950'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {s5NumberFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold ${
                        s5NumberAnswer === '123'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {s5NumberFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Recombination & Return State */}
              {s5LetterAnswer === 'ABC' && s5NumberAnswer === '123' && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3 text-center animate-fadeIn">
                  {!s5Combined ? (
                    <div>
                      <button
                        type="button"
                        onClick={handleS5Combine}
                        className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs mx-auto"
                      >
                        <span>🔗 Ghép lại kết quả: ABC + 123</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm font-black text-indigo-950">
                        Kết quả ghép lại: <span className="font-mono text-purple-700">ABC123</span>
                      </div>

                      {/* Visual Return Flow */}
                      <div className="p-3 rounded-xl bg-white border border-indigo-200 flex flex-wrap items-center justify-center gap-2 font-mono text-xs sm:text-sm font-black">
                        <span className="text-slate-800">ABC123</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-800">BCA231</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-800">CAB312</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                          ABC123
                        </span>
                      </div>

                      {/* Explicit pedagogy constraint: No mention of "chu kỳ" in Week 01 */}
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs sm:text-sm">
                        🔄 Robot đã quay trở lại trạng thái ban đầu!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Finish Button */}
          {s5Done && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleFinishMission}
                className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>🎉 Nhận Huy hiệu Kỹ Sư Nhí →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* HINT SYSTEM: "💡 Con đang bí" (3 LEVELS)          */}
      {/* -------------------------------------------------- */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowHintBox(!showHintBox)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>💡 Con đang bí (Gợi ý {hintLevel}/3)</span>
          </button>

          <span className="text-xs text-slate-500">
            Tự khám phá để đạt đủ <strong>3 ⭐</strong> nhé!
          </span>
        </div>

        {showHintBox && HINT_DATA[currentStage] && (
          <div className="mt-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3 animate-fadeIn">
            <div className="text-xs font-black text-amber-900">
              Gợi ý của Thám tử cho {HINT_DATA[currentStage].title}:
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              {/* Hint 1 */}
              {hintLevel >= 1 ? (
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-slate-800">
                  <strong className="text-amber-800">Gợi ý nhỏ: </strong>
                  <span>{HINT_DATA[currentStage].hints[0]}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setHintLevel(1)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/70 hover:bg-white border border-amber-200 text-xs font-bold text-amber-800 cursor-pointer"
                >
                  🔓 Mở Gợi ý nhỏ (Cấp 1)
                </button>
              )}

              {/* Hint 2 */}
              {hintLevel >= 2 ? (
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-slate-800">
                  <strong className="text-amber-800">Gợi ý thêm: </strong>
                  <span>{HINT_DATA[currentStage].hints[1]}</span>
                </div>
              ) : (
                hintLevel >= 1 && (
                  <button
                    type="button"
                    onClick={() => setHintLevel(2)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/70 hover:bg-white border border-amber-200 text-xs font-bold text-amber-800 cursor-pointer"
                  >
                    🔓 Mở Gợi ý thêm (Cấp 2)
                  </button>
                )
              )}

              {/* Hint 3 */}
              {hintLevel >= 3 ? (
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-slate-800">
                  <strong className="text-amber-800">Cùng làm một bước nhé: </strong>
                  <span>{HINT_DATA[currentStage].hints[2]}</span>
                </div>
              ) : (
                hintLevel >= 2 && (
                  <button
                    type="button"
                    onClick={() => setHintLevel(3)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/70 hover:bg-white border border-amber-200 text-xs font-bold text-amber-800 cursor-pointer"
                  >
                    🔓 Mở Cùng làm một bước (Cấp 3)
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* CONFIDENCE CHECK MODAL (Màn 3 & Màn 5)             */}
      {/* -------------------------------------------------- */}
      {showConfidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-2xl">
              🧠
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-base">
                Con thấy phần này thế nào?
              </h3>
              <p className="text-xs text-slate-500">
                Chia sẻ cảm nhận thật để thầy cô hỗ trợ con tốt nhất nhé!
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleSaveConfidence('confident')}
                className="w-full min-h-[46px] p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors text-left pointer-events-auto"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">😎</span>
                  <span>Con biết cách làm</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveConfidence('guessing')}
                className="w-full min-h-[46px] p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors text-left pointer-events-auto"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤔</span>
                  <span>Con phải thử một chút</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveConfidence('struggling')}
                className="w-full min-h-[46px] p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors text-left pointer-events-auto"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🆘</span>
                  <span>Con vẫn chưa hiểu</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveConfidence('skipped')}
                className="w-full min-h-[46px] p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors text-left pointer-events-auto"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏩</span>
                  <span>Để sau →</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
