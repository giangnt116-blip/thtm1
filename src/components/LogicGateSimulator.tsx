import { useState } from 'react';
import { LOGIC_CARDS_DATA } from '../data/week01';
import { LogicCard } from '../types';
import { Check, X, HelpCircle, Sparkles, RefreshCw, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { storage } from '../utils/storage';

export function LogicGateSimulator() {
  const [activeMode, setActiveMode] = useState<'AND' | 'OR' | 'NOT'>('AND');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(1);
  const [passedCards, setPassedCards] = useState<number[]>([]);
  const [failedCards, setFailedCards] = useState<number[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [reflection, setReflection] = useState(storage.getReflections()['logic'] || '');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Gate Rules definitions
  const gateRules = {
    AND: {
      title: 'CỔNG AND (VÀ)',
      ruleText: 'MÀU XANH VÀ SỐ CHẴN',
      definition: 'Một thẻ bài PHẢI THỎA MÃN CẢ HAI ĐIỀU KIỆN (Màu xanh = Đúng ĐỒNG THỜI Số chẵn = Đúng) thì mới được qua cổng!',
      check: (card: LogicCard) => {
        const cond1 = card.color === 'blue';
        const cond2 = card.number % 2 === 0;
        return {
          pass: cond1 && cond2,
          c1: { name: 'Màu xanh dương', valid: cond1, detail: `Màu của thẻ là ${card.color === 'blue' ? 'Xanh' : card.color === 'red' ? 'Đỏ' : 'Vàng'}` },
          c2: { name: 'Số chẵn', valid: cond2, detail: `Số ${card.number} là số ${card.number % 2 === 0 ? 'chẵn' : 'lẻ'}` },
          operator: 'AND',
        };
      },
    },
    OR: {
      title: 'CỔNG OR (HOẶC)',
      ruleText: 'MÀU ĐỎ HOẶC HÌNH TRÒN',
      definition: 'OR có nghĩa là THỎA ÍT NHẤT MỘT điều kiện (chỉ cần Màu đỏ đúng, HOẶC Hình tròn đúng, HOẶC cả hai cùng đúng) thì được qua cổng!',
      check: (card: LogicCard) => {
        const cond1 = card.color === 'red';
        const cond2 = card.shape === 'circle';
        return {
          pass: cond1 || cond2,
          c1: { name: 'Màu đỏ', valid: cond1, detail: `Màu của thẻ là ${card.color === 'red' ? 'Đỏ' : card.color === 'blue' ? 'Xanh' : 'Vàng'}` },
          c2: { name: 'Hình tròn', valid: cond2, detail: `Hình dạng là ${card.shape === 'circle' ? 'Hình tròn' : card.shape === 'square' ? 'Hình vuông' : 'Tam giác'}` },
          operator: 'OR',
        };
      },
    },
    NOT: {
      title: 'CỔNG NOT (KHÔNG)',
      ruleText: 'KHÔNG PHẢI HÌNH VUÔNG',
      definition: 'NOT có nghĩa là ĐẢO NGƯỢC: Cứ hễ mang hình vuông là bị chặn lại, tất cả các hình khác (tròn, tam giác) đều được qua!',
      check: (card: LogicCard) => {
        const isSquare = card.shape === 'square';
        const cond1 = !isSquare;
        return {
          pass: cond1,
          c1: { name: 'Là hình vuông', valid: isSquare, detail: `Hình của thẻ là ${card.shape === 'square' ? 'Hình vuông' : card.shape === 'circle' ? 'Hình tròn' : 'Tam giác'}` },
          c2: { name: 'Phép NOT (Đảo ngược)', valid: cond1, detail: cond1 ? 'Không phải hình vuông => ĐẠT' : 'Là hình vuông => BỊ CHẶN' },
          operator: 'NOT',
        };
      },
    },
  };

  const currentRule = gateRules[activeMode];
  const activeCard = LOGIC_CARDS_DATA.find((c) => c.id === selectedCardId) || LOGIC_CARDS_DATA[0];
  const analysis = currentRule.check(activeCard);

  const handleTestCard = (card: LogicCard) => {
    setSelectedCardId(card.id);
    const res = currentRule.check(card);
    if (res.pass) {
      if (!passedCards.includes(card.id)) {
        const updated = [...passedCards, card.id];
        setPassedCards(updated);
        setFailedCards(failedCards.filter((id) => id !== card.id));
        if (updated.length >= 3) {
          triggerConfetti();
          storage.markSimulationExplored('logic');
        }
      }
    } else {
      if (!failedCards.includes(card.id)) {
        setFailedCards([...failedCards, card.id]);
        setPassedCards(passedCards.filter((id) => id !== card.id));
      }
    }
  };

  const handleTestAll = () => {
    const passed: number[] = [];
    const failed: number[] = [];
    LOGIC_CARDS_DATA.forEach((card) => {
      if (currentRule.check(card).pass) passed.push(card.id);
      else failed.push(card.id);
    });
    setPassedCards(passed);
    setFailedCards(failed);
    triggerConfetti();
    storage.markSimulationExplored('logic');
  };

  const handleReset = () => {
    setPassedCards([]);
    setFailedCards([]);
  };

  const handleSaveReflection = () => {
    storage.saveReflection('logic', reflection);
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2000);
  };

  // Helper render card shape
  const renderShapeIcon = (shape: string) => {
    if (shape === 'circle') return '●';
    if (shape === 'square') return '■';
    return '▲';
  };

  const getCardBg = (color: string) => {
    if (color === 'red') return 'bg-rose-50 border-rose-300 text-rose-700';
    if (color === 'blue') return 'bg-sky-50 border-sky-300 text-sky-700';
    return 'bg-amber-50 border-amber-300 text-amber-700';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚦</span>
            <h2 className="text-lg md:text-xl font-black text-slate-900">
              Logic Gate – Cổng logic AND, OR, NOT
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Thực hành đưa 12 thẻ bài qua cổng kiểm soát để hiểu rõ bản chất điều kiện
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestAll}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm cursor-pointer shadow-xs"
          >
            Thử tất cả 12 thẻ
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm cursor-pointer"
          >
            Làm sạch
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {(['AND', 'OR', 'NOT'] as const).map((mode) => {
          const active = activeMode === mode;
          return (
            <button
              key={mode}
              onClick={() => {
                setActiveMode(mode);
                setPassedCards([]);
                setFailedCards([]);
              }}
              className={`min-h-[46px] p-2.5 rounded-2xl font-black text-xs md:text-sm border transition-all cursor-pointer ${
                active
                  ? mode === 'AND'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : mode === 'OR'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                    : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              CỔNG {mode}
            </button>
          );
        })}
      </div>

      {/* Active Gate Banner */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 tracking-wider">
              <span>ĐIỀU KIỆN CỔNG:</span>
              <span className="px-2 py-0.5 rounded bg-white/20 text-white">
                {currentRule.title}
              </span>
            </div>
            <div className="text-lg md:text-2xl font-black tracking-wide mt-1 text-white">
              {currentRule.ruleText}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAnalysisModal(true)}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-300/30 text-xs md:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Xem giải thích "Vì sao?"</span>
          </button>
        </div>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed border-t border-white/10 pt-2">
          💡 {currentRule.definition}
        </p>
      </div>

      {/* 12 Cards Desk */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs md:text-sm font-bold text-slate-700">
            Kho 12 thẻ bài: (Bấm vào thẻ để đưa qua Cổng kiểm soát)
          </p>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-emerald-600">Được qua: {passedCards.length}</span>
            <span className="text-rose-600">Bị chặn: {failedCards.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {LOGIC_CARDS_DATA.map((card) => {
            const isPassed = passedCards.includes(card.id);
            const isFailed = failedCards.includes(card.id);
            const isCurrent = selectedCardId === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleTestCard(card)}
                className={`min-h-[80px] p-2.5 rounded-2xl border-2 flex flex-col items-center justify-between transition-all cursor-pointer relative ${getCardBg(
                  card.color
                )} ${
                  isCurrent
                    ? 'ring-3 ring-blue-500 scale-105 shadow-md'
                    : 'hover:scale-102 hover:shadow-xs'
                }`}
              >
                {/* Pass/Fail indicator icon badge */}
                {isPassed && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    ✓
                  </div>
                )}
                {isFailed && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    ✕
                  </div>
                )}

                <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-80">
                  <span>#{card.id}</span>
                  <span>{card.color === 'red' ? 'Đỏ' : card.color === 'blue' ? 'Xanh' : 'Vàng'}</span>
                </div>

                <div className="text-2xl font-black my-0.5">
                  {renderShapeIcon(card.shape)}
                </div>

                <div className="text-sm font-black tracking-wide">
                  Số {card.number}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Card Live Gate Analysis breakdown */}
      {activeCard && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-1 bg-slate-200 rounded-lg text-slate-700">
                Thẻ đang chọn: #{activeCard.id}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                Màu {activeCard.color} • Hình {activeCard.shape} • Số {activeCard.number}
              </span>
            </div>

            <div
              className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                analysis.pass
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {analysis.pass ? '✅ ĐƯỢC QUA CỔNG' : '❌ BỊ CHẶN LẠI'}
            </div>
          </div>

          {/* Condition-by-condition breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>Điều kiện 1: {analysis.c1.name}</span>
                <span className={analysis.c1.valid ? 'text-emerald-600' : 'text-rose-600'}>
                  {analysis.c1.valid ? '✅ Thỏa mãn' : '❌ Không thỏa'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{analysis.c1.detail}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>Điều kiện 2: {analysis.c2.name}</span>
                <span className={analysis.c2.valid ? 'text-emerald-600' : 'text-rose-600'}>
                  {analysis.c2.valid ? '✅ Thỏa mãn' : '❌ Không thỏa'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{analysis.c2.detail}</p>
            </div>
          </div>

          {/* Logic outcome formula */}
          <div className="mt-3 p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs md:text-sm text-blue-950 font-medium">
            <strong>Kết quả phép {analysis.operator}:</strong>{' '}
            {analysis.operator === 'AND' &&
              (analysis.pass
                ? 'Cả hai điều kiện đều ĐÚNG (✅ VÀ ✅) => KẾT QUẢ ĐẠT.'
                : `Có điều kiện bị SAI (${analysis.c1.valid ? '✅' : '❌'} VÀ ${
                    analysis.c2.valid ? '✅' : '❌'
                  }) => KẾT QUẢ BỊ CHẶN.`)}
            {analysis.operator === 'OR' &&
              (analysis.pass
                ? `Thỏa ít nhất một điều kiện (${analysis.c1.valid ? '✅' : '❌'} HOẶC ${
                    analysis.c2.valid ? '✅' : '❌'
                  }) => KẾT QUẢ ĐẠT.`
                : 'Cả hai điều kiện đều SAI => KẾT QUẢ BỊ CHẶN.')}
            {analysis.operator === 'NOT' &&
              (analysis.pass
                ? 'Thẻ không vi phạm điều kiện cấm => KẾT QUẢ ĐẠT.'
                : 'Thẻ vi phạm điều kiện cấm (là hình vuông) => BỊ LOẠI.')}
          </div>
        </div>
      )}

      {/* Analysis Modal / Card */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base md:text-lg flex items-center gap-2">
                <span>🔎</span>
                <span>Bí mật của Thám tử: Phép {activeMode}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAnalysisModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs md:text-sm text-slate-700 leading-relaxed">
              {activeMode === 'AND' && (
                <>
                  <p>
                    <strong>AND = VÀ</strong> giống như hai chiếc chìa khóa. Em phải có <strong>cả chìa khóa 1</strong> VÀ <strong>chìa khóa 2</strong> thì cánh cửa mới mở.
                  </p>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-bold text-blue-900 mb-1">Quy tắc vàng của AND:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Đúng VÀ Đúng → <strong>ĐÚNG</strong></li>
                      <li>Đúng VÀ Sai → <strong>SAI</strong></li>
                      <li>Sai VÀ Sai → <strong>SAI</strong></li>
                    </ul>
                  </div>
                </>
              )}

              {activeMode === 'OR' && (
                <>
                  <p>
                    <strong>OR = HOẶC</strong> có nghĩa là <strong>"ít nhất một điều kiện đúng"</strong>.
                  </p>
                  <p>
                    Ví dụ: Mẹ bảo "Con dọn phòng HOẶC con rửa bát thì được đi chơi". Con dọn phòng: được đi chơi. Con rửa bát: được đi chơi. Con làm cả hai: mẹ càng khen và vẫn được đi chơi!
                  </p>
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="font-bold text-orange-900 mb-1">Quy tắc vàng của OR:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Chỉ cần 1 điều kiện Đúng → <strong>ĐÚNG</strong></li>
                      <li>Cả hai điều kiện đều Đúng → <strong>VẪN ĐÚNG</strong></li>
                      <li>Chỉ khi CẢ HAI đều Sai → <strong>SAI</strong></li>
                    </ul>
                  </div>
                </>
              )}

              {activeMode === 'NOT' && (
                <>
                  <p>
                    <strong>NOT = KHÔNG</strong> là phép đảo ngược logic.
                  </p>
                  <p>
                    Hễ điều kiện là "KHÔNG phải hình vuông", ta sẽ tìm tất cả hình vuông rồi gạch bỏ đi. Những hình còn lại chính là đáp án!
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAnalysisModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm cursor-pointer hover:bg-blue-700"
            >
              Em đã hiểu rồi!
            </button>
          </div>
        </div>
      )}

      {/* Reflection Question */}
      <div className="mt-6 pt-5 border-t border-slate-200 bg-slate-50/70 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-sm md:text-base">
          <MessageSquareQuote className="w-5 h-5 text-orange-600" />
          <span>Em vừa phát hiện ra điều gì?</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Ghi lại điểm khác biệt giữa từ VÀ (AND) và từ HOẶC (OR) vào sổ tay:
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Ví dụ: VÀ đòi hỏi cả hai phải đúng, còn HOẶC chỉ cần một cái đúng..."
            className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs md:text-sm font-medium"
          />
          <button
            type="button"
            onClick={handleSaveReflection}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs md:text-sm shrink-0 cursor-pointer shadow-xs"
          >
            {reflectionSaved ? 'Đã ghi sổ tay! ✓' : 'Ghi sổ tay Thám tử'}
          </button>
        </div>
      </div>
    </div>
  );
}
