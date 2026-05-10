# constants/CLAUDE.md

Design tokens and global constants.

## Files

<!-- skip-validate-next -->
- `colors.ts` — `C` namespace: `C.BG`, `C.CARD`, `C.INK`, etc.

All colors used in the app must be sourced from `C`. The widget side keeps a parallel hex copy in `scripts/patch-widget.js` — see `MEMORY.md` "Widget Swift token sync".

## Cross-module deps

- **Depends on:** none (leaf).
- **Depended by:**
  <!-- skip-validate-next -->
  - `components/**` — every UI component reads from `C`.
  <!-- skip-validate-next -->
  - `app/**` — screens that style raw views directly.
  - `scripts/patch-widget.js` — keeps a parallel hex copy of widget colors (sync manually).
