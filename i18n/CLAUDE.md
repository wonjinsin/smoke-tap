# i18n/CLAUDE.md

Custom i18n implementation. Currently Korean only.

## Files

<!-- skip-validate-next -->
- `index.ts` — `t(key)` helper
<!-- skip-validate-next -->
- `locales/ko.json` — translation table

User-facing strings must always go through `t()`. App-internal labels (debug logs, error messages for developers) stay English.

## Cross-module deps

- **Depends on:** none (leaf).
- **Depended by:**
  <!-- skip-validate-next -->
  - `app/**` — screens calling `t(key)` for user-facing strings.
  <!-- skip-validate-next -->
  - `components/**` — domain UI labels.
