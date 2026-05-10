# components/CLAUDE.md

<!-- skip-validate-next -->
UI components grouped by domain. Each domain folder is screen-aligned, except `common/`.

## Files

<!-- skip-validate-next -->
- `common/AppHeader.tsx`, `common/PaperBackground.tsx` — used across all screens
<!-- skip-validate-next -->
- `home/CountDisplay.tsx`, `home/PlusButton.tsx`, `home/UndoToast.tsx`, `home/HourlyMini.tsx`
<!-- skip-validate-next -->
- `settings/Row.tsx`, `settings/Section.tsx`
<!-- skip-validate-next -->
- `stats/BarChart.tsx`

## Patterns

<!-- skip-validate-next -->
- New shared component → `common/`. Screen-exclusive component that won't be reused → `app/<screen>` (alongside the screen) or `components/<screen-domain>/`.
- All colors come from `constants/colors.ts` (`C.BG`, `C.INK`, etc.). No hardcoded hex.
- Wrap full-screen views with `<PaperBackground>` to apply the paper grain texture.

## Touch points

- `constants/colors.ts` — design tokens.
- `store/useTapStore.ts` — direct subscription via Zustand selectors when needed.

## Gotchas

- Numbers (count display) are the visual focal point — do not add competing accent colors. Single ink accent only.
- Decoration restraint: render only what the design spec calls for, even if a component is a stub.
