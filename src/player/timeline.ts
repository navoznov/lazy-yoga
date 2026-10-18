import type { Pose } from '../poses/types'
import type { Program } from '../program/generate'
import {
  CLOSING_PHRASE,
  MIDPOINT_PHRASE,
  RIGHT_SIDE_PHRASE,
  SIDE_SWITCH_PHRASE,
  TEN_LEFT_PHRASE,
  estimateSpeechSec,
  firstIntro,
  holdStartPhrases,
  nextIntro,
  transitionPhrases,
} from './phrases'

export type TimelineEvent =
  | { atSec: number; kind: 'say'; text: string }
  | { atSec: number; kind: 'step'; stepIndex: number; phase: 'transition' | 'hold' }
  | { atSec: number; kind: 'end' };

// fillers start no sooner than this after the hold-start cues end, and no later than END_GAP_SEC before hold end
const CUES_GAP_SEC = 1
const END_GAP_SEC = 4

// Events sharing an atSec are emitted in speaking order; the engine fires them in array order.
export function buildTimeline(program: Program): TimelineEvent[] {
  const tl: TimelineEvent[] = []
  const say = (atSec: number, text: string) => tl.push({ atSec, kind: 'say', text })
  let start = 0
  program.steps.forEach((step, stepIndex) => {
    const holdAt = start + step.transitionSec
    const endAt = holdAt + step.holdSec

    tl.push({ atSec: start, kind: 'step', stepIndex, phase: 'transition' })
    transitionPhrases(program.steps, stepIndex).forEach(text => say(start, text))

    tl.push({ atSec: holdAt, kind: 'step', stepIndex, phase: 'hold' })
    const cues = holdStartPhrases(step)
    cues.forEach(cue => say(holdAt, cue))

    const earliest = holdAt + cues.reduce((sum, cue) => sum + estimateSpeechSec(cue), 0) + CUES_GAP_SEC
    const fillers: [number, string][] = [[holdAt + step.holdSec / 2, MIDPOINT_PHRASE]]
    if (step.holdSec >= 30) fillers.push([endAt - 10, TEN_LEFT_PHRASE])
    fillers
      .filter(([atSec]) => atSec >= earliest && endAt - atSec >= END_GAP_SEC)
      .forEach(([atSec, text]) => say(atSec, text))
    start = endAt
  })
  // the last exitCue has no next transition to open, so it precedes the closing phrase
  const lastExit = program.steps.at(-1)?.pose.exitCue
  if (lastExit) say(program.totalSec, lastExit)
  say(program.totalSec, CLOSING_PHRASE)
  tl.push({ atSec: program.totalSec, kind: 'end' })
  return tl
}

export function allPhrases(poses: Pose[]): string[] {
  const texts = [RIGHT_SIDE_PHRASE, SIDE_SWITCH_PHRASE, MIDPOINT_PHRASE, TEN_LEFT_PHRASE, CLOSING_PHRASE]
  for (const p of poses) {
    texts.push(firstIntro(p), nextIntro(p), p.entryCue, ...p.cues)
    if (p.exitCue) texts.push(p.exitCue)
  }
  return [...new Set(texts)]
}
