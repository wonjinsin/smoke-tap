# CLAUDE.md

This file is a reference guide for Claude Code when working in this repository.

## Project Overview

**Smoke Tap** — An iOS-only app for logging smoking sessions with a single light tap.

- Target users are people who want to objectively track their own habits without judgment.
- One tap = one record. Minimizing friction is the core design principle.
- Recording is also possible with a single tap from the home screen widget. The widget and app sync via App Groups.

## Tech Stack

- **Runtime**: Expo SDK 55, React Native 0.83, React 19.2
- **Routing**: Expo Router (`app/` file-based, typed routes enabled)
- **Language**: TypeScript strict mode
- **Styling**: NativeWind v4 + `StyleSheet` for some screens (design-token based)
- **State**: Zustand v5 + `persist` (AsyncStorage)
- **Data**: TanStack Query v5 (currently unused — reserved for future server integration)
- **i18n**: Custom implementation, `i18n/locales/ko.json` (currently ko only)
- **Widget**: `expo-widgets` + hand-written Swift (App Intents) — iOS 17+
- **Native Bridge**: Custom Expo Module `SharedTapStore`

## Common Commands

| Command | Description |
|--------|------|
| `npm run ios` | Build and run on iOS simulator |
| `npm start` | Start Expo dev server only |
| `npm run prebuild:ios` | Run `expo prebuild --clean`, then auto-apply widget patch + build phase reorder + ExpoModulesProvider patch |
| `npm run patch-widget` | Re-apply widget Swift file patch only |
| `npx tsc --noEmit` | Type check |
| `npx expo start --clear` | Start with Metro cache cleared |

## Directory Structure

```
smoke-tap/
├── app/                   # Expo Router (file-based routing)
│   ├── _layout.tsx        # Stack root + widget sync hook
│   └── (tabs)/            # index / stats / settings
├── components/
│   ├── common/            # Shared components like AppHeader
│   └── stats/             # Stats-specific components like BarChart
├── store/
│   └── useTapStore.ts     # Zustand persist store (single source of truth for records array)
├── modules/
│   └── SharedTapStore.ts  # Widget↔app bridge (native module JS wrapper)
├── widgets/
│   └── SmokeTapWidget.tsx # expo-widgets JSX (reference only — actual build uses Swift)
├── plugins/
│   ├── withSharedTapStore.js          # Main app Swift files + Xcode target registration
│   └── withRemovePushNotifications.js # Remove push notification permissions/entitlements
├── scripts/
│   ├── patch-widget.js                  # Overwrite widget Swift files after prebuild
│   ├── fix-build-phase-order.js         # Move patch phase after [Expo] Configure project in SmokeTap target
│   └── patch-expo-modules-provider.js   # Patch ExpoModulesProvider in build phase
├── constants/colors.ts    # Design tokens (C.BG, C.ACCENT, etc.)
├── i18n/                  # ko.json + t() helper
├── types/tap.ts           # TapRecord, DailyStat, WeeklySummary
└── ios/                   # Generated Xcode project (committed to repo)
```

## Core Architecture

### Single Source of Truth — `useTapStore.records`

All statistics are derived from `records: TapRecord[]`. `getTodayCount`, `getDailyStats`, and `getWeeklyStats` are all selectors. Do not create separate caches or counters.

### Widget ↔ App Sync

Two keys in `UserDefaults` under App Groups (`group.com.example.smoketap`) for bidirectional sync:

- `pendingTaps` (Int): Count of taps made from the widget that the app has not yet absorbed
- `baseTodayCount` (Int): Today's count as known by the app (reference value for widget display)

Flow:

1. **Widget → App**: Widget `+` button tap → `RecordTapIntent` → increment `pendingTaps` + immediately refresh widget.
2. **App activation**: `useWidgetSync()` in `app/_layout.tsx` calls `addTap()` for each pending tap → `clearPending()` → `setBaseCount(today)`.
3. **App → Widget**: On every records change via `useTapStore.subscribe`, update `setBaseCount(today)` → next widget timeline displays the new value.

### Swift Code Generation Path

- **Main app Swift** (`SharedTapStoreMainApp.swift`, `SharedTapStoreModule.swift`):
  Config plugin `withSharedTapStore.js` writes these files and registers them in the Xcode target at `prebuild` time.
- **Widget Swift** (`SharedTapStore.swift`, `RecordTapIntent.swift`, `SmokeTapWidget.swift`):
  Because `expo-widgets` overwrites generated files during the `prebuild` step, **`scripts/patch-widget.js` overwrites them again immediately after prebuild**. `npm run prebuild:ios` runs three steps in order: prebuild → `patch-widget.js` → `patch-expo-modules-provider.js` (the last step overlaps with the Xcode Run Script Build Phase, but it is a defensive call to ensure consistency immediately after prebuild).
- **`ExpoModulesProvider.swift`**: The `[Expo] Configure project` phase regenerates this file on every build, so the Run Script Build Phase that calls `patch-expo-modules-provider.js` **must come after it**. Because the `[Expo] Configure project` phase does not yet exist in pbxproj at config plugin time, its position cannot be guaranteed there — so `fix-build-phase-order.js` moves the patch phase to immediately after `[Expo] Configure project` in the SmokeTap target's buildPhases array right after prebuild, ensuring the patch survives every build.

## Design System

Paper-light tone + ink. Single theme (dark mode not supported). Core tokens:

- **Theme**: Paper light (`C.BG = #F5F2EC`, `C.CARD = #FBF9F4`)
- **Accent = Ink**: `C.INK = #1A1815` solid. No separate color accent.
- **Hierarchy**: Numbers are the hero. The circular display on the home screen is the visual focal point.
- **Separation principle**: Visually separate the display (reading) from the + button (tapping).
- **Decoration restraint**: For visual fidelity, UI elements explicitly shown in the design spec may be rendered even with stub behavior. Do not arbitrarily add elements not in the spec.
- **Grain**: `assets/textures/paper-grain.png` (8×8 tile) — all tab screens are wrapped with `<PaperBackground>`.

Always use `C` tokens for colors. No hardcoding (except Swift widget code uses hex strings directly — token sync is manual: `colors.ts` ↔ `scripts/patch-widget.js` ↔ `widgets/SmokeTapWidget.tsx`).

## Code Conventions

- Comments, commits, and identifiers are in English. User-facing text and documentation are in Korean (`i18n/locales/ko.json`).
- TypeScript is strict. Minimize `as` casting to narrow types.
- Path alias: `@/*` → project root.
- New components go in `components/<domain>/`. If a component is exclusive to one screen, it can live inside `app/` alongside it.
- Dates are always compared as `YYYY-MM-DD` strings using the **device local timezone** (following the `toLocalDateString` pattern). No UTC comparisons.

## Important Notes

- **When modifying the widget**: `widgets/SmokeTapWidget.tsx` (JSX reference) and the Swift string (`SMOKE_TAP_WIDGET`) inside `scripts/patch-widget.js` must **both** be updated. The Swift side is the authoritative source for actual builds.
- **App Group ID**: `com.example.smoketap` is scattered across three places: `app.json`, `withSharedTapStore.js`, and `patch-widget.js`. Sync all three when changing it.
- **NativeWind v4**: The `withNativeWind` wrapper in `metro.config.js` and `import '../global.css'` in `app/_layout.tsx` are required.
- **Push Notifications**: The `withRemovePushNotifications` plugin intentionally removes them. To re-enable, modify the plugin.
- **iOS only**: `platforms: ["ios"]` in `app.json`. Android builds are not supported.
- **iOS 17+ dependency**: Interactive widget buttons require App Intents. Works on iOS 17 and above only.
