# scripts/CLAUDE.md

Post-prebuild patches and one-off generators. Most run automatically via `npm run prebuild:ios`.

## Files

<!-- skip-validate-next -->
- `patch-widget.js` — overwrites widget Swift sources (`SharedTapStore.swift`, `RecordTapIntent.swift`, `SmokeTapWidget.swift`) after prebuild because `expo-widgets` regenerates them
<!-- skip-validate-next -->
- `fix-build-phase-order.js` — moves the patch Run Script Build Phase to run after `[Expo] Configure project` in the `SmokeTap` target's pbxproj
<!-- skip-validate-next -->
- `patch-expo-modules-provider.js` — patches `ExpoModulesProvider.swift`; runs as Run Script Build Phase + defensively after prebuild
<!-- skip-validate-next -->
- `gen-grain.js` — one-off: generates `assets/textures/paper-grain.png`
<!-- skip-validate-next -->
- `validate-context-paths.js` — validates path references in context docs (also pre-commit hook)

## Patterns

- New post-prebuild patches: add to `scripts/`, then thread into the `prebuild:ios` npm script in `package.json`.
- Each script is plain Node, stdlib only — no dependencies. Keep it that way to avoid bloating the install.

## Touch points

- `package.json` — `prebuild:ios` and `patch-widget` scripts call into here.
- `ios/` — the target of every patch.
- `plugins/` — the patches run *after* plugins; they exist precisely because plugin output is not enough.

## Gotchas

- Running plain `expo prebuild` skips these patches. Always go through `npm run prebuild:ios`.
- See `MEMORY.md` "Build pipeline" for why ordering is non-negotiable.
