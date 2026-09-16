import { useState } from 'react';
import { DETECTIVE_STEPS } from '../data/week01';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export function DetectiveStepsCard() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-orange-50 border border-blue-200 rounded-2xl p-4 md:p-5 shadow-sm transition-all mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            🕵️
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
              5 bước của Thám tử M1
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold border border-orange-200">
                Bí kíp phá án
              </span>
            </h3>
            <p className="text-xs md:text-sm text-slate-600">
              Quy trình tư duy chuẩn thi Tin học trẻ: không đoán mò, luôn có phương pháp!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors flex items-center gap-1 text-xs md:text-sm font-medium border border-slate-200/60"
          title={isOpen ? 'Thu gọn' : 'Mở rộng'}
        >
          <span>{isOpen ? 'Thu gọn' : 'Xem 5 bước'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-blue-100/80 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
          {DETECTIVE_STEPS.map((step) => (
            <div
              key={step.step}
              className="bg-white/90 backdrop-blur-xs rounded-xl p-3 border border-blue-100 shadow-2xs hover:border-blue-300 transition-all flex flex-col"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl" role="img" aria-label={step.name}>
                  {step.icon}
                </span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  Bước {step.step}
                </span>
              </div>
              <div className="font-bold text-xs md:text-sm text-slate-800 mb-1">
                {step.name}
              </div>
              <div className="text-[11px] md:text-xs text-slate-600 leading-relaxed">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
