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
| `npm run prebuild:ios` | `expo prebuild --platform ios --clean` + 3 patches (see below) |
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
ios/         Generated Xcode project — committed. Do not edit by hand.
constants/   Design tokens
i18n/        Korean locale
```

## Critical gotcha: prebuild patch chain

After every `expo prebuild --clean`, three patches must run **in this order**:
1. `scripts/patch-widget.js` — overwrites widget Swift
2. `scripts/fix-build-phase-order.js` — moves the patch Run Script to fire **after** `[Expo] Configure project`
3. `scripts/patch-expo-modules-provider.js` — regenerates `ExpoModulesProvider.swift`

`npm run prebuild:ios` runs all three. Don't call `expo prebuild` alone — the build will fail or use stale Swift.

The App Group ID `group.com.example.smoketap` is duplicated across `plugins/withSharedTapStore.js` and `scripts/patch-widget.js` — keep them in sync. (Not in `app.json` — only `bundleIdentifier` lives there.)

## Editing rules

- Do not edit files under `ios/` directly — they're regenerated. Edit `app.json`, `plugins/`, or `scripts/` instead.
- Do not edit `ios/Pods/` — reinstalled on every `pod install`.
- `i18n/locales/ko.json` contains orphan strings for unbuilt settings (`shakeUndo`, `haptic`, `iCloud`, `startDate`, `exportCsv`, `appIcon`, `appearance`). Grep the key before treating an i18n string as a shipped feature.

## Behavioral guidelines — ALWAYS APPLY

**MANDATORY: Read `.claude/guidelines.md` and follow it on every task, no exceptions.** These rules override default behavior and apply to all code changes in this repo — trivial fixes included. Re-read at the start of each task; do not rely on memory.

@.claude/guidelines.md

## Documentation language

**All documentation in this repo (README.md, CLAUDE.md, guidelines, in-repo markdown) must be written in English.** This overrides any global rule that prefers another language for documentation. Code comments and commit messages also remain in English. (User-facing UI strings under `i18n/` are unaffected.)

## More context

- `README.md` — user-facing intro (English)
