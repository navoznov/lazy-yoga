export type Rating = 'easy' | 'ok' | 'hard'

export interface AppState {
  startDate: string | null
  level: number
  disclaimerAccepted: boolean
  history: { date: string; rating: Rating }[] // date = local 'YYYY-MM-DD'
}

export const DEFAULT_STATE: AppState = { startDate: null, level: 1.0, disclaimerAccepted: false, history: [] }

const KEY = 'lazy-yoga:v1'

// Accessing `localStorage` itself can throw (e.g. blocked site data), so it is resolved inside try blocks.
export function loadState(storage?: Storage): AppState {
  try {
    const raw = (storage ?? localStorage).getItem(KEY)
    if (raw !== null) return { ...DEFAULT_STATE, history: [], ...JSON.parse(raw) }
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
