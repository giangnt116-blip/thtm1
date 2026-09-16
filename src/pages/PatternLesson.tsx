import { ArrowLeft, ArrowRight, Cpu, CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';
import { storage } from '../utils/storage';

interface PatternLessonProps {
  onNavigate: (path: string) => void;
}

export function PatternLesson({ onNavigate }: PatternLessonProps) {
  const handleMarkComplete = () => {
    storage.markLessonComplete('pattern');
    onNavigate('/sim/pattern');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang chủ</span>
        </button>

        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Nhiệm vụ 01 • Bài giảng
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔍</span>
          <h1 className="text-xl md:text-3xl font-black">
            Bài giảng: Kính lúp quy luật
          </h1>
        </div>
        <p className="text-xs md:text-sm text-blue-100 leading-relaxed max-w-2xl">
          Trong đề thi Tin học trẻ bảng M1, nhận biết quy luật là kỹ năng tối quan trọng. Máy tính thực chất là cỗ máy chạy các quy luật đều đặn. Cùng tìm hiểu 4 dạng quy luật chính nhé!
        </p>
      </div>

      {/* Part 1: Repeating Pattern */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
            1
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Quy luật lặp tuần hoàn (Repeating Pattern)
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          Quy luật lặp xảy ra khi một <strong>"khối cơ sở"</strong> (unit) gồm vài phần tử được sao chép y hệt lặp đi lặp lại nhiều lần.
        </p>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-500">Ví dụ minh họa:</div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-2xl py-2">
            <span className="p-2 bg-blue-100 rounded-xl border border-blue-300">🔴 🔵 🔵</span>
            <span className="p-2 bg-blue-100 rounded-xl border border-blue-300">🔴 🔵 🔵</span>
            <span className="p-2 bg-blue-100 rounded-xl border border-blue-300">🔴 🔵 🔵</span>
            <span className="p-2 bg-amber-100 rounded-xl border-2 border-dashed border-amber-400">🔴 ? ?</span>
          </div>
          <p className="text-xs text-slate-700">
            👉 Khối cơ sở ở đây là <strong>[🔴 🔵 🔵]</strong> (độ dài 3 hình: 1 Đỏ rồi 2 Xanh). Sau hình 🔴 chắc chắn phải là hai hình <strong>🔵 🔵</strong>.
          </p>
        </div>
      </div>

      {/* Part 2: Growing Pattern */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center">
            2
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Quy luật tăng / giảm đều (Growing / Shrinking)
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          Khoảng cách giữa hai phần tử liền kề luôn tuân theo một phép cộng hoặc trừ cố định.
        </p>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-500">Ví dụ: Dãy số 4, 7, 10, 13, ?</div>
          <div className="flex items-center justify-center gap-2 text-base md:text-lg font-black text-slate-800 py-2">
            <span>4</span>
            <span className="text-xs text-emerald-600 font-bold">(+3)</span>
            <span>7</span>
            <span className="text-xs text-emerald-600 font-bold">(+3)</span>
            <span>10</span>
            <span className="text-xs text-emerald-600 font-bold">(+3)</span>
            <span>13</span>
            <span className="text-xs text-emerald-600 font-bold">(+3)</span>
            <span className="text-emerald-600 font-black">16</span>
          </div>
          <p className="text-xs text-slate-700">
            👉 <strong>Bí quyết:</strong> Lấy số đứng sau trừ đi số đứng trước (7 - 4 = 3, 10 - 7 = 3). Vậy bước nhảy là +3.
          </p>
        </div>
      </div>

      {/* Part 3: Alternating Rule */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">
            3
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Hai quy tắc xen kẽ (Alternating Rule)
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          Không chỉ có một phép tính! Có những bài thi lồng ghép <strong>hai phép tính xen kẽ nhau</strong> (ví dụ: nhân rồi cộng, hoặc quay rồi đổi màu).
        </p>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-500">Ví dụ: 2, 4, 5, 10, 11, 22, ?</div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm md:text-base font-black text-slate-800 py-2">
            <span>2</span>
            <span className="text-xs text-purple-600 font-bold">[×2]</span>
            <span>4</span>
            <span className="text-xs text-amber-600 font-bold">[+1]</span>
            <span>5</span>
            <span className="text-xs text-purple-600 font-bold">[×2]</span>
            <span>10</span>
            <span className="text-xs text-amber-600 font-bold">[+1]</span>
            <span>11</span>
            <span className="text-xs text-purple-600 font-bold">[×2]</span>
            <span>22</span>
            <span className="text-xs text-amber-600 font-bold">[+1]</span>
            <span className="text-purple-700 font-black">23</span>
          </div>
        </div>
      </div>

      {/* Part 4: Dual Track */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-black text-sm flex items-center justify-center">
            4
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Dual Track: Hai quy luật chạy song song
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          Khi gặp các câu hỏi vừa có Chữ cái vừa có Số (như A1, B3, C5, D7...), thám tử tuyệt đối không nhìn lẫn lộn. Hãy <strong>tách thành 2 đường ray độc lập</strong>!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-xs font-bold text-blue-900 block mb-1">Đường chữ cái:</span>
            <div className="text-base font-black text-blue-700">A → B → C → D → E</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-xs font-bold text-emerald-900 block mb-1">Đường con số:</span>
            <div className="text-base font-black text-emerald-700">1 → 3 → 5 → 7 → 9</div>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-700 text-center">
          Ghép lại ta được đáp án hoàn hảo: <strong>E9</strong>!
        </p>
      </div>

      {/* Next Step CTA */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-base md:text-lg">
            Em đã nắm được 4 quy luật này chưa?
          </h3>
          <p className="text-xs md:text-sm text-slate-600">
            Hãy sang ngay phòng thí nghiệm Pattern Lab để tự tay kéo thả và trải nghiệm!
          </p>
        </div>

        <button
          onClick={handleMarkComplete}
          className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm md:text-base flex items-center gap-2 cursor-pointer shadow-sm transition-transform hover:scale-105 shrink-0"
        >
          <span>Vào Pattern Lab</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
