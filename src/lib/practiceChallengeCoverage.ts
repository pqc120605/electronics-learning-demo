export type PracticeChallengeKind = 'led-prediction' | 'input-output' | 'seven-segment' | 'scenario-prediction'

const challengeKindsByLesson: Record<string, readonly PracticeChallengeKind[]> = {
  blink: ['led-prediction'],
  'source-led': ['led-prediction'],
  'button-led': ['led-prediction', 'input-output'],
  'analog-potentiometer': ['led-prediction', 'input-output'],
  'analog-ldr': ['led-prediction', 'input-output'],
  'ir-alert': ['led-prediction', 'input-output'],
  'ultrasonic-distance': ['led-prediction', 'input-output'],
  'seven-segment-counter': ['seven-segment'],
  'buck-boost-concept': ['scenario-prediction'],
  'dc-motor-driver': ['scenario-prediction'],
  'mosfet-switch': ['scenario-prediction'],
}

/** Explicitly records which practice interactions are implemented for each lesson. */
export function getPracticeChallengeKinds(lessonId: string): PracticeChallengeKind[] {
  return [...(challengeKindsByLesson[lessonId] ?? [])]
}
