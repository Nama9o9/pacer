# Pacer

KI-Lauf-Coach als mobile App (Semesterprojekt „Anwendungen mit LLMs“, BHT Berlin, WiSe 2026/27).

## Tech-Stack

| Bereich  | Technologie                                      |
| -------- | ------------------------------------------------ |
| App      | React Native, Expo, Expo Router, TypeScript      |
| Backend  | Supabase (PostgreSQL + pgvector, Auth, Edge Functions) |
| KI       | Google Gemini API                                |
| Daten    | Strava API                                       |

## Struktur

```
pacer/
├── frontend/          # Expo-App
│   └── src/
│       ├── app/       # Screens (Expo Router)
│       ├── components/
│       ├── types/     # generierte Supabase-Typen
│       └── utils/     # Supabase-Client, Helfer
└── backend/
    └── supabase/      # Migrationen, Edge Functions
```

## Starten

### Voraussetzungen
- Node.js LTS, npm, Git
- Expo Go auf dem Smartphone

### Frontend
```bash
cd frontend
npm install
# .env.example nach .env.local kopieren und Werte eintragen
npx expo start
```

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