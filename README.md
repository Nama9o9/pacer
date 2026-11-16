# Pacer

KI-Lauf-Coach als mobile App (Semesterprojekt „Anwendungen mit LLMs“, BHT Berlin, WiSe 2026/27).

## Tech-Stack

| Bereich  | Technologie                                            |
| -------- | ------------------------------------------------------ |
| App      | React Native, Expo (SDK 58), Expo Router, TypeScript   |
| Backend  | Supabase (PostgreSQL + pgvector, Auth, Edge Functions) |
| KI       | Google Gemini API (ab Meilenstein 2)                   |
| Daten    | Strava API (geplant)                                   |
| Tests    | Jest (App), Deno Test (Backend), ESLint                |

## Struktur

```
pacer/
├── frontend/                  # Expo-App
│   └── src/
│       ├── app/               # Screens und Layouts (Expo Router)
│       │   ├── (tabs)/        # Tabs: Heute, Coach, Profil
│       │   ├── onboarding/    # Fragebogen: Ziel, Basis, Tage, Beschwerden
│       │   └── run/           # Lauf eintragen, Check-in
│       ├── components/        # allgemeine UI-Komponenten
│       ├── features/          # bereichsbezogene Komponenten und Hooks
│       ├── providers/         # AuthProvider (Session, Zielstatus)
│       ├── types/             # generierte Supabase-Typen
│       └── utils/             # Fachlogik als reine Funktionen, Tests in __tests__/
└── backend/
    └── supabase/
        ├── migrations/        # Datenbankschema mit RLS
        └── functions/
            └── _shared/metrics/   # Soll- und Ist-Kennzahlen, Tests in test/
```

## Starten

### Voraussetzungen
- Node.js LTS, npm, Git
- Android Studio mit Emulator **oder** Expo Go auf dem Smartphone
- [Deno 2](https://deno.com) für die Backend-Tests

### Frontend
```bash
cd frontend
npm install
# .env.example nach .env.local kopieren und Supabase-URL und -Key eintragen
npm run emulator     # Android-Emulator starten (mit festen DNS-Servern)
npm run android      # Expo starten und App im Emulator öffnen (Port 8082)
```

Weitere Startbefehle:

| Befehl | Zweck |
| ------ | ----- |
| `npm start` | Expo über localhost auf Port 8082 |
| `npm run start:lan` | Expo im WLAN, z. B. für Expo Go auf dem Smartphone |

Port 8082 statt 8081, weil 8081 lokal oft belegt ist (z. B. durch Docker).

### Backend
```bash
cd backend
npm install
npx supabase login
npx supabase link --project-ref frljjsipfbvoukrfqwml
npx supabase db push
```

### TypeScript-Typen aktualisieren
Nach jeder Änderung am Datenbankschema in `backend/`:
```bash
npm run gen:types
```
Die Datei wird nach `frontend/src/types/database.types.ts` geschrieben.

## Tests

| Bereich | Befehl | Umfang |
| ------- | ------ | ------ |
| App | `cd frontend && npm test` | 147 Unit-Tests der Fachlogik (Validierung, Laufeingabe, Check-in, Wochenansicht, Machbarkeit) |
| App | `cd frontend && npm run lint` | ESLint mit Expo-Konfiguration |
| Backend | `cd backend/supabase/functions && deno task test` | 35 Tests der Kennzahlen (Pace, Riegel-Prognose, Wochen, Soll-Ist-Vergleich) |

## Stand Meilenstein 1

Meilenstein 1 umfasst Infrastruktur und Basis-Funktionalität ohne KI.

**Umgesetzt**
- Registrierung und Anmeldung (FA#0100)
- Onboarding-Fragebogen: Ziel, Trainingsbasis, verfügbare Tage, Beschwerden (FA#0104, FA#0105)
- Machbarkeitsanzeige des Ziels (FA#0107)
- „Heute“: Ziel mit Countdown, heutiger Tag, Wochenübersicht, Begrüßung mit Namen
- Manuelle Laufeingabe (FA#0103) mit anschließendem Check-in: Anstrengung (RPE), Stimmung, Motivation, Schmerzen, Notiz (FA#0108)
- Profil mit Konto, Ziel und Abmelden; Hinweis, dass Pacer keine ärztliche Beratung ersetzt (FA#0114)
- Datenbankschema mit Row Level Security: Nutzer sehen nur ihre eigenen Daten
- Soll- und Ist-Kennzahlen im Backend als reine, getestete Funktionen

**Platzhalter und Beispieldaten**
- Coach-Tab und Plan-Screen sind Platzhalter
- Im Profil kommen Ziel und Einstellungen (Strava, Coach-Gedächtnis) noch aus Beispieldaten
- Ein übersprungener Check-in kann noch nicht nachgetragen werden

**Ab Meilenstein 2**
- KI-Coach mit Gemini über Supabase Edge Functions (keine API-Keys in der App)
- Trainingsplan und Planänderungen per Function Calling, die der Nutzer bestätigt
- Strava-Anbindung, Langzeitgedächtnis mit pgvector

## Konventionen
Code-, Benennungs- und Git-Konventionen sowie die KI-Architektur stehen in [`AGENTS.md`](AGENTS.md).
