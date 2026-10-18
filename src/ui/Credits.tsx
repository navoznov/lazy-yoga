import { ICON_CREDITS } from '../poses/icons'

export function Credits({ onBack }: { onBack: () => void }) {
  return (
    <main class="screen">
      <h1>Авторы иконок</h1>
      <p>
        Иконки поз взяты из <a href="https://github.com/rebeccaestes/yoga_api">yoga_api</a>, источник — Noun Project.
      </p>
      <ul class="credits">
        {ICON_CREDITS.map(c => (
          <li key={c.author}>
            <a href={c.source}>{c.author}</a> — {c.license}
          </li>
        ))}
      </ul>
      <button class="link" onClick={onBack}>
        Назад
      </button>
    </main>
  )
}
