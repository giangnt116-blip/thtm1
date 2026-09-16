import { useState } from 'react';
import { UserAnswerRecord, ChallengeRecord } from '../types';
import { calculateTeacherAnalytics } from '../utils/scoring';
import { storage } from '../utils/storage';
import { ArrowLeft, Users, AlertTriangle, CheckCircle2, HelpCircle, Sparkles, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface TeacherProps {
  answers: Record<string, UserAnswerRecord>;
  challenge: ChallengeRecord | null;
  onNavigate: (path: string) => void;
  onResetProgress: () => void;
}

export function Teacher({ answers, challenge, onNavigate, onResetProgress }: TeacherProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const analytics = calculateTeacherAnalytics(answers);

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

        <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>Góc Phụ huynh & Giáo viên</span>
        </span>
      </div>

      {/* Hero Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 tracking-wider">
          <span>BÁO CÁO PHÂN TÍCH TƯ DUY</span>
          <span className="px-2 py-0.5 rounded bg-white/10 text-white">Tuần 01</span>
        </div>
        <h1 className="text-xl md:text-3xl font-black">
          Hồ sơ năng lực học sinh
        </h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-xl">
          Báo cáo theo dõi mức độ tiếp thu, xu hướng tự tin và các điểm nhầm lẫn khái niệm (misconception) của học sinh lớp 4 trong tuần đầu làm quen với tư duy Tin học trẻ.
        </p>
      </div>

      {/* Key Metric Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block">Đã làm:</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {analytics.completedCount}/20
          </div>
          <span className="text-[11px] text-slate-400">câu luyện tập</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block">Tỷ lệ chính xác:</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {analytics.accuracy}%
          </div>
          <span className="text-[11px] text-slate-400">trên số câu đã thử</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block">Gợi ý đã dùng TB:</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {analytics.avgHints}
          </div>
          <span className="text-[11px] text-slate-400">hint/câu (tối đa 3)</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block">Điểm Thách đấu:</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {challenge?.completed ? `${challenge.score}/100` : 'Chưa thi'}
          </div>
          <span className="text-[11px] text-slate-400">Mini Challenge 01</span>
        </div>
      </div>

      {/* Confidence Matrix (Crucial for diagnostic pedagogy) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-xs space-y-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900">
            🧠 Ma trận Nhận thức & Sự Tự tin
          </h2>
          <p className="text-xs text-slate-500">
            Giúp giáo viên phân biệt được câu làm đúng thực chất với câu làm đúng do may mắn, và phát hiện ngộ nhận.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Confident & Correct */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-emerald-900 font-bold text-xs md:text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đúng và Chắc chắn</span>
              </span>
              <span className="text-lg font-black">{analytics.confidenceGroups.confidentCorrect} câu</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Học sinh đã làm chủ kiến thức vững vàng, suy luận có căn cứ rõ ràng.
            </p>
          </div>

          {/* Lucky correct */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
            <div className="flex items-center justify-between text-sky-900 font-bold text-xs md:text-sm">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>Đúng nhưng Đoán mò</span>
              </span>
              <span className="text-lg font-black">{analytics.confidenceGroups.guessingCorrect} câu</span>
            </div>
            <p className="text-[11px] text-sky-700 leading-relaxed">
              Đúng kết quả nhưng chưa tự tin về bản chất. Cần hỏi lại để học sinh giải thích quy luật.
            </p>
          </div>

          {/* CRITICAL: Confident Wrong (Misconception!) */}
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-1">
            <div className="flex items-center justify-between text-rose-900 font-bold text-xs md:text-sm">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Sai nhưng Tự tin (Ngộ nhận!)</span>
              </span>
              <span className="text-lg font-black text-rose-700">{analytics.confidenceGroups.confidentWrong} câu</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              ⚠️ Điểm nguy hiểm nhất: Học sinh tin chắc mình đúng nhưng đang hiểu sai bản chất khái niệm (thường ở phép OR hoặc Dual Track). Cần giải thích ngay!
            </p>
          </div>

          {/* Unclear / Struggling */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-900 font-bold text-xs md:text-sm">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-600" />
                <span>Chưa hiểu bài</span>
              </span>
              <span className="text-lg font-black">{analytics.confidenceGroups.struggling} câu</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Học sinh gặp lúng túng và cần sự gợi ý từng bước từ phụ huynh/thầy cô.
            </p>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="bg-amber-50/80 rounded-3xl border border-amber-200 p-5 md:p-7 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-black text-sm md:text-base">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span>Khuyến nghị hành động từ Chuyên gia học liệu:</span>
        </div>

        <div className="space-y-2 text-xs md:text-sm text-amber-950 font-medium leading-relaxed">
          {analytics.recommendations.map((rec, idx) => (
            <div key={idx} className="p-3 bg-white/80 rounded-xl border border-amber-200 flex items-start gap-2">
              <span className="font-bold text-amber-700 shrink-0">👉</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Observation Room Diagnostics (Phòng Quan sát 5 Màn) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>🔍 Chẩn đoán Nhiệm vụ 1: Phòng Quan sát</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ghi nhận thao tác, số sao và ngộ nhận trong 5 màn mô phỏng tương tác.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            5 Màn chơi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
          {[
            {
              id: 1,
              title: 'Màn 1: Nhịp màu',
              sub: 'Simple repeat',
              misKey: 'week01.pattern.stage01.misconception',
              misMap: {
                chooses_new_color: 'Chọn màu mới chưa xuất hiện',
                repeats_same_color: 'Lặp lại 2 màu đỏ cạnh nhau',
              },
            },
            {
              id: 2,
              title: 'Màn 2: Nhóm lặp',
              sub: 'Repeating chunk',
              misKey: 'week01.pattern.stage02.misconception',
              misMap: {
                cannot_identify_chunk: 'Chưa nhận diện chu kỳ khối 3 phần tử',
              },
            },
            {
              id: 3,
              title: 'Màn 3: Đoàn tàu số',
              sub: 'Constant step (+3)',
              misKey: 'week01.pattern.stage03.misconception',
              misMap: {
                cannot_find_constant_difference: 'Chưa tìm hiệu số không đổi',
              },
              confKey: 'week01.pattern.stage03.confidence',
            },
            {
              id: 4,
              title: 'Màn 4: Luật luân phiên',
              sub: 'Alternating (×2, +1)',
              misKey: 'week01.pattern.stage04.misconception',
              misMap: {
                repeats_same_operation: 'Dùng lặp lại phép tính vừa thực hiện',
              },
            },
            {
              id: 5,
              title: 'Màn 5: Tách chữ & số',
              sub: 'Decomposition (Dual track)',
              misKey: 'week01.pattern.stage05.misconception',
              misMap: {
                cannot_separate_components: 'Chưa tách biệt 2 luồng dữ liệu song song',
              },
              confKey: 'week01.pattern.stage05.confidence',
            },
          ].map((st) => {
            const stageDone = localStorage.getItem('week01.pattern.stages_done')
              ? JSON.parse(localStorage.getItem('week01.pattern.stages_done') || '{}')[st.id]
              : false;
            const stars = localStorage.getItem('week01.pattern.stars')
              ? JSON.parse(localStorage.getItem('week01.pattern.stars') || '{}')[st.id] || 0
              : 0;
            const misVal = localStorage.getItem(st.misKey);
            const confVal = st.confKey ? localStorage.getItem(st.confKey) : null;

            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  stageDone ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-800">{st.title}</span>
                    <span className="text-amber-500 font-bold">{stars ? `⭐ ${stars}` : '○'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{st.sub}</div>

                  {misVal && (
                    <div className="mt-2 p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-800 font-semibold">
                      ⚠️ {st.misMap[misVal as keyof typeof st.misMap] || misVal}
                    </div>
                  )}

                  {confVal && (
                    <div className="mt-2 text-[10px] font-bold text-slate-600">
                      Tự tin:{' '}
                      <span className="text-blue-600">
                        {confVal === 'confident'
                          ? 'Rất tự tin'
                          : confVal === 'guessing'
                          ? 'Đoán / thử'
                          : 'Chưa hiểu'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-slate-500">
                  {stageDone ? '✅ Đã hoàn thành' : '⏳ Chưa hoàn thành'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Progress zone */}
      <div className="bg-white rounded-3xl border border-rose-200 p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-sm md:text-base flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Xóa dữ liệu tiến độ Week 01</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dùng khi muốn cho học sinh làm lại từ đầu để đánh giá lại năng lực.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs md:text-sm border border-rose-200 cursor-pointer"
        >
          Xóa tiến độ
        </button>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-base">
                Xác nhận xóa toàn bộ tiến độ?
              </h3>
              <p className="text-xs text-slate-500">
                Toàn bộ kết quả 20 bài luyện tập, điểm thi Challenge và phản tư sẽ được reset về trạng thái ban đầu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  storage.clearAll();
                  onResetProgress();
                  setShowResetConfirm(false);
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
