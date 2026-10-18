import { describe, expect, test } from 'vitest'
import {
  CHARS_PER_SEC,
  CLOSING_PHRASE,
  PHRASE_PAUSE_SEC,
  SPEECH_BUFFER_SEC,
  estimateSpeechSec,
  holdStartPhrases,
  transitionPhrases,
} from '../../src/player/phrases'
import type { Pose } from '../../src/poses/types'
import type { Step } from '../../src/program/generate'

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

const cat = pose({ id: 'cat', nameRu: 'Кошка', entryCue: 'Встань на четвереньки', cues: ['Округли спину', 'Опусти голову'] })
const twist = pose({
  id: 'twist',
  nameRu: 'Скрутка',
  entryCue: 'Ляг на спину, колени в сторону',
  cues: ['Плечи на полу'],
  exitCue: 'Верни колени в центр',
  bilateral: true,
  position: 'supine',
})
const STEPS: Step[] = [
  { pose: cat, holdSec: 20, transitionSec: 10 },
  { pose: twist, side: 'right', holdSec: 30, transitionSec: 8 },
  { pose: twist, side: 'left', holdSec: 30, transitionSec: 5 },
  { pose: cat, holdSec: 20, transitionSec: 8 },
]

describe('constants', () => {
  test('speech model parameters', () => {
    expect(CHARS_PER_SEC).toBe(12)
    expect(PHRASE_PAUSE_SEC).toBe(0.4)
    expect(SPEECH_BUFFER_SEC).toBe(2)
    expect(CLOSING_PHRASE).toBe('Практика окончена. Полежи на боку, затем медленно сядь')
  })
})

describe('estimateSpeechSec', () => {
  test('length / chars per second + pause', () => {
    expect(estimateSpeechSec('a'.repeat(24))).toBe(2.4)
    expect(estimateSpeechSec('')).toBe(0.4)
  })
})

describe('transitionPhrases', () => {
  test('first step: first intro then entryCue', () => {
    expect(transitionPhrases(STEPS, 0)).toEqual(['Начинаем. Первая поза: Кошка', 'Встань на четвереньки'])
  })

  test('right side: next intro, right side, entryCue', () => {
    expect(transitionPhrases(STEPS, 1)).toEqual(['Следующая поза: Скрутка', 'Правая сторона', 'Ляг на спину, колени в сторону'])
  })

  test('left side: previous exitCue, side switch, entryCue again', () => {
    expect(transitionPhrases(STEPS, 2)).toEqual([
      'Верни колени в центр',
      'Смена стороны. Левая сторона',
      'Ляг на спину, колени в сторону',
    ])
  })

  test('previous exitCue precedes the next intro', () => {
    expect(transitionPhrases(STEPS, 3)).toEqual(['Верни колени в центр', 'Следующая поза: Кошка', 'Встань на четвереньки'])
  })
})

describe('holdStartPhrases', () => {
  test('are the pose cues in order', () => {
    expect(holdStartPhrases(STEPS[0])).toEqual(['Округли спину', 'Опусти голову'])
  })
})
