import { UserAnswerRecord, ChallengeRecord, ConfidenceLevel } from '../types';

const STORAGE_KEYS = {
  PROGRESS: 'week01.progress',
  ANSWERS: 'week01.answers',
  ATTEMPTS: 'week01.attempts',
  HINTS: 'week01.hints',
  CONFIDENCE: 'week01.confidence',
  CHALLENGE: 'week01.challenge',
  MASTERY: 'week01.mastery',
  TIME: 'week01.time',
  LESSONS: 'week01.lessons',
  SIMULATIONS: 'week01.simulations',
  REFLECTIONS: 'week01.reflections',
};

// Safe wrapper around localStorage
export const storage = {
  getAnswers(): Record<string, UserAnswerRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ANSWERS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Could not read answers from localStorage', e);
      return {};
    }
  },

  getAllAnswers(): Record<string, UserAnswerRecord> {
    return storage.getAnswers();
  },

  saveAnswer(record: UserAnswerRecord): void {
    try {
      const all = storage.getAnswers();
      // If student previously earned more stars, preserve the best star count
      const prev = all[record.questionId];
      if (prev && prev.starsEarned > record.starsEarned) {
        record.starsEarned = prev.starsEarned;
      }
      all[record.questionId] = record;
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(all));

      // Also record in confidence key
      if (record.confidence) {
        const confMap = storage.getConfidenceMap();
        confMap[record.questionId] = record.confidence;
        localStorage.setItem(STORAGE_KEYS.CONFIDENCE, JSON.stringify(confMap));
      }

      // Record hints
      const hintsMap = storage.getHintsMap();
      hintsMap[record.questionId] = record.hintsUsed;
      localStorage.setItem(STORAGE_KEYS.HINTS, JSON.stringify(hintsMap));
    } catch (e) {
      console.warn('Could not save answer', e);
    }
  },

  getConfidenceMap(): Record<string, ConfidenceLevel> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONFIDENCE);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  getHintsMap(): Record<string, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HINTS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  getChallenge(): ChallengeRecord | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHALLENGE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  saveChallenge(challenge: ChallengeRecord): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHALLENGE, JSON.stringify(challenge));
    } catch (e) {
      console.warn('Could not save challenge', e);
    }
  },

  getCompletedLessons(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LESSONS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  markLessonComplete(lessonId: string): void {
    try {
      const current = storage.getCompletedLessons();
      if (!current.includes(lessonId)) {
        current.push(lessonId);
        localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(current));
      }
    } catch (e) {
      console.warn('Could not mark lesson complete', e);
    }
  },

  getCompletedSimulations(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SIMULATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  getExploredSimulations(): string[] {
    return storage.getCompletedSimulations();
  },

  markSimulationExplored(simId: string): void {
    try {
      const current = storage.getCompletedSimulations();
      if (!current.includes(simId)) {
        current.push(simId);
        localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify(current));
      }
    } catch (e) {
      console.warn('Could not mark simulation complete', e);
    }
  },

  getReflections(): Record<string, string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  saveReflection(simId: string, text: string): void {
    try {
      const refs = storage.getReflections();
      refs[simId] = text;
      localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(refs));
    } catch (e) {
      console.warn('Could not save reflection', e);
    }
  },

  getTotalTime(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TIME);
      return raw ? parseInt(raw, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  addStudyTime(seconds: number): void {
    try {
      const curr = storage.getTotalTime();
      localStorage.setItem(STORAGE_KEYS.TIME, (curr + seconds).toString());
    } catch (e) {
      console.warn('Could not update time', e);
    }
  },

  resetAllProgress(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('week01.')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Could not reset progress', e);
    }
  },

  clearAll(): void {
    storage.resetAllProgress();
  },
};
