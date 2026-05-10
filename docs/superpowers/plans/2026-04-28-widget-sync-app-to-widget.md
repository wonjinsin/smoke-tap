# 앱 → 위젯 동기화 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에서 탭이 발생하면 1초 이내 위젯 카운트가 동일하게 갱신되도록, `SharedTapStoreMainApp.setBaseCount`에 `WidgetCenter.shared.reloadTimelines` 호출을 추가한다.

**Architecture:** Single source of truth는 Expo config plugin (`plugins/withSharedTapStore.js`)의 Swift 문자열이다. Prebuild가 이 문자열을 `ios/SmokeTap/SharedTapStoreMainApp.swift`로 기록한다. 이번 변경은 두 파일을 동시에 패치해서 (1) 영구 수정과 (2) 즉시 검증 가능한 빌드를 동시에 확보한다.

**Tech Stack:** Expo SDK 55 config plugin (Node.js), Swift 5.x, WidgetKit (iOS 17+), App Groups.

**테스트 정책:** 본 저장소에는 자동화된 테스트 인프라(jest, swift test 등)가 없다. 이 변경은 iOS WidgetKit이 실제로 위젯 타임라인을 리로드해야 검증 가능하므로 **시뮬레이터 수동 검증**이 정답이다. 자동화 테스트 도입은 별개 작업으로 분리한다 (YAGNI).

---

## File Structure

| 파일 | 역할 | 동작 |
| --- | --- | --- |
| `plugins/withSharedTapStore.js` | 메인 앱 Swift 코드의 단일 진실 공급원. prebuild 시 `ios/SmokeTap/SharedTapStoreMainApp.swift`로 기록됨. | 수정 |
| `ios/SmokeTap/SharedTapStoreMainApp.swift` | 빌드된 Swift 파일. 다음 prebuild 시 plugin 내용으로 덮어쓰기됨. | 수정 (즉시 검증용, plugin과 동일 내용) |

두 파일은 **항상 같은 내용을 유지**해야 한다. 이번 커밋에서 같이 수정하고, 같은 커밋에 묶는다.

---

## Task 1: 플러그인 Swift 문자열 + 빌드된 Swift 파일 동시 패치

**Files:**
- Modify: `plugins/withSharedTapStore.js:122-139` (`SHARED_TAP_STORE_MAIN_APP_SWIFT` 상수)
- Modify: `ios/SmokeTap/SharedTapStoreMainApp.swift` (전체 파일)

### Step 1: `plugins/withSharedTapStore.js`의 메인 앱 Swift 문자열 수정

**현재 상태** (122–139행):

```javascript
const SHARED_TAP_STORE_MAIN_APP_SWIFT = `import Foundation

struct SharedTapStoreMainApp {
    static let appGroupId = "${APP_GROUP}"
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
    }
}
`;
```

- [ ] **다음과 같이 변경한다** (두 군데: `import WidgetKit` 추가, `setBaseCount`에 reload 호출 추가):

```javascript
const SHARED_TAP_STORE_MAIN_APP_SWIFT = `import Foundation
import WidgetKit

struct SharedTapStoreMainApp {
    static let appGroupId = "${APP_GROUP}"
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
`;
```

수행 방법: Edit 도구 또는 에디터로 두 위치를 수정한다.

### Step 2: 변경 검증 (정적)

- [ ] **plugin 파일이 두 추가 라인을 포함하는지 확인한다.**

Run:

```bash
grep -n "import WidgetKit" plugins/withSharedTapStore.js
grep -n "WidgetCenter.shared.reloadTimelines(ofKind: \"SmokeTapWidget\")" plugins/withSharedTapStore.js
```

Expected 출력:

```
123:import WidgetKit
138:        WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")
```

(정확한 행번호는 ±2행까지 차이날 수 있음. 두 라인이 모두 출력되면 OK.)

### Step 3: `ios/SmokeTap/SharedTapStoreMainApp.swift`도 동일하게 수정

빌드된 파일도 같은 두 라인을 추가한다. 다음 prebuild 시 plugin이 동일 내용으로 덮어쓰므로 정합성이 유지된다.

- [ ] **다음 내용으로 파일 전체를 교체한다:**

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

(`appGroupId`는 plugin에서는 `${APP_GROUP}`로 보간되지만 빌드된 파일에서는 리터럴 `"group.com.example.smoketap"`이다. 두 형태는 결과적으로 동일.)

### Step 4: 두 파일이 동일한 Swift 코드를 표현하는지 검증

- [ ] **빌드된 파일이 두 라인을 포함하는지 확인한다.**

Run:

```bash
grep -n "import WidgetKit" ios/SmokeTap/SharedTapStoreMainApp.swift
grep -n "WidgetCenter.shared.reloadTimelines(ofKind: \"SmokeTapWidget\")" ios/SmokeTap/SharedTapStoreMainApp.swift
```

Expected:

```
2:import WidgetKit
17:        WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")
```

### Step 5: 커밋

- [ ] **두 파일을 한 커밋으로 묶는다.**

```bash
git add plugins/withSharedTapStore.js ios/SmokeTap/SharedTapStoreMainApp.swift
git commit -m "fix: reload widget timeline when app updates base count

SharedTapStoreMainApp.setBaseCount only wrote to App Groups
UserDefaults; iOS does not auto-reload widgets on UserDefaults
change, so the widget kept showing a stale count after taps in
the app. Add WidgetCenter.shared.reloadTimelines(ofKind:) to
trigger an immediate timeline refresh."
```

---

## Task 2: 시뮬레이터 빌드 + 수동 검증

**Files:** 변경 없음. 빌드 & 검증만 수행.

### Step 1: 시뮬레이터 빌드

- [ ] **`npm run ios` 실행.**

Run:

```bash
npm run ios
```

Expected: Xcode가 SmokeTap을 빌드하고 시뮬레이터에서 앱이 실행됨. 컴파일 에러 없음. (`WidgetCenter`는 iOS 14+ API라 main app target에서 import 가능.)

빌드 실패 시: `import WidgetKit` 위치, `setBaseCount` 본문의 추가 라인 위치를 다시 확인.

### Step 2: 위젯을 홈 화면에 추가 (한 번만)

- [ ] **시뮬레이터 홈 화면 길게 누르기 → 위젯 추가 → "Smoke Tap" 검색 → systemSmall 추가.** (이미 추가되어 있으면 스킵.)

### Step 3: 검증 항목 1 — 앱 → 위젯 동기화

- [ ] **앱에서 `+` 탭 후 1초 이내 위젯 카운트가 1 증가하는지 확인.**

절차:
1. 앱을 포그라운드로 가져와 현재 카운트를 적어둔다 (예: `5`).
2. 앱 `+` 버튼을 1번 탭.
3. 홈 화면(앱 닫지 않고 옆으로 빼거나, 시뮬레이터 Home 키)을 본다.
4. 위젯 카운트가 `6`이 되어야 한다.

Expected: PASS — 위젯이 1초 이내 갱신된다.
실패 시: Xcode 콘솔에서 `Setting up reload timelines` 류 로그 확인. plugin 변경이 빌드에 반영되었는지 확인.

### Step 4: 검증 항목 2 — 위젯 → 앱 회귀

- [ ] **위젯에서 `+` 탭 후 위젯 즉시 증가, 앱 활성화 시 동일 값이 표시되는지 확인.**

절차:
1. 홈 화면 위젯에서 `+` 버튼을 1번 탭.
2. 위젯 카운트가 즉시 1 증가해야 한다.
3. 앱을 포그라운드로 가져온다.
4. 앱 카운트도 같은 값을 표시해야 한다.

Expected: PASS — 회귀 없음.

### Step 5: 검증 항목 3 — 자정 경계

- [ ] **시뮬레이터 시계를 조작해 자정 경계를 검증한다.**

절차 (시뮬레이터):
1. 23:59에 앱에서 `+` 탭 → 위젯 카운트 N (확인).
2. 시뮬레이터: Features → Time → 시간을 다음날 00:01로 변경.
3. 앱을 포그라운드로 가져온다 → 앱 카운트 0 표시.
4. 위젯 카운트도 0이어야 한다 (또는 다음 reload 시 0).

> **참고**: iOS 시뮬레이터는 시스템 시간 변경이 제한적일 수 있다. 변경이 어려우면 `useTapStore.records`에 어제 날짜의 timestamp를 일시적으로 주입해 동일 효과를 만들 수 있다. 이 검증은 회귀 방지 차원이므로 시뮬레이터 한계로 어려우면 PASS 처리하되 별도 이슈로 기록한다.

Expected: PASS 또는 시뮬레이터 한계로 N/A 처리.

### Step 6: 검증 항목 4 — 강제 종료 후 재실행

- [ ] **위젯에서 탭한 후 앱 강제 종료, 재실행 시 pending 흡수 + base 재계산이 정상인지 확인.**

절차:
1. 위젯 `+`를 2번 탭 (`pendingTaps = 2` 가정).
2. 앱을 멀티태스커에서 강제 종료.
3. 앱을 다시 실행.
4. `useWidgetSync()`가 `pendingTaps` 2를 흡수해 `addTap()` 2번 호출.
5. 앱 카운트가 위젯 카운트와 일치해야 한다.

Expected: PASS — 회귀 없음.

### Step 7: (선택) Prebuild 정합성 확인

- [ ] **`npm run prebuild:ios`가 plugin 내용과 동일하게 `ios/SmokeTap/SharedTapStoreMainApp.swift`를 다시 작성하는지 확인.**

Run:

```bash
npm run prebuild:ios
git diff ios/SmokeTap/SharedTapStoreMainApp.swift
```

Expected: `git diff`가 비어있다 (Task 1 Step 3에서 작성한 내용과 plugin 생성 결과가 동일). 차이가 있으면 두 곳의 Swift 코드가 어긋났다는 뜻 → 차이를 좁힌다.

> 이 step에서 코드가 변경되어 커밋이 필요하면 별도 커밋으로 분리한다.

### Step 8: 마무리

- [ ] **검증 체크리스트 4개가 모두 PASS이거나 명확한 사유로 처리되었는지 확인.**
- [ ] **앱 카운트 vs 위젯 카운트가 모든 시나리오에서 일치하는지 최종 확인.**
- [ ] **불필요한 임시 변경(있다면)을 되돌린다.**

---

## 완료 기준

- `plugins/withSharedTapStore.js`와 `ios/SmokeTap/SharedTapStoreMainApp.swift` 둘 다 `import WidgetKit`과 `WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")`을 포함한다.
- 시뮬레이터에서 앱 `+` 탭 → 위젯이 1초 이내 갱신된다.
- 위젯 `+` 탭 회귀 없음.
- 강제 종료/재실행 회귀 없음.
- 변경이 단일 커밋으로 묶여 있다.
