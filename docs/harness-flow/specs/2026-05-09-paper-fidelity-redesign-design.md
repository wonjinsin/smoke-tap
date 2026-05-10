# Paper UI Redesign — Fidelity Pass (2026-05-09)

이전 라운드(2026-05-07)에서 적용한 Minimal Paper 디자인을 시안 자료(`docs/ui-design/paper.jsx`, `screenshot.png`)와 정확히 일치시키기 위한 보정 스펙. 큰 구조는 유지하고, 시안과 어긋난 4가지 항목을 시각 충실도(visual fidelity) 기준으로 다시 맞춘다.

## 동기

이전 구현은 paper.jsx 토큰을 그대로 적용했지만, 시각적으로 시안과 다르게 보이는 원인이 4가지 발견됐다.

| # | 문제 | 원인 |
|---|------|------|
| A | 설정 화면이 시안 대비 거의 비어 있음 | 이전 라운드에서 "장식 금지" 룰을 들이대며 토글/값 행 6개+ 를 의도적으로 제거 |
| B | 시스템 배경(iOS `#F2F2F7`)이 화면 가장자리에 새어 보임 | `app/_layout.tsx`의 `<Stack>`이 `contentStyle.backgroundColor` 미지정 |
| C | 종이 그레인 질감이 시안 대비 약 1/3 강도 | 그레인 PNG가 8×8 타일 1px 점이라 paper.jsx의 4×4 / 5% 면적 대비 1.6%로 옅음 |
| D | 위젯이 SwiftUI에서 그림자·그레인 없이 단조로움 | 이전 라운드에서 그림자/그레인을 SwiftUI로 옮기지 않음 |

## 비목표 (out of scope)

- 토글의 실제 OS 동작(흔들어 되돌리기, 햅틱) 구현 — UI만 stub
- iCloud 동기화, CSV export, 앱 아이콘 변경, 모양(다크모드) 실제 구현 — 값 행만 표시
- 다국어 추가 (ko 단일 유지)
- 다크 모드 (단일 페이퍼 라이트)
- 색 토큰 추가/변경 — 기존 `C` 토큰 그대로 사용

## 토큰

`constants/colors.ts`의 `C` 토큰을 그대로 사용 — 변경 없음.

```ts
C.BG    = '#F5F2EC'
C.CARD  = '#FBF9F4'
C.INK   = '#1A1815'
C.INK_70 = rgba(26,24,21,0.62)
C.INK_40 = rgba(26,24,21,0.32)
C.INK_15 = rgba(26,24,21,0.12)
C.HAIR  = rgba(26,24,21,0.10)
```

추가로 그림자에서만 쓸 ink 8% (`rgba(26,24,21,0.07)`)는 `C` 토큰에 추가하지 않고 콜사이트에서 직접 표기 — 그레인 PNG 외엔 콜사이트가 1~2곳뿐이라 토큰화 가치 적음.

## 변경 항목

### 1. Stack 시스템 배경 누설 차단

**파일:** `app/_layout.tsx`

`<Stack>`에 `screenOptions={{ contentStyle: { backgroundColor: C.BG } }}` 추가. 이로써 화면 전환·SafeArea 가장자리에서 시스템 기본 배경이 새어 보이지 않는다.

```tsx
<Stack screenOptions={{ contentStyle: { backgroundColor: C.BG } }}>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
</Stack>
```

### 2. 그레인 PNG 4×4 재생성

**파일:** `assets/textures/paper-grain.png`

- 크기: **4×4 RGBA**
- 패턴: (1, 1) 위치 1픽셀에 `rgba(26, 24, 21, 0.07)` (ink @ 7% alpha), 나머지 15픽셀은 투명
- 재생성 스크립트(`scripts/gen-grain.js`) 추가 — 빌드 의존성 늘리지 않도록 Node 내장만으로 PNG 인코딩

`<PaperBackground>`의 `ImageBackground` `resizeMode="repeat"`는 그대로 유지. 4×4가 반복되며 paper.jsx의 `4px 4px` 그라데이션과 동일 밀도가 된다.

### 3. 홈 + 버튼 그림자

**파일:** `components/home/PlusButton.tsx`

paper.jsx 사양 그대로 그림자 두 겹:

```tsx
shadowColor: '#1A1815',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.18,
shadowRadius: 14,
elevation: 6, // Android — iOS 전용이지만 lint 호환
```

iOS는 단일 그림자만 지원하므로 paper.jsx의 두 번째 그림자(`0 1px 3px @ 0.10`)는 생략해도 시각 차이 미미. **단일 그림자로 통일**.

### 4. 설정 화면 — 3섹션 + 토글/값 행 시안 그대로 복원

**파일:** `app/(tabs)/settings.tsx`, `components/settings/Row.tsx`, `i18n/locales/ko.json`

#### 4.1 Row 컴포넌트 — 토글 모드 추가

`Row`에 `switched?: boolean`과 `onToggle?: () => void` props 추가. switched가 정의되면 36×20 토글, 아니면 기존 텍스트 값.

토글 디자인 (paper.jsx 사양):
- 트랙: 36×20 반원, `C.INK` (켜짐) / `C.INK_15` (꺼짐)
- 노브: 16×16 원, `C.BG`, 켜짐 시 left=18, 꺼짐 시 left=2
- 트랜지션: `left` 150ms (Animated.timing)
- 누르면 즉시 토글

#### 4.2 Settings 화면 구조

```
설정
─────────────────────────
기록
[흔들어 되돌리기]      [토글]
[햅틱 피드백]          [토글]
─────────────────────────
데이터
[iCloud 동기화]        꺼짐
[기록 시작일]          {firstRecordMonth ?? "—"}
[CSV로 내보내기]
─────────────────────────
앱
[버전]                 1.0.0
[앱 아이콘]            기본
[모양]                 자동
─────────────────────────

Smoke Tap은 목표를 설정하지 않습니다.
숫자는 그저 숫자입니다.
```

- **흔들어 되돌리기 / 햅틱 피드백**: `useState<boolean>` 두 개로 시각 토글만. AsyncStorage 영속화 없음(다음 작업 분리). 기본값 `true`.
- **iCloud 동기화**: 값 행, "꺼짐" 하드코딩.
- **기록 시작일**: `useTapStore`의 `records[0].timestamp`을 `Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' })`로 포맷. 기록이 없으면 "—".
- **CSV로 내보내기**: 값 영역 빈 칸. `Pressable`로 감싸되 `onPress={() => {}}` (no-op). 시각만 표현.
- **버전**: `Constants.expoConfig?.version` (기존).
- **앱 아이콘**: "기본" 하드코딩.
- **모양**: "자동" 하드코딩.

#### 4.3 i18n 키

```json
"settings": {
  "title": "설정",
  "section": {
    "records": "기록",
    "data": "데이터",
    "app": "앱"
  },
  "shakeUndo": "실수 방지 — 흔들어 되돌리기",
  "haptic": "햅틱 피드백",
  "iCloud": "iCloud 동기화",
  "iCloudOff": "꺼짐",
  "startDate": "기록 시작일",
  "noStartDate": "—",
  "exportCsv": "CSV로 내보내기",
  "appVersion": "버전",
  "appIcon": "앱 아이콘",
  "appIconDefault": "기본",
  "appearance": "모양",
  "appearanceAuto": "자동",
  "tagline": "Smoke Tap은 목표를 설정하지 않습니다\n숫자는 그저 숫자입니다"
}
```

기존 `appSection` 키 제거(`section.app`이 대체). 다른 화면에서 사용 안 함 확인 후 삭제.

### 5. 위젯 충실도 (SwiftUI)

**파일:** `scripts/patch-widget.js` (Swift `SMOKE_TAP_WIDGET` 문자열)

#### 5.1 카드 그림자

`SmokeTapWidgetView` 루트(현재 `.padding(12)` 다음에 `.widgetBackground(...)` 적용 직전)에 그림자 두 겹 추가. SwiftUI는 한 view에 `.shadow` 두 번 체이닝하면 누적된다:

```swift
.shadow(color: .black.opacity(0.08), radius: 3, x: 0, y: 1)
.shadow(color: .black.opacity(0.06), radius: 24, x: 0, y: 8)
```

단, `containerBackground`는 위젯 컨테이너 자체의 배경이므로 위젯 외곽에 그림자가 그려지지 않는다. iOS 17 위젯은 시스템이 그림자를 자동 부여하므로 **카드 그림자는 생략**해도 사용자 시점에선 동일하다. → **카드 그림자는 추가하지 않음**(시스템에 위임).

#### 5.2 + 버튼 그림자

`Button(intent: ...) { ... }`의 클립 후 `.shadow(color: Color(hex: "1A1815").opacity(0.20), radius: 8, x: 0, y: 2)` 추가.

#### 5.3 그레인 (SwiftUI Canvas)

ZStack의 가장 아래 레이어에 Canvas로 4×4 패턴을 직접 그린다. PNG 번들링은 ExpoWidgetsTarget에 새 Asset Catalog 작업이 필요해 비용이 큼. Canvas는 self-contained.

```swift
Canvas { ctx, size in
    let dot = Color(hex: "1A1815").opacity(0.07)
    var y = 1
    while y < Int(size.height) {
        var x = 1
        while x < Int(size.width) {
            ctx.fill(
                Path(CGRect(x: CGFloat(x), y: CGFloat(y), width: 1, height: 1)),
                with: .color(dot)
            )
            x += 4
        }
        y += 4
    }
}
.allowsHitTesting(false)
```

ZStack 구조:
```
ZStack(alignment: .topLeading) {
    Canvas { ... }                              // grain
    Text(count) ...                              // top-left number
    Button(intent: RecordTapIntent()) { ... }   // bottom-right
}
.padding(12)
.widgetBackground(Color(hex: "FBF9F4"))
```

#### 5.4 widgets/SmokeTapWidget.tsx (참고용)

JSX 참고용 파일은 그대로 둔다(이미 ink/card 색 동기화). 그레인은 JSX에서 표현 불가(expo-widgets primitive 제약), 주석으로 명시.

## 시안 일치 확인 체크리스트 (자가 검증)

구현 후 시뮬레이터에서 확인:

- [ ] 홈 배경 톤이 paper.jsx HTML 캔버스(시안 디자인 캔버스의 도화지 색이 아닌, paper.jsx 화면 자체의 `T.bg = #F5F2EC`)와 일치
- [ ] 그레인 점이 시안과 비슷한 밀도로 보임 (정면에서 약간 거친 종이 질감 인지)
- [ ] 화면 전환 시 흰색 잔상 없음
- [ ] 설정 화면이 스크린샷의 3섹션 / 7행 구조와 일치
- [ ] 두 토글이 탭 시 켜짐↔꺼짐 시각 전환 (앱 재시작 시 기본값 `true`로 복귀)
- [ ] 홈 + 버튼이 잉크 디스크 아래로 부드러운 그림자 보임
- [ ] 위젯에 잉크 + 버튼 그림자 + 종이 그레인이 미세하게 보임

## 파일 인벤토리

**Modify:**
- `app/_layout.tsx` — Stack screenOptions
- `assets/textures/paper-grain.png` — regenerate 4×4
- `components/home/PlusButton.tsx` — shadow
- `components/settings/Row.tsx` — toggle mode
- `app/(tabs)/settings.tsx` — full UI rewrite
- `i18n/locales/ko.json` — settings keys
- `scripts/patch-widget.js` — Swift Canvas grain + button shadow
- `widgets/SmokeTapWidget.tsx` — comment update

**Add:**
- `scripts/gen-grain.js` — one-shot grain PNG generator (committed but not part of build pipeline)

**Unchanged:**
- `constants/colors.ts`
- `components/common/PaperBackground.tsx`
- `components/home/CountDisplay.tsx`
- `components/home/HourlyMini.tsx`
- `components/home/UndoToast.tsx`
- `components/stats/BarChart.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/stats.tsx`
- `app/(tabs)/_layout.tsx`
- `components/settings/Section.tsx`
- `components/common/AppHeader.tsx`
- `store/useTapStore.ts`
- `CLAUDE.md` (디자인 시스템 부분 이미 페이퍼)

## 검증

- `npx tsc --noEmit` 통과 — 기존 baseline 에러(`widgets/SmokeTapWidget.tsx` `WidgetBase`, `EdgeInsets`) 외 추가 0건
- `npm run prebuild:ios && npm run ios` — 시뮬레이터 부팅 후 위 체크리스트 수동 확인

## 데코레이션 룰 갱신 (CLAUDE.md)

CLAUDE.md의 "장식 금지" 룰을 좁혀서 다음과 같이 명시한다 — 별도 PR로 분리 가능하지만 본 스펙에서 문서까지 함께 수정한다:

```diff
- - **장식 금지**: 기능하지 않는 UI 요소 추가하지 말 것.
+ - **장식 신중**: 시각적 충실도를 위해 시안에 명시된 UI 요소는 stub 동작이라도 표시할 수 있다. 단, 시안에 없는 요소를 임의 추가하지 말 것.
```
