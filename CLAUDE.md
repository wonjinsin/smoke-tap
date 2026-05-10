# CLAUDE.md

이 파일은 Claude Code가 본 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**Smoke Tap** — 흡연 횟수를 가볍게 한 번의 탭으로 기록하는 iOS 전용 앱.

- 사용자는 판단 없이 자기 습관을 객관적으로 추적하려는 사람.
- 탭 한 번 = 기록 한 번. 마찰을 최대한 줄이는 것이 핵심.
- 홈 화면 위젯에서도 탭 하나로 기록 가능. 위젯과 앱은 App Groups로 동기화됨.

## 기술 스택

- **런타임**: Expo SDK 55, React Native 0.83, React 19.2
- **라우팅**: Expo Router (`app/` 파일 기반, typed routes 활성화)
- **언어**: TypeScript strict mode
- **스타일링**: NativeWind v4 + 일부 화면은 `StyleSheet`(디자인 토큰 기반)
- **상태**: Zustand v5 + `persist` (AsyncStorage)
- **데이터**: TanStack Query v5 (현재는 미사용 — 추후 서버 연동 대비)
- **i18n**: 자체 구현, `i18n/locales/ko.json` (현재 ko만 존재)
- **위젯**: `expo-widgets` + 직접 작성한 Swift (App Intents) — iOS 17+
- **네이티브 브릿지**: 자체 Expo Module `SharedTapStore`

## 자주 쓰는 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run ios` | iOS 시뮬레이터 빌드/실행 |
| `npm start` | Expo 개발 서버만 실행 |
| `npm run prebuild:ios` | `expo prebuild --clean` 후 위젯 패치 + 빌드 페이즈 순서 보정 + ExpoModulesProvider 패치 자동 실행 |
| `npm run patch-widget` | 위젯 Swift 파일 패치만 다시 적용 |
| `npx tsc --noEmit` | 타입 검사 |
| `npx expo start --clear` | Metro 캐시 초기화 후 실행 |

## 디렉토리 구조

```
smoke-tap/
├── app/                   # Expo Router (file-based routing)
│   ├── _layout.tsx        # Stack root + 위젯 동기화 훅
│   └── (tabs)/            # index / stats / settings
├── components/
│   ├── common/            # AppHeader 등 공통 컴포넌트
│   └── stats/             # BarChart 등 통계 전용
├── store/
│   └── useTapStore.ts     # Zustand persist 스토어 (records 배열 단일 소스)
├── modules/
│   └── SharedTapStore.ts  # 위젯↔앱 브릿지 (네이티브 모듈 JS 래퍼)
├── widgets/
│   └── SmokeTapWidget.tsx # expo-widgets JSX (참고용 — 실 빌드는 Swift)
├── plugins/
│   ├── withSharedTapStore.js          # 메인 앱 Swift 파일 + Xcode target 등록
│   └── withRemovePushNotifications.js # 푸시 권한/엔타이틀먼트 제거
├── scripts/
│   ├── patch-widget.js                  # prebuild 후 위젯 Swift 덮어쓰기
│   ├── fix-build-phase-order.js         # SmokeTap 타깃에서 패치 페이즈를 [Expo] Configure project 뒤로 이동
│   └── patch-expo-modules-provider.js   # 빌드 페이즈에서 ExpoModulesProvider 패치
├── constants/colors.ts    # 디자인 토큰 (C.BG, C.ACCENT 등)
├── i18n/                  # ko.json + t() 헬퍼
├── types/tap.ts           # TapRecord, DailyStat, WeeklySummary
└── ios/                   # 생성된 Xcode 프로젝트 (커밋 대상)
```

## 핵심 아키텍처

### 단일 소스 — `useTapStore.records`

모든 통계는 `records: TapRecord[]`에서 파생됨. `getTodayCount`, `getDailyStats`, `getWeeklyStats`는 모두 selector. 별도 캐시/카운터를 만들지 말 것.

### 위젯 ↔ 앱 동기화

App Groups (`group.com.example.smoketap`)의 `UserDefaults`에 두 키를 두고 양방향 동기화:

- `pendingTaps` (Int): 위젯에서 누른 후 앱이 아직 흡수하지 못한 횟수
- `baseTodayCount` (Int): 앱이 알고 있는 오늘 카운트 (위젯 표시용 기준값)

흐름:

1. **위젯 → 앱**: 위젯 `+` 버튼 탭 → `RecordTapIntent` → `pendingTaps` 증가 + 위젯 즉시 갱신.
2. **앱 활성화**: `app/_layout.tsx`의 `useWidgetSync()`가 `pendingTaps`만큼 `addTap()` 호출 → `clearPending()` → `setBaseCount(today)`.
3. **앱 → 위젯**: `useTapStore.subscribe`로 records 변경 시마다 `setBaseCount(today)` 갱신 → 다음 위젯 타임라인이 새 값을 표시.

### Swift 코드 생성 경로

- **메인 앱 Swift**(`SharedTapStoreMainApp.swift`, `SharedTapStoreModule.swift`):
  Config plugin `withSharedTapStore.js`가 `prebuild` 시점에 작성 + Xcode 타겟 등록.
- **위젯 Swift**(`SharedTapStore.swift`, `RecordTapIntent.swift`, `SmokeTapWidget.swift`):
  `expo-widgets`가 `prebuild` 단계에서 생성 파일을 덮어쓰기 때문에, **`scripts/patch-widget.js`가 prebuild 직후 다시 덮어쓰는 구조**. `npm run prebuild:ios`가 prebuild → `patch-widget.js` → `patch-expo-modules-provider.js` 세 단계를 순서대로 실행함 (마지막 단계는 Xcode Run Script Build Phase와 중복되지만 prebuild 직후 즉시 정합성을 보장하기 위한 방어적 호출).
- **`ExpoModulesProvider.swift`**: 빌드 시 `[Expo] Configure project` 페이즈가 재생성하므로, `patch-expo-modules-provider.js`를 호출하는 Run Script Build Phase가 **반드시 그 뒤**에 와야 함. config plugin 시점에는 `[Expo] Configure project` 페이즈가 아직 pbxproj에 없어 위치를 보장할 수 없으므로, prebuild 직후 `fix-build-phase-order.js`가 SmokeTap 타깃 buildPhases 배열에서 패치 페이즈를 `[Expo] Configure project` 바로 뒤로 이동시켜 매 빌드마다 패치가 살아남도록 함.

## 디자인 시스템

페이퍼 라이트 톤 + 잉크. 단일 테마(다크 모드 미지원). 핵심 토큰:

- **테마**: 페이퍼 라이트 (`C.BG = #F5F2EC`, `C.CARD = #FBF9F4`)
- **액센트 = 잉크**: `C.INK = #1A1815` 단색. 별도 컬러 액센트 없음.
- **위계**: 숫자가 주인공. 홈 화면의 원형 디스플레이가 시각적 중심.
- **분리 원칙**: 디스플레이(읽기)와 + 버튼(누르기)을 시각적으로 분리.
- **장식 신중**: 시각적 충실도를 위해 시안에 명시된 UI 요소는 stub 동작이라도 표시할 수 있다. 단, 시안에 없는 요소를 임의 추가하지 말 것.
- **그레인**: `assets/textures/paper-grain.png`(8×8 타일) — 모든 탭 화면을 `<PaperBackground>`로 감쌈.

색상은 항상 `C` 토큰 사용. 하드코딩 금지 (단, Swift 위젯 코드는 hex 문자열 그대로 — 토큰 동기화는 수동: `colors.ts` ↔ `scripts/patch-widget.js` ↔ `widgets/SmokeTapWidget.tsx`).

## 코드 컨벤션

- 주석·커밋·식별자는 영어. 사용자 노출 텍스트와 문서는 한국어 (`i18n/locales/ko.json`).
- TypeScript는 strict. 타입을 좁히기 위한 `as` 캐스팅은 최소화.
- 경로 앨리어스: `@/*` → 프로젝트 루트.
- 새 컴포넌트는 `components/<domain>/`. 한 화면 전용이면 `app/` 안에 같이 둬도 됨.
- 날짜는 항상 **디바이스 로컬 타임존** 기준 `YYYY-MM-DD` 문자열로 비교 (`toLocalDateString` 패턴 따름). UTC 비교 금지.

## 주의사항

- **위젯 수정 시**: `widgets/SmokeTapWidget.tsx`(JSX 참고용)와 `scripts/patch-widget.js` 안의 Swift 문자열(`SMOKE_TAP_WIDGET`)을 **함께** 수정해야 함. 실제 빌드는 Swift 쪽이 정답.
- **App Group ID**: `com.example.smoketap`은 `app.json`, `withSharedTapStore.js`, `patch-widget.js` 세 곳에 흩뿌려져 있음. 변경 시 모두 동기화.
- **NativeWind v4**: `metro.config.js`의 `withNativeWind` 래핑과 `app/_layout.tsx`의 `import '../global.css'` 필수.
- **Push Notifications**: `withRemovePushNotifications` 플러그인이 의도적으로 제거함. 다시 활성화하려면 플러그인 수정.
- **iOS 전용**: `app.json`의 `platforms: ["ios"]`. Android 빌드는 지원 대상이 아님.
- **iOS 17+ 의존**: 위젯의 인터랙티브 버튼은 App Intents가 필요. iOS 17 이상에서만 동작.
