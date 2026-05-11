# Smoke Tap

흡연 한 번을 한 번의 가벼운 탭으로 기록하는 iOS 전용 앱.

판단 없이 자기 습관을 객관적으로 추적하고 싶은 사용자를 위해, **마찰 최소화**를 핵심 원칙으로 설계되었다. 홈 스크린 위젯에서도 한 번의 탭으로 바로 기록된다.

## Tech Stack

- Expo SDK 55 / React Native 0.83 / React 19.2
- TypeScript strict / Expo Router (file-based)
- NativeWind v4 + StyleSheet
- Zustand v5 (persist · AsyncStorage)
- expo-widgets + Swift App Intents (iOS 17+)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. iOS 시뮬레이터 실행

```bash
npm run ios
```

> 처음이거나 네이티브 코드 변경 후에는 prebuild 가 필요하다:
>
> ```bash
> npm run prebuild:ios
> ```
>
> 이 명령은 `expo prebuild --clean` 후 자동으로 widget patch · build phase 재정렬 · ExpoModulesProvider 패치를 순서대로 적용한다.

### 3. 개발 서버만 실행 (QR / Expo Go)

```bash
npm start
```

## 주요 명령어

| Command | Description |
|--------|------|
| `npm run ios` | iOS 시뮬레이터 빌드 + 실행 |
| `npm start` | Expo dev server 만 시작 |
| `npm run prebuild:ios` | prebuild + 3종 patch 자동 적용 |
| `npm run patch-widget` | widget Swift 파일만 재패치 |
| `npx tsc --noEmit` | 타입 체크 |
| `npx expo start --clear` | Metro 캐시 비우고 시작 |

## 디렉터리 구조 (요약)

```
smoke-tap/
├── app/              # Expo Router (탭 3개: index · stats · settings)
├── components/       # UI 컴포넌트 (common · home · settings · stats)
├── widgets/          # 위젯 JSX (참조용, 실제 빌드는 Swift)
├── store/            # Zustand 전역 상태
├── modules/          # 네이티브 모듈 JS 래퍼
├── ios/              # 생성된 Xcode 프로젝트 (커밋됨)
├── plugins/          # Expo 커스텀 config plugin
├── scripts/          # prebuild 후 patch 스크립트
├── constants/        # 디자인 토큰 (`constants/colors.ts`)
├── i18n/             # 국제화 (`i18n/locales/ko.json`)
└── types/            # TypeScript 공유 타입
```

## 더 읽을거리

- [`CLAUDE.md`](CLAUDE.md) — 에이전트/코드 작성용 컴파스

## 플랫폼 / 버전

iOS 전용 (`platforms: ["ios"]`). 인터랙티브 위젯은 iOS 17 이상 필요 (App Intents).
