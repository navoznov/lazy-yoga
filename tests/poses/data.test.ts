import { expect, test } from 'vitest'
import { POSES } from '../../src/poses/data'
import { ICON_KEYS } from '../../src/poses/icons'
import { isAllowed } from '../../src/poses/safety'
import type { Phase } from '../../src/poses/types'

test('ids unique', () => expect(new Set(POSES.map(p => p.id)).size).toBe(POSES.length))

test('every pose passes hypertension filter', () => POSES.forEach(p => expect(isAllowed(p), p.id).toBe(true)))

test('holds within bounds', () => {
  for (const p of POSES) {
    const cooldownOnly = p.phases.length === 1 && p.phases[0] === 'cooldown'
    expect(p.holdSec, p.id).toBeGreaterThanOrEqual(20)
    expect(p.holdSec, p.id).toBeLessThanOrEqual(cooldownOnly ? 120 : 45)
  }
})

test('1–2 cues, non-empty description and imagePrompt', () => {
  for (const p of POSES) {
    expect(p.cues.length, p.id).toBeGreaterThanOrEqual(1)
    expect(p.cues.length, p.id).toBeLessThanOrEqual(2)
    p.cues.forEach(c => expect(c.trim(), p.id).not.toBe(''))
    expect(p.description.trim(), p.id).not.toBe('')
    expect(p.imagePrompt.trim(), p.id).not.toBe('')
  }
})

test('yogaApiKey refers to vendored icon', () => {
  for (const p of POSES) if (p.yogaApiKey !== undefined) expect(ICON_KEYS, p.id).toContain(p.yogaApiKey)
})

test('each phase has enough poses', () => {
  const count = (phase: Phase) => POSES.filter(p => p.phases.includes(phase)).length
  expect(count('warmup')).toBeGreaterThanOrEqual(4)
  expect(count('main')).toBeGreaterThanOrEqual(8)
  expect(count('cooldown')).toBeGreaterThanOrEqual(3)
})

test('corpse exists and is cooldown-only', () => {
  const corpse = POSES.find(p => p.id === 'corpse')
  expect(corpse).toBeDefined()
  expect(corpse!.phases).toEqual(['cooldown'])
})

test('no spoken text contains Latin letters', () => {
  for (const p of POSES) {
    expect(p.nameRu).toMatch(/^[^A-Za-z]*$/)
    p.cues.forEach(c => expect(c).toMatch(/^[^A-Za-z]*$/))
  }
})
