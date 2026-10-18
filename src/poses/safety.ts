import type { Contraindication, Pose } from './types'

// Hypertension filter: hard-coded on purpose, not configurable.
export const HEAD_BELOW_HEART_MAX_SEC = 20

const EXCLUDED: readonly Contraindication[] = ['inversion', 'breath-retention', 'intense-backbend', 'static-strength']

export function isAllowed(pose: Pose): boolean {
  return !pose.contraindications.some(c => EXCLUDED.includes(c))
}

export function capHold(pose: Pose, holdSec: number): number {
  return pose.contraindications.includes('head-below-heart') ? Math.min(holdSec, HEAD_BELOW_HEART_MAX_SEC) : holdSec
}
