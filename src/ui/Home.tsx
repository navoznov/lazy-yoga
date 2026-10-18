import type { Program, Step } from '../program/generate'
import { PoseIcon } from './PoseIcon'

// Both sides of a bilateral pose are shown as one row.
function rows(steps: Step[]): { step: Step; sides: number }[] {
  const out: { step: Step; sides: number }[] = []
  for (const step of steps) {
    const last = out[out.length - 1]
    if (step.side === 'left' && last?.step.pose === step.pose) last.sides++
    else out.push({ step, sides: 1 })
  }
  return out
}

export function Home(props: { program: Program; doneToday: boolean; onStart: () => void; onCredits: () => void }) {
  const { program, doneToday } = props
  return (
    <main class="screen">
      <h1>Йога на сегодня</h1>
      <p class="summary">
        {Math.round(program.totalSec / 60)} мин
        {doneToday && <span class="done">Сегодня сделано</span>}
      </p>
      <button class="primary big" onClick={props.onStart}>
        Начать
      </button>
      <ol class="program">
        {rows(program.steps).map(({ step, sides }, i) => (
          <li key={i}>
            {step.pose.icon ? <PoseIcon poseId={step.pose.id} /> : <span class="icon" />}
            <span class="pose-name">
              {step.pose.nameRu}
              {step.pose.sanskrit && <small>{step.pose.sanskrit}</small>}
            </span>
            <span class="hold">
              {step.holdSec} с{sides > 1 && ' × 2'}
            </span>
          </li>
        ))}
      </ol>
      <footer>
        <button class="link" onClick={props.onCredits}>
          Авторы иконок
        </button>
      </footer>
    </main>
  )
}
