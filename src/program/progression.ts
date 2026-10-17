import type { Rating } from '../storage'

export const STABLE_DAYS = 21,
  LEVEL_MIN = 0.8,
  LEVEL_MAX = 1.5

const DELTA: Record<Rating, number> = { easy: 0.05, ok: 0.02, hard: -0.1 }

export function nextLevel(level: number, rating: Rating, dayIndex: number): number {
  const delta = rating === 'ok' && dayIndex < STABLE_DAYS ? 0 : DELTA[rating]
  return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, level + delta))
}

export function scaleHold(holdSec: number, level: number): number {
  return Math.max(15, Math.round((holdSec * level) / 5) * 5)
}
