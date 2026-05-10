# store/CLAUDE.md

Zustand v5 + persist (AsyncStorage). Single source of truth for tap records.

## Files

<!-- skip-validate-next -->
- `useTapStore.ts` — store definition with `records: TapRecord[]` plus actions and selectors

## Patterns

- All statistics derive from `records` via selectors (`getTodayCount`, `getDailyStats`, `getWeeklyStats`). Do not add parallel counters or caches.
- New persisted fields require a migration consideration — Zustand's `persist` versions are key.
- Actions: `addTap()`, `removeLastTap()` — keep them small and synchronous. Widget-sync helpers (`clearPending`, `setBaseCount`) live in `modules/SharedTapStore.ts`, not in the store.

## Cross-module deps

- **Depends on:** `types/tap.ts` (`TapRecord`, `DailyStat`, `WeeklySummary`).
- **Depended by:**
  - `app/_layout.tsx` — subscribes via `useTapStore.subscribe` to push base count to the widget.
  <!-- skip-validate-next -->
  - `components/home/*`, `components/stats/*` — read selectors.
  - `modules/SharedTapStore.ts` — pendingTaps absorption flows back into `addTap`.

## Gotchas

- Date selectors compare as `YYYY-MM-DD` in **device local timezone**, not UTC. Follow the existing `toLocalDateString` pattern.
