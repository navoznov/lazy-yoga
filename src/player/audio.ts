import { estimateSpeechSec } from './phrases'

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
        if (gen === generation) pending--
      })
      return queue
    },
    // Drops queued phrases; the one currently playing finishes on its own, but no longer blocks new ones.
    stop() {
      generation++
      pending = 0
      queue = Promise.resolve()
    },
  }
}

// Strong references: Safari may garbage-collect a speaking utterance and never fire onend.
const speaking = new Set<SpeechSynthesisUtterance>()

export function browserSpeak(text: string): Promise<void> {
  const synth = globalThis.speechSynthesis
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return Promise.resolve()
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ru-RU'
    const voice = synth.getVoices().find(v => v.lang.toLowerCase().replace('_', '-').startsWith('ru'))
    if (voice) u.voice = voice
    // Safari sometimes fires neither onend nor onerror (e.g. after cancel); the timeout keeps the queue moving.
    const timer = setTimeout(finish, (estimateSpeechSec(text) * 2 + 2) * 1000)
    function finish() {
      clearTimeout(timer)
      speaking.delete(u)
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    speaking.add(u)
    synth.speak(u)
  })
}
