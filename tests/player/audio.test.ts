import { expect, test } from 'vitest'
import { browserSpeak, createVoice } from '../../src/player/audio'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(r => (resolve = r))
  return { promise, resolve }
}

function fakes(play: (url: string) => Promise<void> = () => Promise.resolve()) {
  const log: string[] = []
  return {
    log,
    deps: {
      manifest: { Привет: 'abc.mp3' },
      baseUrl: '/audio/',
      play: (url: string) => (log.push(`play ${url}`), play(url)),
      speak: (text: string) => (log.push(`speak ${text}`), Promise.resolve()),
    },
  }
}

test('known text → play(baseUrl + file)', async () => {
  const { log, deps } = fakes()
  await createVoice(deps).say('Привет')
  expect(log).toEqual(['play /audio/abc.mp3'])
})

test('unknown text → speak', async () => {
  const { log, deps } = fakes()
  await createVoice(deps).say('Дыши спокойно')
  expect(log).toEqual(['speak Дыши спокойно'])
})

test('play rejects → speak, say does not reject', async () => {
  const { log, deps } = fakes(() => Promise.reject(new Error('404')))
  await expect(createVoice(deps).say('Привет')).resolves.toBeUndefined()
  expect(log).toEqual(['play /audio/abc.mp3', 'speak Привет'])
})

test('speak rejects → say still resolves', async () => {
  const { deps } = fakes()
  const voice = createVoice({ ...deps, speak: () => Promise.reject(new Error('no voice')) })
  await expect(voice.say('Дыши спокойно')).resolves.toBeUndefined()
})

test('say calls play sequentially', async () => {
  const gates = [deferred(), deferred(), deferred()]
  const started: string[] = []
  const voice = createVoice({
    manifest: { a: '1.mp3', b: '2.mp3', c: '3.mp3' },
    baseUrl: '',
    play: url => (started.push(url), gates[started.length - 1].promise),
    speak: () => Promise.resolve(),
  })
  const done = Promise.all([voice.say('a'), voice.say('b'), voice.say('c')])
  await Promise.resolve()
  expect(started).toEqual(['1.mp3'])
  gates[0].resolve()
  await new Promise(r => setTimeout(r, 0))
  expect(started).toEqual(['1.mp3', '2.mp3'])
  gates[1].resolve()
  await new Promise(r => setTimeout(r, 0))
  expect(started).toEqual(['1.mp3', '2.mp3', '3.mp3'])
  gates[2].resolve()
  await done
})

test('stop drops queued phrases', async () => {
  const gate = deferred()
  const { log, deps } = fakes()
  const voice = createVoice({ ...deps, play: url => (log.push(`play ${url}`), gate.promise) })
  const first = voice.say('Привет')
  const second = voice.say('Дыши спокойно')
  await Promise.resolve()
  voice.stop()
  gate.resolve()
  await Promise.all([first, second])
  expect(log).toEqual(['play /audio/abc.mp3'])
  await voice.say('Ещё')
  expect(log).toEqual(['play /audio/abc.mp3', 'speak Ещё'])
})

test('browserSpeak does not throw without speechSynthesis', async () => {
  await expect(browserSpeak('Привет')).resolves.toBeUndefined()
})

test('idle voice reaches play/speak synchronously (iOS unlocks audio only inside a user gesture)', async () => {
  const { log, deps } = fakes()
  const voice = createVoice(deps)
  const first = voice.say('Дыши спокойно')
  const second = voice.say('Привет')
  expect(log).toEqual(['speak Дыши спокойно'])
  await Promise.all([first, second])
  expect(log).toEqual(['speak Дыши спокойно', 'play /audio/abc.mp3'])
  const third = voice.say('Ещё')
  expect(log).toEqual(['speak Дыши спокойно', 'play /audio/abc.mp3', 'speak Ещё'])
  await third
})
