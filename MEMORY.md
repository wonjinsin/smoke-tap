# Memory

Non-obvious rules, decisions, and constraints. Each entry: **Rule**, **Why** (motivation/incident), **How to apply** (when this kicks in).

---

## Build pipeline: prebuild requires three follow-up patches

**Rule:** After every `expo prebuild`, three patches must run in order: `scripts/patch-widget.js` → `scripts/fix-build-phase-order.js` → `scripts/patch-expo-modules-provider.js`. Use `npm run prebuild:ios` so the wrapper handles ordering.

**Why:** `expo-widgets` overwrites widget Swift sources during prebuild, so we re-overwrite immediately after. The `[Expo] Configure project` build phase regenerates
<!-- skip-validate-next -->
`ExpoModulesProvider.swift` on every build, so the Run Script Build Phase that calls our patch must come *after* it — and that ordering can only be enforced once the phase actually exists in `pbxproj` (i.e., post-prebuild).

**How to apply:** Never run plain `expo prebuild` directly. If you do, follow up with `npm run patch-widget` at minimum, plus the build phase reorder if pbxproj was regenerated.

---

## Widget Swift token sync is manual across three places

**Rule:** Color tokens used in the widget exist in three locations and must be kept in sync by hand: `constants/colors.ts`, the Swift string inside `scripts/patch-widget.js`, and the JSX in `widgets/SmokeTapWidget.tsx`.

**Why:** The widget runs as a separate iOS extension; it cannot import TypeScript modules. Swift code is the authoritative source for the actual build, but we keep the JSX in sync so changes are visible in code review and so the JSX serves as a compile-time reference.

**How to apply:** When changing any color used in the widget, update all three files in the same commit.

---

## App Group ID is duplicated in three configs

**Rule:** `group.com.example.smoketap` appears in `app.json`, `plugins/withSharedTapStore.js`, and `scripts/patch-widget.js`. All three must change together.

**Why:** Each file feeds a different stage of the build (Expo config / prebuild plugin / post-prebuild patch). There is no single source — the duplication is intentional to keep each stage independent.

**How to apply:** Renaming the App Group requires `grep -r "group.com.example.smoketap"` and editing every hit.

---

## Date comparisons use device local timezone

**Rule:** Dates are compared as `YYYY-MM-DD` strings in the device's local timezone. Never use UTC for comparisons. Follow the `toLocalDateString` pattern already in the codebase.

**Why:** "Today's count" must reflect the user's local day boundary. Using UTC creates off-by-one bugs at midnight in non-UTC zones.

**How to apply:** Any new selector or grouping logic on `TapRecord.timestamp` must convert to local date string before grouping.

---

## NativeWind v4 wiring is fragile and required

**Rule:** Two pieces are required for NativeWind to work: the `withNativeWind` wrapper in `metro.config.js`, and `import '../global.css'` at the top of `app/_layout.tsx`. Removing either breaks Tailwind class resolution silently.

**Why:** NativeWind v4 ties into the Metro bundler via the wrapper, and the runtime needs the CSS import to register class transforms. Both are easy to lose during refactors.

**How to apply:** When touching `metro.config.js` or `app/_layout.tsx`, preserve the NativeWind hooks.

---

## iOS 17+ is a hard requirement (App Intents)

**Rule:** Interactive widget buttons depend on App Intents, which require iOS 17 or higher. Push notifications are intentionally removed via `plugins/withRemovePushNotifications.js`.

**Why:** App Intents are the only way to trigger behavior from a widget tap without launching the app. Removing push notifications keeps the entitlement surface minimal.

**How to apply:** Do not lower the iOS deployment target below 17. To re-enable push notifications, modify or remove the plugin.
