import type { Pose } from '../poses/types'
import type { Step } from '../program/generate'

// Single source of spoken copy and its rough duration, shared by the timeline and the generator.
export const CHARS_PER_SEC = 12
export const PHRASE_PAUSE_SEC = 0.4
export const SPEECH_BUFFER_SEC = 2

export const RIGHT_SIDE_PHRASE = 'Правая сторона'
export const SIDE_SWITCH_PHRASE = 'Смена стороны. Левая сторона'
export const MIDPOINT_PHRASE = 'Дыши спокойно'
export const TEN_LEFT_PHRASE = 'Ещё десять секунд'
export const CLOSING_PHRASE = 'Практика окончена. Полежи на боку, затем медленно сядь'

export const firstIntro = (p: Pose) => `Начинаем. Первая поза: ${p.nameRu}`
export const nextIntro = (p: Pose) => `Следующая поза: ${p.nameRu}`

export function estimateSpeechSec(text: string): number {
  return text.length / CHARS_PER_SEC + PHRASE_PAUSE_SEC
}

// Spoken at the start of step i: the previous pose's exitCue, then the intro of this step.
export function transitionPhrases(steps: Step[], i: number): string[] {
  const { pose, side } = steps[i]
  const exit = steps[i - 1]?.pose.exitCue
  const texts = exit ? [exit] : []
  if (side === 'left') texts.push(SIDE_SWITCH_PHRASE)
  else {
    texts.push(i === 0 ? firstIntro(pose) : nextIntro(pose))
    if (side === 'right') texts.push(RIGHT_SIDE_PHRASE)
  }
  texts.push(pose.entryCue)
  return texts
}

export function holdStartPhrases(step: Step): string[] {
  return step.pose.cues
}
