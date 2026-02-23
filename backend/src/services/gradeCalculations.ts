import type { Assignment } from '@prisma/client';

export interface AssignmentWithDecimal extends Omit<Assignment, 'weightPercent' | 'gradeReceived'> {
  weightPercent: number;
  gradeReceived: number | null;
}

/**
 * Calculate current weighted grade for a class.
 * Sum of (weight * grade) for graded assignments, divided by sum of weights of graded assignments.
 * Returns null if no graded assignments.
 */
export function calculateCurrentGrade(assignments: AssignmentWithDecimal[]): number | null {
  const graded = assignments.filter((a) => a.gradeReceived != null);
  if (graded.length === 0) return null;

  const totalWeight = graded.reduce((sum, a) => sum + a.weightPercent, 0);
  const weightedSum = graded.reduce((sum, a) => sum + (a.weightPercent * (a.gradeReceived ?? 0)), 0);
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

/**
 * Minimum grade needed on upcoming assignments to reach target grade.
 * Uses actual total weight (gradedWeight + upcomingWeight) — works even when weights don't sum to 100.
 * Formula: target = (currentWeighted * gradedWeight + minNeeded * upcomingWeight) / totalWeight
 * => minNeeded = (target * totalWeight - currentWeighted * gradedWeight) / upcomingWeight
 */
export function minimumGradeNeeded(
  assignments: AssignmentWithDecimal[],
  targetGrade: number
): { minNeeded: number | null; message: string } {
  const graded = assignments.filter((a) => a.gradeReceived != null);
  const upcoming = assignments.filter((a) => a.gradeReceived == null);

  if (upcoming.length === 0) {
    return { minNeeded: null, message: 'No upcoming assignments' };
  }

  const gradedWeight = graded.reduce((sum, a) => sum + a.weightPercent, 0);
  const upcomingWeight = upcoming.reduce((sum, a) => sum + a.weightPercent, 0);
  const totalWeight = gradedWeight + upcomingWeight;

  if (totalWeight <= 0) {
    return { minNeeded: null, message: 'No valid assignment weights' };
  }

  const currentWeighted = graded.length > 0
    ? (graded.reduce((sum, a) => sum + (a.weightPercent * (a.gradeReceived ?? 0)), 0) / gradedWeight)
    : 0;

  const numerator = targetGrade * totalWeight - currentWeighted * gradedWeight;
  const minNeeded = numerator / upcomingWeight;

  if (minNeeded > 100) {
    const bestPossible = (currentWeighted * gradedWeight + 100 * upcomingWeight) / totalWeight;
    return { minNeeded: 100, message: `Target ${targetGrade}% is not achievable. Best possible is ~${bestPossible.toFixed(1)}%` };
  }
  if (minNeeded < 0) {
    return { minNeeded: 0, message: `Target ${targetGrade}% is already exceeded. You can score 0% on remaining work.` };
  }

  return { minNeeded, message: `Need at least ${minNeeded.toFixed(1)}% on each remaining assignment (on average)` };
}

/**
 * Priority score = weight × points remaining × proximity factor
 * Proximity: higher for assignments due sooner (days until due inverse)
 */
export function priorityScore(
  a: AssignmentWithDecimal,
  baseDate: Date = new Date()
): number {
  const weight = a.weightPercent;
  const pointsRemaining = a.gradeReceived == null ? 100 : Math.max(0, 100 - (a.gradeReceived ?? 0));
  const dueDate = new Date(a.dueDate);
  const daysUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000)));
  const proximityFactor = daysUntilDue === 0 ? 10 : 10 / (daysUntilDue + 1);
  return weight * (pointsRemaining / 100) * proximityFactor;
}

export function rankByPriority(assignments: AssignmentWithDecimal[], baseDate?: Date): Array<AssignmentWithDecimal & { priorityScore: number }> {
  const base = baseDate ?? new Date();
  return assignments
    .map((a) => ({ ...a, priorityScore: priorityScore(a, base) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
