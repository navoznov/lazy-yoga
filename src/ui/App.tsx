import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { generateProgram } from '../program/generate'
import { nextLevel } from '../program/progression'
import { loadState, saveState, todayLocal, type AppState, type Rating as RatingValue } from '../storage'
import { Credits } from './Credits'
import { Disclaimer } from './Disclaimer'
import { Home } from './Home'
import { Rating } from './Rating'
import { Session, loadManifest, startSession, type SessionRun } from './Session'

type Screen = 'home' | 'session' | 'rating' | 'credits'

// Dates are local 'YYYY-MM-DD'; both parse as UTC midnight, so the difference is whole days.
function daysBetween(from: string, to: string): number {
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
  return Number.isFinite(days) ? Math.max(0, days) : 0
}

export function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [screen, setScreen] = useState<Screen>('home')
  const [run, setRun] = useState<SessionRun | null>(null)
  const manifest = useRef<Record<string, string>>({})

  useEffect(() => {
    loadManifest().then(m => (manifest.current = m))
  }, [])

  const today = todayLocal()
  const startDate = state.startDate ?? today
  const dayIndex = daysBetween(startDate, today)
  const program = useMemo(
    () => generateProgram({ date: today, dayIndex, level: state.level }),
    [today, dayIndex, state.level],
  )

  const update = (next: AppState) => {
    saveState(next)
    setState(next)
  }

  if (!state.disclaimerAccepted) {
    return <Disclaimer onAccept={() => update({ ...state, disclaimerAccepted: true, startDate })} />
  }

  switch (screen) {
    case 'session':
      return <Session run={run!} onDone={() => setScreen('rating')} onQuit={() => setScreen('home')} />
    case 'rating':
      return (
        <Rating
          onRate={(rating: RatingValue) => {
            // a repeat session on the same day replaces that day's entry; only the first rating moves the level
            const ratedToday = state.history.some(h => h.date === today)
            const history = [...state.history.filter(h => h.date !== today), { date: today, rating }]
            const level = ratedToday ? state.level : nextLevel(state.level, rating, dayIndex)
            update({ ...state, startDate, level, history })
            setScreen('home')
          }}
        />
      )
    case 'credits':
      return <Credits onBack={() => setScreen('home')} />
    case 'home':
      return (
        <Home
          program={program}
          doneToday={state.history.some(h => h.date === today)}
          onStart={() => {
            setRun(startSession(program, manifest.current))
            setScreen('session')
          }}
          onCredits={() => setScreen('credits')}
        />
      )
  }
}
