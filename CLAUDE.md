# CLAUDE.md

Smoke Tap — iOS-only one-tap smoke logger. Expo SDK 55 + React Native 0.83 + Expo Router + Zustand + iOS 17 widget (App Intents).

## Quick commands

| Command | What it does |
|--------|------|
| `npm run ios` | Build + run on iOS simulator |
| `npm start` | Dev server only |
| `npm run prebuild:ios` | `expo prebuild --clean` + 3-step native patch |
| `npm run patch-widget` | Re-apply widget Swift only |
| `npm run validate:context` | Validate context-doc paths (also runs in pre-commit) |
| `npx tsc --noEmit` | Type check |

## Module map

| Path | Role |
|------|------|
| `app/` | Expo Router (tabs: index · stats · settings) — see `app/CLAUDE.md` |
| `components/` | UI by domain (common · home · settings · stats) — see `components/CLAUDE.md` |
| `widgets/` | Widget JSX reference (Swift is authoritative) — see `widgets/CLAUDE.md` |
| `store/` | Zustand `useTapStore` (single source of truth) — see `store/CLAUDE.md` |
| `modules/` | Native bridge JS wrapper — see `modules/CLAUDE.md` |
| `ios/` | Generated Xcode project — see `ios/CLAUDE.md` |
| `plugins/` | Expo config plugins — see `plugins/CLAUDE.md` |
| `scripts/` | Prebuild patches — see `scripts/CLAUDE.md` |
| `constants/`, `i18n/`, `types/` | Resources — see each `CLAUDE.md` |

## Where to look next

- `README.md` — project intro, run instructions (Korean)
- `ARCHITECTURE.md` — module dependency + Widget↔App sync diagram
- `MEMORY.md` — non-obvious rules: prebuild patch rationale, App Group sync, iOS 17+ requirement
- Per-module `CLAUDE.md` for editing patterns and gotchas

## Conventions

- Comments / commits / identifiers in English. User-facing strings + README in Korean.
- TypeScript strict; minimize `as` casts.
- Path alias `@/*` → project root.
- Dates compared as `YYYY-MM-DD` strings in **device local timezone** (no UTC).
