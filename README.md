<div align="center">

<img src="./assets/icon.png" alt="Smoke Tap" width="120" />

# Smoke Tap

**한 번의 탭으로 흡연 한 번을 기록한다.**

판단하지 않고, 목표를 강요하지 않는다. 숫자는 그저 숫자다.

![iOS](https://img.shields.io/badge/iOS-17%2B-000?logo=apple)
![Expo](https://img.shields.io/badge/Expo-SDK%2055-000?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)

<br />

<table>
  <tr>
    <td align="center"><img src="./statics/README/home.png" alt="홈 화면" width="240" /><br /><sub><b>오늘</b></sub></td>
    <td align="center"><img src="./statics/README/stats.png" alt="통계 화면" width="240" /><br /><sub><b>통계</b></sub></td>
    <td align="center"><img src="./statics/README/widget.png" alt="홈 스크린 위젯" width="240" /><br /><sub><b>홈 스크린 위젯</b></sub></td>
  </tr>
</table>

</div>

---

마찰을 최소화하기 위해 설계되었다. 앱을 열어 큰 버튼을 한 번 누르거나, 홈 스크린 위젯의 `+` 버튼을 한 번 누르면 끝이다. 위젯은 앱을 띄우지 않고 App Intents로 직접 카운트를 올린다.

## ✦ 특징

- **원-탭 기록** — 큰 버튼 하나. 실수했다면 토스트의 `되돌리기` 로 직전 기록을 취소한다.
- **홈 스크린 위젯** — iOS 17+ 인터랙티브 위젯. 앱을 열지 않고도 기록된다.
- **로컬 우선** — 모든 데이터는 기기 내 `AsyncStorage`에 저장. 계정도, 서버도 없다.
- **종이 질감의 미니멀 UI** — 페이퍼 배경 텍스처와 잉크 컬러 팔레트.
- **통계** — 일/주/월 단위 차트와 시간대별 미니 그래프.
- **목표 없음** — Smoke Tap은 사용자에게 목표를 설정하지 않는다.

## ✦ 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 런타임 | Expo SDK 55 · React Native 0.83 · React 19.2 |
| 언어 | TypeScript (strict) |
| 라우팅 | Expo Router (file-based, typed routes) |
| 스타일 | NativeWind v4 + StyleSheet |
| 상태 | Zustand v5 (`persist` + AsyncStorage) |
| 위젯 | `expo-widgets` + Swift App Intents (iOS 17+) |
| 네이티브 브리지 | Expo Modules (`SharedTapStore` App Group) |

## ✦ 시작하기

### 사전 준비

- macOS · Xcode 15 이상
- Node.js 20 이상 · npm
- iOS 시뮬레이터 또는 iOS 17+ 실기기

### 설치 & 실행

```bash
npm install
npm run prebuild:ios   # 최초 1회 또는 네이티브 코드 변경 후
npm run ios            # 시뮬레이터로 빌드 + 실행
```

> [!IMPORTANT]
> 처음 클론했거나 `app.json` / `plugins/` / `scripts/` 를 수정한 뒤에는 반드시 `npm run prebuild:ios` 를 먼저 실행한다. 일반 `expo prebuild` 만으로는 위젯 Swift가 빠지거나 stale 상태가 된다.

### 개발 서버만 띄우기

```bash
npm start              # Metro / Expo dev server
npx expo start --clear # Metro 캐시 초기화
```

## ✦ 명령어

| Command | Purpose |
|---|---|
| `npm run ios` | iOS 시뮬레이터에 빌드 + 실행 |
| `npm start` | Expo dev server 만 실행 |
| `npm run prebuild:ios` | `expo prebuild --clean` 후 3종 패치를 순서대로 적용 |
| `npm run patch-widget` | 위젯 Swift 만 재패치 |
| `npx tsc --noEmit` | 타입 체크 (테스트 러너는 설정되어 있지 않다) |

## ✦ 아키텍처

```
smoke-tap/
├── app/              Expo Router 화면 (탭: index · stats · settings)
├── components/       UI (common · home · settings · stats)
├── store/            Zustand 전역 상태 (useTapStore.ts)
├── modules/          네이티브 모듈 JS 래퍼 (SharedTapStore)
├── widgets/          위젯 JSX (참조용 — 실제 빌드는 ios/ 의 Swift)
├── plugins/          Expo config plugins
├── scripts/          prebuild 후 적용되는 패치 스크립트
├── constants/        디자인 토큰 (colors.ts)
├── i18n/             한국어 로케일
├── types/            공유 TypeScript 타입
└── ios/              생성된 Xcode 프로젝트 (커밋됨, 직접 편집 금지)
```

### 데이터 흐름

1. **앱에서 탭** — `useTapStore.addTap()` 이 `TapRecord` 를 push → AsyncStorage 에 영속화.
2. **위젯에서 탭** — Swift App Intent 가 App Group `group.com.example.smoketap` 의 공유 저장소에 pending count 를 증가.
3. **앱 포커스 시** — `SharedTapStore.getPendingCount()` 로 누적분을 가져와 records 에 머지 후 `clearPending()`.

### 위젯 빌드 체인 (중요)

`expo prebuild --clean` 후에는 **반드시 다음 순서로** 세 가지 패치가 적용되어야 한다 — `npm run prebuild:ios` 가 모두 처리한다.

1. `scripts/patch-widget.js` — 위젯 Swift 소스를 덮어쓴다.
2. `scripts/fix-build-phase-order.js` — patch Run Script 가 `[Expo] Configure project` **이후에** 실행되도록 Build Phase 순서를 조정.
3. `scripts/patch-expo-modules-provider.js` — `ExpoModulesProvider.swift` 를 재생성.

> [!WARNING]
> App Group ID `group.com.example.smoketap` 는 `app.json` · `plugins/withSharedTapStore.js` · `scripts/patch-widget.js` 세 곳에 하드코딩되어 있다. 바꿀 때는 세 곳을 동시에 수정해야 한다.

## ✦ 편집 규칙

- `ios/` 내부 파일은 직접 편집하지 않는다 — 재생성된다. `app.json`, `plugins/`, `scripts/` 를 수정한다.
- `ios/Pods/` 도 마찬가지로 `pod install` 시 재설치된다.
- 코드 스타일/가이드라인은 [`CLAUDE.md`](CLAUDE.md) 와 [`.claude/guidelines.md`](.claude/guidelines.md) 참조.

## ✦ 플랫폼

iOS 전용 (`platforms: ["ios"]`). Android/Web 빌드는 설정되어 있지 않다.
인터랙티브 홈 스크린 위젯은 **iOS 17 이상**이 필요하다 (App Intents).
