## Konventionen

### Sprache
- Code und Kommentare: Englisch
- Dokumentation: Deutsch

### Benennung
- lowerCamelCase: Variablen, Funktionen
- UpperCamelCase: React-Komponenten, Typen
- snake_case: Tabellen- und Spaltennamen in der Datenbank
- SCREAMING_SNAKE_CASE: Konstanten, Enum-Werte
- Singular für einzelne Objekte, Plural für Sammlungen (`getRun()`, `getRuns()`)

### Prinzipien
- KISS, DRY, Single Responsibility
- Funktionen haben genau eine Aufgabe und verändern ihre Eingaben nicht
- Regeln der Regel-Engine sind reine Funktionen und werden per Unit-Test abgedeckt
- Bei einem Bugfix zuerst einen Test schreiben, der den Fehler zeigt

### Git
- Commit-Messages nach Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`
- Größere Features auf eigenem Branch `feature/<name>`, danach in `main` mergen