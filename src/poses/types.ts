export type Position = 'standing' | 'chair' | 'seated' | 'kneeling' | 'prone' | 'supine'
export type Phase = 'warmup' | 'main' | 'cooldown'
export type BodyArea = 'neck' | 'shoulders' | 'upper-back' | 'lower-back' | 'spine' | 'hips' | 'hamstrings'
export type Contraindication = 'inversion' | 'head-below-heart' | 'breath-retention' | 'intense-backbend' | 'static-strength'

export interface Pose {
  id: string
  nameRu: string
  sanskrit?: string
  description: string
  cues: string[] // 1–2 short spoken technique cues
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
