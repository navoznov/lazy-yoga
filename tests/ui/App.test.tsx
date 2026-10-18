// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { ICON_SOURCE } from '../../src/poses/icons'
import { DEFAULT_STATE, loadState, saveState, todayLocal } from '../../src/storage'
import { App } from '../../src/ui/App'

beforeEach(() => localStorage.clear())
afterEach(cleanup)

function acceptDisclaimer() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Понятно' }))
}

function swipeLeft(el: Element) {
  fireEvent.pointerDown(el, { clientX: 300, clientY: 200 })
  fireEvent.pointerUp(el, { clientX: 100, clientY: 210 })
}

test('fresh storage shows disclaimer', () => {
  render(<App />)
  expect(screen.getByText(/не медицинская рекомендация/i)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Начать' })).toBeNull()
})

test('after accepting, Home shows «Начать» and the corpse pose name', () => {
  acceptDisclaimer()
  expect(screen.getByRole('button', { name: 'Начать' })).toBeTruthy()
  expect(screen.getByText('Поза покоя')).toBeTruthy()
  expect(loadState()).toMatchObject({ disclaimerAccepted: true, startDate: todayLocal() })
})

test('rating «Тяжело» saves level 0.9 and history entry with today', async () => {
  acceptDisclaimer()
  fireEvent.click(screen.getByRole('button', { name: 'Начать' }))
  const session = screen.getByTestId('session')
  for (let i = 0; i < 100 && !screen.queryByRole('button', { name: 'Тяжело' }); i++) {
    swipeLeft(session)
    await Promise.resolve()
  }
  fireEvent.click(await screen.findByRole('button', { name: 'Тяжело' }))
  const state = loadState()
  expect(state.level).toBeCloseTo(0.9)
  expect(state.history).toEqual([{ date: todayLocal(), rating: 'hard' }])
  expect(screen.getByText('Сегодня сделано')).toBeTruthy()
})

test('tap pauses and resumes the session', () => {
  acceptDisclaimer()
  fireEvent.click(screen.getByRole('button', { name: 'Начать' }))
  const session = screen.getByTestId('session')
  fireEvent.pointerDown(session, { clientX: 100, clientY: 100 })
  fireEvent.pointerUp(session, { clientX: 102, clientY: 101 })
  expect(screen.getByText('Пауза')).toBeTruthy()
  fireEvent.pointerDown(session, { clientX: 100, clientY: 100 })
  fireEvent.pointerUp(session, { clientX: 100, clientY: 100 })
  expect(screen.queryByText('Пауза')).toBeNull()
})

test('«Завершить» returns home without a history entry', () => {
  acceptDisclaimer()
  fireEvent.click(screen.getByRole('button', { name: 'Начать' }))
  fireEvent.click(screen.getByRole('button', { name: 'Завершить' }))
  expect(screen.getByRole('button', { name: 'Начать' })).toBeTruthy()
  expect(loadState().history).toEqual([])
})

test('a second session on the same day replaces the day’s history entry', async () => {
  saveState({ ...DEFAULT_STATE, disclaimerAccepted: true, startDate: todayLocal(), history: [{ date: todayLocal(), rating: 'easy' }] })
  render(<App />)
  expect(screen.getByText('Сегодня сделано')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Начать' }))
  const session = screen.getByTestId('session')
  for (let i = 0; i < 100 && !screen.queryByRole('button', { name: 'Нормально' }); i++) {
    swipeLeft(session)
    await Promise.resolve()
  }
  fireEvent.click(await screen.findByRole('button', { name: 'Нормально' }))
  expect(loadState().history).toEqual([{ date: todayLocal(), rating: 'ok' }])
})

test('rating twice on the same day changes the level only once', async () => {
  acceptDisclaimer()
  for (let n = 0; n < 2; n++) {
    fireEvent.click(screen.getByRole('button', { name: 'Начать' }))
    const session = screen.getByTestId('session')
    for (let i = 0; i < 100 && !screen.queryByRole('button', { name: 'Тяжело' }); i++) {
      swipeLeft(session)
      await Promise.resolve()
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Тяжело' }))
  }
  const state = loadState()
  expect(state.level).toBeCloseTo(0.9)
  expect(state.history).toEqual([{ date: todayLocal(), rating: 'hard' }])
})

test('Credits page shows ICON_SOURCE', () => {
  acceptDisclaimer()
  fireEvent.click(screen.getByRole('button', { name: 'Авторы иконок' }))
  const link = screen.getByRole('link', { name: ICON_SOURCE.name })
  expect(link.getAttribute('href')).toBe(ICON_SOURCE.url)
  expect(screen.getByText(ICON_SOURCE.license, { exact: false })).toBeTruthy()
})
