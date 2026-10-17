import { expect, test } from 'vitest'
import { advance, type PlayerAction, type PlayerState } from '../../src/player/engine'
import type { TimelineEvent } from '../../src/player/timeline'

const TL: TimelineEvent[] = [
  { atSec: 0, kind: 'step', stepIndex: 0, phase: 'transition' },
  { atSec: 0, kind: 'say', text: 'Начинаем. Первая поза: Кошка' },
  { atSec: 10, kind: 'step', stepIndex: 0, phase: 'hold' },
  { atSec: 10, kind: 'say', text: 'cue A' },
  { atSec: 20, kind: 'say', text: 'Дыши спокойно' },
  { atSec: 30, kind: 'step', stepIndex: 1, phase: 'transition' },
  { atSec: 30, kind: 'say', text: 'Следующая поза: Корова' },
  { atSec: 38, kind: 'step', stepIndex: 1, phase: 'hold' },
  { atSec: 48, kind: 'say', text: 'Дыши спокойно' },
  { atSec: 58, kind: 'say', text: 'Практика окончена. Полежи на боку, затем медленно сядь' },
  { atSec: 58, kind: 'end' },
]

const IDLE: PlayerState = { status: 'idle', elapsedSec: 0, nextEvent: 0, stepIndex: 0 }

function run(actions: PlayerAction[], s: PlayerState = IDLE) {
  const fired: TimelineEvent[] = []
  for (const a of actions) {
    const r = advance(TL, s, a)
    s = r.state
    fired.push(...r.fired)
  }
  return { state: s, fired }
}

test('start fires events at 0 and runs', () => {
  const { state, fired } = run([{ type: 'start' }])
  expect(state.status).toBe('running')
  expect(fired).toEqual(TL.slice(0, 2))
})

test('ticks fire every event in order exactly once', () => {
  const ticks: PlayerAction[] = Array.from({ length: 70 }, () => ({ type: 'tick', dt: 1 }))
  const { state, fired } = run([{ type: 'start' }, ...ticks])
  expect(fired).toEqual(TL)
  expect(state.status).toBe('done')
})

test('large tick fires all due events at once', () => {
  const { state, fired } = run([{ type: 'start' }, { type: 'tick', dt: 25 }])
  expect(fired).toEqual(TL.slice(0, 5))
  expect(state.elapsedSec).toBe(25)
  expect(state.stepIndex).toBe(0)
})

test('tracks stepIndex from step events', () => {
  const { state } = run([{ type: 'start' }, { type: 'tick', dt: 31 }])
  expect(state.stepIndex).toBe(1)
})

test('tick before start does nothing', () => {
  const r = advance(TL, IDLE, { type: 'tick', dt: 5 })
  expect(r.state).toEqual(IDLE)
  expect(r.fired).toEqual([])
})

test('paused ticks fire nothing and do not advance time', () => {
  const paused = run([{ type: 'start' }, { type: 'tick', dt: 5 }, { type: 'togglePause' }]).state
  expect(paused.status).toBe('paused')
  const { state, fired } = run([{ type: 'tick', dt: 20 }, { type: 'tick', dt: 20 }], paused)
  expect(fired).toEqual([])
  expect(state).toEqual(paused)
  const resumed = run([{ type: 'togglePause' }, { type: 'tick', dt: 5 }], paused)
  expect(resumed.state.status).toBe('running')
  expect(resumed.fired).toEqual(TL.slice(2, 4))
})

test('skip mid-hold lands on next transition without firing skipped cues', () => {
  const midHold = run([{ type: 'start' }, { type: 'tick', dt: 12 }]).state
  const { state, fired } = advance(TL, midHold, { type: 'skip' })
  expect(fired).toEqual(TL.slice(5, 7))
  expect(state.elapsedSec).toBe(30)
  expect(state.stepIndex).toBe(1)
  expect(state.status).toBe('running')
  expect(run([{ type: 'tick', dt: 8 }], state).fired).toEqual([TL[7]])
})

test('skip on last step jumps to end → done', () => {
  const lastHold = run([{ type: 'start' }, { type: 'tick', dt: 40 }]).state
  const { state, fired } = advance(TL, lastHold, { type: 'skip' })
  expect(fired).toEqual(TL.slice(9))
  expect(state.status).toBe('done')
  expect(state.elapsedSec).toBe(58)
})

test('skip while paused stays paused', () => {
  const paused = run([{ type: 'start' }, { type: 'tick', dt: 12 }, { type: 'togglePause' }]).state
  expect(advance(TL, paused, { type: 'skip' }).state.status).toBe('paused')
})

test('reaching total → done, further actions are no-ops', () => {
  const done = run([{ type: 'start' }, { type: 'tick', dt: 100 }]).state
  expect(done.status).toBe('done')
  for (const a of [{ type: 'tick', dt: 1 }, { type: 'skip' }, { type: 'togglePause' }, { type: 'start' }] as PlayerAction[]) {
    const r = advance(TL, done, a)
    expect(r.state).toEqual(done)
    expect(r.fired).toEqual([])
  }
})

test('skip fires cues sharing the target time even if sorted before it', () => {
  const tl: TimelineEvent[] = [
    { atSec: 0, kind: 'step', stepIndex: 0, phase: 'hold' },
    { atSec: 5, kind: 'say', text: 'skipped' },
    { atSec: 20, kind: 'say', text: 'exit cue' },
    { atSec: 20, kind: 'step', stepIndex: 1, phase: 'transition' },
  ]
  const s = advance(tl, IDLE, { type: 'start' }).state
  expect(advance(tl, s, { type: 'skip' }).fired).toEqual(tl.slice(2))
})
