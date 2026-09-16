import { ArrowLeft, ArrowRight, Bot, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { storage } from '../utils/storage';

interface MachineLessonProps {
  onNavigate: (path: string) => void;
}

export function MachineLesson({ onNavigate }: MachineLessonProps) {
  const handleMarkComplete = () => {
    storage.markLessonComplete('machine');
    onNavigate('/sim/machine');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Navigation top */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang chủ</span>
        </button>

        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
          Nhiệm vụ 03 • Bài giảng
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-3xl p-6 md:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🤖</span>
          <h1 className="text-xl md:text-3xl font-black">
            Bài giảng: Máy quy luật bí mật
          </h1>
        </div>
        <p className="text-xs md:text-sm text-purple-100 leading-relaxed max-w-2xl">
          Một chiếc hộp đen nhận dữ liệu đầu vào (Input) và nhả ra kết quả (Output). Thám tử Tin học trẻ không đoán mò, mà tư duy như một nhà khoa học thực thụ: <strong>Lập Giả Thuyết → Thử Nghiệm → Kiểm Chứng!</strong>
        </p>
      </div>

      {/* Step 1: Input to Output */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
            1
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Mô hình hộp đen: Input → Máy → Output
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          Hãy quan sát mối quan hệ giữa số đi vào và số đi ra:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-purple-50/60 rounded-2xl border border-purple-200 text-center">
          <div className="p-3 bg-white rounded-xl border border-purple-100">
            <span className="text-xs text-slate-500 font-bold block">Ví dụ 1:</span>
            <span className="text-base font-black text-purple-900">1 → 4</span>
            <span className="text-xs text-slate-500 block">(Tăng 3 đơn vị)</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-purple-100">
            <span className="text-xs text-slate-500 font-bold block">Ví dụ 2:</span>
            <span className="text-base font-black text-purple-900">2 → 7</span>
            <span className="text-xs text-slate-500 block">(Tăng 5 đơn vị)</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-purple-100">
            <span className="text-xs text-slate-500 font-bold block">Ví dụ 3:</span>
            <span className="text-base font-black text-purple-900">3 → 10</span>
            <span className="text-xs text-slate-500 block">(Tăng 7 đơn vị)</span>
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-700">
          ❓ Nếu em đoán quy luật là <strong>+3</strong> (vì 1+3=4), nhưng khi sang ví dụ 2: <strong>2+3=5 (không phải 7)</strong>, vậy giả thuyết +3 bị sụp đổ! Phải tìm một phép tính khác.
        </p>
      </div>

      {/* Step 2: Hypothesis and Verification */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-black text-sm flex items-center justify-center">
            2
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Phương pháp thử các phép toán cơ bản
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          Khi khoảng cách tăng dần, hãy thử phép <strong>nhân một số rồi cộng hoặc trừ</strong>:
        </p>

        <div className="space-y-2 text-xs md:text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-indigo-700">Giả thuyết: Thử nhân 3</strong>
            <p className="text-slate-600 mt-1">
              • 1 × 3 = 3 (thiếu 1 để thành 4)<br />
              • 2 × 3 = 6 (thiếu 1 để thành 7)<br />
              • 3 × 3 = 9 (thiếu 1 để thành 10)
            </p>
            <p className="text-emerald-700 font-bold mt-1">
              🎉 Tìm ra quy luật rồi: <strong>Output = Input × 3 + 1</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Explanation */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center">
            3
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            Cách giải thích ngắn gọn vì sao chọn đáp án
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          Đề thi Tin học trẻ M1 thường yêu cầu học sinh trình bày ngắn gọn phương pháp suy luận. Cấu trúc câu giải thích mẫu:
        </p>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs md:text-sm text-amber-950 font-medium">
          "Em thấy Output được tính bằng cách lấy Input nhân 3 rồi cộng 1 (vì 1×3+1=4, 2×3+1=7, 3×3+1=10). Do đó với Input = 4 thì Output = 4×3+1 = 13."
        </div>
      </div>

      {/* CTA to Simulator */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl border-2 border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-base md:text-lg">
            Khám phá chiếc máy bí mật nào!
          </h3>
          <p className="text-xs md:text-sm text-slate-600">
            Vào phòng thí nghiệm để tự tay nhập số thử nghiệm và kiểm chứng giả thuyết.
          </p>
        </div>

        <button
          onClick={handleMarkComplete}
          className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm md:text-base flex items-center gap-2 cursor-pointer shadow-sm transition-transform hover:scale-105 shrink-0"
        >
          <span>Vào Secret Rule Machine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
