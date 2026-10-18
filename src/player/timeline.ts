import type { Pose } from '../poses/types'
import type { Program } from '../program/generate'

export type TimelineEvent =
  | { atSec: number; kind: 'say'; text: string }
  | { atSec: number; kind: 'step'; stepIndex: number; phase: 'transition' | 'hold' }
  | { atSec: number; kind: 'end' };

const RIGHT = 'Правая сторона'
const SWITCH = 'Смена стороны. Левая сторона'
const MIDPOINT = 'Дыши спокойно'
const TEN_LEFT = 'Ещё десять секунд'
const CLOSING = 'Практика окончена. Полежи на боку, затем медленно сядь'
// filler phrases closer than this to another hold phrase are dropped
const MIN_GAP_SEC = 4

const firstIntro = (p: Pose) => `Начинаем. Первая поза: ${p.nameRu}`
const nextIntro = (p: Pose) => `Следующая поза: ${p.nameRu}`

// Events sharing an atSec are emitted in speaking order; the engine fires them in array order.
export function buildTimeline(program: Program): TimelineEvent[] {
  const tl: TimelineEvent[] = []
  const say = (atSec: number, text: string) => tl.push({ atSec, kind: 'say', text })
  let start = 0
  program.steps.forEach((step, stepIndex) => {
    const { pose, side, holdSec } = step
    const holdAt = start + step.transitionSec
    const endAt = holdAt + holdSec

    tl.push({ atSec: start, kind: 'step', stepIndex, phase: 'transition' })
    if (side === 'left') say(start, SWITCH)
    else {
      say(start, stepIndex === 0 ? firstIntro(pose) : nextIntro(pose))
      if (side === 'right') say(start, RIGHT)
    }
    say(start, pose.entryCue)

    tl.push({ atSec: holdAt, kind: 'step', stepIndex, phase: 'hold' })
    pose.cues.forEach(cue => say(holdAt, cue))

    // hold start and hold end always carry speech (cues; exitCue or the next intro), fillers in priority order
    const fillers: [number, string][] = [[endAt - 10, TEN_LEFT], [holdAt + holdSec / 2, MIDPOINT]]
    if (holdSec < 30) fillers.shift()
    const taken = [holdAt, endAt]
    const kept = fillers.filter(([atSec]) => {
      if (taken.some(t => Math.abs(t - atSec) < MIN_GAP_SEC)) return false
      taken.push(atSec)
      return true
    })
    kept.sort((a, b) => a[0] - b[0]).forEach(([atSec, text]) => say(atSec, text))

    if (pose.exitCue) say(endAt, pose.exitCue)
    start = endAt
  })
  say(program.totalSec, CLOSING)
  tl.push({ atSec: program.totalSec, kind: 'end' })
  return tl
}

export function allPhrases(poses: Pose[]): string[] {
  const texts = [RIGHT, SWITCH, MIDPOINT, TEN_LEFT, CLOSING]
  for (const p of poses) {
    texts.push(firstIntro(p), nextIntro(p), p.entryCue, ...p.cues)
    if (p.exitCue) texts.push(p.exitCue)
  }
  return [...new Set(texts)]
}
