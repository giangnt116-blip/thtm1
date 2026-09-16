import { useState } from 'react';
import { Menu, X, Compass, Award, BarChart3, UserCheck, Sparkles, BookOpen, Cpu } from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  overallProgressPercent?: number;
  totalStars?: number;
  challengeScore?: number | null;
}

export function Header({
  currentPath,
  onNavigate,
  overallProgressPercent = 0,
  totalStars,
  challengeScore,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: '🏠 Trang chủ', path: '/' },
    { label: '🎯 Luyện kỹ năng', path: '/practice' },
    { label: '🏆 Thử thách', path: '/challenge' },
    { label: '📊 Tiến độ', path: '/progress' },
    { label: '👨‍🏫 Phụ huynh / GV', path: '/teacher' },
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              M1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                  THINKING LAB
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                  Week 01
                </span>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
                Week 01 • Thám tử Quy luật 🔍
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-semibold">
            {navItems.map((item) => {
              const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path.slice(0, 5)));
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Progress pill & Mobile Menu Button */}
          <div className="flex items-center gap-2.5">
            <div
              onClick={() => handleNav('/progress')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
              title="Xem bảng tiến độ"
            >
              <span>Tiến độ tuần:</span>
              <span className="text-blue-600">{overallProgressPercent}%</span>
              <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                  style={{ width: `${overallProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center border border-slate-200 cursor-pointer"
              aria-label="Mở menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 px-4 pt-3 pb-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-xl mb-3 text-xs font-bold text-slate-700">
            <span>Tiến độ tuần 01:</span>
            <span className="text-blue-700 font-extrabold text-sm">{overallProgressPercent}%</span>
          </div>

          {navItems.map((item) => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full text-left px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {active && <span className="text-xs">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
