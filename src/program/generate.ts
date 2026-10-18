import { SPEECH_BUFFER_SEC, estimateSpeechSec, transitionPhrases } from '../player/phrases'
import { POSES } from '../poses/data'
import { capHold, isAllowed } from '../poses/safety'
import type { Pose, Position } from '../poses/types'
import { STABLE_DAYS, scaleHold } from './progression'
import { hashString, mulberry32 } from './rng'

export interface Step {
  pose: Pose
  side?: 'right' | 'left'
  holdSec: number
  transitionSec: number
}
export interface Program {
  date: string
  steps: Step[]
  totalSec: number
}

const MAX_TOTAL_SEC = 900
const COOLDOWN_ONLY_MAX_SEC = 120
const WARMUP_COUNT = 3
const POSITION_ORDER: Position[] = ['standing', 'chair', 'seated', 'kneeling', 'prone', 'supine']
const FLOOR: Position[] = ['seated', 'kneeling', 'prone', 'supine']

const headDown = (p: Pose) => p.contraindications.includes('head-below-heart')
const cooldownOnly = (p: Pose) => p.phases.length === 1 && p.phases[0] === 'cooldown'

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Puts an upright main pose between adjacent head-below-heart poses; drops the later one if none fits.
function spaceHeadDown(main: Pose[]): Pose[] {
  const list = [...main]
  for (let i = 0; i + 1 < list.length; i++) {
    if (!(headDown(list[i]) && headDown(list[i + 1]))) continue
    const pair = [list[i].position, list[i + 1].position]
    // a separator can move only if its own neighbours don't become an adjacent head-down pair
    const movable = list
      .map((p, j) => ({ p, j }))
      .filter(({ p, j }) => !headDown(p) && !(headDown(list[j - 1] ?? p) && headDown(list[j + 1] ?? p)))
    const pick =
      movable.filter(({ p }) => pair.includes(p.position)).sort((a, b) => Math.abs(a.j - i) - Math.abs(b.j - i))[0] ??
      movable.sort((a, b) => Math.abs(a.j - i) - Math.abs(b.j - i))[0]
    if (pick) {
      list.splice(pick.j, 1)
      list.splice(pick.j < i ? i : i + 1, 0, pick.p)
    } else {
      list.splice(i + 1, 1)
    }
    i = -1
  }
  return list
}

function toSteps(poses: Pose[], level: number): Step[] {
  const steps: Step[] = []
  poses.forEach((pose, i) => {
    const prev = poses[i - 1]
    let holdSec = capHold(pose, scaleHold(pose.holdSec, level))
    if (cooldownOnly(pose)) holdSec = Math.min(holdSec, COOLDOWN_ONLY_MAX_SEC)
    const transitionSec = !prev ? 10 : pose.position === 'standing' && FLOOR.includes(prev.position) ? 15 : 8
    if (pose.bilateral) {
      steps.push({ pose, side: 'right', holdSec, transitionSec }, { pose, side: 'left', holdSec, transitionSec: 5 })
    } else {
      steps.push({ pose, holdSec, transitionSec })
    }
  })
  // stretch each transition to fit what is spoken during it
  return steps.map((step, i) => {
    const speechSec = transitionPhrases(steps, i).reduce((sum, text) => sum + estimateSpeechSec(text), 0)
    return { ...step, transitionSec: Math.max(step.transitionSec, Math.ceil(speechSec) + SPEECH_BUFFER_SEC) }
  })
}

function build(date: string, poses: Pose[], level: number): Program {
  const steps = toSteps(poses, level)
  return { date, steps, totalSec: steps.reduce((sum, s) => sum + s.holdSec + s.transitionSec, 0) }
}

export function generateProgram(opts: { date: string; dayIndex: number; level: number; poses?: Pose[] }): Program {
  const { date, dayIndex, level } = opts
  const pool = (opts.poses ?? POSES).filter(isAllowed)
  const rng = mulberry32(dayIndex < STABLE_DAYS ? 1 : hashString(date))

  const warmup = shuffle(
    pool.filter(p => p.phases.includes('warmup')),
    rng,
  ).slice(0, WARMUP_COUNT)
  const corpse = pool.find(p => p.id === 'corpse')
  const rest = shuffle(
    pool.filter(p => p.phases.includes('cooldown') && p.id !== 'corpse' && !warmup.includes(p)),
    rng,
  ).slice(0, 1)
  const cooldown = corpse ? [...rest, corpse] : rest
  const candidates = shuffle(
    pool.filter(p => p.phases.includes('main') && !warmup.includes(p) && !cooldown.includes(p)),
    rng,
  )

  const byPosition = (a: Pose, b: Pose) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
  let main: Pose[] = []
  let program = build(date, [...warmup, ...cooldown], level)
  for (const pose of candidates) {
    const nextMain = spaceHeadDown([...main, pose].sort(byPosition))
    const next = build(date, [...warmup, ...nextMain, ...cooldown], level)
    if (next.totalSec > MAX_TOTAL_SEC) continue
    main = [...main, pose]
    program = next
  }
  return program
}
