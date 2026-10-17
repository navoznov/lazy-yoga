import { expect, test, vi } from 'vitest'
import { keepAwake } from '../../src/player/wakeLock'

function fakeDoc() {
  const listeners = new Set<() => void>()
  const doc = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (_: string, fn: () => void) => void listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => void listeners.delete(fn),
  }
  const setVisibility = (v: DocumentVisibilityState) => {
    doc.visibilityState = v
    listeners.forEach(fn => fn())
  }
  return { doc: doc as unknown as Document, setVisibility, listeners }
}

function fakeNav(request = vi.fn(() => Promise.resolve({ release: vi.fn(() => Promise.resolve()) }))) {
  return { nav: { wakeLock: { request } } as unknown as Navigator, request }
}

const flush = () => new Promise(r => setTimeout(r, 0))

test('no navigator.wakeLock → no throw', () => {
  const { doc } = fakeDoc()
  const release = keepAwake({} as Navigator, doc)
  expect(() => release()).not.toThrow()
})

test('no navigator/document at all → no throw', () => {
  expect(() => keepAwake()()).not.toThrow()
})

test('request rejects → no throw, no unhandled rejection', async () => {
  const { doc } = fakeDoc()
  const { nav } = fakeNav(vi.fn(() => Promise.reject(new Error('NotAllowedError'))))
  const release = keepAwake(nav, doc)
  await flush()
  release()
})

test('requests screen lock and re-requests when visible again', async () => {
  const { doc, setVisibility } = fakeDoc()
  const { nav, request } = fakeNav()
  keepAwake(nav, doc)
  expect(request).toHaveBeenCalledTimes(1)
  expect(request).toHaveBeenCalledWith('screen')
  setVisibility('hidden')
  expect(request).toHaveBeenCalledTimes(1)
  setVisibility('visible')
  expect(request).toHaveBeenCalledTimes(2)
  expect(request).toHaveBeenLastCalledWith('screen')
})

test('release releases the sentinel and stops re-acquiring', async () => {
  const { doc, setVisibility, listeners } = fakeDoc()
  const sentinel = { release: vi.fn(() => Promise.resolve()) }
  const { nav, request } = fakeNav(vi.fn(() => Promise.resolve(sentinel)))
  const release = keepAwake(nav, doc)
  await flush()
  release()
  expect(sentinel.release).toHaveBeenCalled()
  expect(listeners.size).toBe(0)
  setVisibility('hidden')
  setVisibility('visible')
  expect(request).toHaveBeenCalledTimes(1)
})

test('release before request resolves still releases the late sentinel', async () => {
  const { doc } = fakeDoc()
  const sentinel = { release: vi.fn(() => Promise.resolve()) }
  const { nav } = fakeNav(vi.fn(() => Promise.resolve(sentinel)))
  keepAwake(nav, doc)()
  await flush()
  expect(sentinel.release).toHaveBeenCalled()
})
