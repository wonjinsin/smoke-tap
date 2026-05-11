# CLAUDE.md — Smoke Tap

iOS-only Expo app for tapping to log smoking events. Home-screen widget logs with one tap (App Intents, iOS 17+).

## Stack

Expo SDK 55 · React Native 0.83 · React 19.2 · TypeScript strict · Expo Router (file-based) · NativeWind v4 · Zustand v5 (persist + AsyncStorage) · expo-widgets + Swift App Intents.

Platform: iOS only (`app.json` → `platforms: ["ios"]`). Interactive widget requires iOS 17+.

## Commands

| Command | Purpose |
|---|---|
| `npm run ios` | Build + run on iOS simulator |
| `npm start` | Expo dev server only |
| `npm run prebuild:ios` | `expo prebuild --clean` + 3 patches (see below) |
| `npm run patch-widget` | Re-patch widget Swift only |
| `npx tsc --noEmit` | Type check |
| `npx expo start --clear` | Clear Metro cache |

No test runner is configured.

## Architecture

```
app/         Expo Router screens (tabs: index · stats · settings)
components/  UI (common · home · settings · stats)
widgets/     Widget JSX (reference only — real build is Swift in ios/)
store/       Zustand global state (useTapStore.ts)
modules/     Native module JS wrapper (SharedTapStore.ts)
plugins/     Expo config plugins (withSharedTapStore writes Swift into ios/)
scripts/     Post-prebuild patch scripts (run in fixed order)
ios/         Generated Xcode project — committed. See ios/CLAUDE.md
constants/   Design tokens
i18n/        Korean locale
```

## Critical gotcha: prebuild patch chain

After every `expo prebuild --clean`, three patches must run **in this order**:
1. `scripts/patch-widget.js` — overwrites widget Swift
2. `scripts/fix-build-phase-order.js` — moves the patch Run Script to fire **after** `[Expo] Configure project`
3. `scripts/patch-expo-modules-provider.js` — regenerates `ExpoModulesProvider.swift`

`npm run prebuild:ios` runs all three. Don't call `expo prebuild` alone — the build will fail or use stale Swift.

The App Group ID `group.com.example.smoketap` is duplicated across `app.json`, `plugins/withSharedTapStore.js`, and `scripts/patch-widget.js` — keep them in sync.

## Editing rules

- Do not edit files under `ios/` directly — they're regenerated. Edit `app.json`, `plugins/`, or `scripts/` instead. See `ios/CLAUDE.md`.
- Do not edit `ios/Pods/` — reinstalled on every `pod install`.

## Behavioral guidelines — ALWAYS APPLY

**MANDATORY: Read `.claude/guidelines.md` and follow it on every task, no exceptions.** These rules override default behavior and apply to all code changes in this repo — trivial fixes included. Re-read at the start of each task; do not rely on memory.

@.claude/guidelines.md

## More context

- `README.md` — Korean user-facing intro
- `ios/CLAUDE.md` — native iOS specifics
