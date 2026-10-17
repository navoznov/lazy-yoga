import { expect, test } from 'vitest'
import { capHold, isAllowed } from '../../src/poses/safety'
import type { Contraindication, Pose } from '../../src/poses/types'

function pose(overrides: Partial<Pose> = {}): Pose {
  return {
    id: 'test-pose',
    nameRu: 'Тестовая поза',
    description: 'Описание',
    cues: ['Дыши спокойно'],
    holdSec: 30,
    bilateral: false,
    position: 'seated',
    phases: ['main'],
    areas: ['spine'],
    difficulty: 1,
    contraindications: [],
    imagePrompt: 'minimalist silhouette',
    ...overrides,
  }
}

test.each<Contraindication>(['inversion', 'breath-retention', 'intense-backbend', 'static-strength'])(
  'rejects %s',
  c => expect(isAllowed(pose({ contraindications: [c] }))).toBe(false),
)
test('allows head-below-heart (capped later)', () =>
  expect(isAllowed(pose({ contraindications: ['head-below-heart'] }))).toBe(true))
test('allows pose without contraindications', () => expect(isAllowed(pose())).toBe(true))
test('caps head-below-heart hold to 20', () =>
  expect(capHold(pose({ contraindications: ['head-below-heart'] }), 40)).toBe(20))
test('does not cap other poses', () => expect(capHold(pose(), 40)).toBe(40))
