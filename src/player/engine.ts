import type { TimelineEvent } from './timeline'

export interface PlayerState { status: 'idle'|'running'|'paused'|'done'; elapsedSec: number; nextEvent: number; stepIndex: number }
export type PlayerAction = { type: 'start' } | { type: 'tick'; dt: number } | { type: 'togglePause' } | { type: 'skip' };

// Fires tl[from..] while atSec <= untilSec; `end` finishes the session.
function fireUntil(tl: TimelineEvent[], s: PlayerState, from: number, untilSec: number) {
  const fired: TimelineEvent[] = []
  const state = { ...s, elapsedSec: untilSec, nextEvent: from }
  while (state.nextEvent < tl.length && tl[state.nextEvent].atSec <= untilSec) {
    const e = tl[state.nextEvent++]
    fired.push(e)
    if (e.kind === 'step') state.stepIndex = e.stepIndex
    if (e.kind === 'end') state.status = 'done'
  }
  return { state, fired }
}

export function advance(tl: TimelineEvent[], s: PlayerState, a: PlayerAction): { state: PlayerState; fired: TimelineEvent[] } {
  if (s.status === 'done') return { state: s, fired: [] }
  switch (a.type) {
    case 'start':
      if (s.status !== 'idle') return { state: s, fired: [] }
      return fireUntil(tl, { ...s, status: 'running' }, s.nextEvent, s.elapsedSec)
    case 'tick':
      if (s.status !== 'running') return { state: s, fired: [] }
      return fireUntil(tl, s, s.nextEvent, s.elapsedSec + a.dt)
    case 'togglePause':
      if (s.status === 'running') return { state: { ...s, status: 'paused' }, fired: [] }
      if (s.status === 'paused') return { state: { ...s, status: 'running' }, fired: [] }
      return { state: s, fired: [] }
    case 'skip': {
      if (s.status === 'idle') return { state: s, fired: [] }
      const target = tl.findIndex(
        (e, i) => i >= s.nextEvent && (e.kind === 'end' || (e.kind === 'step' && e.phase === 'transition')),
      )
      if (target === -1) return { state: s, fired: [] }
      // Events sharing the target's atSec belong to it (e.g. the closing phrase sorted before `end`).
      const atSec = tl[target].atSec
      return fireUntil(tl, s, tl.findIndex((e, i) => i >= s.nextEvent && e.atSec === atSec), atSec)
    }
  }
}
