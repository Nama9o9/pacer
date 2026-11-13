## Konventionen

### Sprache
- Code und Kommentare: Englisch
- Dokumentation: Deutsch

## Benennung
- Komponenten und Provider: PascalCase, wie der Komponentenname (`ChoiceChip.tsx`, `AuthProvider.tsx`)
- Hooks, Utils, Konstanten, Styles: camelCase (`useTheme.ts`, `feasibility.ts`, `styles.ts`)
- Routen in `frontend/src/app/`: Kleinbuchstaben, wie von Expo Router vorgegeben (`goal.tsx`)
- Allgemeine UI-Komponenten in `components/`, bereichsbezogene in `features/<bereich>/`
- Fachlogik als reine Funktionen in `utils/`, mit Tests in `utils/__tests__/`

### Prinzipien
- KISS, DRY, Single Responsibility
- Funktionen haben genau eine Aufgabe und verändern ihre Eingaben nicht
- Regeln der Regel-Engine sind reine Funktionen und werden per Unit-Test abgedeckt
- Bei einem Bugfix zuerst einen Test schreiben, der den Fehler zeigt

### Git
- Commit-Messages nach Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`
- Größere Features auf eigenem Branch `feature/<name>`, danach in `main` mergen