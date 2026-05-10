# 앱 → 위젯 동기화 버그 진단 및 수정안

## 증상

앱에서 `+` 버튼을 눌러 카운트가 올라가도, 홈 화면 위젯에는 반영되지 않음.

- 앱 화면: 6회
- 위젯: 4회 (이전 값 그대로)

반대 방향(위젯 `+` → 앱)은 정상 동작.

## 원인

`SharedTapStoreMainApp.setBaseCount()`이 App Groups의 `baseTodayCount` 값만 갱신하고, **위젯 타임라인 리로드를 호출하지 않음**.

- 위젯 쪽 `RecordTapIntent.perform()`은 `WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")`를 호출 → 위젯 → 앱 방향은 정상.
- 앱 쪽 `setBaseCount()`에는 동일한 reload 호출이 없음 → 앱 → 위젯 방향이 깨짐.

iOS는 App Groups `UserDefaults`가 바뀌어도 위젯을 자동 갱신하지 않기 때문에, 앱이 명시적으로 reload를 트리거해야 한다.

## 수정안

### 단일 진실 공급원: `plugins/withSharedTapStore.js`

`SHARED_TAP_STORE_MAIN_APP_SWIFT` 상수 (현재 122–139행) 수정:

```swift
import Foundation
import WidgetKit  // ← 추가

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
        WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")  // ← 추가
    }
}
```

### 적용 절차

```bash
npm run prebuild:ios   # plugin이 SharedTapStoreMainApp.swift를 다시 작성
npm run ios            # 재빌드 후 위젯 동기화 확인
```

> 현재 빌드된 Xcode 프로젝트에 즉시 반영하려면 `ios/SmokeTap/SharedTapStoreMainApp.swift`도 같이 수정해야 한다. 단, 다음 prebuild에서 plugin이 덮어쓰므로 plugin 쪽 수정이 필수.

## 트레이드오프

- `useTapStore.subscribe` 콜백이 **매 탭마다** `setBaseCount()`를 호출 → reload도 매번 발생.
- `systemSmall` 위젯 1개 환경에서는 비용 무시 가능.
- 추후 위젯 종류·갯수가 늘면 디바운스(예: 300ms 스로틀) 도입 검토.

## 검증 체크리스트

- [ ] 앱에서 `+` 탭 → 위젯 숫자가 1초 이내 증가
- [ ] 위젯에서 `+` 탭 → 위젯 숫자 즉시 증가, 앱 활성화 시 동일 값 표시 (회귀 없음)
- [ ] 자정 경계: 어제 마지막 탭 후 자정 넘김 → 앱·위젯 모두 0으로 리셋
- [ ] 앱 강제 종료 후 재실행 → `pendingTaps` 흡수 + `baseTodayCount` 재계산 정상

## 관련 파일

- `plugins/withSharedTapStore.js:122-139` — 메인 앱 Swift 소스 (수정 대상)
- `app/_layout.tsx:18-53` — `useWidgetSync()` 훅
- `store/useTapStore.ts:29-35` — `addTap()`
- `scripts/patch-widget.js:44-58` — 위젯 측 `RecordTapIntent` (참고: 이미 reload 호출함)
