/**
 * Machbarkeitsprüfung des Ziels (FA#0107).
 * Regelbasiert und ohne Sprachmodell, damit das Ergebnis nachvollziehbar
 * und testbar ist. Die Schwellwerte sind wie im Konzept exemplarisch
 * und müssen im Projekt noch validiert werden.
 */

export type Feasibility = 'realistic' | 'ambitious' | 'unrealistic';

export type FeasibilityInput = {
  distanceM: number;
  targetTimeS: number;
  weeksUntilRace: number;
  recent5kTimeS: number;
  /** Lauferfahrung aus dem Onboarding, steuert die erwartbare Verbesserung */
  runningSinceMonths: number;
};

export type FeasibilityResult = {
  level: Feasibility;
  /** Prognose nach Riegel aus der 5-km-Zeit */
  predictedTimeS: number;
  /** Nötige Verbesserung gegenüber der Prognose, 0.05 = 5 % schneller */
  requiredImprovement: number;
  /** Begründungen für die Anzeige, leer bei „realistisch“ */
  reasons: string[];
  /** Vorschlag für eine erreichbare Zielzeit, nur wenn die Zielzeit unrealistisch ist */
  suggestedTargetTimeS: number | null;
};

/** Exponent der Riegel-Formel */
export const RIEGEL_EXPONENT = 1.06;

/**
 * Annahme: erwartbare Verbesserung je nach Erfahrung.
 * Einsteiger verbessern sich schneller und weiter als erfahrene Läufer.
 */
const IMPROVEMENT_BY_EXPERIENCE = [
  { maxMonths: 11, perWeek: 0.01, max: 0.25 }, // unter 1 Jahr
  { maxMonths: 35, perWeek: 0.005, max: 0.15 }, // 1 bis 3 Jahre
  { maxMonths: Infinity, perWeek: 0.003, max: 0.08 }, // über 3 Jahre
];

/** Erlaubte Verbesserung für Erfahrung und Vorbereitungszeit */
export function allowedImprovement(runningSinceMonths: number, weeks: number): number {
  const rule =
    IMPROVEMENT_BY_EXPERIENCE.find((r) => runningSinceMonths <= r.maxMonths) ??
    IMPROVEMENT_BY_EXPERIENCE[IMPROVEMENT_BY_EXPERIENCE.length - 1];
  return Math.min(Math.max(0, weeks) * rule.perWeek, rule.max);
}

/** Annahme: Mindestvorbereitung in Wochen je Distanz */
const MIN_PREP_WEEKS: Record<number, number> = {
  5000: 4,
  10000: 6,
  21097: 10,
  42195: 16,
};
const DEFAULT_MIN_PREP_WEEKS = 8;

const ORDER: Feasibility[] = ['realistic', 'ambitious', 'unrealistic'];

/** Wettkampfprognose nach Riegel: T2 = T1 · (D2 / D1)^1.06 */
export function predictTime(refDistanceM: number, refTimeS: number, targetDistanceM: number): number {
  return Math.round(refTimeS * (targetDistanceM / refDistanceM) ** RIEGEL_EXPONENT);
}

/** Das schlechtere von zwei Ergebnissen */
function worse(a: Feasibility, b: Feasibility): Feasibility {
  return ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b;
}

export function assessFeasibility(input: FeasibilityInput): FeasibilityResult {
  const predictedTimeS = predictTime(5000, input.recent5kTimeS, input.distanceM);
  const requiredImprovement = (predictedTimeS - input.targetTimeS) / predictedTimeS;
  const weeks = Math.max(0, input.weeksUntilRace);
  const allowed = allowedImprovement(input.runningSinceMonths, weeks);
  const reasons: string[] = [];

  // 1. Ist die Zielzeit im Vergleich zur Prognose erreichbar?
  let paceLevel: Feasibility = 'realistic';
  if (requiredImprovement > allowed) {
    paceLevel = 'unrealistic';
    reasons.push('Deine Zielzeit liegt deutlich unter deiner aktuellen Prognose.');
  } else if (requiredImprovement > allowed / 2) {
    paceLevel = 'ambitious';
    reasons.push('Für deine Zielzeit musst du dich spürbar verbessern.');
  }

  // 2. Reicht die Zeit bis zum Wettkampf für die Distanz?
  const minWeeks = MIN_PREP_WEEKS[input.distanceM] ?? DEFAULT_MIN_PREP_WEEKS;
  let timeLevel: Feasibility = 'realistic';
  if (weeks < minWeeks) {
    timeLevel = 'unrealistic';
    reasons.push(`Für diese Distanz empfehlen wir mindestens ${minWeeks} Wochen Vorbereitung.`);
  } else if (weeks < minWeeks * 1.5) {
    timeLevel = 'ambitious';
    reasons.push('Die Vorbereitungszeit ist knapp bemessen.');
  }

  // Vorschlag nur bei unrealistischer Zielzeit: die Grenze zu „realistisch“,
  // auf volle Minuten gerundet
  const suggestedTargetTimeS =
    paceLevel === 'unrealistic'
      ? Math.round((predictedTimeS * (1 - allowed / 2)) / 60) * 60
      : null;

  return {
    level: worse(paceLevel, timeLevel),
    predictedTimeS,
    requiredImprovement,
    reasons,
    suggestedTargetTimeS,
  };
}