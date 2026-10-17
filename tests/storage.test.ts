import { expect, test } from 'vitest'
import { DEFAULT_STATE, loadState, saveState, todayLocal, type AppState } from '../src/storage'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: key => data.get(key) ?? null,
    key: i => [...data.keys()][i] ?? null,
    removeItem: key => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  }
}

function throwingStorage(): Storage {
  const fail = () => {
    throw new Error('storage unavailable')
  }
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail }
}

test('default state', () =>
  expect(DEFAULT_STATE).toEqual({ startDate: null, level: 1.0, disclaimerAccepted: false, history: [] }))
test('empty storage → defaults', () => expect(loadState(memoryStorage())).toEqual(DEFAULT_STATE))
test('corrupted JSON → defaults', () =>
  expect(loadState(memoryStorage({ 'lazy-yoga:v1': '{not json' }))).toEqual(DEFAULT_STATE))
test('getItem throws → defaults', () => expect(loadState(throwingStorage())).toEqual(DEFAULT_STATE))
test('setItem throws → no throw', () => expect(() => saveState(DEFAULT_STATE, throwingStorage())).not.toThrow())

test('round-trips saved state', () => {
  const storage = memoryStorage()
  const state: AppState = {
    startDate: '2026-01-05',
    level: 1.1,
    disclaimerAccepted: true,
    history: [{ date: '2026-01-05', rating: 'easy' }],
  }
  saveState(state, storage)
  expect(loadState(storage)).toEqual(state)
})
test('merges partial stored state over defaults', () =>
  expect(loadState(memoryStorage({ 'lazy-yoga:v1': '{"level":1.2}' }))).toEqual({ ...DEFAULT_STATE, level: 1.2 }))
test('loaded defaults do not share history with DEFAULT_STATE', () => {
  loadState(memoryStorage()).history.push({ date: '2026-01-05', rating: 'ok' })
  expect(DEFAULT_STATE.history).toEqual([])
})

test('todayLocal uses local date', () => expect(todayLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05'))
