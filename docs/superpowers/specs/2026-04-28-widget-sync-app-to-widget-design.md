# 앱 → 위젯 동기화 버그 수정 설계

작성일: 2026-04-28
관련 진단: `docs/widget-sync-fix.md`

## 배경

홈 화면 위젯 ↔ 앱은 App Groups (`group.com.example.smoketap`)의 `UserDefaults` 두 키(`pendingTaps`, `baseTodayCount`)로 양방향 동기화한다.

- **위젯 → 앱**: 위젯 `+` 탭 시 `RecordTapIntent`가 `pendingTaps`를 증가시키고 `WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")`를 호출 → 위젯 즉시 갱신.
- **앱 → 위젯**: `app/_layout.tsx`의 `useTapStore.subscribe` 콜백이 records 변경 시마다 `setBaseCount(today)`를 호출 → App Groups의 `baseTodayCount` 갱신.

## 문제

앱에서 `+` 버튼을 눌러 카운트가 올라가도 홈 화면 위젯에 반영되지 않는다. 반대 방향(위젯 → 앱)은 정상이다.

원인은 `SharedTapStoreMainApp.setBaseCount()`이 App Groups 값만 갱신하고 위젯 타임라인 리로드를 호출하지 않는 것. iOS는 App Groups `UserDefaults`가 변경되어도 위젯을 자동 갱신하지 않으므로 앱이 명시적으로 reload를 트리거해야 한다.

## 목표

앱에서 탭이 발생하면 1초 이내에 위젯 카운트도 동일하게 반영된다.

## 비목표

- 디바운스/스로틀링 도입 — 현재 systemSmall 위젯 1개 환경이며 iOS WidgetKit이 reload를 내부적으로 합쳐 처리하므로 불필요. 위젯 종류·갯수가 늘어나면 그때 재검토.
- App Group ID, 위젯 kind 등 식별자의 상수화/리팩터 — 별개 작업.

## 변경 사항

### 1. 플러그인 Swift 문자열 (단일 진실 공급원)

**파일**: `plugins/withSharedTapStore.js` (122–139행)

`SHARED_TAP_STORE_MAIN_APP_SWIFT` 상수를 다음과 같이 수정한다.

```swift
import Foundation
import WidgetKit

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
        WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")
    }
}
```

변경 라인:
- `import WidgetKit` 추가 (2행).
- `setBaseCount` 마지막에 `WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")` 추가.

### 2. 빌드된 Swift 파일도 동일하게 패치

**파일**: `ios/SmokeTap/SharedTapStoreMainApp.swift`

플러그인이 prebuild 시 덮어쓰는 파일이지만, 즉시 검증을 위해 동일한 두 라인을 직접 추가한다. 다음 prebuild에서 plugin이 같은 내용으로 덮어쓰므로 정합성은 유지된다.

> **이유**: 이 변경 없이 `npm run ios`만 실행하면 빌드된 Swift는 변하지 않아 위젯이 그대로 멈춘다. `npm run prebuild:ios`까지 강제하면 검증 사이클이 길어진다. 플러그인 + 파일 동시 패치가 가장 마찰이 적다.

## 영향 범위

- **변경 파일 2개**: `plugins/withSharedTapStore.js`, `ios/SmokeTap/SharedTapStoreMainApp.swift`.
- **위젯 측 코드(`scripts/patch-widget.js`)**: 변경 없음. 이미 reload 호출 중.
- **JS/TS 측(`app/_layout.tsx`, `store/useTapStore.ts`, `modules/SharedTapStore.ts`)**: 변경 없음. `setBaseCount` 호출 빈도/시점은 그대로.

## 검증 체크리스트

- [ ] 앱에서 `+` 탭 → 홈 화면 위젯 숫자가 1초 이내 증가
- [ ] 위젯에서 `+` 탭 → 위젯 숫자 즉시 증가, 앱 활성화 시 동일 값 표시 (회귀 없음)
- [ ] 자정 경계: 어제 마지막 탭 후 자정 넘김 → 앱·위젯 모두 0으로 리셋
- [ ] 앱 강제 종료 후 재실행 → `pendingTaps` 흡수 + `baseTodayCount` 재계산 정상

## 적용 절차

1. `plugins/withSharedTapStore.js` 수정.
2. `ios/SmokeTap/SharedTapStoreMainApp.swift` 동일 수정.
3. `npm run ios` → 시뮬레이터에서 검증 체크리스트 4개 실행.
4. (선택) `npm run prebuild:ios`로 plugin이 같은 내용을 재생성하는지 확인.

## 트레이드오프

- `useTapStore.subscribe`는 매 탭마다 발화하므로 reload도 매번 호출된다. iOS WidgetKit은 reload 요청을 내부 throttle로 합쳐 처리하므로 systemSmall 위젯 1개 환경에서는 비용을 무시할 수 있다.
- 향후 위젯 종류/갯수가 늘어나거나 다른 store 변경이 빈번해지면 300ms 스로틀 또는 의미 있는 변경 감지(`getTodayCount`가 실제 바뀐 경우만 호출) 도입을 검토한다.

## 관련 파일

- `plugins/withSharedTapStore.js:122-139` — 메인 앱 Swift 소스 (수정 대상)
- `ios/SmokeTap/SharedTapStoreMainApp.swift` — 빌드된 Swift (수정 대상, 즉시 검증용)
- `app/_layout.tsx:18-53` — `useWidgetSync()` 훅 (변경 없음, 호출자)
- `store/useTapStore.ts:29-35` — `addTap()` (변경 없음)
- `scripts/patch-widget.js:44-58` — 위젯 측 `RecordTapIntent` (참고: 이미 reload 호출함)
