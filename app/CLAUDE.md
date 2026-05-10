# app/CLAUDE.md

Expo Router screens. File-based routing — file path is the route.

## Files

<!-- skip-validate-next -->
- `_layout.tsx` — root Stack + `useWidgetSync()` hook (absorbs widget pendingTaps on resume)
<!-- skip-validate-next -->
- `(tabs)/_layout.tsx` — tab definition (3 tabs)
<!-- skip-validate-next -->
- `(tabs)/index.tsx` — Home (number display + plus button)
<!-- skip-validate-next -->
- `(tabs)/stats.tsx` — Daily / weekly stats
<!-- skip-validate-next -->
- `(tabs)/settings.tsx` — Settings rows

## Patterns

<!-- skip-validate-next -->
- New screens go inside `(tabs)/` if tab-bound, otherwise as a sibling of `(tabs)`. Stack root is `_layout.tsx`.
- Screen-only components may live next to the screen file. Cross-screen UI goes to `components/<domain>/`.
<!-- skip-validate-next -->
- Always import `'../global.css'` indirectly via `_layout.tsx` — do not duplicate the import.

## Touch points

- `store/useTapStore.ts` — most screens read selectors here.
<!-- skip-validate-next -->
- `modules/SharedTapStore.ts` — `_layout.tsx` calls into it via `useWidgetSync`.
- `i18n/` — user-facing strings.

## Gotchas

<!-- skip-validate-next -->
- The `useWidgetSync` hook in `_layout.tsx` runs on every app foreground; do not gate it behind navigation events.
- Tab labels are also user-facing — wire through `i18n/`.
