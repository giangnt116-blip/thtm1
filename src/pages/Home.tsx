import { useState, useEffect } from 'react';
import { ArrowRight, Lock, CheckCircle2, Sparkles, BookOpen, Star, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { storage } from '../utils/storage';

interface HomeProps {
  onNavigate: (path: string) => void;
  progressPercent: number;
  practiceCount: number;
  totalStars: number;
  challengeScore: number | null;
  completedLessons: string[];
}

export function Home({
  onNavigate,
  progressPercent,
  practiceCount,
  totalStars,
  challengeScore,
  completedLessons,
}: HomeProps) {
  const [showDetectiveGuide, setShowDetectiveGuide] = useState(false);

  // Dynamic progress evaluation from storage
  const exploredSims = storage.getExploredSimulations();
  const allAnswers = storage.getAnswers();
  const challenge = storage.getChallenge();

  // Questions breakdown
  const q1to7Done = ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07'].filter(
    (id) => allAnswers[id]?.isCorrect
  ).length;
  const q8to14Done = ['Q08', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14'].filter(
    (id) => allAnswers[id]?.isCorrect
  ).length;
  const q15to20Done = ['Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20'].filter(
    (id) => allAnswers[id]?.isCorrect
  ).length;

  // Mission states
  // Mission 1: Phong Quan sat
  const m1Done =
    exploredSims.includes('pattern') ||
    completedLessons.includes('pattern') ||
    q1to7Done >= 4;
  const m1Started =
    m1Done ||
    exploredSims.includes('pattern') ||
    completedLessons.includes('pattern') ||
    q1to7Done > 0;

  // Mission 2: Cong Logic (Unlocked when Mission 1 is done)
  const m2Unlocked = m1Done;
  const m2Done =
    m2Unlocked &&
    (exploredSims.includes('logic') ||
      completedLessons.includes('logic') ||
      q8to14Done >= 4);
  const m2Started =
    m2Unlocked &&
    (m2Done ||
      exploredSims.includes('logic') ||
      completedLessons.includes('logic') ||
      q8to14Done > 0);

  // Mission 3: Xuong Robot (Unlocked when Mission 2 is done)
  const m3Unlocked = m2Done;
  const m3Done =
    m3Unlocked &&
    (exploredSims.includes('machine') ||
      completedLessons.includes('machine') ||
      q15to20Done >= 3);
  const m3Started =
    m3Unlocked &&
    (m3Done ||
      exploredSims.includes('machine') ||
      completedLessons.includes('machine') ||
      q15to20Done > 0);

  // Challenge: Thu thach cuoi tuan (Unlocked when all 3 missions are done)
  const challengeUnlocked = m1Done && m2Done && m3Done;
  const challengeDone = challenge?.completed === true;

  // Calculate completed stages (out of 4)
  const stagesCount =
    (m1Done ? 1 : 0) + (m2Done ? 1 : 0) + (m3Done ? 1 : 0) + (challengeDone ? 1 : 0);

  // Next recommended task
  let nextAction = {
    title: 'Phòng Quan sát',
    path: '/sim/pattern',
    text: '🚀 Bắt đầu: Phòng Quan sát',
  };

  if (!m1Done) {
    nextAction = {
      title: 'Phòng Quan sát',
      path: '/sim/pattern',
      text: m1Started ? '🚀 Tiếp tục: Phòng Quan sát' : '🚀 Bắt đầu: Phòng Quan sát',
    };
  } else if (!m2Done) {
    nextAction = {
      title: 'Cổng Logic',
      path: '/sim/logic',
      text: m2Started ? '🚀 Tiếp tục: Cổng Logic' : '🚀 Bắt đầu: Cổng Logic',
    };
  } else if (!m3Done) {
    nextAction = {
      title: 'Xưởng Robot',
      path: '/sim/machine',
      text: m3Started ? '🚀 Tiếp tục: Xưởng Robot' : '🚀 Bắt đầu: Xưởng Robot',
    };
  } else if (!challengeDone) {
    nextAction = {
      title: 'Thử thách cuối tuần',
      path: '/challenge',
      text: '🏆 Vào Thử thách cuối tuần',
    };
  } else {
    nextAction = {
      title: 'Luyện kỹ năng',
      path: '/practice',
      text: '🎯 Luyện thêm kỹ năng để gom đủ 60 sao',
    };
  }

  // Missions data definition
  const missions = [
    {
      id: 'pattern',
      num: '1',
      icon: '🔍',
      title: 'Phòng Quan sát',
      desc: 'Tìm điều đang lặp lại và thay đổi.',
      badgeName: 'Mắt Cú',
      badgeIcon: '🦉',
      simPath: '/sim/pattern',
      learnPath: '/learn/pattern',
      questionsSubtext: 'Q01–Q07',
      unlocked: true,
      done: m1Done,
      inProgress: m1Started && !m1Done,
    },
    {
      id: 'logic',
      num: '2',
      icon: '🚦',
      title: 'Cổng Logic',
      desc: 'Chọn đúng để mở cổng.',
      badgeName: 'Người Gác Cổng',
      badgeIcon: '🛡️',
      simPath: '/sim/logic',
      learnPath: '/learn/logic',
      questionsSubtext: 'Q08–Q14',
      unlocked: m2Unlocked,
      done: m2Done,
      inProgress: m2Started && !m2Done,
    },
    {
      id: 'machine',
      num: '3',
      icon: '🤖',
      title: 'Xưởng Robot',
      desc: 'Đoán xem chiếc máy đang làm gì.',
      badgeName: 'Kỹ Sư Nhí',
      badgeIcon: '⚙️',
      simPath: '/sim/machine',
      learnPath: '/learn/machine',
      questionsSubtext: 'Q15–Q20',
      unlocked: m3Unlocked,
      done: m3Done,
      inProgress: m3Started && !m3Done,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* 1. HERO WELCOME CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/20">
            <span>Week 01 • Thám tử Quy luật 🔍</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            👋 Chào Thám tử!
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-blue-50 leading-relaxed font-medium">
            Hôm nay con sẽ tìm những quy luật đang ẩn trong hình, số và máy móc.
          </p>

          <p className="text-xs sm:text-sm text-blue-200">
            Không cần làm thật nhanh. Chỉ cần quan sát thật kỹ. 👀
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate(nextAction.path)}
              className="min-h-[48px] px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer shadow-md transition-transform"
            >
              <span>{nextAction.text}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TIẾN ĐỘ TUẦN (4 CHẶNG RÕ RÀNG) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span>🗺️ Tiến độ tuần</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Con đã hoàn thành <strong className="text-blue-600 font-black">{stagesCount}/4</strong> chặng.
            </p>
          </div>

          {/* 4 dots visually */}
          <div className="flex items-center gap-1.5 text-lg">
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`transition-colors ${
                  idx < stagesCount ? 'text-blue-600' : 'text-slate-300'
                }`}
              >
                ●
              </span>
            ))}
          </div>
        </div>

        {/* Visual Progress Steps Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div
            className={`p-2.5 rounded-2xl border text-center transition-all ${
              m1Done
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                : m1Started
                ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold ring-2 ring-blue-300'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="text-[11px] opacity-75">Chặng 1</div>
            <div className="text-xs sm:text-sm font-black mt-0.5 truncate">
              🔍 Phòng Quan sát
            </div>
            <div className="text-[10px] mt-1 font-bold">
              {m1Done ? '✅ Hoàn thành' : m1Started ? '⏳ Đang học' : '✨ Bắt đầu'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-2xl border text-center transition-all ${
              m2Done
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                : m2Unlocked
                ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold ring-2 ring-blue-300'
                : 'bg-slate-50/70 border-slate-200 text-slate-400'
            }`}
          >
            <div className="text-[11px] opacity-75">Chặng 2</div>
            <div className="text-xs sm:text-sm font-black mt-0.5 truncate">
              🚦 Cổng Logic
            </div>
            <div className="text-[10px] mt-1 font-bold">
              {m2Done ? '✅ Hoàn thành' : m2Unlocked ? '✨ Có thể bắt đầu' : '🔒 Chưa mở'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-2xl border text-center transition-all ${
              m3Done
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                : m3Unlocked
                ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold ring-2 ring-blue-300'
                : 'bg-slate-50/70 border-slate-200 text-slate-400'
            }`}
          >
            <div className="text-[11px] opacity-75">Chặng 3</div>
            <div className="text-xs sm:text-sm font-black mt-0.5 truncate">
              🤖 Xưởng Robot
            </div>
            <div className="text-[10px] mt-1 font-bold">
              {m3Done ? '✅ Hoàn thành' : m3Unlocked ? '✨ Có thể bắt đầu' : '🔒 Chưa mở'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-2xl border text-center transition-all ${
              challengeDone
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                : challengeUnlocked
                ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold ring-2 ring-orange-300'
                : 'bg-slate-50/70 border-slate-200 text-slate-400'
            }`}
          >
            <div className="text-[11px] opacity-75">Chặng 4</div>
            <div className="text-xs sm:text-sm font-black mt-0.5 truncate">
              🏆 Thử thách
            </div>
            <div className="text-[10px] mt-1 font-bold">
              {challengeDone
                ? `✅ Đạt ${challenge?.score}đ`
                : challengeUnlocked
                ? '✨ Sẵn sàng!'
                : '🔒 Khóa'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. HUY HIỆU DANH DỰ (3 HUY HIỆU THÁM TỬ) */}
      <div className="bg-slate-100/70 rounded-3xl p-4 sm:p-5 border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <span>🎖️ Huy hiệu tuần 01</span>
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Mở khóa khi hoàn thành từng nhiệm vụ
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Badge 1: Mat Cu */}
          <div
            className={`p-3 rounded-2xl border text-center transition-all ${
              m1Done
                ? 'bg-white border-amber-300 shadow-xs ring-2 ring-amber-200'
                : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
            }`}
          >
            <div className="text-2xl sm:text-3xl mb-1">🦉</div>
            <div className="text-xs sm:text-sm font-black text-slate-900">Mắt Cú</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {m1Done ? '⭐ Đã nhận' : 'Phòng Quan sát'}
            </div>
          </div>

          {/* Badge 2: Nguoi Gac Cong */}
          <div
            className={`p-3 rounded-2xl border text-center transition-all ${
              m2Done
                ? 'bg-white border-amber-300 shadow-xs ring-2 ring-amber-200'
                : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
            }`}
          >
            <div className="text-2xl sm:text-3xl mb-1">🛡️</div>
            <div className="text-xs sm:text-sm font-black text-slate-900">
              Người Gác Cổng
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {m2Done ? '⭐ Đã nhận' : 'Cổng Logic'}
            </div>
          </div>

          {/* Badge 3: Ky Su Nhi */}
          <div
            className={`p-3 rounded-2xl border text-center transition-all ${
              m3Done
                ? 'bg-white border-amber-300 shadow-xs ring-2 ring-amber-200'
                : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
            }`}
          >
            <div className="text-2xl sm:text-3xl mb-1">⚙️</div>
            <div className="text-xs sm:text-sm font-black text-slate-900">Kỹ Sư Nhí</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {m3Done ? '⭐ Đã nhận' : 'Xưởng Robot'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. HÀNH TRÌNH 3 NHIỆM VỤ (MAIN JOURNEY CARDS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span>🚀 Hành trình 3 nhiệm vụ</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Làm lần lượt từng nhiệm vụ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {missions.map((m) => (
            <div
              key={m.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                m.done
                  ? 'bg-white border-emerald-200 shadow-xs'
                  : m.unlocked
                  ? 'bg-white border-blue-200 shadow-xs ring-2 ring-blue-100'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div>
                {/* Top header status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{m.icon}</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Nhiệm vụ {m.num}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {m.done ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Xong</span>
                    </span>
                  ) : m.inProgress ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      Đang học
                    </span>
                  ) : m.unlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      Sẵn sàng
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Chưa mở</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                  {m.title}
                </h3>

                {/* Short 1-sentence description (<= 2 lines) */}
                <p className="text-xs sm:text-sm text-slate-600 mb-4 line-clamp-2">
                  {m.desc}
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                {m.unlocked ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigate(m.simPath)}
                      className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors ${
                        m.done
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span>
                        {m.done ? '🔄 Chơi lại nhiệm vụ' : '🔍 Bắt đầu nhiệm vụ'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate(m.learnPath)}
                      className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span>📖 Xem cách chơi</span>
                    </button>
                  </>
                ) : (
                  <div className="min-h-[44px] px-3 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs text-center flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Hoàn thành nhiệm vụ trước để mở</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. THỬ THÁCH CUỐI TUẦN (WEEKEND CHALLENGE) */}
      <div
        className={`rounded-3xl border-2 p-5 sm:p-7 transition-all ${
          challengeUnlocked
            ? 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-orange-300 shadow-xs'
            : 'bg-slate-50 border-slate-200 opacity-75'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <h3 className="text-base sm:text-xl font-black text-slate-900">
                Thử thách cuối tuần
              </h3>
              {challengeDone && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  {challenge?.score}/100 điểm
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              10 câu mới để xem con đã khám phá được bao nhiêu.
            </p>

            {!challengeUnlocked && (
              <p className="text-xs font-bold text-orange-700 flex items-center gap-1 pt-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Hoàn thành 3 nhiệm vụ để mở khóa.</span>
              </p>
            )}
          </div>

          <div className="w-full sm:w-auto shrink-0">
            {challengeUnlocked ? (
              <button
                type="button"
                onClick={() => onNavigate('/challenge')}
                className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform"
              >
                <span>
                  {challengeDone ? '🔄 Thử sức lại' : '🏆 Bắt đầu thử thách'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>Đang khóa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. 20 BÀI LUYỆN (LUYỆN KỸ NĂNG) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Luyện kỹ năng
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                Đã làm: {practiceCount}/20
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{totalStars}/60</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              Làm từng bài nhỏ để luyện mắt quan sát và suy luận.
            </p>

            {/* Links connecting to 3 mission question batches */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-slate-500">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                🔍 Q01–Q07 (Quan sát)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                🚦 Q08–Q14 (Logic)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                🤖 Q15–Q20 (Máy móc)
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/practice')}
              className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform"
            >
              <span>🚀 Chơi ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. BÍ KÍP THÁM TỬ (COLLAPSIBLE 5-STEP TIP) */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowDetectiveGuide(!showDetectiveGuide)}
          className="w-full min-h-[44px] px-4 py-3 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span>💡</span>
            <span>Bí kíp 5 bước suy luận của Thám tử (Bấm để xem)</span>
          </span>
          {showDetectiveGuide ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showDetectiveGuide && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <span className="font-bold text-blue-900 block mb-0.5">1. Quan sát kỹ</span>
              <span className="text-slate-600 text-[11px]">Nhìn hình dạng, màu sắc, vị trí.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <span className="font-bold text-blue-900 block mb-0.5">2. Tìm chu kỳ</span>
              <span className="text-slate-600 text-[11px]">Đo khoảng cách, bước nhảy số.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <span className="font-bold text-blue-900 block mb-0.5">3. Đặt giả thuyết</span>
              <span className="text-slate-600 text-[11px]">Nghĩ xem quy luật là gì.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <span className="font-bold text-blue-900 block mb-0.5">4. Thử kiểm tra</span>
              <span className="text-slate-600 text-[11px]">Áp dụng thử vào số tiếp theo.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-900 block mb-0.5">5. Chốt đáp án</span>
              <span className="text-slate-600 text-[11px]">Giải thích vì sao con chọn!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
