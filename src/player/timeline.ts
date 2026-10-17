export type TimelineEvent =
  | { atSec: number; kind: 'say'; text: string }
  | { atSec: number; kind: 'step'; stepIndex: number; phase: 'transition' | 'hold' }
  | { atSec: number; kind: 'end' };
