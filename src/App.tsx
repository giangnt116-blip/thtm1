import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { PatternLesson } from './pages/PatternLesson';
import { LogicLesson } from './pages/LogicLesson';
import { MachineLesson } from './pages/MachineLesson';
import { Practice } from './pages/Practice';
import { Challenge } from './pages/Challenge';
import { Progress } from './pages/Progress';
import { Teacher } from './pages/Teacher';
import { PatternSimulator } from './components/PatternSimulator';
import { LogicGateSimulator } from './components/LogicGateSimulator';
import { RuleMachineSimulator } from './components/RuleMachineSimulator';
import { storage } from './utils/storage';
import { UserAnswerRecord, ChallengeRecord } from './types';
import { ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, UserAnswerRecord>>({});
  const [challengeData, setChallengeData] = useState<ChallengeRecord | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Load persisted state on mount
  useEffect(() => {
    setPracticeAnswers(storage.getAllAnswers());
    setChallengeData(storage.getChallenge());
    setCompletedLessons(storage.getCompletedLessons());
  }, []);

  const handleSavePracticeRecord = (record: UserAnswerRecord) => {
    storage.saveAnswer(record);
    setPracticeAnswers(storage.getAllAnswers());
  };

  const handleSaveChallenge = (record: ChallengeRecord) => {
    storage.saveChallenge(record);
    setChallengeData(record);
  };

  const handleResetProgress = () => {
    setPracticeAnswers({});
    setChallengeData(null);
    setCompletedLessons([]);
  };

  // Aggregated stats
  const practiceRecords = Object.values(practiceAnswers) as UserAnswerRecord[];
  const completedPracticeCount = practiceRecords.filter((a) => a.isCorrect).length;
  const totalStars: number = practiceRecords.reduce(
    (acc, curr) => acc + (curr.starsEarned || 0),
    0
  );

  // Overall Week 01 calculation
  const lessonProgress = (completedLessons.length / 3) * 20;
  const simProgress = (storage.getExploredSimulations().length / 3) * 20;
  const practiceProgress = (completedPracticeCount / 20) * 40;
  const challengeProgress = challengeData?.completed
    ? ((challengeData.score || 0) / 100) * 20
    : 0;
  const progressPercent = Math.min(
    100,
    Math.round(lessonProgress + simProgress + practiceProgress + challengeProgress)
  );

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-200">
      {/* Top Main Navigation Header */}
      <Header
        currentPath={currentPath}
        onNavigate={(path) => {
          setCurrentPath(path);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        overallProgressPercent={progressPercent}
        totalStars={totalStars}
        challengeScore={challengeData?.score ?? null}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentPath === '/' && (
          <Home
            onNavigate={(path) => {
              setCurrentPath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            progressPercent={progressPercent}
            practiceCount={completedPracticeCount}
            totalStars={totalStars}
            challengeScore={challengeData?.score ?? null}
            completedLessons={completedLessons}
          />
        )}

        {/* 3 Lessons */}
        {currentPath === '/learn/pattern' && (
          <PatternLesson
            onNavigate={(path) => {
              setCurrentPath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPath === '/learn/logic' && (
          <LogicLesson
            onNavigate={(path) => {
              setCurrentPath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPath === '/learn/machine' && (
          <MachineLesson
            onNavigate={(path) => {
              setCurrentPath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* 3 Simulators */}
        {currentPath === '/sim/pattern' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentPath('/')}
              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang chủ</span>
            </button>
            <PatternSimulator
              onNavigate={(path) => {
                setCurrentPath(path);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {currentPath === '/sim/logic' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentPath('/')}
              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang chủ</span>
            </button>
            <LogicGateSimulator
              onNavigate={(path) => {
                setCurrentPath(path);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {currentPath === '/sim/machine' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentPath('/')}
              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang chủ</span>
            </button>
            <RuleMachineSimulator
              onNavigate={(path) => {
                setCurrentPath(path);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Practice (20 Questions) */}
        {currentPath === '/practice' && (
          <Practice
            answers={practiceAnswers}
            onSaveRecord={handleSavePracticeRecord}
            onNavigate={(path) => {
              setCurrentPath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Mini Challenge 01 (10 Questions) */}
        {currentPath === '/challenge' && (
          <Challenge
            savedChallenge={challengeData}
            onSaveChallenge={handleSaveChallenge}
            onNavigate={(path) => {
              setCurrentPath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Progress Board */}
        {currentPath === '/progress' && (
          <Progress
            answers={practiceAnswers}
            challenge={challengeData}
            onNavigate={(path) => {
              setCurrentPath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Teacher / Parent View */}
        {currentPath === '/teacher' && (
          <Teacher
            answers={practiceAnswers}
            challenge={challengeData}
            onNavigate={(path) => {
              setCurrentPath(path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white/70 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-slate-700">
            M1 THINKING LAB – WEEK 01: “Thám tử quy luật”
          </span>
          <span>Dành cho học sinh lớp 4 luyện thi Tin học trẻ M1</span>
        </div>
      </footer>
    </div>
  );
}
