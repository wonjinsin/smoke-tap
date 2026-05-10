# iOS Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 화면 위젯에서 + 버튼을 탭하면 앱을 열지 않고 흡연 횟수가 증가하고, 앱 실행 시 위젯과 앱 카운트가 자동으로 동기화된다.

**Architecture:**
`expo-widgets` + `@expo/ui/swift-ui`를 사용해 SwiftUI 기반 위젯을 JS/TS로 작성한다. 위젯 버튼 탭 시 `onPress`가 `Partial<Props>`를 반환해 위젯 로컬 state를 즉시 갱신(앱 미실행)한다. 동시에 `addUserInteractionListener`로 앱이 이벤트를 수신해 `addTap()`을 호출, AsyncStorage에 영구 저장한다. 앱 측에서 store 변경 시 `updateSnapshot()`으로 위젯에 정확한 카운트를 동기화한다.

**Tech Stack:** expo-widgets (alpha), @expo/ui/swift-ui, Zustand, expo-router, iOS only

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `widgets/SmokeTapWidget.tsx` | **CREATE** — 위젯 컴포넌트 (+ 버튼 포함) |
| `app.json` | **MODIFY** — expo-widgets 플러그인 추가 |
| `app/_layout.tsx` | **MODIFY** — 위젯 이벤트 리스너 + store→위젯 동기화 |
| `store/useTapStore.ts` | 변경 없음 |

---

## Task 1: 패키지 설치

**Files:**
- 변경 없음 (패키지 설치만)

- [ ] **Step 1: 패키지 설치**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/smoke-tap
npx expo install expo-widgets @expo/ui
```

예상 출력: `expo-widgets` and `@expo/ui` added to package.json

- [ ] **Step 2: 설치 확인**

```bash
cat package.json | grep -E "expo-widgets|@expo/ui"
```

예상 출력:
```
"@expo/ui": "...",
"expo-widgets": "...",
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install expo-widgets and @expo/ui for iOS widget"
```

---

## Task 2: app.json 플러그인 설정

**Files:**
- Modify: `app.json`

- [ ] **Step 1: app.json에 expo-widgets 플러그인 추가**

`app.json`의 `"plugins"` 배열을 다음과 같이 수정:

```json
{
  "expo": {
    "name": "Smoke Tap",
    "slug": "smoke-tap",
    "scheme": "smoke-tap",
    "version": "1.0.0",
    "userInterfaceStyle": "automatic",
    "platforms": ["ios"],
    "plugins": [
      "expo-router",
      [
        "expo-widgets",
        {
          "widgets": [
            {
              "name": "SmokeTapWidget",
              "displayName": "Smoke Tap",
              "description": "오늘 흡연 횟수를 기록하세요",
              "supportedFamilies": ["systemSmall"]
            }
          ]
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.example.smoketap"
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app.json
git commit -m "feat: add expo-widgets plugin to app.json"
```

---

## Task 3: 위젯 컴포넌트 작성

**Files:**
- Create: `widgets/SmokeTapWidget.tsx`

- [ ] **Step 1: widgets 디렉토리 생성 후 컴포넌트 작성**

`widgets/SmokeTapWidget.tsx` 파일 생성:

```tsx
import { Text, VStack, Button } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  buttonStyle,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

type SmokeTapProps = {
  count: number;
};

const SmokeTapWidget = (p: WidgetBase<SmokeTapProps>) => {
  'widget';

  return (
    <VStack spacing={6} modifiers={[padding(12)]}>
      <Text
        modifiers={[
          font({ size: 11, weight: 'semibold' }),
          foregroundStyle('#5c5854'),
        ]}
      >
        오늘
      </Text>
      <Text
        modifiers={[
          font({ size: 48, weight: 'bold' }),
          foregroundStyle('#f0ece6'),
        ]}
      >
        {p.count}
      </Text>
      <Text
        modifiers={[
          font({ size: 12 }),
          foregroundStyle('#8c8580'),
        ]}
      >
        회
      </Text>
      <Button
        label="+"
        target="add-tap"
        modifiers={[
          buttonStyle('borderedProminent'),
          foregroundStyle('#0c0b0a'),
        ]}
        onPress={() => ({ count: p.count + 1 })}
      />
    </VStack>
  );
};

export default createWidget('SmokeTapWidget', SmokeTapWidget);
```

> **Note:** `onPress`가 `{ count: p.count + 1 }`을 반환하면 앱을 열지 않고 위젯의 로컬 state만 즉시 갱신됩니다. 영구 저장은 Task 4에서 앱 측 리스너가 담당합니다.

- [ ] **Step 2: Commit**

```bash
git add widgets/SmokeTapWidget.tsx
git commit -m "feat: add SmokeTapWidget component with interactive + button"
```

---

## Task 4: 앱 레이아웃에 위젯 동기화 연결

**Files:**
- Modify: `app/_layout.tsx`

두 가지 역할:
1. **앱 → 위젯**: store records가 바뀔 때마다 `updateSnapshot`으로 위젯에 최신 카운트 전달
2. **위젯 → 앱**: `addUserInteractionListener`로 위젯 버튼 탭 이벤트 수신 → `addTap()` 호출

- [ ] **Step 1: `app/_layout.tsx` 수정**

```tsx
import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { addUserInteractionListener } from 'expo-widgets';
import SmokeTapWidget from '../widgets/SmokeTapWidget';
import { useTapStore } from '../store/useTapStore';

function toLocalDateString(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function useWidgetSync() {
  const addTap = useTapStore((s) => s.addTap);

  useEffect(() => {
    // Widget → App: 위젯 버튼 탭 이벤트 수신 → AsyncStorage에 기록
    const subscription = addUserInteractionListener((event) => {
      if (event.target === 'add-tap') {
        addTap();
      }
    });

    return () => subscription.remove();
  }, [addTap]);

  useEffect(() => {
    // App → Widget: store 변경 시 위젯에 정확한 카운트 동기화
    const unsubscribe = useTapStore.subscribe((state) => {
      const today = toLocalDateString(Date.now());
      const todayCount = state.records.filter(
        (r) => toLocalDateString(r.timestamp) === today
      ).length;
      SmokeTapWidget.updateSnapshot({ count: todayCount });
    });

    // 앱 시작 시 초기값 주입
    const today = toLocalDateString(Date.now());
    const initialCount = useTapStore
      .getState()
      .records.filter((r) => toLocalDateString(r.timestamp) === today).length;
    SmokeTapWidget.updateSnapshot({ count: initialCount });

    return unsubscribe;
  }, []);
}

export default function RootLayout() {
  useWidgetSync();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: sync widget count with app store via updateSnapshot and addUserInteractionListener"
```

---

## Task 5: prebuild 및 빌드

**Files:**
- Create: `ios/` (자동 생성)

- [ ] **Step 1: prebuild 실행**

```bash
npx expo prebuild --platform ios --clean
```

예상 결과: `ios/` 폴더 생성. 오류 없이 완료.

> **Note:** 이 명령은 `ios/` 폴더를 새로 생성합니다. 이미 있는 경우 `--clean` 플래그가 초기화합니다.

- [ ] **Step 2: iOS 빌드 및 실행**

```bash
npx expo run:ios
```

또는 Xcode에서 `ios/smokeTap.xcworkspace`를 열어 실기기/시뮬레이터로 빌드.

> **Note:** Expo Go가 아닌 **Development Build**이므로 시뮬레이터에서 위젯을 홈 화면에 추가해 테스트합니다.
> 시뮬레이터에서 위젯 추가: 홈 화면 길게 누르기 → + 버튼 → "Smoke Tap" 검색

- [ ] **Step 3: 위젯 동작 확인**

1. 시뮬레이터 홈 화면에 SmokeTapWidget 추가
2. 앱을 열고 카운트 증가 → 위젯 숫자가 업데이트되는지 확인
3. 앱을 닫고 위젯의 + 버튼 탭 → 위젯 숫자가 즉시 증가하는지 확인
4. 앱 재실행 → 앱 내 카운트와 위젯 카운트가 일치하는지 확인

---

## 알려진 제약사항

| 항목 | 내용 |
|------|------|
| **앱 종료 시 위젯 탭** | `addUserInteractionListener`는 앱이 실행 중일 때만 동작. 앱이 완전히 종료된 상태에서 위젯 탭 → 위젯 로컬 count만 증가하고 AsyncStorage에는 미저장. 앱 재실행 시 `updateSnapshot`으로 위젯이 앱 카운트로 리셋됨. |
| **iOS 버전** | 인터랙티브 위젯(Button)은 iOS 17+ 필요 |
| **Alpha 상태** | `expo-widgets` API 변경 가능성 있음 |
