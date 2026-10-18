# Lazy Yoga MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A personal PWA that assembles a safe 10–15 minute yoga session for today and guides through it by voice with a timer.

**Architecture:** Pure TypeScript core (pose DB → safety filter → generator → timeline → player reducer), fully unit-tested, with a thin Preact UI on top. No backend: state in `localStorage`, voice as pre-generated mp3 files looked up via a manifest, with `speechSynthesis` fallback.

**Tech Stack:** Vite, TypeScript (strict), Preact, Vitest, vite-plugin-pwa, Yandex SpeechKit (build-time script), GitHub Pages via GitHub Actions.

**Spec:** `docs/spec.md`

## Global Constraints

- Single user, no accounts, no backend; persistent state only in `localStorage`.
- Session length: total program duration (holds + transitions) within **600–900 s**.
- Hold times in DB: **20–45 s**; poses used only in the cooldown phase may go up to **120 s**.
- Head-below-heart poses never directly follow each other (sides of one bilateral pose count as consecutive); an upright pose sits between them.
- Cooldown-only poses: effective hold after progression **≤ 120 s**.
- Hypertension filter is hard-coded, not configurable: excluded contraindications `inversion`, `breath-retention`, `intense-backbend`, `static-strength`; `head-below-heart` allowed only with effective hold **≤ 20 s** after progression.
- Transitions between poses: **8 s** default, **15 s** when rising to standing from floor, **5 s** side switch, **10 s** before the first pose.
- UI and voice in Russian; Sanskrit shown on screen only, never spoken.
- One-time disclaimer «согласуй нагрузку с врачом» before first session.
- Yandex API key only from env var `YANDEX_API_KEY`; never committed.
- No nude imagery.
- Work on feature branches; `main` only via PR. Commit messages: Conventional Commits, English, **no `Co-Authored-By` / "Generated with" lines**.

## Review Focus

1. **Audio file missing for a phrase** (DB text edited, TTS not re-run) → falls back to `speechSynthesis`, never silent, never throws. Test in Task 8.
2. **`localStorage` unavailable or corrupted JSON** → defaults are used, app works. Test in Task 4.
3. **Extreme progression** (many «легко» or many «тяжело» in a row) → `head-below-heart` cap ≤ 20 s and total 600–900 s still hold. Test in Task 5.
4. **Gaps in usage / reopening the same day** → the same date always yields the same program; skipped days don't break progression. Test in Task 5.
5. **Wake Lock unsupported or released on tab switch** → session keeps running, lock re-requested on `visibilitychange`, no crash. Test in Task 8.

---

## File Structure

```
index.html
vite.config.ts            # Preact + PWA plugin, base '/lazy-yoga/'
src/
  poses/types.ts          # Pose and related types
  poses/safety.ts         # hypertension filter + caps
  poses/data.ts           # the pose database (content)
  poses/icons.ts          # generated list of vendored yoga_api icon keys + credits
  program/rng.ts          # seeded RNG
  program/progression.ts  # level updates, hold scaling
  program/generate.ts     # today's program
  player/timeline.ts      # program → timed events + phrase texts
  player/engine.ts        # pure player reducer
  player/audio.ts         # mp3 manifest lookup + speechSynthesis fallback
  player/wakeLock.ts      # wake lock with re-acquire
  storage.ts              # localStorage state
  ui/App.tsx, Home.tsx, Disclaimer.tsx, Session.tsx, Rating.tsx, Credits.tsx
  main.tsx
scripts/fetch-icons.ts    # downloads yoga_api SVGs → public/icons/
scripts/tts.ts            # generates public/audio/*.mp3 + manifest.json
public/icons/, public/audio/
tests/ mirrors src/
.github/workflows/deploy.yml
```

---

### Task 1: Scaffold, pose types, safety filter

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx` (renders "Lazy Yoga" placeholder), `.gitignore` (node_modules, dist, `.env`)
- Create: `src/poses/types.ts`, `src/poses/safety.ts`
- Test: `tests/poses/safety.test.ts`

**Interfaces:**
- Produces (`types.ts`):
```ts
export type Position = 'standing' | 'chair' | 'seated' | 'kneeling' | 'prone' | 'supine';
export type Phase = 'warmup' | 'main' | 'cooldown';
export type BodyArea = 'neck' | 'shoulders' | 'upper-back' | 'lower-back' | 'spine' | 'hips' | 'hamstrings';
export type Contraindication = 'inversion' | 'head-below-heart' | 'breath-retention' | 'intense-backbend' | 'static-strength';
export interface Pose {
  id: string; nameRu: string; sanskrit?: string; description: string;
  entryCue: string;          // spoken during the transition: how to get into the pose
  cues: string[];            // 1–2 short spoken refinements, spoken at hold start (never exit wording)
  exitCue?: string;          // spoken at hold end; required for head-below-heart and supine/prone poses
  holdSec: number; bilateral: boolean; position: Position; phases: Phase[];
  areas: BodyArea[]; difficulty: 1 | 2 | 3; contraindications: Contraindication[];
  yogaApiKey?: string; imagePrompt: string;
}
```
- Produces (`safety.ts`): `HEAD_BELOW_HEART_MAX_SEC = 20`, `isAllowed(pose: Pose): boolean`, `capHold(pose: Pose, holdSec: number): number`.

- [ ] **Step 1:** `npm create vite@latest . -- --template preact-ts`, add `vitest`, script `"test": "vitest run"`, enable `strict`. Verify: `npm run build` succeeds.
- [ ] **Step 2: Write failing tests** in `tests/poses/safety.test.ts` with a `pose(overrides)` fixture helper:
```ts
test.each(['inversion','breath-retention','intense-backbend','static-strength'])('rejects %s', c =>
  expect(isAllowed(pose({ contraindications: [c] }))).toBe(false));
test('allows head-below-heart (capped later)', () =>
  expect(isAllowed(pose({ contraindications: ['head-below-heart'] }))).toBe(true));
test('allows pose without contraindications', () => expect(isAllowed(pose())).toBe(true));
test('caps head-below-heart hold to 20', () =>
  expect(capHold(pose({ contraindications: ['head-below-heart'] }), 40)).toBe(20));
test('does not cap other poses', () => expect(capHold(pose(), 40)).toBe(40));
```
- [ ] **Step 3:** Run `npm test` → FAIL (module not found).
- [ ] **Step 4:** Implement `types.ts` and `safety.ts`.
- [ ] **Step 5:** Run `npm test` → PASS.
- [ ] **Step 6:** Commit `feat: scaffold app with pose types and hypertension filter`.

---

### Task 2: Vendor yoga_api icons and credits

**Files:**
- Create: `scripts/fetch-icons.ts`, `public/icons/*.svg`, `src/poses/icons.ts`
- Test: `tests/poses/icons.test.ts`

**Interfaces:**
- Produces: `src/poses/icons.ts` exporting `ICON_KEYS: readonly string[]` (kebab-case of yoga_api `english_name`, e.g. `child's pose` → `childs-pose`) and `ICON_CREDITS: { author: string; source: string; license: string }[]`; icon URL is `${import.meta.env.BASE_URL}icons/${key}.svg`.

- [ ] **Step 1:** Write `scripts/fetch-icons.ts` (run with `npx tsx`): fetch `https://raw.githubusercontent.com/rebeccaestes/yoga_api/master/yoga_api.json`, download each `img_url` (Dropbox `?raw=1`) to `public/icons/<key>.svg`, write `src/poses/icons.ts`. Skip and log entries whose download fails.
- [ ] **Step 2:** Run it. Verify: `ls public/icons | wc -l` ≈ 48, each file starts with `<svg` or `<?xml`.
- [ ] **Step 3:** Check the license on Noun Project for Claire Jones and Elizabeth Sobka icons; put the verified license string into `ICON_CREDITS`. If an icon is not CC BY / CC0, delete it and its key. Record the finding in the commit message.
- [ ] **Step 4: Test** `tests/poses/icons.test.ts`: every `ICON_KEYS` entry has a file in `public/icons/`; `ICON_CREDITS` non-empty. Run → PASS.
- [ ] **Step 5:** Commit `feat: vendor yoga_api pose icons with credits`.

---

### Task 3: Pose database

**Files:**
- Create: `src/poses/data.ts` exporting `POSES: Pose[]`
- Test: `tests/poses/data.test.ts`

**Interfaces:**
- Consumes: `Pose`, `isAllowed` (Task 1), `ICON_KEYS` (Task 2).
- Produces: `POSES`; pose with id `corpse` exists and is the only pose that the generator places last.

Pose set (ids fixed; content — Russian name, description, cues, holds, tags — written conservatively per spec; `corpse` hold 90–120 s):

| Phase | ids |
|---|---|
| warmup (chair/seated) | `neck-side-stretch`*, `chin-tuck`, `shoulder-rolls`, `chair-cat-cow`, `chair-twist`*, `seated-side-bend`*, `wrist-stretch` |
| main — standing | `mountain`, `standing-side-bend`*, `chair-supported-half-fold`, `warrior-two`*, `wall-tree`* |
| main — floor | `cat-cow`, `childs-pose`, `thread-the-needle`* (head-below-heart), `low-lunge`*, `sphinx`, `butterfly`, `bent-knee-seated-fold`, `seated-twist`* |
| cooldown (supine) | `knees-to-chest`, `supine-twist`*, `supine-figure-four`*, `strap-hamstring-stretch`*, `reclined-bound-angle`, `legs-up-the-wall`, `corpse` |

\* bilateral (plus `wrist-stretch`, one arm at a time). Set `yogaApiKey` only where a matching key exists in `ICON_KEYS`.

- [ ] **Step 1: Write failing validation tests** in `tests/poses/data.test.ts`:
```ts
test('ids unique', ...);                         // new Set(ids).size === POSES.length
test('every pose passes hypertension filter', () => POSES.forEach(p => expect(isAllowed(p)).toBe(true)));
test('holds within bounds', ...);                // 20–45, or ≤120 if phases equals ['cooldown']
test('1–2 cues, non-empty entryCue, description and imagePrompt', ...);
test('exitCue present for head-below-heart, supine and prone poses', ...);
test('cues contain no exit wording', ...);         // not /поднимайся|возвращайся|выходи/i
test('exact id set and bilateral set from the table', ...);
test('corpse hold 90–120', ...);
test('yogaApiKey refers to vendored icon', ...); // ICON_KEYS.includes(key)
test('each phase has enough poses', ...);        // warmup ≥ 4, main ≥ 8, cooldown ≥ 3
test('corpse exists and is cooldown-only', ...);
test('no spoken text contains Latin letters or digits', ...); // nameRu, entryCue, cues, exitCue match /^[^A-Za-z0-9]*$/, non-empty
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Write `POSES`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add beginner pose database safe for hypertension`.

---

### Task 4: Storage and progression

**Files:**
- Create: `src/storage.ts`, `src/program/progression.ts`
- Test: `tests/storage.test.ts`, `tests/program/progression.test.ts`

**Interfaces:**
- Produces:
```ts
// storage.ts
export type Rating = 'easy' | 'ok' | 'hard';
export interface AppState { startDate: string | null; level: number; disclaimerAccepted: boolean;
  history: { date: string; rating: Rating }[] }          // date = local 'YYYY-MM-DD'
export const DEFAULT_STATE: AppState;                    // { null, 1.0, false, [] }
export function loadState(storage?: Storage): AppState;
export function saveState(state: AppState, storage?: Storage): void;
export function todayLocal(now?: Date): string;
// progression.ts
export const STABLE_DAYS = 21, LEVEL_MIN = 0.8, LEVEL_MAX = 1.5;
export function nextLevel(level: number, rating: Rating, dayIndex: number): number;
export function scaleHold(holdSec: number, level: number): number;
```
Rules: `easy` → +0.05; `ok` → +0.02 only when `dayIndex >= STABLE_DAYS`, else unchanged; `hard` → −0.1; clamp to [0.8, 1.5]. `scaleHold` = round(holdSec × level) to nearest 5, min 15.

- [ ] **Step 1: Write failing tests:**
  - `loadState` returns `DEFAULT_STATE` when storage is empty, when value is `"{not json"`, and when `getItem` throws.
  - `saveState` does not throw when `setItem` throws.
  - `todayLocal(new Date(2026, 0, 5, 23, 59))` === `'2026-01-05'`.
  - `nextLevel(1, 'ok', 5)` === 1; `nextLevel(1, 'ok', 21)` ≈ 1.02; `nextLevel(1.5, 'easy', 30)` === 1.5; `nextLevel(0.8, 'hard', 3)` === 0.8.
  - `scaleHold(30, 1.2)` === 35; `scaleHold(20, 0.8)` === 15.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (storage key `lazy-yoga:v1`; wrap every access in try/catch; merge parsed object over `DEFAULT_STATE`). **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add local state storage and progression rules`.

---

### Task 5: Program generator

**Files:**
- Create: `src/program/rng.ts`, `src/program/generate.ts`
- Test: `tests/program/generate.test.ts`

**Interfaces:**
- Consumes: `POSES`, `isAllowed`, `capHold`, `scaleHold`, `STABLE_DAYS`.
- Produces:
```ts
export interface Step { pose: Pose; side?: 'right' | 'left'; holdSec: number; transitionSec: number }
export interface Program { date: string; steps: Step[]; totalSec: number }
export function generateProgram(opts: { date: string; dayIndex: number; level: number; poses?: Pose[] }): Program;
// rng.ts
export function mulberry32(seed: number): () => number;
export function hashString(s: string): number;
```

Algorithm (not determined by the tests):
1. `pool = poses.filter(isAllowed)`; `rng = mulberry32(dayIndex < STABLE_DAYS ? 1 : hashString(date))`.
2. Warmup: 3 random poses from `warmup`. Cooldown: 1 random non-`corpse` cooldown pose, then `corpse` last.
3. Main: shuffle `main` pool; add poses while total ≤ 900 s; then sort main by position order `standing, chair, seated, kneeling, prone, supine`.
4. Hold = `capHold(pose, scaleHold(pose.holdSec, level))`, then `min(…, 120)` for cooldown-only poses. Bilateral → two steps `right` then `left`, the left one with `transitionSec = 5`.
5. After sorting main, if two `head-below-heart` poses are adjacent, move a non-head-below-heart main pose between them (prefer same position; if none fits, drop the later head-down pose).
6. Transition: first step 10; rising to `standing` from any of `seated|kneeling|prone|supine` 15; otherwise 8.

- [ ] **Step 1: Write failing tests** (iterate over 60 consecutive dates × levels `[0.8, 1, 1.5]` × dayIndex `[0, 30]` where relevant):
  - total within 600–900 and equals sum of holds + transitions;
  - last step is `corpse`; first 3 poses are warmup;
  - no step has a disallowed pose, using `poses` with an injected `inversion` pose → never appears;
  - every `head-below-heart` step has `holdSec ≤ 20` at level 1.5;
  - no two consecutive steps of different poses are both `head-below-heart`, and no bilateral head-below-heart pose sits next to another head-down pose;
  - cooldown-only steps have `holdSec ≤ 120` at level 1.5;
  - bilateral poses appear as adjacent `right`,`left` with equal holds;
  - same opts → deeply equal program; dayIndex < 21 → identical steps for two different dates; dayIndex ≥ 21 → at least two different programs among 7 dates;
  - first `transitionSec` = 10; floor→standing transition = 15.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS. If the 600 s floor fails, add main poses to the DB (Task 3) rather than relaxing the bound.
- [ ] **Step 5:** Commit `feat: generate daily program with stable base period`.

---

### Task 6: Timeline and phrases

**Files:**
- Create: `src/player/timeline.ts`
- Test: `tests/player/timeline.test.ts`

**Interfaces:**
- Consumes: `Program`, `Step`, `POSES`.
- Produces:
```ts
export type TimelineEvent =
  | { atSec: number; kind: 'say'; text: string }
  | { atSec: number; kind: 'step'; stepIndex: number; phase: 'transition' | 'hold' }
  | { atSec: number; kind: 'end' };
export function buildTimeline(program: Program): TimelineEvent[];   // sorted by atSec
export function allPhrases(poses: Pose[]): string[];                // every text buildTimeline can emit, deduped
```

Fixed copy (spoken; numbers as words):
- transition start: first step `Начинаем. Первая поза: ${nameRu}`, otherwise `Следующая поза: ${nameRu}`, then `pose.entryCue`; side switch `Смена стороны. Левая сторона`; right side adds `Правая сторона` after the name.
- hold start: each of `pose.cues` in order.
- hold end: `pose.exitCue` if present — after **each** side for bilateral poses; the side switch then says `Смена стороны. Левая сторона` followed by `pose.entryCue` again.
- hold midpoint: `Дыши спокойно`.
- hold end − 10 s: `Ещё десять секунд` (only if `holdSec ≥ 30`).
- after last hold: `Практика окончена. Полежи на боку, затем медленно сядь` then `end`.

- [ ] **Step 1: Write failing tests:** events sorted; each step has `transition` at its start and `hold` at start + transitionSec; `Дыши спокойно` at hold midpoint; no `Ещё десять секунд` for a 20 s hold; `end` at `program.totalSec`; every `say.text` of timelines for 30 generated programs ∈ `allPhrases(POSES)`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: build timed voice timeline from program`.

---

### Task 7 (DEFERRED — not in MVP, no Yandex key yet): TTS generation script

MVP speaks only via `speechSynthesis`; Task 8 ships with `public/audio/manifest.json` = `{}`. Implement this task later when the key exists; nothing else changes.

**Files:**
- Create: `scripts/tts.ts`, `public/audio/manifest.json`, `public/audio/*.mp3`, `.env.example` (`YANDEX_API_KEY=`)
- Test: `tests/scripts/tts.test.ts`

**Interfaces:**
- Consumes: `allPhrases(POSES)`.
- Produces: `public/audio/manifest.json`: `Record<string /*text*/, string /*file name*/>`; file name = first 16 hex chars of sha256(text) + `.mp3`. Exports `planSynthesis(phrases: string[], existing: Set<string>): { text: string; file: string }[]` (only missing files) for testing.

- [ ] **Step 1: Failing test** for `planSynthesis`: returns only phrases whose file isn't in `existing`; file names stable and unique.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. Confirm the current Yandex SpeechKit REST API (endpoint, `Api-Key` auth, `mp3` format support, voice list) via context7/docs before coding; use `lang=ru-RU`, a neutral female voice. Script exits non-zero with a clear message if `YANDEX_API_KEY` is unset; deletes mp3s no longer in the manifest. `npm run tts` script.
- [ ] **Step 4:** Run tests → PASS. With the user's key: `YANDEX_API_KEY=... npm run tts`; verify count of mp3 = manifest entries, listen to 3 samples, fix stress in DB text if needed. (If the key isn't available yet, commit the script and an empty manifest `{}` — Task 8 fallback covers it.)
- [ ] **Step 5:** Commit `feat: add Yandex SpeechKit phrase generation`.

---

### Task 8: Player engine, audio, wake lock

**Files:**
- Create: `src/player/engine.ts`, `src/player/audio.ts`, `src/player/wakeLock.ts`, `public/audio/manifest.json` (`{}` — Task 7 deferred, so every phrase goes to `speechSynthesis` with `lang = 'ru-RU'`)
- Test: `tests/player/engine.test.ts`, `tests/player/audio.test.ts`, `tests/player/wakeLock.test.ts`

**Interfaces:**
- Consumes: `TimelineEvent[]`.
- Produces:
```ts
// engine.ts
export interface PlayerState { status: 'idle'|'running'|'paused'|'done'; elapsedSec: number; nextEvent: number; stepIndex: number }
export type PlayerAction = { type: 'start' } | { type: 'tick'; dt: number } | { type: 'togglePause' } | { type: 'skip' };
export function advance(tl: TimelineEvent[], s: PlayerState, a: PlayerAction): { state: PlayerState; fired: TimelineEvent[] };
// audio.ts
export function createVoice(deps: { manifest: Record<string,string>; baseUrl: string;
  play: (url: string) => Promise<void>; speak: (text: string) => Promise<void> }): { say(text: string): Promise<void>; stop(): void };
// wakeLock.ts
export function keepAwake(nav?: Navigator, doc?: Document): () => void;   // returns release
```
Semantics: `tick` while paused does nothing; `skip` jumps `elapsedSec` to the next `step` event with phase `transition` (or `end`) and fires only that event and later ones at the same `atSec`, not the skipped `say` events; reaching `end` → `done`. `say` queues phrases sequentially. Missing manifest entry or `play` rejection → `speak(text)`.

- [ ] **Step 1: Failing tests:**
  - engine: ticks fire events in order exactly once; paused ticks fire nothing; skip mid-hold lands on next step's transition without firing skipped cues; reaching total → `done`.
  - audio: known text → `play(baseUrl + file)`; unknown text → `speak`; `play` rejects → `speak`; three `say` calls play sequentially (second starts after first resolves).
  - wakeLock: no `navigator.wakeLock` → no throw; on `visibilitychange` to visible, `request('screen')` called again; release stops re-acquiring.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add player engine with audio fallback and wake lock`.

---

### Task 9: UI screens

**Files:**
- Create: `src/ui/App.tsx`, `Home.tsx`, `Disclaimer.tsx`, `Session.tsx`, `Rating.tsx`, `Credits.tsx`; modify `src/main.tsx`
- Test: `tests/ui/App.test.tsx` (`@testing-library/preact`, jsdom)

**Interfaces:**
- Consumes: everything above.

Flow: first launch → `Disclaimer` (button «Понятно», sets `disclaimerAccepted`, sets `startDate` to today) → `Home`: today's program list (name, Sanskrit small, hold, icon if `yogaApiKey`), total minutes, one big «Начать» → `Session`: full-screen current pose (name, Sanskrit, icon or description, countdown); tap anywhere = pause/resume, horizontal swipe ≥ 50 px = skip; «Начать» tap also unlocks audio (first `say` inside the click handler) and calls `keepAwake` → after `end`, `Rating`: «Легко / Нормально / Тяжело» → `nextLevel`, append to history, save → back to `Home` showing «Сегодня сделано». Link to `Credits` (icon authors + license) in footer. `dayIndex` = days between `startDate` and today.

- [ ] **Step 1: Failing tests:** fresh storage shows disclaimer; after accepting, Home shows «Начать» and the corpse pose name; rating «Тяжело» saves level 0.9 and history entry with today's date; Credits page lists `ICON_CREDITS` authors.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Manual check: `npm run dev`, open on phone in the same network (`--host`), complete one session: voice plays, screen stays on, tap pauses, swipe skips.
- [ ] **Step 6:** Commit `feat: add disclaimer, home, session and rating screens`.

---

### Task 10: PWA and deploy

**Files:**
- Modify: `vite.config.ts` (add `vite-plugin-pwa`: manifest name «Lazy Yoga», `lang: 'ru'`, `display: 'standalone'`, icons 192/512, precache `icons/*.svg`, `audio/*.mp3`, `audio/manifest.json`); `base: '/lazy-yoga/'`
- Create: `public/app-icon-192.png`, `public/app-icon-512.png`, `.github/workflows/deploy.yml` (on push to `main`: `npm ci`, `npm test`, `npm run build`, deploy `dist` with `actions/deploy-pages`)

- [ ] **Step 1:** Configure; `npm run build && npx vite preview`; verify in Chrome DevTools → Application: manifest valid, service worker active, works offline after first load.
- [ ] **Step 2:** Commit `feat: make app installable and deploy to GitHub Pages`.
- [ ] **Step 3:** Push branch, open PR to `main`. After merge, enable Pages (source: GitHub Actions) in repo settings; verify the site opens on iPhone, add to Home Screen, run one session offline.

---

### Task 6b: Speech-aware timing (added after Task 6)

Problem: an 8 s transition (5 s side switch) carries the previous `exitCue` + name + side + `entryCue` ≈ 6–10 s of speech, so the queue lags and in-hold cues drift late.

**Files:**
- Create: `src/player/phrases.ts`; Modify: `src/player/timeline.ts`, `src/program/generate.ts`
- Test: `tests/player/phrases.test.ts`, extend `tests/player/timeline.test.ts`, `tests/program/generate.test.ts`

**Interfaces:**
- Produces (`phrases.ts`), the single source of spoken copy, used by both timeline and generator:
```ts
export const CHARS_PER_SEC = 12, PHRASE_PAUSE_SEC = 0.4, SPEECH_BUFFER_SEC = 2;
export function estimateSpeechSec(text: string): number;            // text.length / CHARS_PER_SEC + PHRASE_PAUSE_SEC
export function transitionPhrases(steps: Step[], i: number): string[]; // prev exitCue (if any) + intro (name/side/entryCue or side switch + entryCue)
export function holdStartPhrases(step: Step): string[];               // step.pose.cues
export const CLOSING_PHRASE: string;                                   // 'Практика окончена. Полежи на боку, затем медленно сядь'
```
- Generator: `transitionSec = max(base, ceil(Σ estimateSpeechSec(transitionPhrases)) + SPEECH_BUFFER_SEC)` where base is the existing 10/15/8/5. Main fill and all bounds use these real values (600–900 s still holds).
- Timeline: `exitCue` moves to the start of the next transition (it is already counted there); after the last hold it precedes `CLOSING_PHRASE`. In-hold fillers (`Дыши спокойно`, `Ещё десять секунд`) are dropped if they start before the estimated end of hold-start cues + 1 s, or less than 4 s before hold end. Copy otherwise unchanged.

- [ ] **Step 1: Failing tests:** `estimateSpeechSec('a'.repeat(24))` === 2.4; for 30 generated programs every step satisfies `transitionSec ≥ Σ estimateSpeechSec(transitionPhrases) + SPEECH_BUFFER_SEC` and `≥ base`; no filler starts before the estimated end of the hold-start cues; totals still 600–900; timeline `say` texts ⊆ `allPhrases(POSES)`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement; timeline and generator import copy only from `phrases.ts`. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `fix: size transitions to spoken cue length`.
