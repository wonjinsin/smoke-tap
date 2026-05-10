# widgets/CLAUDE.md

iOS Home Screen Widget — JSX in this folder is **reference only**. Actual widget UI is Swift, embedded as a string in `scripts/patch-widget.js`.

## Files

<!-- skip-validate-next -->
- `SmokeTapWidget.tsx` — JSX mirror of the Swift widget. Pre-existing TS errors here are expected (the file is reference-only).

## Patterns

- Any visual change to the widget requires editing **both** `widgets/SmokeTapWidget.tsx` (for review legibility) and the Swift string `SMOKE_TAP_WIDGET` inside `scripts/patch-widget.js` (authoritative source).
- After editing, run `npm run patch-widget` to re-apply the Swift to `ios/`.

## Touch points

- `scripts/patch-widget.js` — authoritative Swift source.
- `constants/colors.ts` — token table that must match the Swift hex literals.
- `plugins/withSharedTapStore.js` — registers the widget extension target.

## Gotchas

- `expo-widgets` will overwrite the Swift file during `expo prebuild`. Always run `npm run prebuild:ios` (which re-patches) instead of bare prebuild.
- Token sync is manual across three files — see `MEMORY.md` "Widget Swift token sync".
- Interactive widget buttons require iOS 17+ (App Intents).
