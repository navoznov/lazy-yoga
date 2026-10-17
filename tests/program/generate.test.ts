import { describe, expect, test } from 'vitest'
import { POSES } from '../../src/poses/data'
import type { Pose, Position } from '../../src/poses/types'
import { generateProgram, type Program, type Step } from '../../src/program/generate'
import { hashString, mulberry32 } from '../../src/program/rng'

const LEVELS = [0.8, 1, 1.5]
const DAY_INDEXES = [0, 30]
const FLOOR: Position[] = ['seated', 'kneeling', 'prone', 'supine']

function dates(count: number, start = '2026-01-01'): string[] {
  const d = new Date(`${start}T12:00:00Z`)
  return Array.from({ length: count }, (_, i) => new Date(d.getTime() + i * 86_400_000).toISOString().slice(0, 10))
}

const DATES = dates(60)
const CASES = DATES.flatMap(date => LEVELS.flatMap(level => DAY_INDEXES.map(dayIndex => ({ date, level, dayIndex }))))
const PROGRAMS = CASES.map(opts => ({ opts, program: generateProgram(opts) }))

const hbh = (s: Step) => s.pose.contraindications.includes('head-below-heart')
const cooldownOnly = (p: Pose) => p.phases.length === 1 && p.phases[0] === 'cooldown'

// consecutive steps of the same pose (bilateral sides) collapsed into one entry
function poseRuns(program: Program): Pose[] {
  return program.steps.filter((s, i) => i === 0 || program.steps[i - 1].pose.id !== s.pose.id).map(s => s.pose)
}

function pose(overrides: Partial<Pose>): Pose {
  return {
    id: 'test-pose',
    nameRu: 'Тестовая поза',
    description: 'Описание',
    entryCue: 'Вход',
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

describe('rng', () => {
  test('mulberry32 is deterministic and in [0, 1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 100; i++) {
      const x = a()
      expect(x).toBe(b())
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
  test('hashString is stable and differs for different strings', () => {
    expect(hashString('2026-01-01')).toBe(hashString('2026-01-01'))
    expect(hashString('2026-01-01')).not.toBe(hashString('2026-01-02'))
  })
})

describe('generateProgram over 60 dates × levels × dayIndex', () => {
  test('total is within 600–900 s and equals sum of holds + transitions', () => {
    for (const { opts, program } of PROGRAMS) {
      const sum = program.steps.reduce((acc, s) => acc + s.holdSec + s.transitionSec, 0)
      expect(program.totalSec, JSON.stringify(opts)).toBe(sum)
      expect(program.totalSec, JSON.stringify(opts)).toBeGreaterThanOrEqual(600)
      expect(program.totalSec, JSON.stringify(opts)).toBeLessThanOrEqual(900)
      expect(program.date).toBe(opts.date)
    }
  })

  test('last step is corpse, first 3 poses are warmup', () => {
    for (const { program } of PROGRAMS) {
      expect(program.steps.at(-1)!.pose.id).toBe('corpse')
      const runs = poseRuns(program)
      for (const p of runs.slice(0, 3)) expect(p.phases).toContain('warmup')
      expect(runs.slice(3).every(p => !p.phases.includes('warmup'))).toBe(true)
    }
  })

  test('every head-below-heart step holds ≤ 20 s at level 1.5', () => {
    for (const { opts, program } of PROGRAMS.filter(p => p.opts.level === 1.5)) {
      for (const s of program.steps.filter(hbh)) expect(s.holdSec, JSON.stringify(opts)).toBeLessThanOrEqual(20)
    }
  })

  test('no two different head-below-heart poses are adjacent', () => {
    for (const { opts, program } of PROGRAMS) {
      program.steps.forEach((s, i) => {
        const next = program.steps[i + 1]
        if (next && next.pose.id !== s.pose.id) expect(hbh(s) && hbh(next), JSON.stringify(opts)).toBe(false)
      })
    }
  })

  test('no bilateral head-below-heart pose sits next to another head-down pose', () => {
    for (const { program } of PROGRAMS) {
      const runs = poseRuns(program)
      runs.forEach((p, i) => {
        if (!(p.bilateral && p.contraindications.includes('head-below-heart'))) return
        for (const n of [runs[i - 1], runs[i + 1]]) {
          if (n) expect(n.contraindications).not.toContain('head-below-heart')
        }
      })
    }
  })

  test('cooldown-only steps hold ≤ 120 s at level 1.5', () => {
    for (const { program } of PROGRAMS.filter(p => p.opts.level === 1.5)) {
      for (const s of program.steps.filter(s => cooldownOnly(s.pose))) expect(s.holdSec).toBeLessThanOrEqual(120)
    }
  })

  test('bilateral poses appear as adjacent right, left with equal holds', () => {
    for (const { program } of PROGRAMS) {
      const steps = program.steps
      for (let i = 0; i < steps.length; i++) {
        const s = steps[i]
        if (!s.pose.bilateral) {
          expect(s.side).toBeUndefined()
          continue
        }
        expect(s.side).toBe('right')
        const left = steps[i + 1]
        expect(left.pose.id).toBe(s.pose.id)
        expect(left.side).toBe('left')
        expect(left.holdSec).toBe(s.holdSec)
        expect(left.transitionSec).toBe(5)
        i++
      }
    }
  })

  test('first transition is 10 s; floor → standing is 15 s', () => {
    for (const { program } of PROGRAMS) {
      expect(program.steps[0].transitionSec).toBe(10)
      program.steps.forEach((s, i) => {
        const prev = program.steps[i - 1]
        if (prev && prev.pose.id !== s.pose.id && s.pose.position === 'standing' && FLOOR.includes(prev.pose.position))
          expect(s.transitionSec).toBe(15)
      })
    }
  })
})

describe('safety filter', () => {
  test('an injected inversion pose never appears', () => {
    const inversion = pose({
      id: 'injected-inversion',
      position: 'standing',
      phases: ['warmup', 'main', 'cooldown'],
      contraindications: ['inversion'],
    })
    const poses = [...POSES, inversion]
    for (const opts of CASES) {
      const program = generateProgram({ ...opts, poses })
      expect(program.steps.some(s => s.pose.id === inversion.id)).toBe(false)
    }
  })

  test('hold caps survive extreme progression with long DB holds', () => {
    const poses = [
      ...POSES,
      pose({ id: 'long-fold', holdSec: 45, contraindications: ['head-below-heart'] }),
      pose({ id: 'long-rest', holdSec: 120, position: 'supine', phases: ['cooldown'] }),
    ]
    for (const opts of CASES.filter(c => c.level === 1.5)) {
      for (const s of generateProgram({ ...opts, poses }).steps) {
        if (hbh(s)) expect(s.holdSec).toBeLessThanOrEqual(20)
        if (cooldownOnly(s.pose)) expect(s.holdSec).toBeLessThanOrEqual(120)
      }
    }
  })
})

describe('transitions', () => {
  test('rising to standing from the floor takes 15 s, otherwise 8 s', () => {
    const poses = [
      pose({ id: 'w1', phases: ['warmup'], position: 'supine' }),
      pose({ id: 'w2', phases: ['warmup'], position: 'supine' }),
      pose({ id: 'w3', phases: ['warmup'], position: 'supine' }),
      pose({ id: 'stand', phases: ['main'], position: 'standing' }),
      pose({ id: 'rest', phases: ['cooldown'], position: 'supine' }),
      pose({ id: 'corpse', phases: ['cooldown'], position: 'supine', holdSec: 120 }),
    ]
    const program = generateProgram({ date: '2026-01-01', dayIndex: 0, level: 1, poses })
    expect(program.steps.map(s => s.pose.id)).toHaveLength(6)
    expect(program.steps[3].pose.id).toBe('stand')
    expect(program.steps.map(s => s.transitionSec)).toEqual([10, 8, 8, 15, 8, 8])
  })
})

describe('determinism and stable period', () => {
  test('same opts → deeply equal program', () => {
    for (const opts of CASES.slice(0, 30)) expect(generateProgram(opts)).toEqual(generateProgram(opts))
  })

  test('dayIndex < 21 → identical steps for different dates', () => {
    for (const level of LEVELS) {
      const a = generateProgram({ date: '2026-01-01', dayIndex: 3, level })
      const b = generateProgram({ date: '2026-02-15', dayIndex: 20, level })
      expect(a.steps).toEqual(b.steps)
    }
  })

  test('dayIndex ≥ 21 → at least two different programs among 7 dates', () => {
    for (const level of LEVELS) {
      const programs = dates(7).map(date => JSON.stringify(generateProgram({ date, dayIndex: 21, level }).steps))
      expect(new Set(programs).size).toBeGreaterThanOrEqual(2)
    }
  })
})
