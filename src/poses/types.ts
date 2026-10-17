export type Position = 'standing' | 'chair' | 'seated' | 'kneeling' | 'prone' | 'supine'
export type Phase = 'warmup' | 'main' | 'cooldown'
export type BodyArea = 'neck' | 'shoulders' | 'upper-back' | 'lower-back' | 'spine' | 'hips' | 'hamstrings'
export type Contraindication = 'inversion' | 'head-below-heart' | 'breath-retention' | 'intense-backbend' | 'static-strength'

export interface Pose {
  id: string
  nameRu: string
  sanskrit?: string
  description: string
  entryCue: string // spoken during the transition: how to get into the pose
  cues: string[] // 1–2 short spoken refinements, spoken at hold start (never exit wording)
  exitCue?: string // spoken at hold end; required for head-below-heart and supine/prone poses
  holdSec: number
  bilateral: boolean
  position: Position
  phases: Phase[]
  areas: BodyArea[]
  difficulty: 1 | 2 | 3
  contraindications: Contraindication[]
  yogaApiKey?: string
  imagePrompt: string
}
