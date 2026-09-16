import { ArrowLeft, ArrowRight, Cpu, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { storage } from '../utils/storage';

interface LogicLessonProps {
  onNavigate: (path: string) => void;
}

export function LogicLesson({ onNavigate }: LogicLessonProps) {
  const handleMarkComplete = () => {
    storage.markLessonComplete('logic');
    onNavigate('/sim/logic');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang chủ</span>
        </button>

        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
          Nhiệm vụ 02 • Bài giảng
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-3xl p-6 md:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🚦</span>
          <h1 className="text-xl md:text-3xl font-black">
            Bài giảng: Cổng logic AND – OR – NOT
          </h1>
        </div>
        <p className="text-xs md:text-sm text-orange-100 leading-relaxed max-w-2xl">
          Trong khoa học máy tính, "Logic Boole" chính là bộ não ra quyết định của máy tính. Mọi chương trình từ trò chơi đến tên lửa vũ trụ đều bắt đầu từ 3 từ kỳ diệu: <strong>VÀ, HOẶC, KHÔNG</strong>.
        </p>
      </div>

      {/* 1. AND = VÀ */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 font-black text-sm flex items-center justify-center">
            &
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            1. Phép AND (VÀ) – Đòi hỏi sự hoàn hảo!
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          Với từ <strong>VÀ</strong>, một đối tượng chỉ được chọn khi nó thỏa mãn <strong>TẤT CẢ các điều kiện cùng một lúc</strong>. Chỉ cần 1 điều kiện sai, kết quả coi như hỏng!
        </p>

        <div className="p-4 bg-cyan-50/70 rounded-2xl border border-cyan-200 space-y-2">
          <div className="font-bold text-xs md:text-sm text-cyan-900">
            Ví dụ: "Chọn các số CHẴN VÀ LỚN HƠN 5" trong dãy: [2, 5, 6, 7, 8]
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-cyan-100">
              <span className="font-bold block">Số 2:</span>
              <span>Chẵn: ✅ | &gt;5: ❌</span>
              <span className="text-rose-600 font-bold block mt-1">→ BỊ LOẠI</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-cyan-100">
              <span className="font-bold block">Số 5:</span>
              <span>Chẵn: ❌ | &gt;5: ❌</span>
              <span className="text-rose-600 font-bold block mt-1">→ BỊ LOẠI</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-300 bg-emerald-50/50">
              <span className="font-bold block text-emerald-800">Số 6 & 8:</span>
              <span>Chẵn: ✅ | &gt;5: ✅</span>
              <span className="text-emerald-700 font-bold block mt-1">→ ĐẠT CHUẨN 🎉</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OR = HOẶC */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 font-black text-sm flex items-center justify-center">
            ||
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            2. Phép OR (HOẶC) – Cởi mở & Dễ tính!
          </h2>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs md:text-sm font-bold">
          ⚠️ SAI LẦM PHỔ BIẾN CẦN TRÁNH: Đừng nghĩ "Hoặc" là chỉ được chọn một trong hai!
          Trong toán học và tin học, <strong>OR có nghĩa là "thỏa ÍT NHẤT một điều kiện"</strong>. Nghĩa là thỏa điều kiện 1 được, thỏa điều kiện 2 được, mà <strong>thỏa cả hai điều kiện CÀNG ĐƯỢC CHỌN!</strong>
        </div>

        <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-2">
          <div className="font-bold text-xs md:text-sm text-orange-900">
            Ví dụ: "Chọn số NHỎ HƠN 5 HOẶC CHIA HẾT CHO 4" trong dãy: [2, 4, 8, 9]
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-orange-100">
              <span className="font-bold block">Số 2:</span>
              <span>&lt;5: ✅ | Chia hết cho 4: ❌</span>
              <span className="text-emerald-600 font-bold block mt-1">→ ĐƯỢC CHỌN (vì &lt;5)</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-300 bg-emerald-50/50">
              <span className="font-bold block text-emerald-800">Số 4:</span>
              <span>&lt;5: ✅ | Chia hết cho 4: ✅</span>
              <span className="text-emerald-700 font-bold block mt-1">→ ĐƯỢC CHỌN (thỏa cả hai!)</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-orange-100">
              <span className="font-bold block">Số 8:</span>
              <span>&lt;5: ❌ | Chia hết cho 4: ✅</span>
              <span className="text-emerald-600 font-bold block mt-1">→ ĐƯỢC CHỌN</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NOT = KHÔNG */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 font-black text-sm flex items-center justify-center">
            !
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            3. Phép NOT (KHÔNG) – Kính lọc loại trừ!
          </h2>
        </div>

        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          NOT nghĩa là <strong>phủ định / loại bỏ</strong>. Cách làm nhanh nhất là: tìm ra những gì vi phạm điều kiện bị cấm rồi gạch bỏ nó đi, phần còn lại chính là kết quả.
        </p>

        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 text-xs md:text-sm text-rose-950 space-y-1">
          <p>• <strong>KHÔNG phải số lẻ</strong> = Số chẵn.</p>
          <p>• <strong>KHÔNG phải hình vuông</strong> = Lấy tất cả hình tròn, hình tam giác... và bỏ hình vuông đi.</p>
          <p>• <strong>Đỏ VÀ KHÔNG Vuông</strong> = Lấy các thẻ màu Đỏ, rồi gạt bỏ thẻ Vuông, chỉ giữ lại thẻ Tròn/Tam giác màu Đỏ!</p>
        </div>
      </div>

      {/* CTA to Simulator */}
      <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl border-2 border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-base md:text-lg">
            Sẵn sàng điều khiển cổng logic chưa?
          </h3>
          <p className="text-xs md:text-sm text-slate-600">
            Hãy đưa 12 thẻ bài qua cổng kiểm soát trong phòng mô phỏng Logic Gate!
          </p>
        </div>

        <button
          onClick={handleMarkComplete}
          className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm md:text-base flex items-center gap-2 cursor-pointer shadow-sm transition-transform hover:scale-105 shrink-0"
        >
          <span>Vào Cổng Logic</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
