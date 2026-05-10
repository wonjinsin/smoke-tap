# App → Widget Sync Bug Diagnosis and Fix

## Symptom

Even after pressing the `+` button in the app to increase the count, the home screen widget does not reflect the change.

- App screen: 6
- Widget: 4 (stale value)

The reverse direction (widget `+` → app) works correctly.

## Root Cause

`SharedTapStoreMainApp.setBaseCount()` only updates the `baseTodayCount` value in App Groups but **does not call the widget timeline reload**.

- The widget-side `RecordTapIntent.perform()` calls `WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")` → widget → app direction works correctly.
- The app-side `setBaseCount()` has no equivalent reload call → app → widget direction is broken.

iOS does not automatically refresh widgets when App Groups `UserDefaults` changes, so the app must explicitly trigger a reload.

## Fix

### Single Source of Truth: `plugins/withSharedTapStore.js`

Modify the `SHARED_TAP_STORE_MAIN_APP_SWIFT` constant (currently lines 122–139):

```swift
import Foundation
import WidgetKit  // ← add

struct SharedTapStoreMainApp {
    static let appGroupId = "group.com.example.smoketap"
    static let pendingKey = "pendingTaps"
    static let baseKey   = "baseTodayCount"

    static func getPendingCount() -> Int {
        UserDefaults(suiteName: appGroupId)?.integer(forKey: pendingKey) ?? 0
    }
    static func clearPending() {
        UserDefaults(suiteName: appGroupId)?.set(0, forKey: pendingKey)
    }
    static func setBaseCount(_ count: Int) {
        UserDefaults(suiteName: appGroupId)?.set(count, forKey: baseKey)
        WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")  // ← add
    }
}
```

### How to Apply

```bash
npm run prebuild:ios   # plugin rewrites SharedTapStoreMainApp.swift
npm run ios            # rebuild and verify widget sync
```

> To apply immediately to the current Xcode project without a full prebuild, also edit `ios/SmokeTap/SharedTapStoreMainApp.swift` directly. However, the plugin-side fix is mandatory since the next prebuild will overwrite it.

## Trade-offs

- The `useTapStore.subscribe` callback calls `setBaseCount()` **on every tap** → reload fires on every tap too.
- Negligible cost in a single `systemSmall` widget environment.
- If widget types/count increase in the future, consider adding a debounce (e.g., 300ms throttle).

## Verification Checklist

- [ ] Tap `+` in app → widget number increases within 1 second
- [ ] Tap `+` in widget → widget number updates immediately; app shows the same value on activation (no regression)
- [ ] Midnight boundary: last tap before midnight, then crossing midnight → both app and widget reset to 0
- [ ] Force-quit app and relaunch → `pendingTaps` absorbed + `baseTodayCount` recalculated correctly

## Related Files

- `plugins/withSharedTapStore.js:122-139` — main app Swift source (target of this fix)
- `app/_layout.tsx:18-53` — `useWidgetSync()` hook
- `store/useTapStore.ts:29-35` — `addTap()`
- `scripts/patch-widget.js:44-58` — widget-side `RecordTapIntent` (reference: already calls reload)
