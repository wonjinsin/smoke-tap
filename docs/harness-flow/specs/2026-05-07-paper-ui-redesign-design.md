# Paper UI Redesign — Design Spec

- **작성일**: 2026-05-07
- **워크트리**: `.claude/worktrees/paper-redesign` (브랜치 `worktree-paper-redesign`)
- **참고 자료**: `docs/ui-design/` (Smoke Tap.html, screens/paper.jsx)
- **상태**: 사용자 승인 받음(브레인스토밍 단계)

## 1. 목표

앱 전체의 시각 언어를 기존 다크 웜톤 + 앰버 액센트에서 **Minimal Paper(라이트 페이퍼 + 잉크)** 톤으로 교체한다. 단순 색 교체가 아니라 홈/통계/설정 레이아웃과 인터랙션도 시안(`docs/ui-design/screens/paper.jsx`)에 맞춰 재구성한다. 위젯도 같은 톤으로 통일한다.

## 2. 핵심 결정(브레인스토밍 결과)

| # | 결정 | 결과 |
|---|---|---|
| 1 | 다크/라이트 운영 | **라이트 페이퍼 단일** — 다크 모드 폐기 |
| 2 | 홈 레이아웃 | **시안 충실 재현** — 분리된 디스플레이/버튼, 펄스, 4초 토스트, 시간대별 미니 막대 |
| 3 | 위젯 톤 | **페이퍼 톤으로 변경** (Swift 문자열 패치) |
| 4 | 통계/설정 | **시안 충실 재현** (단, 비기능 UI는 추가하지 않음 — §6.4 참고) |
| 5 | 페이퍼 그레인 | **PNG 타일 + ImageBackground**(repeat) |

## 3. 디자인 토큰

### 3.1 `constants/colors.ts` 교체

```ts
export const C = {
  BG: '#F5F2EC',                       // paper off-white
  CARD: '#FBF9F4',                     // raised card
  INK: '#1A1815',                      // ink (text + accent)
  INK_70: 'rgba(26,24,21,0.62)',
  INK_40: 'rgba(26,24,21,0.32)',
  INK_15: 'rgba(26,24,21,0.12)',
  HAIR:   'rgba(26,24,21,0.10)',       // 1px hairline
} as const;
```

기존 키(`ACCENT`, `ACCENT_SOFT`, `ACCENT_DIM`, `TAB_BAR`, `CARD_SUBTLE`, `TEXT_PRIMARY`, `TEXT_SECONDARY`, `TEXT_MUTED`, `BORDER`)는 **삭제**하고 모든 사용처를 새 토큰으로 마이그레이션한다.

매핑 가이드:
- `TEXT_PRIMARY` → `INK`
- `TEXT_SECONDARY` → `INK_70`
- `TEXT_MUTED` → `INK_40`
- `BORDER` → `HAIR` 또는 `INK_15`
- `ACCENT`(앰버) → 디자인 의도상 **잉크 단색으로 대체**(`INK`). "한 화면 한 액센트" 룰은 유지.
- `TAB_BAR` → `BG`(같은 톤)
- `CARD_SUBTLE` → `CARD`

### 3.2 페이퍼 그레인 에셋

- 신규: `assets/textures/paper-grain.png`
- 사양: 4×4 또는 8×8 px 타일, 투명 배경에 점 1개를 `rgba(26,24,21,0.07)`로 그림. `@2x`/`@3x` 변형 없음(반복 타일이라 무관).
- 적용: 신규 컴포넌트 `components/common/PaperBackground.tsx`가 `<View style={{ backgroundColor: C.BG }}><ImageBackground source={paperGrain} resizeMode="repeat" />`로 감싼다. 모든 탭 화면(`index.tsx`, `stats.tsx`, `settings.tsx`)이 루트로 사용.

### 3.3 타이포

- 폰트는 시스템 기본(SF Pro). 명시적 fontFamily 지정 없이 RN 기본을 사용한다.
- 디스플레이 숫자는 `fontWeight: '200'`(시안: weight 200), 일반 본문은 `'400'~'500'`.
- `fontVariant: ['tabular-nums']`를 시간/카운트 표기에 사용.

## 4. 화면별 설계

### 4.1 홈 (`app/(tabs)/index.tsx`)

레이아웃(SafeAreaView 내부, 배경은 `<PaperBackground />`):

1. **상단 날짜 헤더** — 좌측 정렬, 패딩 `pt:20 px:24`
   - 윗줄: `formatDate()` 결과(`INK_40`, 13pt)
   - 아랫줄: `오늘`(22pt, weight 500, `INK`, letter-spacing -0.4)
2. **센터 영역** — `flex:1`, 수직/수평 중앙, `gap:28`
   - `<CountDisplay count={today} tick={tick} />` (220×220, 터치 비활성)
   - `<PlusButton onPress={handleTap} />` (72×72, 분리)
3. **마지막 기록 줄** — 가운데 정렬, `INK_70`, 13pt. 기존 i18n 메시지 재사용.
4. **시간대별 미니 막대 카드** — `<HourlyMini data={hourly} />`
5. **탭바**(공통 — §4.4)
6. **`<UndoToast />`** — 하단 absolute, 탭바 위 88px

#### `<CountDisplay>` 사양

- 220×220 원형, `CARD` 배경, 1px `INK_15` 보더
- 큰 숫자: 96pt, weight 200, letter-spacing -3, line-height 1, color `INK`
- 라벨: 12pt `INK_40`, "오늘", letter-spacing 0.4, marginTop 6
- **펄스 애니메이션**: `tick` prop이 변할 때마다 동심원 2개를 0.7s 동안 scale 1→1.45 + opacity 0.35→0. 두 번째는 120ms 지연. RN `Animated` 사용 — `Animated.View` 두 개에 각각 `Animated.Value` 두 쌍(scale, opacity), `Animated.parallel(...).start()`로 트리거. `useEffect(() => { ... }, [tick])`.

#### `<PlusButton>` 사양

- 72×72 원형, `INK` 배경, "+" 38pt weight 200 `BG`
- 그림자: iOS `shadowColor:'#000', shadowOffset:{0,4}, shadowOpacity:0.18, shadowRadius:14`
- press 시 scale 0.92(140ms ease-out) — `Pressable` + `Animated.spring` 또는 `Animated.timing`

#### `<HourlyMini>` 사양

- 카드: `CARD` 배경, 1px `HAIR` 보더(상단/하단), 패딩 `14/16/10/16`, marginHorizontal 24
- 헤더 줄: `시간대별`(11pt `INK_40` upper case lspc 0.6) ↔ `00 — 24`(11pt `INK_40` tabular-nums)
- 막대 영역: 높이 28, gap 2, flex 가로 채움
- 각 막대: 0이면 `INK_15` 1px, 0이 아니면 `INK`로 `(v/max)*100%` 높이
- `data: number[24]`(시간 0..23)는 `useTapStore`의 `getHourlyToday()` selector에서 받음

#### `<UndoToast>` 사양

- 하단 absolute, `bottom: 88`, 가로 중앙
- `INK` 배경, 13pt `BG` 텍스트 "+1 기록됨", 우측 "되돌리기" 버튼(1px `rgba(245,242,236,0.4)` 보더, 패딩 `4 10`, 12pt)
- 표시 진입 fade-in 240ms ease-out
- props: `visible`, `onUndo`, `onDismiss`. 컴포넌트 내부에서 `setTimeout(..., 4000)` 후 `onDismiss` 호출(타이머는 `useEffect` cleanup으로 안전하게 정리).

#### 인터랙션

- **탭**: `addTap()` → `setTick(t => t+1)` → `setShowUndo(true)`
- **되돌리기**: `removeLastTap()` → `setShowUndo(false)`
- **자동 닫기**: 토스트 표시 4초 후 자동 dismiss(또 다른 탭이 들어오면 타이머 리셋되어 새로 4초)

### 4.2 통계 (`app/(tabs)/stats.tsx`)

레이아웃(SafeAreaView + `<PaperBackground />`):

1. **헤더** — `관찰`(13pt `INK_40`) + `통계`(28pt weight 500, letter-spacing -0.6), 패딩 `pt:20 px:24 pb:24`
2. **세그먼트 바** — `일 / 주 / 월`
   - 컨테이너: 패딩 `px:24 pb:20`, hairline 하단 보더
   - 각 버튼: 13pt, 활성 `INK` + 1px `INK` 밑줄, 비활성 `INK_40`. `marginBottom: -1`(컨테이너 보더와 겹쳐 시각적 통합).
   - 상태: `useState<'day' | 'week' | 'month'>('week')`
3. **합계 헤더** — 캡션 `이번 {레인지} 합계`(11pt `INK_40` upper) + 큰 숫자(48pt weight 200, letter-spacing -1.5), 패딩 `pt:24 px:24 pb:20`
4. **막대그래프** — 높이 180, gap 8, 패딩 `px:24`
   - 마지막 막대만 `INK`, 나머지 `INK_40`(시안 그대로 — 색 경고 제거)
   - 막대 아래: 카운트(11pt `INK_40` tabular-nums) + 라벨(11pt `INK_70`)
5. **최근 기록 리스트** — 상위 4건, 패딩 `pt:24 px:24`
   - 헤더: `최근 기록`(11pt `INK_40` upper)
   - 행: 시간(tabular-nums) ↔ "얼마 전"(`INK_40`), hairline 구분선
6. **탭바**(공통)

#### 데이터 소스

- 일 레인지: 시간대별 24시간(`getHourlyToday()`)을 6시간 단위 4구간으로 집계? — **단순화: '일'은 시간대별 24개를 그대로 8개 구간(3시간)으로 보여주거나 24개 그대로 표시**. 시안 paper.jsx는 `range==='day'`도 week 데이터로 떨어뜨려 처리하므로, 본 구현은 **'일'을 `getDailyStats(7)` 중 오늘 한 점만 강조하는 식이 아니라, 시간대별 24개 막대로 바꿔 표시**(홈의 미니와 동일 데이터, 큰 사이즈). 라벨은 `00 06 12 18 24`만 표기.
- 주 레인지: `getDailyStats(7)`(이미 존재). 라벨은 요일.
- 월 레인지: `getMonthlyStats()` **신규 추가** — 최근 4주 합계 4점. 라벨 `1주차..4주차`(또는 주 시작 날짜).

#### `<BarChart />` 리디자인

- 위치: `components/stats/BarChart.tsx`(기존 파일 인플레이스 수정)
- 색 분기 제거: `getBarColor()` 같은 함수 삭제. 잉크 두 단계만(`INK` / `INK_40`).
- props: `data: { count: number; label: string }[]`, `highlightLast?: boolean`(기본 true)
- 막대 사이 gap, 막대 자체 height 비율은 시안과 동일.

### 4.3 설정 (`app/(tabs)/settings.tsx`)

CLAUDE.md "장식 금지" 원칙에 따라 **시안의 비기능 항목(흔들어 되돌리기/햅틱/iCloud/CSV/앱 아이콘/모양)은 추가하지 않는다**. 페이퍼 톤 리스타일링 + 시안 푸터 카피만 적용.

레이아웃(SafeAreaView + `<PaperBackground />`):

1. **헤더** — `설정`(28pt weight 500, letter-spacing -0.6), 패딩 `pt:20 px:24 pb:28`
2. **앱 섹션 카드** — 시안 카드 스타일
   - 캡션: `앱`(11pt `INK_40` upper, padding `px:24 pb:8`)
   - 카드: `CARD` 배경, 상하 1px `HAIR` 보더(시안은 좌우 보더 없음 — full-bleed 카드)
   - 행: `버전` ↔ `1.0.0` (15pt `INK` ↔ 14pt `INK_40`), 패딩 `py:14 px:24`
3. **푸터 카피** — 패딩 `pt:8 px:24 pb:24`, 11pt `INK_40`, line-height 1.6
   - 텍스트: `Smoke Tap은 목표를 설정하지 않습니다 / 숫자는 그저 숫자입니다`(2줄)
4. **탭바**(공통)

신규 컴포넌트:
- `components/settings/Section.tsx` — `title` + children 패턴
- `components/settings/Row.tsx` — `label` + (`value` 또는 `right` slot)

(시안의 토글 컴포넌트는 본 스코프에서 사용하지 않음. 추후 실제 기능 구현 시 추가.)

### 4.4 탭바 (`app/(tabs)/_layout.tsx`)

- 배경 `BG`(투명 아님 — 그레인 위에 떠 있음)
- 상단 1px `HAIR`
- 활성 탭: 라벨 위 1px `INK` 밑줄(`marginTop: -1`로 보더 정렬)
- 라벨: 12pt `INK`(활성) / `INK_40`(비활성), letter-spacing 0.4
- 한국어 라벨: `오늘 / 통계 / 설정`
- **아이콘 제거** — 시안에 없음. 텍스트만.
- 높이 60, paddingBottom 8

### 4.5 위젯

#### Swift 변경(`scripts/patch-widget.js`의 `SMOKE_TAP_WIDGET` 문자열)

색 토큰 hex 매핑(코드베이스 관례에 따라 hex 직접 작성):
- BG `#F5F2EC` → `Color(red: 0.961, green: 0.949, blue: 0.925)`
- CARD `#FBF9F4` → `Color(red: 0.984, green: 0.976, blue: 0.957)`
- INK `#1A1815` → `Color(red: 0.102, green: 0.094, blue: 0.082)`

레이아웃(`SmokeTapWidget.swift`):
- 카드 배경 `CARD`
- 좌상단 큰 숫자: 72pt SF Pro, `.thin` weight, letter-spacing -2.5(SwiftUI에서는 `tracking(-2.5)`), color `INK`
- 우하단 + 버튼: 44×44, `INK` 배경 원, "+" 26pt thin `BG`, `.shadow(...)` 그림자
- 그레인 생략(작은 영역, SwiftUI 구현 비용 대비 시각 차이 미미)

`RecordTapIntent.swift`, `SharedTapStore.swift`: **로직 변경 없음**. 색 토큰 매핑만 영향.

#### `widgets/SmokeTapWidget.tsx`(JSX 참고용) 동기화

- 같은 톤으로 업데이트(코드베이스 컨벤션상 참고용이지만 일관성 유지).
- 사전 타입 에러 2건(`WidgetBase`, EdgeInsets)은 본 작업과 무관 — 손대지 않음.

#### 적용 절차

1. `npm run patch-widget`로 Swift 패치만 재적용 가능
2. 또는 `npm run prebuild:ios`로 전체 prebuild 재실행
3. **자동 실행은 하지 않는다** — 사용자가 Xcode 빌드 시점을 결정

## 5. 상태/스토어 변경

### `store/useTapStore.ts`

- 신규 액션 `removeLastTap()` — `set(s => ({ records: s.records.slice(0, -1) }))`. App Group 동기화는 기존 `subscribe` 훅이 자동 처리.
- 신규 selector `getHourlyToday(): number[24]` — 오늘 records를 시간(0..23)별 카운트로 집계.
- 신규 selector `getMonthlyStats(): { label: string; count: number }[]` — 최근 4주 합계.
- 기존 selector `getTodayCount`, `getDailyStats(n)`, `getWeeklyStats()`는 유지.

## 6. i18n 변경 (`i18n/locales/ko.json`)

기존 구조(`tabs`, `main`, `stats`, `settings`) 유지하면서 키 단위로 추가/갱신/제거.

**제거**:
- `main.unit`("회") — 단위 표기 폐기
- `stats.weeklyTotal`, `stats.dailyAvg`, `stats.peakDay`, `stats.last7days` — 신규 통계 화면에서 사용 안 함

**갱신**:
- `tabs.main`: `"홈"` → **`"오늘"`**(시안 라벨)
- `main.lastTap`: `"마지막: {{time}}"` → **`"마지막 기록 {{time}}"`**(시안 어조)
- `settings.tagline`: `"SMOKE TAP — 흡연 기록 앱"` → **`"Smoke Tap은 목표를 설정하지 않습니다\n숫자는 그저 숫자입니다"`**

**추가**:
- `home.hourly`: `"시간대별"`
- `home.hourlyRange`: `"00 — 24"`
- `toast.added`: `"+1 기록됨"`
- `toast.undo`: `"되돌리기"`
- `stats.observe`: `"관찰"`
- `stats.day`: `"일"`, `stats.week`: `"주"`, `stats.month`: `"월"`
- `stats.totalThis`: `"이번 {{range}} 합계"`(`range`에는 "주"/"달"/"일" 한글이 들어감 — 호출부에서 day→일/week→주/month→달 매핑)
- `stats.recent`: `"최근 기록"`
- `settings.appSection`: `"앱"`

**유지**: `appName`, `tabs.stats`, `tabs.settings`, `main.today`, `main.noTapYet`, `stats.title`, `settings.title`, `settings.appVersion`

## 7. 신규/변경 파일 목록

**신규**:
- `components/common/PaperBackground.tsx`
- `components/home/CountDisplay.tsx`
- `components/home/PlusButton.tsx`
- `components/home/HourlyMini.tsx`
- `components/home/UndoToast.tsx`
- `components/settings/Section.tsx`
- `components/settings/Row.tsx`
- `assets/textures/paper-grain.png`

**변경**:
- `constants/colors.ts` — 토큰 교체
- `app/_layout.tsx` — 배경/StatusBar 스타일(라이트 톤)
- `app/(tabs)/_layout.tsx` — 탭바 페이퍼 리스타일
- `app/(tabs)/index.tsx` — 홈 레이아웃 전면 재구성
- `app/(tabs)/stats.tsx` — 통계 레이아웃 재구성
- `app/(tabs)/settings.tsx` — 페이퍼 톤 리스타일 + 푸터
- `components/common/AppHeader.tsx` — 페이퍼 톤
- `components/stats/BarChart.tsx` — 색 분기 제거, 잉크 두 단계
- `store/useTapStore.ts` — `removeLastTap`, `getHourlyToday`, `getMonthlyStats`
- `i18n/locales/ko.json`
- `scripts/patch-widget.js` — Swift 문자열 톤 교체
- `widgets/SmokeTapWidget.tsx` — JSX 참고 동기화
- `CLAUDE.md` — 디자인 시스템 섹션 업데이트(웜톤 다크 → 페이퍼 라이트)

**삭제 가능성**: 없음. 모두 인플레이스 변경.

## 8. 검증 계획

- `npx tsc --noEmit` 통과(사전 위젯 JSX 에러 2건은 기존 베이스라인이므로 새 에러 없는지만 확인)
- `npm run ios`로 시뮬레이터 빌드 후 다음을 수동 확인:
  - 홈: 페이퍼 배경 + 그레인, 원형 디스플레이, 분리된 + 버튼, 펄스 애니메이션, 4초 토스트, 되돌리기, 시간대별 미니 막대
  - 통계: 일/주/월 세그먼트 동작, 막대그래프 오늘 강조, 최근 기록 리스트
  - 설정: 페이퍼 톤 카드, 푸터 카피
  - 탭바: 텍스트만, 활성 밑줄
- 위젯: `npm run patch-widget` 후 Xcode 재빌드 — **자동 실행하지 않음**(사용자 결정)

## 9. 비스코프(명시적 제외)

- 다크 모드 지원
- 시안 설정 화면의 비기능 토글/iCloud/CSV/앱 아이콘 항목
- 통계 화면 '일' 레인지의 시안에 없는 신규 차트 디자인(시간대별 24개 그대로 활용)
- 햅틱 피드백 추가
- "흔들어 되돌리기" 제스처(토스트 되돌리기 버튼만 사용)
- 영어 등 추가 언어 i18n
- 위젯 그레인 텍스처(SwiftUI 비용 vs 효과)

## 10. 위험과 완화

- **사전 타입 에러 2건**(`widgets/SmokeTapWidget.tsx`): 새 에러 도입 시 가려질 수 있음 → tsc 결과에서 라인 수가 늘었는지 차분 확인.
- **위젯 색 동기화 누락**: 색 토큰이 `colors.ts`/`patch-widget.js`/`widgets/*.tsx` 세 곳에 흩어져 있음. 변경 시 세 곳 동시 갱신을 체크리스트로 강제.
- **App Group 흐름 회귀**: `removeLastTap` 추가 시 `subscribe` 훅이 정상으로 baseCount를 줄여주는지 시뮬레이터 확인. 위젯 → 앱 → 위젯 한 라운드 검증.
- **펄스 애니메이션 성능**: 동심원 2개 + 240ms 토스트가 동시에 떠도 60fps 유지 확인. `useNativeDriver: true` 사용.
- **그레인 PNG 누락**: 에셋 추가 절차를 plan에 명시. `app.json` 변경은 불필요(정적 require로 import).
