import { expect, test } from 'vitest'
import { ICON_CREDITS, ICON_KEYS } from '../../src/poses/icons'

const files = import.meta.glob<string>('../../public/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

test('has icon keys', () => expect(ICON_KEYS.length).toBeGreaterThan(0))

test.each(ICON_KEYS)('%s has a vendored svg file', key => {
  const svg = files[`../../public/icons/${key}.svg`]
  expect(svg).toBeDefined()
  expect(svg.trimStart()).toMatch(/^<(svg|\?xml)/)
})

test('keys are unique kebab-case', () => {
  expect(new Set(ICON_KEYS).size).toBe(ICON_KEYS.length)
  for (const key of ICON_KEYS) expect(key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
})

test('credits are non-empty', () => {
  expect(ICON_CREDITS.length).toBeGreaterThan(0)
  for (const c of ICON_CREDITS) {
    expect(c.author).not.toBe('')
    expect(c.source).not.toBe('')
    expect(c.license).not.toBe('')
  }
})
