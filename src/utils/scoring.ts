import { UserAnswerRecord, ChallengeRecord, SkillType } from '../types';
import { PRACTICE_QUESTIONS, CHALLENGE_QUESTIONS } from '../data/week01';

export function normalizeString(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/→/g, '->');
}

export function checkAnswer(userAnswer: string, canonical: string, accepted?: string[]): boolean {
  if (!userAnswer) return false;
  const userNorm = normalizeString(userAnswer);
  const canonNorm = normalizeString(canonical);

  if (userNorm === canonNorm) return true;

  // Check if comma-separated items match regardless of order (e.g., "6, 8, 12" vs "8, 6, 12")
  if (canonical.includes(',') || (userAnswer.includes(',') && canonical.includes(' '))) {
    const canonParts = canonical
      .split(/[, ]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .sort();
    const userParts = userAnswer
      .split(/[, ]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .sort();

    if (canonParts.length > 0 && canonParts.length === userParts.length) {
      if (canonParts.every((val, idx) => val === userParts[idx])) {
        return true;
      }
    }
  }

  // Check against accepted alternatives
  if (accepted && accepted.length > 0) {
    for (const alt of accepted) {
      if (normalizeString(alt) === userNorm) return true;
    }
  }

  return false;
}

export function calculateStars(
  isCorrect: boolean,
  hintsUsed: number,
  revealedSolution: boolean,
  attemptsCount: number
): number {
  if (!isCorrect) return 0;
  if (revealedSolution) return 0;
  if (hintsUsed === 0 && attemptsCount <= 1) return 3;
  if (hintsUsed === 1) return 2;
  return 1;
}

export function getChallengeGrade(score: number): { label: string; badgeColor: string; description: string } {
  if (score >= 90) {
    return {
      label: 'Master Week 01 🏆',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Xuất sắc! Em đã hoàn toàn làm chủ tư duy quy luật và logic của Week 01.',
    };
  }
  if (score >= 70) {
    return {
      label: 'Đạt Week 01 ⭐',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Rất tốt! Em đã nắm vững hầu hết các dạng bài thám tử quy luật.',
    };
  }
  if (score >= 50) {
    return {
      label: 'Đang hình thành 💡',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Khá tốt! Em đã hiểu các quy tắc cơ bản, hãy ôn thêm các câu hỏi phức hợp.',
    };
  }
  return {
    label: 'Cần luyện lại 🔍',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'Đừng nản lòng! Hãy quay lại các phòng thí nghiệm mô phỏng để quan sát kỹ hơn nhé.',
  };
}

export interface SkillProgressStat {
  skill: SkillType;
  category: string;
  name: string;
  total: number;
  completed: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

export function analyzeSkills(
  answers: Record<string, UserAnswerRecord>,
  challenge: ChallengeRecord | null
): Record<string, SkillProgressStat> {
  const stats: Record<string, SkillProgressStat> = {
    'Quan sát': {
      skill: 'structural-observation',
      category: 'Quan sát',
      name: 'Quan sát & Cấu trúc',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'Quy luật lặp': {
      skill: 'repeating-pattern',
      category: 'Quy luật',
      name: 'Quy luật lặp',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'Quy luật số': {
      skill: 'numeric-pattern',
      category: 'Quy luật',
      name: 'Quy luật số',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'Quy luật xen kẽ': {
      skill: 'alternating-rule',
      category: 'Quy luật',
      name: 'Quy luật xen kẽ',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'Dual Track': {
      skill: 'dual-track',
      category: 'Quy luật',
      name: 'Dual Track (2 đường)',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'AND': {
      skill: 'AND',
      category: 'Logic',
      name: 'Cổng VÀ (AND)',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'OR': {
      skill: 'OR',
      category: 'Logic',
      name: 'Cổng HOẶC (OR)',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'NOT': {
      skill: 'NOT',
      category: 'Logic',
      name: 'Cổng KHÔNG (NOT)',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'Rule Machine': {
      skill: 'rule-machine',
      category: 'Máy tính',
      name: 'Máy quy luật',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
    'Constraints': {
      skill: 'constraints',
      category: 'Logic',
      name: 'Ràng buộc logic',
      total: 0,
      completed: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    },
  };

  function mapSkillToGroup(skill: SkillType): string {
    switch (skill) {
      case 'structural-observation':
      case 'direction-pattern':
        return 'Quan sát';
      case 'repeating-pattern':
        return 'Quy luật lặp';
      case 'numeric-pattern':
        return 'Quy luật số';
      case 'alternating-rule':
        return 'Quy luật xen kẽ';
      case 'dual-track':
        return 'Dual Track';
      case 'AND':
      case 'multiple-AND':
        return 'AND';
      case 'OR':
        return 'OR';
      case 'NOT':
      case 'AND-NOT':
        return 'NOT';
      case 'rule-machine':
      case 'transformation':
        return 'Rule Machine';
      case 'constraints':
        return 'Constraints';
      default:
        return 'Quan sát';
    }
  }

  // Count from Practice
  PRACTICE_QUESTIONS.forEach((q) => {
    const grp = mapSkillToGroup(q.skill);
    if (stats[grp]) {
      stats[grp].total += 1;
      const rec = answers[q.id];
      if (rec) {
        stats[grp].completed += 1;
        if (rec.isCorrect) stats[grp].correct += 1;
        else stats[grp].wrong += 1;
      }
    }
  });

  // Count from Challenge if completed
  if (challenge && challenge.completed) {
    CHALLENGE_QUESTIONS.forEach((cq) => {
      const grp = mapSkillToGroup(cq.skill);
      if (stats[grp]) {
        stats[grp].total += 1;
        const rec = challenge.answers[cq.id];
        if (rec) {
          stats[grp].completed += 1;
          if (rec.isCorrect) stats[grp].correct += 1;
          else stats[grp].wrong += 1;
        }
      }
    });
  }

  // Compute accuracies
  Object.values(stats).forEach((item) => {
    item.accuracy = item.completed > 0 ? Math.round((item.correct / item.completed) * 100) : 0;
  });

  return stats;
}

export function generateRecommendations(
  stats: Record<string, SkillProgressStat>,
  misconceptions: Array<{ questionId: string; prompt: string; skill: string }>
): string[] {
  const recommendations: string[] = [];

  // Critical misconceptions
  if (misconceptions.length > 0) {
    recommendations.push(
      `⚠️ Có ${misconceptions.length} câu học sinh "SAI nhưng rất TỰ TIN" (đang hiểu nhầm quy luật). Hãy cùng em xem lại lời giải chi tiết của các câu này!`
    );
  }

  // Lowest accuracy skills with at least 1 completed
  const testedSkills = Object.values(stats).filter((s) => s.completed > 0);
  testedSkills.sort((a, b) => a.accuracy - b.accuracy);

  const weakest = testedSkills[0];
  if (weakest && weakest.accuracy < 70) {
    if (weakest.name.includes('OR')) {
      recommendations.push(
        `Nên quay lại mô phỏng "Cổng Logic – Chế độ OR": Giúp học sinh khắc sâu rằng OR nghĩa là chỉ cần thỏa ít nhất một điều kiện là được nhận.`
      );
    } else if (weakest.name.includes('AND')) {
      recommendations.push(
        `Nên quay lại bài học "Cổng Logic – Chế độ AND": Hướng dẫn học sinh kiểm tra từng điều kiện một, cả hai đều phải ✅ thì mới đạt.`
      );
    } else if (weakest.name.includes('Dual Track')) {
      recommendations.push(
        `Nên quay lại "Pattern Lab – DUAL TRACK": Bấm nút "Tách thành 2 đường" để luyện thói quen tách chữ và số thành 2 bài toán con độc lập.`
      );
    } else if (weakest.name.includes('Máy')) {
      recommendations.push(
        `Nên thử nghiệm thêm trong "Secret Rule Machine": Khuyến khích học sinh nhập số thử nghiệm trước khi chốt giả thuyết.`
      );
    } else {
      recommendations.push(`Nên luyện tập thêm về phần "${weakest.name}" (độ chính xác hiện tại: ${weakest.accuracy}%).`);
    }
  } else if (testedSkills.length > 0 && testedSkills.every((s) => s.accuracy >= 80)) {
    recommendations.push(
      `🎉 Học sinh đang có phong độ tuyệt vời! Hãy tự tin bước vào Mini Challenge để hoàn thành chứng nhận Thám tử M1.`
    );
  } else {
    recommendations.push(
      `Khuyến khích học sinh hoàn thành toàn bộ 20 bài luyện tập theo đúng quy trình 5 bước để xây dựng nền tảng vững chắc.`
    );
  }

  return recommendations;
}

export function calculateSkillMastery(answers: Record<string, UserAnswerRecord>) {
  const map: Record<string, { correct: number; total: number; percent: number }> = {};
  PRACTICE_QUESTIONS.forEach((q) => {
    if (!map[q.skill]) {
      map[q.skill] = { correct: 0, total: 0, percent: 0 };
    }
    map[q.skill].total += 1;
    if (answers[q.id]?.isCorrect) {
      map[q.skill].correct += 1;
    }
  });
  Object.keys(map).forEach((sk) => {
    map[sk].percent = map[sk].total > 0 ? Math.round((map[sk].correct / map[sk].total) * 100) : 0;
  });
  return map;
}

export function calculateTeacherAnalytics(answers: Record<string, UserAnswerRecord>) {
  const records = Object.values(answers);
  const completedCount = records.filter((r) => r.isCorrect).length;
  const attemptedCount = records.length;
  const accuracy = attemptedCount > 0 ? Math.round((completedCount / attemptedCount) * 100) : 0;
  const totalHints = records.reduce((sum, r) => sum + (r.hintsUsed || 0), 0);
  const avgHints = attemptedCount > 0 ? (totalHints / attemptedCount).toFixed(1) : '0';

  const confidenceGroups = {
    confidentCorrect: 0,
    guessingCorrect: 0,
    confidentWrong: 0,
    struggling: 0,
  };

  const misconceptions: Array<{ questionId: string; prompt: string; skill: string }> = [];

  records.forEach((r) => {
    const isConfident = r.confidence === 'sure' || r.confidence === 'confident';
    if (r.isCorrect) {
      if (isConfident) confidenceGroups.confidentCorrect += 1;
      else confidenceGroups.guessingCorrect += 1;
    } else {
      if (isConfident) {
        confidenceGroups.confidentWrong += 1;
        const q = PRACTICE_QUESTIONS.find((item) => item.id === r.questionId);
        if (q) {
          misconceptions.push({ questionId: q.id, prompt: q.prompt, skill: q.skill });
        }
      } else {
        confidenceGroups.struggling += 1;
      }
    }
  });

  const skillStats = analyzeSkills(answers, null);
  const recommendations = generateRecommendations(skillStats, misconceptions);

  return {
    completedCount,
    attemptedCount,
    accuracy,
    avgHints,
    confidenceGroups,
    misconceptions,
    recommendations,
  };
}
