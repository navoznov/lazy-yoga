import { expect, test } from 'vitest'
import { ICON_SOURCE } from '../../src/poses/icons'

const files = import.meta.glob<string>('../../public/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

test('has vendored icons', () => expect(Object.keys(files).length).toBeGreaterThan(0))

test.each(Object.entries(files))('%s is sanitized', (_path, svg) => {
  expect(svg.trimStart()).toMatch(/^<svg/)
  expect(svg).not.toMatch(/<script|<foreignObject|<image|\son\w+=|href=|url\(/i)
})

test('icon source is CC0 SVG Repo', () => {
  expect(ICON_SOURCE).toEqual({
    name: 'SVG Repo — Yoga Poses',
    url: 'https://www.svgrepo.com/collection/yoga-poses/',
    license: 'CC0',
  })
})
