export function PoseIcon({ iconKey, class: className }: { iconKey: string; class?: string }) {
  return <img class={className ?? 'icon'} src={`${import.meta.env.BASE_URL}icons/${iconKey}.svg`} alt="" />
}
