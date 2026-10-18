import { LEVEL_MAX, LEVEL_MIN } from './program/progression'

export type Rating = 'easy' | 'ok' | 'hard'

export interface AppState {
  startDate: string | null
  level: number
  disclaimerAccepted: boolean
  history: { date: string; rating: Rating }[] // date = local 'YYYY-MM-DD'
}

export const DEFAULT_STATE: AppState = { startDate: null, level: 1.0, disclaimerAccepted: false, history: [] }

const KEY = 'lazy-yoga:v1'
const RATINGS: readonly unknown[] = ['easy', 'ok', 'hard'] satisfies Rating[]

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

// Keeps each stored field only if it has the expected type; anything else falls back to the default.
function sanitize(parsed: unknown): AppState {
  if (!isRecord(parsed)) return { ...DEFAULT_STATE, history: [] }
  const { startDate, level, disclaimerAccepted, history } = parsed
  return {
    startDate: typeof startDate === 'string' ? startDate : DEFAULT_STATE.startDate,
    level:
      typeof level === 'number' && Number.isFinite(level)
        ? Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, level))
        : DEFAULT_STATE.level,
    disclaimerAccepted:
      typeof disclaimerAccepted === 'boolean' ? disclaimerAccepted : DEFAULT_STATE.disclaimerAccepted,
    history: Array.isArray(history)
      ? history.filter(
          (h): h is AppState['history'][number] =>
            isRecord(h) && typeof h.date === 'string' && RATINGS.includes(h.rating),
        )
      : [],
  }
}

// Accessing `localStorage` itself can throw (e.g. blocked site data), so it is resolved inside try blocks.
export function loadState(storage?: Storage): AppState {
  try {
    const raw = (storage ?? localStorage).getItem(KEY)
    if (raw !== null) return sanitize(JSON.parse(raw))
  } catch {
    // unavailable storage or corrupted JSON → defaults
  }
  return { ...DEFAULT_STATE, history: [] }
}

export function saveState(state: AppState, storage?: Storage): void {
  try {
    ;(storage ?? localStorage).setItem(KEY, JSON.stringify(state))
  } catch {
    // quota exceeded or storage unavailable → state is kept in memory only
  }
}

export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
