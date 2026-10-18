export function createVoice(deps: { manifest: Record<string,string>; baseUrl: string;
  play: (url: string) => Promise<void>; speak: (text: string) => Promise<void> }): { say(text: string): Promise<void>; stop(): void } {
  let queue = Promise.resolve()
  let generation = 0

  // Never rejects: a missing or broken mp3 falls back to speech, a speech failure is swallowed.
  async function utter(text: string) {
    const file = Object.hasOwn(deps.manifest, text) ? deps.manifest[text] : undefined
    try {
      if (file === undefined) throw new Error('no audio file')
      await deps.play(deps.baseUrl + file)
    } catch {
      await deps.speak(text).catch(() => {})
    }
  }

  let pending = 0

  return {
    // An idle queue starts right away, so a call inside a user gesture reaches play/speak synchronously (iOS unlock).
    say(text) {
      const gen = generation
      const run = () => (gen === generation ? utter(text) : undefined)
      pending++
      queue = (pending === 1 ? Promise.resolve(run()) : queue.then(run)).then(() => {
        pending--
      })
      return queue
    },
    // Drops queued phrases; the one currently playing finishes on its own.
    stop() {
      generation++
    },
  }
}

export function browserSpeak(text: string): Promise<void> {
  const synth = globalThis.speechSynthesis
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return Promise.resolve()
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ru-RU'
    const voice = synth.getVoices().find(v => v.lang.toLowerCase().replace('_', '-').startsWith('ru'))
    if (voice) u.voice = voice
    u.onend = () => resolve()
    u.onerror = () => resolve()
    synth.speak(u)
  })
}
