import type { Rating as RatingValue } from '../storage'

const OPTIONS: { value: RatingValue; label: string }[] = [
  { value: 'easy', label: 'Легко' },
  { value: 'ok', label: 'Нормально' },
  { value: 'hard', label: 'Тяжело' },
]

export function Rating({ onRate }: { onRate: (rating: RatingValue) => void }) {
  return (
    <main class="screen">
      <h1>Как прошло?</h1>
      <div class="ratings">
        {OPTIONS.map(o => (
          <button key={o.value} class="primary" onClick={() => onRate(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </main>
  )
}
