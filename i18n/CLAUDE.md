# i18n/CLAUDE.md

Custom i18n implementation. Currently Korean only.

## Files

<!-- skip-validate-next -->
- `index.ts` — `t(key)` helper
<!-- skip-validate-next -->
- `locales/ko.json` — translation table

User-facing strings must always go through `t()`. App-internal labels (debug logs, error messages for developers) stay English.

→ Loaded by screens in `app/CLAUDE.md`.
