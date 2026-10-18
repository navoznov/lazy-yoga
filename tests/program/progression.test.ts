import { expect, test } from 'vitest'
import { LEVEL_MAX, LEVEL_MIN, STABLE_DAYS, nextLevel, scaleHold } from '../../src/program/progression'

test('constants', () => expect([STABLE_DAYS, LEVEL_MIN, LEVEL_MAX]).toEqual([21, 0.8, 1.5]))

test('ok keeps level during stable period', () => expect(nextLevel(1, 'ok', 5)).toBe(1))
test('ok raises level after stable period', () => expect(nextLevel(1, 'ok', 21)).toBeCloseTo(1.02))
test('easy raises level', () => expect(nextLevel(1, 'easy', 5)).toBeCloseTo(1.05))
test('hard lowers level', () => expect(nextLevel(1, 'hard', 5)).toBeCloseTo(0.9))
test('easy clamps to max', () => expect(nextLevel(1.5, 'easy', 30)).toBe(1.5))
test('hard clamps to min', () => expect(nextLevel(0.8, 'hard', 3)).toBe(0.8))

test('scaleHold rounds to nearest 5', () => expect(scaleHold(30, 1.2)).toBe(35))
test('scaleHold has 15 s minimum', () => expect(scaleHold(20, 0.8)).toBe(15))
test('scaleHold at level 1 keeps hold', () => expect(scaleHold(45, 1)).toBe(45))
