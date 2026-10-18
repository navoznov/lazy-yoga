import { describe, expect, test } from 'vitest'
import { estimateSpeechSec, holdStartPhrases, transitionPhrases } from '../../src/player/phrases'
import { allPhrases, buildTimeline, type TimelineEvent } from '../../src/player/timeline'
import { POSES } from '../../src/poses/data'
import type { Pose } from '../../src/poses/types'
import { generateProgram, type Program, type Step } from '../../src/program/generate'

const CLOSING = 'Практика окончена. Полежи на боку, затем медленно сядь'
const SWITCH = 'Смена стороны. Левая сторона'

function pose(overrides: Partial<Pose>): Pose {
  return {
    id: 'test-pose',
    nameRu: 'Тестовая поза',
    description: 'Описание',
    entryCue: 'Вход',
    cues: ['Подсказка'],
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

function program(steps: Step[]): Program {
  return { date: '2026-01-01', steps, totalSec: steps.reduce((sum, s) => sum + s.holdSec + s.transitionSec, 0) }
}

const says = (tl: TimelineEvent[]) => tl.flatMap(e => (e.kind === 'say' ? [e.text] : []))
const saysAt = (tl: TimelineEvent[], atSec: number) => says(tl.filter(e => e.atSec === atSec))
const atOf = (tl: TimelineEvent[], text: string) => tl.filter(e => e.kind === 'say' && e.text === text).map(e => e.atSec)

const cat = pose({ id: 'cat', nameRu: 'Кошка', entryCue: 'Встань на четвереньки', cues: ['Округли спину', 'Опусти голову'], holdSec: 20 })
const twist = pose({
  id: 'twist',
  nameRu: 'Скрутка',
  entryCue: 'Ляг на спину, колени в сторону',
  cues: ['Плечи на полу'],
  exitCue: 'Верни колени в центр',
  holdSec: 30,
  bilateral: true,
  position: 'supine',
})
const SAMPLE = program([
  { pose: cat, holdSec: 20, transitionSec: 10 },
  { pose: twist, side: 'right', holdSec: 30, transitionSec: 8 },
  { pose: twist, side: 'left', holdSec: 30, transitionSec: 5 },
])
const TL = buildTimeline(SAMPLE)

const DATES = Array.from({ length: 30 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10))
const GENERATED = DATES.map((date, i) => generateProgram({ date, dayIndex: 30 + i, level: [0.8, 1, 1.5][i % 3] }))

describe('buildTimeline', () => {
  test('events are sorted by atSec', () => {
    for (const p of [SAMPLE, ...GENERATED]) {
      const tl = buildTimeline(p)
      expect(tl.map(e => e.atSec)).toEqual([...tl.map(e => e.atSec)].sort((a, b) => a - b))
    }
  })

  test('each step has transition at its start and hold at start + transitionSec', () => {
    for (const p of [SAMPLE, ...GENERATED]) {
      const tl = buildTimeline(p)
      let start = 0
      p.steps.forEach((s, stepIndex) => {
        expect(tl).toContainEqual({ atSec: start, kind: 'step', stepIndex, phase: 'transition' })
        expect(tl).toContainEqual({ atSec: start + s.transitionSec, kind: 'step', stepIndex, phase: 'hold' })
        start += s.transitionSec + s.holdSec
      })
    }
  })

  test('transition says the name, right side, then entryCue; hold start says cues', () => {
    expect(saysAt(TL, 0)).toEqual(['Начинаем. Первая поза: Кошка', 'Встань на четвереньки'])
    expect(saysAt(TL, 10)).toEqual(['Округли спину', 'Опусти голову'])
    expect(saysAt(TL, 30)).toEqual(['Следующая поза: Скрутка', 'Правая сторона', 'Ляг на спину, колени в сторону'])
    expect(saysAt(TL, 38)).toEqual(['Плечи на полу'])
  })

  test('Дыши спокойно at hold midpoint', () => {
    expect(atOf(TL, 'Дыши спокойно')).toEqual([20, 53, 88])
  })

  test('Ещё десять секунд at hold end − 10 only for holds ≥ 30 s', () => {
    expect(atOf(TL, 'Ещё десять секунд')).toEqual([58, 93])
    const short = buildTimeline(program([{ pose: cat, holdSec: 20, transitionSec: 10 }]))
    expect(says(short)).not.toContain('Ещё десять секунд')
  })

  test('exitCue after each side of a bilateral pose', () => {
    expect(atOf(TL, 'Верни колени в центр')).toEqual([68, 103])
  })

  test('side switch says Смена стороны then entryCue again', () => {
    expect(saysAt(TL, 68)).toEqual(['Верни колени в центр', SWITCH, 'Ляг на спину, колени в сторону'])
  })

  test('exitCue opens the next transition, before its intro', () => {
    const at68 = TL.filter(e => e.atSec === 68)
    expect(at68[0]).toEqual({ atSec: 68, kind: 'step', stepIndex: 2, phase: 'transition' })
    expect(at68[1]).toEqual({ atSec: 68, kind: 'say', text: 'Верни колени в центр' })
  })

  test('transition start says exactly transitionPhrases of generated programs', () => {
    for (const p of GENERATED) {
      const tl = buildTimeline(p)
      let start = 0
      p.steps.forEach((s, i) => {
        expect(saysAt(tl, start)).toEqual(transitionPhrases(p.steps, i))
        start += s.transitionSec + s.holdSec
      })
    }
  })

  test('drops fillers that would start while hold-start cues are still spoken', () => {
    const wordy = pose({ id: 'wordy', cues: ['а'.repeat(120)], holdSec: 20 })
    const tl = buildTimeline(program([{ pose: wordy, holdSec: 20, transitionSec: 10 }]))
    expect(says(tl)).not.toContain('Дыши спокойно')
  })

  test('no filler of generated programs starts before hold-start cues end + 1 s or within 4 s of hold end', () => {
    for (const p of GENERATED) {
      const tl = buildTimeline(p)
      let start = 0
      p.steps.forEach(s => {
        const holdAt = start + s.transitionSec
        const endAt = holdAt + s.holdSec
        const cuesEnd = holdAt + holdStartPhrases(s).reduce((sum, t) => sum + estimateSpeechSec(t), 0)
        for (const e of tl) {
          if (e.kind !== 'say' || !['Дыши спокойно', 'Ещё десять секунд'].includes(e.text)) continue
          if (e.atSec <= holdAt || e.atSec >= endAt) continue
          expect(e.atSec).toBeGreaterThanOrEqual(cuesEnd + 1)
          expect(endAt - e.atSec).toBeGreaterThanOrEqual(4)
        }
        start = endAt
      })
    }
  })

  test('closing phrase precedes end, which is at program.totalSec', () => {
    for (const p of [SAMPLE, ...GENERATED]) {
      const tl = buildTimeline(p)
      const end = tl[tl.length - 1]
      expect(end).toEqual({ atSec: p.totalSec, kind: 'end' })
      expect(tl[tl.length - 2]).toEqual({ atSec: p.totalSec, kind: 'say', text: CLOSING })
      expect(tl.filter(e => e.kind === 'end')).toHaveLength(1)
    }
    expect(saysAt(TL, 103)).toEqual(['Верни колени в центр', CLOSING])
  })

  test('drops filler phrases within 4 s of other hold phrases', () => {
    // 6 s hold: midpoint at 3 s is within 4 s of both hold start and the exitCue
    const tiny = buildTimeline(program([{ pose: twist, side: 'right', holdSec: 6, transitionSec: 10 }]))
    expect(says(tiny)).not.toContain('Дыши спокойно')
    expect(says(tiny)).toContain('Верни колени в центр')
    // 30 s hold: midpoint (15) and ten-seconds (20) are 5 s apart, both kept
    const ok = buildTimeline(program([{ pose: twist, side: 'right', holdSec: 30, transitionSec: 10 }]))
    expect(atOf(ok, 'Дыши спокойно')).toEqual([25])
    expect(atOf(ok, 'Ещё десять секунд')).toEqual([30])
  })

  test('keeps the midpoint when it is at least 4 s from hold start and end', () => {
    const p = program([{ pose: twist, side: 'right', holdSec: 8, transitionSec: 0 }])
    expect(atOf(buildTimeline(p), 'Дыши спокойно')).toEqual([4])
  })

  test('every spoken text of 30 generated programs is in allPhrases(POSES)', () => {
    const phrases = new Set(allPhrases(POSES))
    for (const p of GENERATED) for (const text of says(buildTimeline(p))) expect(phrases).toContain(text)
  })
})

describe('allPhrases', () => {
  test('is deduplicated and includes the fixed copy', () => {
    const phrases = allPhrases(POSES)
    expect(new Set(phrases).size).toBe(phrases.length)
    for (const text of [CLOSING, SWITCH, 'Правая сторона', 'Дыши спокойно', 'Ещё десять секунд']) {
      expect(phrases).toContain(text)
    }
  })
})
