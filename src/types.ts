export type SkillType =
  | 'repeating-pattern'
  | 'numeric-pattern'
  | 'direction-pattern'
  | 'alternating-rule'
  | 'dual-track'
  | 'structural-observation'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'AND-NOT'
  | 'multiple-AND'
  | 'rule-machine'
  | 'transformation'
  | 'constraints';

export type QuestionType = 'choice' | 'text' | 'multi-select' | 'fill-blanks';

export type ConfidenceLevel = 'confident' | 'sure' | 'guessing' | 'confused';

export interface Question {
  id: string;
  session: string;
  skill: SkillType;
  difficulty: 1 | 2 | 3;
  type: QuestionType;
  prompt: string;
  options?: string[]; // for choice or multi-select options
  answer: string; // canonical answer or comma-separated items
  explanation: string;
  hints: [string, string, string]; // Hint 1, 2, 3
  acceptedAnswers?: string[]; // alternative accepted formats
}

export interface ChallengeQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  answer: string;
  acceptedAnswers?: string[];
  explanation?: string;
  skill: SkillType;
}

export interface UserAnswerRecord {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  hintsUsed: number;
  revealedSolution: boolean;
  confidence?: ConfidenceLevel;
  starsEarned: number; // 0, 1, 2, 3
  attemptsCount: number;
  timestamp: number;
}

export interface ChallengeRecord {
  completed: boolean;
  score: number; // 0 - 100
  answers: Record<string, { userAnswer: string; isCorrect: boolean; confidence?: ConfidenceLevel }>;
  completedAt?: number;
  timeSpentSeconds?: number;
}

export interface UserProgressData {
  practiceAnswers: Record<string, UserAnswerRecord>;
  challenge: ChallengeRecord | null;
  completedLessons: string[]; // ['pattern', 'logic', 'machine']
  simulationsExplored: string[]; // ['pattern', 'logic', 'machine']
  simulationReflections: Record<string, string>; // simId -> user thought
  totalTimeSpentSeconds: number;
  lastActiveTimestamp: number;
}

export interface LogicCard {
  id: number;
  color: 'red' | 'blue' | 'yellow';
  shape: 'circle' | 'square' | 'triangle';
  number: number;
}
