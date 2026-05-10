# modules/CLAUDE.md

JavaScript wrapper for the `SharedTapStore` Expo Module (Swift-implemented). Exposes pending-tap counters and base-count writes from JS.

## Files

<!-- skip-validate-next -->
- `SharedTapStore.ts` — typed JS interface (`getPendingCount`, `clearPending`, `setBaseCount`)

## Patterns

- This module wraps a native Swift module produced by `plugins/withSharedTapStore.js` at prebuild time.
- API stays intentionally small: read/clear pending counter, write base today count. No business logic here.

## Cross-module deps

- **Depends on:** `plugins/withSharedTapStore.js` (generates the Swift counterpart at prebuild), `ios/` (native Swift module lives there after prebuild).
- **Depended by:**
  - `store/useTapStore.ts` — caller during widget sync (pendingTaps absorption).
  - `app/_layout.tsx` — invokes `useWidgetSync` which uses these methods.

## Gotchas

- Calling these on Android is unsupported (`platforms: ["ios"]` in `app.json`). The native module is iOS-only.
- After changing the Swift signatures via the plugin, `npm run prebuild:ios` is required to regenerate.
