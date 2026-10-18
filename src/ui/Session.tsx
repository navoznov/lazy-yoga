import { useEffect, useRef, useState } from 'preact/hooks'
import { browserSpeak, createVoice } from '../player/audio'
import { advance, type PlayerAction, type PlayerState } from '../player/engine'
import { buildTimeline, type TimelineEvent } from '../player/timeline'
import { keepAwake } from '../player/wakeLock'
import type { Program } from '../program/generate'
import { PoseIcon } from './PoseIcon'

const TICK_MS = 250
const SWIPE_PX = 50
const TAP_PX = 10

type Voice = ReturnType<typeof createVoice>

export interface SessionRun {
  program: Program
  timeline: TimelineEvent[]
  voice: Voice
  release: () => void
  state: PlayerState
}

export function loadManifest(): Promise<Record<string, string>> {
  return fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
    .then(r => r.json())
    .then(m => (typeof m === 'object' && m !== null ? m : {}))
    .catch(() => ({}))
}

function playAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error(`cannot play ${url}`))
    audio.play().catch(reject)
  })
}

function sayFired(voice: Voice, fired: TimelineEvent[]) {
  for (const e of fired) if (e.kind === 'say') void voice.say(e.text)
}

function silence(voice: Voice) {
  voice.stop()
  globalThis.speechSynthesis?.cancel()
}

// Must run inside the «Начать» click: iOS unlocks speech and audio only within a user gesture,
// so the first phrase is handed to the (idle) voice synchronously here.
export function startSession(program: Program, manifest: Record<string, string>): SessionRun {
  const timeline = buildTimeline(program)
  const voice = createVoice({
    manifest,
    baseUrl: `${import.meta.env.BASE_URL}audio/`,
    play: playAudio,
    speak: browserSpeak,
  })
  const release = keepAwake()
  const idle: PlayerState = { status: 'idle', elapsedSec: 0, nextEvent: 0, stepIndex: 0 }
  const { state, fired } = advance(timeline, idle, { type: 'start' })
  sayFired(voice, fired)
  return { program, timeline, voice, release, state }
}

export function Session({ run, onDone, onQuit }: { run: SessionRun; onDone: () => void; onQuit: () => void }) {
  const [player, setPlayer] = useState(run.state)
  const playerRef = useRef(run.state)
  const pointer = useRef<{ x: number; y: number } | null>(null)

  const dispatch = (action: PlayerAction) => {
    const { state, fired } = advance(run.timeline, playerRef.current, action)
    playerRef.current = state
    setPlayer(state)
    sayFired(run.voice, fired)
  }

  // Real elapsed time drives the session, so throttled timers (background tab, low power) don't stretch it.
  useEffect(() => {
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      dispatch({ type: 'tick', dt: (now - last) / 1000 })
      last = now
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Leaving the screen ends the session; after `end` the closing phrase is left to finish.
  useEffect(
    () => () => {
      run.release()
      if (playerRef.current.status !== 'done') silence(run.voice)
    },
    [],
  )

  useEffect(() => {
    if (player.status === 'done') onDone()
  }, [player.status])

  const onPointerUp = (e: PointerEvent) => {
    const start = pointer.current
    pointer.current = null
    if (!start) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      silence(run.voice)
      dispatch({ type: 'skip' })
    } else if (Math.abs(dx) < TAP_PX && Math.abs(dy) < TAP_PX) {
      dispatch({ type: 'togglePause' })
    }
  }

  const current = run.timeline
    .slice(0, player.nextEvent)
    .findLast(e => e.kind === 'step')
  const phase = current?.kind === 'step' ? current.phase : 'transition'
  const step = run.program.steps[player.stepIndex]
  const phaseEnd = (current?.atSec ?? 0) + (phase === 'hold' ? step.holdSec : step.transitionSec)
  const remaining = Math.max(0, Math.ceil(phaseEnd - player.elapsedSec))
  const { pose } = step

  return (
    <main
      class={`session ${phase}`}
      data-testid="session"
      onPointerDown={e => (pointer.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (pointer.current = null)}
    >
      <p class="label">
        {phase === 'transition' && 'Переход'}
        {step.side && <span>{step.side === 'right' ? 'Правая сторона' : 'Левая сторона'}</span>}
      </p>
      <h1>{pose.nameRu}</h1>
      {pose.sanskrit && <p class="sanskrit">{pose.sanskrit}</p>}
      {pose.icon ? (
        <PoseIcon poseId={pose.id} class="pose-icon" />
      ) : (
        <p class="description">{pose.description}</p>
      )}
      <p class="countdown">{remaining}</p>
      {player.status === 'paused' && <p class="paused">Пауза</p>}
      <button class="link quit" onPointerDown={e => e.stopPropagation()} onClick={onQuit}>
        Завершить
      </button>
    </main>
  )
}
