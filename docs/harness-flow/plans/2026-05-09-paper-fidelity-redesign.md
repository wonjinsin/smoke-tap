# Paper Fidelity Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use harness-flow:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시안(`docs/ui-design/paper.jsx`, `screenshot.png`)과 현재 구현 사이의 4가지 시각 차이(설정 화면 빈 상태 / Stack 배경 누설 / 그레인 약함 / 위젯 그림자·그레인 누락)를 보정해 시안 충실도 복원.

**Architecture:** 토큰(`C`)은 그대로 두고 콜사이트만 보정. 설정 화면은 `Section`/`Row` 두 컴포넌트 위에 stub-state로 시안 그대로 6행 복원. 위젯은 SwiftUI Canvas로 그레인을 self-contained하게 렌더(에셋 번들 작업 회피). 테스트는 RN UI 테스트 인프라가 없으므로 `npx tsc --noEmit` baseline 유지 + 시뮬레이터 시각 확인.

**Tech Stack:** Expo SDK 55, React Native 0.83, Zustand v5, Expo Router, SwiftUI(WidgetKit, App Intents), Node 내장 PNG 인코딩.

**작업 디렉토리:** `/Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap`. 모든 명령은 이 디렉토리에서 실행. git은 worktree 루트(`/Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign`) 기준.

**Baseline tsc 에러 (무시):** `widgets/SmokeTapWidget.tsx`에 `WidgetBase` export 누락, `EdgeInsets` 타입 불일치 2건. 본 작업과 무관한 사전 존재 에러로 변경 금지.

---

### Task 1: Stack contentStyle 배경 누설 차단

**Files:**
- Modify: `app/_layout.tsx:62`

iOS 17 시스템 기본 배경(`#F2F2F7`)이 Stack content에 깔려 있어 화면 가장자리/전환 시 새어 보임. `screenOptions.contentStyle.backgroundColor`로 페이퍼 BG 강제.

- [ ] **Step 1: 콜러 import 확인 (이미 있는지)**

```bash
grep -n "constants/colors" app/_layout.tsx
```
Expected: 출력 없음 (현재 파일은 `C` import 안 함). 다음 step에서 추가.

- [ ] **Step 2: 코드 수정**

`app/_layout.tsx` 1번 줄 import 블록과 56~67번 줄 `RootLayout` 함수만 수정:

```tsx
import '../global.css';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTapStore } from '../store/useTapStore';
import { getPendingCount, clearPending, setBaseCount } from '../modules/SharedTapStore';
import { C } from '../constants/colors';
```

```tsx
export default function RootLayout() {
  useWidgetSync();

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: C.BG } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
```

- [ ] **Step 3: 타입 검사**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && npx tsc --noEmit
```
Expected: baseline 에러 2건만 (둘 다 `widgets/SmokeTapWidget.tsx`).

- [ ] **Step 4: Commit**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign add smoke-tap/app/_layout.tsx
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign commit -m "fix: stop iOS system background bleeding through Stack content"
```

---

### Task 2: 그레인 PNG 4×4로 재생성

**Files:**
- Create: `scripts/gen-grain.js`
- Modify (overwrite): `assets/textures/paper-grain.png`

paper.jsx 사양: `radial-gradient(rgba(26,24,21,0.07) 0.5px, transparent 0.5px) / 4px 4px`. RN에선 PNG 타일로 흉내 — 4×4 RGBA에 (1,1) 픽셀 1개를 ink @ 7% 알파로.

- [ ] **Step 1: 그레인 생성 스크립트 작성**

`scripts/gen-grain.js` 생성. Node 내장만으로 PNG 인코딩 (zlib + crc32):

```js
#!/usr/bin/env node
/**
 * Generate assets/textures/paper-grain.png — 4×4 RGBA tile with one ink dot at (1,1) at 7% alpha.
 * Mirrors the paper.jsx grain spec: radial-gradient(rgba(26,24,21,0.07) 0.5px, transparent 0.5px) / 4px 4px.
 *
 * Run once: node scripts/gen-grain.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 4, H = 4;
const INK_R = 26, INK_G = 24, INK_B = 21;
const ALPHA = Math.round(0.07 * 255); // 18

// Build raw RGBA scanlines with PNG filter byte (0 = None) per row
const rows = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 4);
  row[0] = 0; // filter: None
  for (let x = 0; x < W; x++) {
    const i = 1 + x * 4;
    if (x === 1 && y === 1) {
      row[i] = INK_R; row[i + 1] = INK_G; row[i + 2] = INK_B; row[i + 3] = ALPHA;
    } else {
      row[i] = 0; row[i + 1] = 0; row[i + 2] = 0; row[i + 3] = 0;
    }
  }
  rows.push(row);
}
const raw = Buffer.concat(rows);
const idatData = zlib.deflateSync(raw);

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type: RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))]);

const out = path.join(__dirname, '..', 'assets', 'textures', 'paper-grain.png');
fs.writeFileSync(out, png);
console.log(`✓ wrote ${path.relative(path.join(__dirname, '..'), out)} (${W}×${H}, ${png.length} bytes)`);
```

- [ ] **Step 2: 스크립트 실행해 PNG 갱신**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && node scripts/gen-grain.js
```
Expected: `✓ wrote assets/textures/paper-grain.png (4×4, ~76 bytes)`.

- [ ] **Step 3: 결과 검증**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && file assets/textures/paper-grain.png
```
Expected: `PNG image data, 4 x 4, 8-bit/color RGBA, non-interlaced`.

- [ ] **Step 4: Commit**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign add smoke-tap/scripts/gen-grain.js smoke-tap/assets/textures/paper-grain.png
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign commit -m "feat: regenerate paper grain at 4x4 density to match paper.jsx spec"
```

---

### Task 3: 홈 + 버튼 그림자

**Files:**
- Modify: `components/home/PlusButton.tsx`

paper.jsx의 `boxShadow: 0 4px 14px rgba(26,24,21,0.18)` 적용. iOS는 단일 그림자만.

- [ ] **Step 1: 현재 파일 읽기**

```bash
cat /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/components/home/PlusButton.tsx
```
Expected: 현재 button styles에 shadow* 키 없음 확인.

- [ ] **Step 2: button 스타일에 shadow 추가**

`styles.button` 또는 동등 객체에 다음 키 추가 (기존 키 유지, 위치는 객체 안 어디든 OK):

```ts
shadowColor: '#1A1815',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.18,
shadowRadius: 14,
elevation: 6,
```

- [ ] **Step 3: 타입 검사**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && npx tsc --noEmit
```
Expected: baseline 2건만.

- [ ] **Step 4: Commit**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign add smoke-tap/components/home/PlusButton.tsx
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign commit -m "feat: add ink shadow to home plus button per paper.jsx"
```

---

### Task 4: Row 컴포넌트 — 토글 모드 추가

**Files:**
- Modify: `components/settings/Row.tsx`

기존 props(`label`, `value?`, `last?`)를 깨지 않으면서 `switched?: boolean`, `onToggle?: () => void`, `noBorder?: boolean` 추가. switched가 정의된 경우만 토글 렌더, 그 외엔 기존 텍스트 값.

- [ ] **Step 1: 현재 파일 읽기**

```bash
cat /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/components/settings/Row.tsx
```
Expected: `label`/`value`/`last` props 사용 중.

- [ ] **Step 2: Row.tsx 전체 재작성**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';

type Props = {
  label: string;
  value?: string;
  switched?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  last?: boolean;
};

export default function Row({ label, value, switched, onToggle, onPress, last }: Props) {
  const inner = (
    <View style={[styles.row, !last && styles.border]}>
      <Text style={styles.label} allowFontScaling={false} numberOfLines={1}>
        {label}
      </Text>
      {switched !== undefined ? (
        <Toggle on={switched} onPress={onToggle ?? (() => {})} />
      ) : value !== undefined ? (
        <Text style={styles.value} allowFontScaling={false}>
          {value}
        </Text>
      ) : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.track, { backgroundColor: on ? C.INK : C.INK_15 }]}
    >
      <View style={[styles.knob, { left: on ? 18 : 2 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: C.HAIR,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: C.INK,
  },
  value: {
    fontSize: 14,
    color: C.INK_40,
    marginLeft: 16,
  },
  track: {
    width: 36,
    height: 20,
    borderRadius: 10,
    position: 'relative',
  },
  knob: {
    position: 'absolute',
    top: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.BG,
  },
});
```

- [ ] **Step 3: 타입 검사**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && npx tsc --noEmit
```
Expected: baseline 2건만. settings.tsx에서 Row를 호출하는 기존 시그니처(`label`, `value`, `last`)는 그대로 호환.

- [ ] **Step 4: Commit**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign add smoke-tap/components/settings/Row.tsx
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign commit -m "feat: add toggle mode to settings Row component"
```

---

### Task 5: 설정 i18n 키 갱신

**Files:**
- Modify: `i18n/locales/ko.json`

기존 `appSection`/`appVersion`/`tagline` 외 11개 키 추가. 키 구조는 평면(flat) 또는 중첩 가능. 이 프로젝트 i18n는 점 표기 lookup이라 어느 쪽이든 동작 — paper-redesign 1차 라운드와 동일하게 평면 우선.

- [ ] **Step 1: 현재 파일 읽기**

```bash
cat /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/i18n/locales/ko.json
```

- [ ] **Step 2: 파일 전체 재작성**

```json
{
  "appName": "SMOKE TAP",
  "tabs": {
    "main": "오늘",
    "stats": "통계",
    "settings": "설정"
  },
  "main": {
    "today": "오늘",
    "lastTap": "마지막 기록 {{time}}",
    "noTapYet": "아직 기록 없음"
  },
  "home": {
    "hourly": "시간대별",
    "hourlyRange": "00 — 24"
  },
  "toast": {
    "added": "+1 기록됨",
    "undo": "되돌리기"
  },
  "stats": {
    "title": "통계",
    "observe": "관찰",
    "day": "일",
    "week": "주",
    "month": "월",
    "totalThis": "이번 {{range}} 합계",
    "recent": "최근 기록"
  },
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
}
```

- [ ] **Step 3: 사용처 정합성 확인**

```bash
grep -rn "settings\.appSection\|settings\.section\.app\|settings\.tagline" /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/app /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/components
```
Expected: settings.tsx에서 `settings.appSection`/`settings.tagline` 참조하지만 다음 task에서 settings.tsx 전체 재작성하므로 무시.

- [ ] **Step 4: Commit**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign add smoke-tap/i18n/locales/ko.json
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign commit -m "feat: add settings i18n keys for full paper.jsx fidelity"
```

---

### Task 6: 설정 화면 — 3섹션 / 7행 시안 충실 복원

**Files:**
- Modify: `app/(tabs)/settings.tsx`

paper.jsx의 PaperSettings 구조 그대로. 토글 2개는 `useState` stub, 나머지 값 행은 하드코딩 또는 store 파생.

- [ ] **Step 1: 파일 전체 재작성**

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTapStore } from '../../store/useTapStore';
import { t } from '../../i18n';
import { C } from '../../constants/colors';
import PaperBackground from '../../components/common/PaperBackground';
import Section from '../../components/settings/Section';
import Row from '../../components/settings/Row';

function formatStartDate(records: { timestamp: number }[]): string {
  if (records.length === 0) return t('settings.noStartDate');
  const first = records[0].timestamp;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(first));
}

export default function SettingsScreen() {
  const records = useTapStore((s) => s.records);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const [shakeUndo, setShakeUndo] = useState(true);
  const [haptic, setHaptic] = useState(true);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title} allowFontScaling={false}>
              {t('settings.title')}
            </Text>
          </View>

          <Section title={t('settings.section.records')}>
            <Row
              label={t('settings.shakeUndo')}
              switched={shakeUndo}
              onToggle={() => setShakeUndo((v) => !v)}
            />
            <Row
              label={t('settings.haptic')}
              switched={haptic}
              onToggle={() => setHaptic((v) => !v)}
              last
            />
          </Section>

          <Section title={t('settings.section.data')}>
            <Row label={t('settings.iCloud')} value={t('settings.iCloudOff')} />
            <Row label={t('settings.startDate')} value={formatStartDate(records)} />
            <Row label={t('settings.exportCsv')} onPress={() => {}} last />
          </Section>

          <Section title={t('settings.section.app')}>
            <Row label={t('settings.appVersion')} value={version} />
            <Row label={t('settings.appIcon')} value={t('settings.appIconDefault')} />
            <Row label={t('settings.appearance')} value={t('settings.appearanceAuto')} last />
          </Section>

          <View style={styles.footer}>
            <Text style={styles.tagline} allowFontScaling={false}>
              {t('settings.tagline')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 24 },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: C.INK,
    letterSpacing: -0.6,
  },
  footer: {
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tagline: {
    fontSize: 11,
    color: C.INK_40,
    lineHeight: 18,
  },
});
```

- [ ] **Step 2: 타입 검사**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && npx tsc --noEmit
```
Expected: baseline 2건만.

- [ ] **Step 3: 다른 곳에서 제거된 i18n 키 사용 안 함 확인**

```bash
grep -rn "settings\.appSection" /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/app /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/components
```
Expected: 출력 없음.

- [ ] **Step 4: Commit**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign add smoke-tap/app/\(tabs\)/settings.tsx
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign commit -m "feat: restore full paper.jsx settings with 3 sections and 7 rows"
```

---

### Task 7: 위젯 SwiftUI — + 버튼 그림자 + 그레인 Canvas

**Files:**
- Modify: `scripts/patch-widget.js` (Swift `SMOKE_TAP_WIDGET` 문자열)

`SmokeTapWidgetView` 본문을 다시 작성. ZStack 가장 아래 레이어에 Canvas로 4×4 그레인 그리기, + 버튼에 `.shadow` 추가.

- [ ] **Step 1: 현재 SMOKE_TAP_WIDGET 블록 위치 확인**

```bash
grep -n "SMOKE_TAP_WIDGET\|SmokeTapWidgetView\|widgetBackground" /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/scripts/patch-widget.js
```
Expected: `SMOKE_TAP_WIDGET` 60번 줄대 시작, `SmokeTapWidgetView` 101~131 부근.

- [ ] **Step 2: SmokeTapWidgetView 본문 교체**

`scripts/patch-widget.js`의 `SmokeTapWidgetView` 구조체(현재 `struct SmokeTapWidgetView: View { ... }` 블록 전체)를 다음으로 교체:

```swift
struct SmokeTapWidgetView: View {
    let entry: SmokeTapEntry
    var body: some View {
        ZStack(alignment: .topLeading) {
            // Paper grain — 4×4 dot pattern, ink @ 7% alpha
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

            // Big number, top-left
            Text("\\(entry.count)")
                .font(.system(size: 72, weight: .thin))
                .tracking(-2.5)
                .foregroundColor(Color(hex: "1A1815"))
                .padding(.leading, 4)
                .padding(.top, 2)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

            // Plus button, bottom-right
            if #available(iOS 17.0, *) {
                Button(intent: RecordTapIntent()) {
                    Text("+")
                        .font(.system(size: 26, weight: .thin))
                        .foregroundColor(Color(hex: "FBF9F4"))
                        .frame(width: 44, height: 44)
                        .background(Color(hex: "1A1815"))
                        .clipShape(Circle())
                        .shadow(color: Color(hex: "1A1815").opacity(0.20), radius: 8, x: 0, y: 2)
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
            }
        }
        .padding(12)
        .widgetBackground(Color(hex: "FBF9F4"))
    }
}
```

- [ ] **Step 3: 타입 검사 (JS측)**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && node -e "require('./scripts/patch-widget.js')" 2>&1 | head -5
```
Expected: 첫 줄이 "✓ wrote ios/ExpoWidgetsTarget/SharedTapStore.swift" 같은 출력 (또는 ios 디렉토리 미생성 시 다른 에러). 어떤 경우든 JS 파싱 자체는 에러 없이 통과해야 함. JS 문법 에러가 있으면 즉시 fail.

> 주의: ios 디렉토리가 없으면 mkdir 후 swift만 작성하다 pbxproj 단계에서 fail함. 그건 정상 동작 — 본 task는 Swift 문자열 정합성만 검증.

- [ ] **Step 4: Commit**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign add smoke-tap/scripts/patch-widget.js
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign commit -m "feat: add paper grain canvas and plus button shadow to widget"
```

---

### Task 8: CLAUDE.md 디자인 룰 갱신

**Files:**
- Modify: `CLAUDE.md` (디자인 시스템 섹션 99번 줄대)

"장식 금지" 룰을 좁혀 시안에 명시된 stub UI를 허용하도록 명시.

- [ ] **Step 1: 현재 디자인 룰 위치 확인**

```bash
grep -n "장식 금지\|장식 신중" /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap/CLAUDE.md
```
Expected: 99번 줄에 `- **장식 금지**: 기능하지 않는 UI 요소 추가하지 말 것.`

- [ ] **Step 2: 룰 교체**

```bash
# Edit 도구 사용 — 다음 정확한 치환:
# old: - **장식 금지**: 기능하지 않는 UI 요소 추가하지 말 것.
# new: - **장식 신중**: 시각적 충실도를 위해 시안에 명시된 UI 요소는 stub 동작이라도 표시할 수 있다. 단, 시안에 없는 요소를 임의 추가하지 말 것.
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign add smoke-tap/CLAUDE.md
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign commit -m "docs: refine decoration rule to allow spec-defined stub UI"
```

---

### Task 9: 최종 검증

**Files:** (read-only)

타입 검사 + lint + 사용자 시뮬레이터 확인 안내.

- [ ] **Step 1: 최종 tsc**

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && npx tsc --noEmit
```
Expected: baseline 2건만 (`widgets/SmokeTapWidget.tsx` `WidgetBase` + `EdgeInsets`). 그 외 0건.

- [ ] **Step 2: git 상태 정리 확인**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign status
```
Expected: `nothing to commit, working tree clean`.

- [ ] **Step 3: 커밋 로그 요약**

```bash
git -C /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign log --oneline -10
```
Expected: 최근 8개 커밋이 본 plan의 task 1~8에 대응.

- [ ] **Step 4: 시뮬레이터 안내**

사용자에게 시각 확인용 명령 제시:

```bash
cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap && npm run prebuild:ios && npm run ios
```

확인 항목:
- 홈 배경에 시스템 흰색 잔상이 없고 전체가 따뜻한 페이퍼 톤
- 종이 그레인 점이 시안과 비슷한 밀도
- 설정 화면이 3섹션 / 7행으로 시안과 일치
- 두 토글이 탭 시 ink ↔ ink_15 시각 전환
- 홈 + 버튼 아래 부드러운 그림자
- 위젯에 + 버튼 그림자 + 그레인 미세하게 보임

---

## 자가 검토 (이미 수행)

**Spec coverage:** 스펙 4개 변경 항목(설정/Stack/그레인/위젯) 모두 task에 매핑 — Stack→Task 1, 그레인→Task 2, + 버튼 그림자→Task 3, Row 토글→Task 4, i18n→Task 5, 설정 본문→Task 6, 위젯→Task 7, 룰 문서→Task 8, 검증→Task 9.

**Placeholder scan:** "TBD"/"TODO"/"add appropriate" 검색 결과 0건. 모든 step에 실제 코드 또는 명령어 포함.

**Type consistency:** Row props는 Task 4에서 정의(`label`, `value?`, `switched?`, `onToggle?`, `onPress?`, `last?`)되고 Task 6에서 동일 시그니처로 호출. i18n 키는 Task 5에서 정의되고 Task 6에서 동일 점 표기로 호출. `formatStartDate(records: { timestamp: number }[])`의 records 형태는 store의 `TapRecord`와 호환. 정합성 확인.
