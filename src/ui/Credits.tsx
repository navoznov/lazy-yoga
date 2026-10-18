import { ICON_SOURCE } from '../poses/icons'

export function Credits({ onBack }: { onBack: () => void }) {
  return (
    <main class="screen">
      <h1>Авторы иконок</h1>
      <p>
        Иконки поз взяты из коллекции <a href={ICON_SOURCE.url}>{ICON_SOURCE.name}</a>, лицензия {ICON_SOURCE.license}.
      </p>
      <button class="link" onClick={onBack}>
        Назад
      </button>
    </main>
  )
}
