/** Fehler für ungültige Eingaben der Kennzahlen-Funktionen, mit deutscher Meldung */
export class MetricsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetricsInputError';
  }
}

/** Prüft, dass ein Wert eine endliche Zahl größer 0 ist */
export function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new MetricsInputError(`${label} muss eine Zahl größer 0 sein (erhalten: ${value}).`);
  }
}

/** Prüft, dass ein Wert eine ganze Zahl größer oder gleich 0 ist */
export function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new MetricsInputError(`${label} muss eine ganze Zahl ab 0 sein (erhalten: ${value}).`);
  }
}
