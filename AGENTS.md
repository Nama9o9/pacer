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

# Pacer – KI-Architektur & aktueller Projektstand

## Projekt
Pacer ist ein KI-Lauf-Coach (Semesterprojekt „Angewandte LLMs“, BHT).
Stack: Expo / React Native / TypeScript (frontend/), Supabase mit
PostgreSQL, pgvector, Auth und Edge Functions (backend/), Google Gemini als LLM,
Strava-API für Aktivitätsdaten.

Meilensteine: M1 (Infrastruktur + Basis-Funktionalität ohne KI) am 16.11.2026,
M2 (KI-Integration) am 07.12.2026, M3 (fertige App + Arbeitsbericht) am 18.01.2027.

## Kernidee: Die KI vergleicht Ist und Soll
Die KI vergleicht den Ist-Zustand (gelaufene Einheiten, Check-ins, Chat)
mit dem Soll-Zustand (Trainingsplan, Ziel). Daraus leitet sie eine
Planänderung oder einen Tipp für den Läufer ab.
Wichtig: Die KI soll an der Stelle sitzen, an der *interpretiert* wird,
nicht nur fertige Regelergebnisse umformulieren.

## Aufteilung der Verantwortung (verbindlich)

1. Code berechnet die Fakten (deterministisch, ohne KI)
   - Kennzahlen wie Pace, Wochenkilometer, Abweichung geplant vs. gelaufen,
     Prognose zum Ziel
   - Als reine TypeScript-Funktionen ohne UI, Supabase oder KI-Aufrufe
   - KEINE Bewertungen, Ampeln oder Schwellwerte in diesen Funktionen.
     Das Bewerten übernimmt das LLM.
   - Das LLM rechnet nie selbst, sondern bekommt die fertigen Zahlen.

2. Das LLM interpretiert und entscheidet (ab M2)
   - Input: berechnete Kennzahlen + Check-in-Daten + Chat-Kontext
   - Entscheidet: Plan anpassen, nur einen Tipp geben oder nichts tun
   - Output: strukturierter Vorschlag per Function Calling, kein Freitext,
     den der Code parsen müsste
   - Weitere LLM-Aufgaben: Freitext in strukturierte Daten übersetzen
     („bin nächste Woche auf Dienstreise“, „Knie zwickt“) und den
     Coach-Dialog führen (mit Bezug auf frühere Gespräche über pgvector)

3. Code prüft den Vorschlag, dann entscheidet der Nutzer
   - Harte Sicherheitsgrenzen prüfen jeden KI-Vorschlag, z. B. maximale
     Umfangssteigerung pro Woche und kein Tempotraining bei hohem
     Schmerzwert (konkrete Grenzwerte werden noch festgelegt).
   - Ein Vorschlag wird nie automatisch übernommen: Der Nutzer bestätigt
     oder lehnt ab. Die Historie bleibt erhalten (Snapshot der alten Werte,
     Status `superseded`).

## Architektur-Regeln
- Keine KI-Logik und keine API-Keys im Client. Alle LLM-Aufrufe laufen
  über den Server (Supabase Edge Functions).
- Fehlerbehandlung für alle KI-Aufrufe sowie Validierung der KI-Ausgaben
  gegen ein Schema.

## Konventionen
- Einheiten: Distanzen in Metern, Zeiten in Sekunden, Pace in Sekunden pro km
- Funktionen rufen nie selbst `new Date()` oder `Date.now()` auf: Das aktuelle
  Datum wird als Parameter übergeben, damit Tests deterministisch sind.
- Primärschlüssel heißen `<tabellenname>_id` (z. B. `goal_id`).
- Git: Arbeit auf Feature-Branches (`feature/<name>`), dann Merge nach main.
  Sinnvolle, regelmäßige Commit-Messages.
- Code modular aufbauen und kommentieren.

## UI-Stand
- Navigation mit 3 Tabs: Heute · Coach · Profil
- Der Plan ist kein Tab, sondern ein eigener Screen, der aus „Heute“
  geöffnet wird (Link gut sichtbar unter der Wochenübersicht).
- Plan-Screen: vergangene Einheiten mit Soll und Ist, kommende nur mit Soll.
- M1: Läufe werden manuell eingegeben. Eigene GPS-Aufzeichnung und
  Strava-Import kommen später.

## Was in M1 NICHT gebaut wird
- Keine KI-Aufrufe
- Keine bewertenden Regeln oder Ampel-Schwellwerte
  (diese Interpretation übernimmt in M2 das LLM)