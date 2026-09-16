import { useState } from 'react';
import { Bot, Play, Sparkles, RefreshCw, CheckCircle, ArrowRight, MessageSquareQuote, Check, RotateCcw } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { storage } from '../utils/storage';

export function RuleMachineSimulator() {
  const [activeTab, setActiveTab] = useState<'NUMERIC' | 'TRANSFORM'>('NUMERIC');

  // Reflection state
  const [reflection, setReflection] = useState(storage.getReflections()['machine'] || '');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Machine 1: Numeric Rule State
  // Secret Rule: Output = Input * 3 + 1
  const secretExamples = [
    { in: 1, out: 4 },
    { in: 2, out: 7 },
    { in: 3, out: 10 },
  ];

  const hypotheses = [
    { id: 'h1', label: '+3 (Cộng 3)', calc: (x: number) => x + 3 },
    { id: 'h2', label: '×3 (Nhân 3)', calc: (x: number) => x * 3 },
    { id: 'h3', label: '×3 + 1 (Nhân 3 rồi cộng 1)', calc: (x: number) => x * 3 + 1, isCorrect: true },
    { id: 'h4', label: '×2 + 2 (Nhân 2 rồi cộng 2)', calc: (x: number) => x * 2 + 2 },
  ];

  const [selectedHypothesis, setSelectedHypothesis] = useState<string | null>(null);
  const [testInput, setTestInput] = useState<string>('5');
  const [machineRunResult, setMachineRunResult] = useState<{
    inputVal: number;
    actualOutput: number;
    hypothesisOutput: number;
  } | null>(null);

  const [finalDecision, setFinalDecision] = useState<'kept' | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Machine 2: Transformation State
  // ABC123 -> BCA231 -> CAB312 -> ABC123
  const [transformStep, setTransformStep] = useState(0);
  const transformHistory = [
    { text: 'ABC123', stepName: 'Bước 0 (Ban đầu)' },
    { text: 'BCA231', stepName: 'Bước 1 (Chuyển A & 1 xuống cuối)' },
    { text: 'CAB312', stepName: 'Bước 2 (Chuyển B & 2 xuống cuối)' },
    { text: 'ABC123', stepName: 'Bước 3 (Chuyển C & 3 xuống cuối)' },
  ];

  const handleSelectHypothesis = (id: string) => {
    setSelectedHypothesis(id);
    setMachineRunResult(null);
    setFinalDecision(null);
    setVerificationFeedback(null);
  };

  const handleRunMachineTest = () => {
    const num = parseInt(testInput, 10);
    if (isNaN(num)) return;

    // Actual machine rule: x * 3 + 1
    const actual = num * 3 + 1;

    const chosenHypo = hypotheses.find((h) => h.id === selectedHypothesis);
    const hypoVal = chosenHypo ? chosenHypo.calc(num) : 0;

    setMachineRunResult({
      inputVal: num,
      actualOutput: actual,
      hypothesisOutput: hypoVal,
    });
  };

  const handleConfirmDecision = (action: 'keep' | 'change') => {
    if (action === 'change') {
      setSelectedHypothesis(null);
      setMachineRunResult(null);
      setFinalDecision(null);
      setVerificationFeedback(null);
    } else {
      // Keep hypothesis -> now verify!
      setFinalDecision('kept');
      const chosen = hypotheses.find((h) => h.id === selectedHypothesis);
      if (chosen?.isCorrect) {
        setVerificationFeedback('🎉 CHÍNH XÁC! Giả thuyết [×3 + 1] là quy luật chuẩn xác của máy!');
        triggerConfetti();
        storage.markSimulationExplored('machine');
      } else {
        setVerificationFeedback('Chưa đúng rồi 🤔 Số thực tế của máy khác với giả thuyết này. Hãy thử chọn một giả thuyết khác!');
      }
    }
  };

  const handleNextTransformStep = () => {
    const next = (transformStep + 1) % transformHistory.length;
    setTransformStep(next);
    if (next === 3) {
      triggerConfetti();
      storage.markSimulationExplored('machine');
    }
  };

  const handleSaveReflection = () => {
    storage.saveReflection('machine', reflection);
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-8 space-y-6">
      {/* Top Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg md:text-xl font-black text-slate-900">
              Secret Rule Machine – Máy quy luật bí mật
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Quy trình khoa học: Đưa ra giả thuyết → Thử nghiệm thực tế → Kiểm chứng & Kết luận
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('NUMERIC')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all cursor-pointer ${
              activeTab === 'NUMERIC'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Chế độ Số (Input → Output)
          </button>
          <button
            onClick={() => setActiveTab('TRANSFORM')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all cursor-pointer ${
              activeTab === 'TRANSFORM'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Chế độ Ký tự (ABC123)
          </button>
        </div>
      </div>

      {activeTab === 'NUMERIC' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Visual Machine Display */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-md">
            <div className="text-center mb-4">
              <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase">
                Dữ liệu mẫu đã quan sát được từ máy:
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              {secretExamples.map((ex, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-xs text-indigo-300 font-semibold">Vào (In):</span>
                  <span className="text-xl font-black text-amber-300">{ex.in}</span>
                  <span className="text-xs text-slate-400">↓</span>
                  <span className="text-xs text-emerald-300 font-semibold">Ra (Out):</span>
                  <span className="text-xl font-black text-emerald-400">{ex.out}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs md:text-sm font-bold text-amber-300">
                <Bot className="w-4 h-4" />
                <span>Câu hỏi Thám tử: "Máy đang làm gì với số đầu vào?"</span>
              </div>
            </div>
          </div>

          {/* Step 1: Hypothesis selection */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>Em hãy chọn một GIẢ THUYẾT:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {hypotheses.map((h) => {
                const isSelected = selectedHypothesis === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleSelectHypothesis(h.id)}
                    className={`min-h-[48px] p-3 rounded-xl border text-left font-bold text-xs md:text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{h.label}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Test with custom number (DO NOT reveal right away!) */}
          {selectedHypothesis && (
            <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                <span>Thử nghiệm giả thuyết với một số em tự chọn:</span>
              </div>

              <p className="text-xs text-amber-800">
                Hệ thống chưa báo đúng sai vội. Hãy thử cho máy chạy một số bất kỳ để đối chiếu output thật của máy!
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-bold text-slate-700">
                  Số em muốn đưa vào máy:
                </label>
                <input
                  type="number"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-24 min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-center text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleRunMachineTest}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bấm nút cho máy chạy!</span>
                </button>
              </div>

              {/* Show test result comparisons */}
              {machineRunResult && (
                <div className="p-4 bg-white rounded-xl border border-amber-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-semibold block">
                        Giả thuyết của em dự đoán:
                      </span>
                      <span className="text-lg font-black text-blue-600">
                        Input {machineRunResult.inputVal} → Output{' '}
                        {machineRunResult.hypothesisOutput}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-xs text-emerald-700 font-semibold block">
                        🤖 Máy thật thực tế nhả ra:
                      </span>
                      <span className="text-lg font-black text-emerald-700">
                        Input {machineRunResult.inputVal} → Output{' '}
                        {machineRunResult.actualOutput}
                      </span>
                    </div>
                  </div>

                  {/* Decision confirmation */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-700">
                      Sau khi thấy kết quả thật của máy, em quyết định thế nào?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmDecision('keep')}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>✅ Giữ giả thuyết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmDecision('change')}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>🔄 Đổi giả thuyết</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Verification Feedback */}
              {verificationFeedback && (
                <div
                  className={`p-4 rounded-xl border font-bold text-sm flex items-center gap-2 animate-fadeIn ${
                    finalDecision === 'kept' && hypotheses.find((h) => h.id === selectedHypothesis)?.isCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{verificationFeedback}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Advanced Mode: Character Transformation */}
      {activeTab === 'TRANSFORM' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs md:text-sm text-purple-900">
            <strong>Chế độ nâng cao:</strong> Quan sát quy luật xoay vòng ký tự ABC123 → BCA231 → CAB312 → ?
            Mỗi bước chuyển ký tự đầu của chữ và số xuống cuối!
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center gap-6">
            <div className="text-center">
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                {transformHistory[transformStep].stepName}
              </span>
            </div>

            {/* Individual characters tiles */}
            <div className="flex items-center gap-2">
              {/* Letters */}
              <div className="flex items-center gap-1.5 p-2 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                {transformHistory[transformStep].text.slice(0, 3).split('').map((ch, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-xl bg-white border border-blue-300 shadow-2xs font-black text-2xl text-blue-700 flex items-center justify-center transition-all duration-300"
                  >
                    {ch}
                  </div>
                ))}
              </div>

              <span className="text-slate-400 font-black">+</span>

              {/* Digits */}
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                {transformHistory[transformStep].text.slice(3).split('').map((dg, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-xl bg-white border border-emerald-300 shadow-2xs font-black text-2xl text-emerald-700 flex items-center justify-center transition-all duration-300"
                  >
                    {dg}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextTransformStep}
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-transform hover:scale-105"
            >
              <span>Thực hiện bước tiếp theo (Bước {((transformStep + 1) % 4)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Step list indicator */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              {transformHistory.map((item, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    transformStep === i
                      ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <div className="text-[11px] opacity-80">Bước {i}</div>
                  <div className="text-sm font-black mt-0.5">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reflection Question */}
      <div className="mt-6 pt-5 border-t border-slate-200 bg-slate-50/70 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-sm md:text-base">
          <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
          <span>Em vừa phát hiện ra điều gì?</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Tại sao việc đưa số thử nghiệm vào máy lại giúp thám tử không bị kết luận nhầm?
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Ví dụ: Khi thử với số mới, nếu máy ra kết quả khác giả thuyết thì chứng tỏ giả thuyết sai..."
            className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs md:text-sm font-medium"
          />
          <button
            type="button"
            onClick={handleSaveReflection}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm shrink-0 cursor-pointer shadow-xs"
          >
            {reflectionSaved ? 'Đã ghi sổ tay! ✓' : 'Ghi sổ tay Thám tử'}
          </button>
        </div>
      </div>
    </div>
  );
}
