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

test('1–2 cues, non-empty entryCue, description and imagePrompt', () => {
  for (const p of POSES) {
    expect(p.cues.length, p.id).toBeGreaterThanOrEqual(1)
    expect(p.cues.length, p.id).toBeLessThanOrEqual(2)
    p.cues.forEach(c => expect(c.trim(), p.id).not.toBe(''))
    expect(p.entryCue.trim(), p.id).not.toBe('')
    expect(p.description.trim(), p.id).not.toBe('')
    expect(p.imagePrompt.trim(), p.id).not.toBe('')
  }
})

test('exitCue present for head-below-heart, supine and prone poses', () => {
  for (const p of POSES) {
    const needsExit =
      p.contraindications.includes('head-below-heart') || p.position === 'supine' || p.position === 'prone'
    if (needsExit) expect(p.exitCue?.trim(), p.id).toBeTruthy()
  }
})

test('cues contain no exit wording', () => {
  for (const p of POSES) p.cues.forEach(c => expect(c, p.id).not.toMatch(/поднимайся|возвращайся|выходи/i))
})

test('exact id set and bilateral set from the table', () => {
  const ids = [
    'neck-side-stretch', 'chin-tuck', 'shoulder-rolls', 'chair-cat-cow', 'chair-twist', 'seated-side-bend', 'wrist-stretch',
    'mountain', 'standing-side-bend', 'chair-supported-half-fold', 'warrior-two', 'wall-tree',
    'cat-cow', 'childs-pose', 'thread-the-needle', 'low-lunge', 'sphinx', 'butterfly', 'bent-knee-seated-fold', 'seated-twist',
    'knees-to-chest', 'supine-twist', 'supine-figure-four', 'strap-hamstring-stretch', 'reclined-bound-angle',
    'legs-up-the-wall', 'corpse',
  ]
  const bilateral = [
    'neck-side-stretch', 'chair-twist', 'seated-side-bend', 'wrist-stretch', 'standing-side-bend', 'warrior-two',
    'wall-tree', 'thread-the-needle', 'low-lunge', 'seated-twist', 'supine-twist', 'supine-figure-four',
    'strap-hamstring-stretch',
  ]
  expect(POSES.map(p => p.id).sort()).toEqual([...ids].sort())
  expect(POSES.filter(p => p.bilateral).map(p => p.id).sort()).toEqual([...bilateral].sort())
  expect(POSES.find(p => p.id === 'thread-the-needle')!.contraindications).toContain('head-below-heart')
})

test('corpse hold 90–120', () => {
  const corpse = POSES.find(p => p.id === 'corpse')!
  expect(corpse.holdSec).toBeGreaterThanOrEqual(90)
  expect(corpse.holdSec).toBeLessThanOrEqual(120)
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

test('no spoken text contains Latin letters or digits', () => {
  for (const p of POSES) {
    const spoken = [p.nameRu, p.entryCue, ...p.cues, ...(p.exitCue === undefined ? [] : [p.exitCue])]
    spoken.forEach(t => {
      expect(t.trim(), p.id).not.toBe('')
      expect(t, p.id).toMatch(/^[^A-Za-z0-9]*$/)
    })
  }
})
