export function PoseIcon({ poseId, class: className }: { poseId: string; class?: string }) {
  return <img class={className ?? 'icon'} src={`${import.meta.env.BASE_URL}icons/${poseId}.svg`} alt="" />
}
