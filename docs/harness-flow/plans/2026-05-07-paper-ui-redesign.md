# Paper UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use harness-flow:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark warm + amber design system with the Minimal Paper light + ink system across home/stats/settings screens, the iOS widget, and shared design tokens, per the brainstormed spec.

**Architecture:** Token swap with temporary backwards-compatible aliases on `C` (so all screens keep compiling), then per-screen rebuild to the spec, then remove aliases. UI components are extracted into `components/home/*` and `components/settings/*`. Stats/widget retoned in place. Verification: `npx tsc --noEmit` after each task; simulator smoke check at the end.

**Tech Stack:** Expo SDK 55, React Native 0.83, React 19.2, TypeScript strict, Expo Router, Zustand, expo-widgets + Swift App Intents (iOS 17+).

**Working directory:** `/Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap`. All paths below are relative to this dir unless noted.

**Spec:** `docs/harness-flow/specs/2026-05-07-paper-ui-redesign-design.md`

**Test infrastructure:** None in repo (existing selectors like `getDailyStats` are not unit-tested). Verification gate per task = `npx tsc --noEmit` (no new errors over baseline of 2 pre-existing widget JSX errors). End-of-plan gate = simulator smoke check; widget verification deferred to user's `npm run prebuild:ios` + Xcode rebuild.

---

## File Structure

**New files:**

- `components/common/PaperBackground.tsx` — wraps screens with `BG` + repeating grain
- `components/home/CountDisplay.tsx` — circular display, pulse animation
- `components/home/PlusButton.tsx` — separated tap button
- `components/home/HourlyMini.tsx` — 24-bar mini chart card
- `components/home/UndoToast.tsx` — 4-second undo toast
- `components/settings/Section.tsx` — section caption + bordered card group
- `components/settings/Row.tsx` — `label` ↔ `value` row
- `assets/textures/paper-grain.png` — 8×8 transparent tile w/ one ink dot
- `docs/harness-flow/plans/2026-05-07-paper-ui-redesign.md` — this file

**Modified files:**

- `constants/colors.ts` (Task 1, Task 11)
- `i18n/locales/ko.json` (Task 3)
- `store/useTapStore.ts` (Task 2)
- `app/(tabs)/index.tsx` (Task 5)
- `app/(tabs)/stats.tsx` (Task 7)
- `app/(tabs)/settings.tsx` (Task 8)
- `app/(tabs)/_layout.tsx` (Task 9)
- `app/_layout.tsx` (Task 9)
- `components/common/AppHeader.tsx` (Task 9)
- `components/stats/BarChart.tsx` (Task 6)
- `scripts/patch-widget.js` (Task 10)
- `widgets/SmokeTapWidget.tsx` (Task 10)
- `CLAUDE.md` (Task 11)

---

## Task 1: Token swap with backwards-compatible aliases

Goal: Replace `C` token values with paper colors while keeping every legacy key as an alias. Every screen continues compiling; colors visually flip to paper tones immediately. Aliases get removed in Task 11.

**Files:**

- Modify: `constants/colors.ts`

- [ ] **Step 1.1: Replace `constants/colors.ts` with new tokens + legacy aliases**

```ts
// New paper tokens + temporary aliases for legacy callsites.
// Aliases are removed in the final cleanup task once every screen has migrated.

export const C = {
  // ── new paper tokens ────────────────────────────────────────────────
  BG: '#F5F2EC',
  CARD: '#FBF9F4',
  INK: '#1A1815',
  INK_70: 'rgba(26,24,21,0.62)',
  INK_40: 'rgba(26,24,21,0.32)',
  INK_15: 'rgba(26,24,21,0.12)',
  HAIR: 'rgba(26,24,21,0.10)',

  // ── legacy aliases (removed in Task 11) ─────────────────────────────
  TEXT_PRIMARY: '#1A1815',
  TEXT_SECONDARY: 'rgba(26,24,21,0.62)',
  TEXT_MUTED: 'rgba(26,24,21,0.32)',
  BORDER: 'rgba(26,24,21,0.10)',
  ACCENT: '#1A1815',
  ACCENT_DIM: 'rgba(26,24,21,0.32)',
  ACCENT_SOFT: '#FBF9F4',
  TAB_BAR: '#F5F2EC',
  CARD_SUBTLE: '#FBF9F4',
} as const;
```

- [ ] **Step 1.2: Verify type check still passes**

Run: `npx tsc --noEmit`
Expected: only the 2 pre-existing baseline errors in `widgets/SmokeTapWidget.tsx` (`WidgetBase`, EdgeInsets). No new errors.

- [ ] **Step 1.3: Commit**

```bash
git add smoke-tap/constants/colors.ts
git commit -m "refactor(tokens): swap C palette to paper tones with legacy aliases

All screens keep compiling because legacy keys (TEXT_PRIMARY, ACCENT,
TAB_BAR, etc.) remain as aliases pointing to ink. Aliases are removed
in a later cleanup task once every screen has migrated to the new
keys (INK, INK_*, HAIR).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Store — add `removeLastTap`, `getHourlyToday`, `getMonthlyStats`

Goal: Extend `useTapStore` with the actions/selectors the new screens need, following the existing single-source `records[]` rule (no caches, no extra counters).

**Files:**

- Modify: `store/useTapStore.ts`

- [ ] **Step 2.1: Update `TapState` type and add new methods**

Replace the file contents with:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TapRecord, DailyStat, WeeklySummary } from '../types/tap';

type MonthlyBucket = { label: string; count: number };

type TapState = {
  records: TapRecord[];
  addTap: () => void;
  removeLastTap: () => void;
  getTodayCount: () => number;
  getLastTapTime: () => number | null;
  getDailyStats: (days: number) => DailyStat[];
  getWeeklyStats: () => WeeklySummary;
  getHourlyToday: () => number[];
  getMonthlyStats: () => MonthlyBucket[];
};

function toLocalDateString(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const useTapStore = create<TapState>()(
  persist(
    (set, get) => ({
      records: [],

      addTap: () =>
        set((state) => ({
          records: [
            ...state.records,
            { id: String(Date.now()), timestamp: Date.now() },
          ],
        })),

      removeLastTap: () =>
        set((state) => ({ records: state.records.slice(0, -1) })),

      getTodayCount: () => {
        const today = toLocalDateString(Date.now());
        return get().records.filter(
          (r) => toLocalDateString(r.timestamp) === today
        ).length;
      },

      getLastTapTime: () => {
        const { records } = get();
        return records.length ? records[records.length - 1].timestamp : null;
      },

      getDailyStats: (days: number): DailyStat[] => {
        const { records } = get();
        const stats: DailyStat[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const dateStr = toLocalDateString(d.getTime());
          const count = records.filter(
            (r) => toLocalDateString(r.timestamp) === dateStr
          ).length;
          stats.push({ date: dateStr, count });
        }
        return stats;
      },

      getWeeklyStats: (): WeeklySummary => {
        const stats = get().getDailyStats(7);
        const total = stats.reduce((sum, d) => sum + d.count, 0);
        const peakDay = Math.max(...stats.map((d) => d.count), 0);
        return {
          total,
          dailyAvg: parseFloat((total / 7).toFixed(1)),
          peakDay,
        };
      },

      getHourlyToday: (): number[] => {
        const today = toLocalDateString(Date.now());
        const buckets = Array(24).fill(0) as number[];
        for (const r of get().records) {
          if (toLocalDateString(r.timestamp) !== today) continue;
          const h = new Date(r.timestamp).getHours();
          buckets[h] += 1;
        }
        return buckets;
      },

      getMonthlyStats: (): MonthlyBucket[] => {
        const { records } = get();
        const result: MonthlyBucket[] = [];
        // 4 weeks ending today, oldest first
        for (let i = 3; i >= 0; i--) {
          const end = new Date();
          end.setHours(23, 59, 59, 999);
          end.setDate(end.getDate() - i * 7);
          const start = new Date(end.getTime());
          start.setDate(end.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          const count = records.filter(
            (r) => r.timestamp >= start.getTime() && r.timestamp <= end.getTime()
          ).length;
          result.push({ label: `${4 - i}주차`, count });
        }
        return result;
      },
    }),
    {
      name: 'tap-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

- [ ] **Step 2.2: Type check**

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors only.

- [ ] **Step 2.3: Commit**

```bash
git add smoke-tap/store/useTapStore.ts
git commit -m "feat(store): add removeLastTap, getHourlyToday, getMonthlyStats

removeLastTap drops the most recent record (used by undo toast).
getHourlyToday returns a 24-slot count vector for today's records,
used by the home mini chart and the stats day range. getMonthlyStats
returns 4 rolling 7-day buckets ending today.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: i18n keys — add/update/remove

Goal: Replace the locale file content per spec §6 in one shot. Keys consumed by callsites that haven't migrated yet (e.g., `stats.weeklyTotal`) are removed — but `stats.tsx` and `settings.tsx` will be rebuilt later in Tasks 7-8 to consume the new keys, so we must update those screens in those tasks. To prevent transient `t('stats.weeklyTotal')` from returning the key string, **this task only ADDS new keys and updates `tabs.main`/`main.lastTap`/`settings.tagline`**. Removal of `stats.weeklyTotal/dailyAvg/peakDay/last7days` and `main.unit` is deferred to Task 11 (after callsites are gone).

**Files:**

- Modify: `i18n/locales/ko.json`

- [ ] **Step 3.1: Update locale file**

Replace contents with:

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
    "unit": "회",
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
    "recent": "최근 기록",
    "weeklyTotal": "WEEKLY TOTAL",
    "dailyAvg": "DAILY AVG",
    "peakDay": "PEAK DAY",
    "last7days": "지난 7일"
  },
  "settings": {
    "title": "설정",
    "appSection": "앱",
    "appVersion": "버전",
    "tagline": "Smoke Tap은 목표를 설정하지 않습니다\n숫자는 그저 숫자입니다"
  }
}
```

Note: `stats.weeklyTotal`/`dailyAvg`/`peakDay`/`last7days` and `main.unit` remain temporarily for the stats/home screens' current code — they get removed in Task 11 once callsites are gone.

`settings.appVersion` value changed from `"앱 버전"` → `"버전"` (spec §4.3 row label).

- [ ] **Step 3.2: Type check**

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors only.

- [ ] **Step 3.3: Commit**

```bash
git add smoke-tap/i18n/locales/ko.json
git commit -m "i18n: add paper-redesign keys (home/toast/stats/settings)

Adds new keys consumed by the redesigned screens. Updates tabs.main,
main.lastTap, settings.tagline, and settings.appVersion in place.
Legacy stats.* and main.unit are kept temporarily; removed once
callsites migrate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Paper grain texture + `<PaperBackground>`

Goal: Add the repeating grain tile asset and a wrapper component all screens will use.

**Files:**

- Create: `assets/textures/paper-grain.png`
- Create: `components/common/PaperBackground.tsx`

- [ ] **Step 4.1: Generate the 8×8 grain PNG**

We generate a single 8×8 PNG with a transparent background and one ink dot at (1,1) with alpha 0.07 (ink #1A1815). Use a one-shot Node script (no extra dependencies — uses `Buffer` to write a hand-rolled PNG):

Run from worktree root (`smoke-tap/`):

```bash
mkdir -p assets/textures
node -e '
const fs = require("fs");
const zlib = require("zlib");
const W = 8, H = 8;
// raw RGBA: each row prefixed by filter byte 0x00
const rows = [];
for (let y = 0; y < H; y++) {
  const row = [0]; // filter: None
  for (let x = 0; x < W; x++) {
    if (x === 1 && y === 1) {
      // ink dot at (1,1): #1A1815 with alpha ≈ 0.07 → 18 (0x12)
      row.push(0x1A, 0x18, 0x15, 0x12);
    } else {
      row.push(0, 0, 0, 0); // transparent
    }
  }
  rows.push(Buffer.from(row));
}
const raw = Buffer.concat(rows);
const idat = zlib.deflateSync(raw);

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  // CRC32 over type+data
  const crc32 = require("zlib").crc32 ?? null;
  // Node 18+ has zlib.crc32 in some versions; fallback if missing
  let c;
  if (typeof crc32 === "function") {
    c = crc32(Buffer.concat([typeBuf, data]));
  } else {
    // CRC32 implementation
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let cc = n;
      for (let k = 0; k < 8; k++) cc = (cc & 1) ? (0xedb88320 ^ (cc >>> 1)) : (cc >>> 1);
      table[n] = cc >>> 0;
    }
    let cc = 0xffffffff;
    const buf = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < buf.length; i++) cc = (table[(cc ^ buf[i]) & 0xff] ^ (cc >>> 8)) >>> 0;
    c = (cc ^ 0xffffffff) >>> 0;
  }
  crc.writeUInt32BE(c >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;       // bit depth
ihdr[9] = 6;       // color type RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
fs.writeFileSync("assets/textures/paper-grain.png", png);
console.log("wrote", png.length, "bytes to assets/textures/paper-grain.png");
'
```

Expected output: `wrote <N> bytes to assets/textures/paper-grain.png` (typically ~80-120 bytes).

- [ ] **Step 4.2: Verify the PNG is valid**

Run: `file assets/textures/paper-grain.png`
Expected: `... PNG image data, 8 x 8, 8-bit/color RGBA, non-interlaced`

- [ ] **Step 4.3: Create `components/common/PaperBackground.tsx`**

```tsx
import React from 'react';
import { ImageBackground, StyleSheet, View, type ViewStyle } from 'react-native';
import { C } from '../../constants/colors';

const grain = require('../../assets/textures/paper-grain.png');

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function PaperBackground({ children, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <ImageBackground
        source={grain}
        resizeMode="repeat"
        style={StyleSheet.absoluteFill}
        imageStyle={styles.grain}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.BG,
  },
  grain: {
    opacity: 1, // alpha is baked into the PNG
  },
});
```

- [ ] **Step 4.4: Type check**

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors only.

- [ ] **Step 4.5: Commit**

```bash
git add smoke-tap/assets/textures/paper-grain.png smoke-tap/components/common/PaperBackground.tsx
git commit -m "feat(common): add PaperBackground + grain tile asset

8x8 PNG tile (transparent w/ one ink dot at 7% alpha) repeated via
ImageBackground gives the paper grain texture across screens. Single
asset, no per-density variants needed since it tiles.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Home — extract sub-components, then rebuild `index.tsx`

Goal: Build the four home-screen pieces (`CountDisplay`, `PlusButton`, `HourlyMini`, `UndoToast`), then rewire `app/(tabs)/index.tsx` to compose them with the new layout, pulse animation, and 4-second undo toast.

**Files:**

- Create: `components/home/CountDisplay.tsx`
- Create: `components/home/PlusButton.tsx`
- Create: `components/home/HourlyMini.tsx`
- Create: `components/home/UndoToast.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 5.1: Create `components/home/CountDisplay.tsx`**

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';
import { C } from '../../constants/colors';
import { t } from '../../i18n';

type Props = {
  count: number;
  tick: number; // increments to trigger pulse
};

const SIZE = 220;

export default function CountDisplay({ count, tick }: Props) {
  const ringScale1 = useRef(new Animated.Value(1)).current;
  const ringOpacity1 = useRef(new Animated.Value(0)).current;
  const ringScale2 = useRef(new Animated.Value(1)).current;
  const ringOpacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tick === 0) return;
    [
      [ringScale1, ringOpacity1, 0],
      [ringScale2, ringOpacity2, 120],
    ].forEach(([scale, opacity, delay]) => {
      (scale as Animated.Value).setValue(1);
      (opacity as Animated.Value).setValue(0.35);
      Animated.parallel([
        Animated.timing(scale as Animated.Value, {
          toValue: 1.45,
          duration: 700,
          delay: delay as number,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity as Animated.Value, {
          toValue: 0,
          duration: 700,
          delay: delay as number,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [tick, ringScale1, ringOpacity1, ringScale2, ringOpacity2]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale1 }], opacity: ringOpacity1 },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale2 }], opacity: ringOpacity2 },
        ]}
      />
      <View style={styles.disc}>
        <Text style={styles.number} allowFontScaling={false}>
          {count}
        </Text>
        <Text style={styles.label} allowFontScaling={false}>
          {t('main.today')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: C.INK,
  },
  disc: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.INK_15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 96,
    fontWeight: '200',
    color: C.INK,
    letterSpacing: -3,
    lineHeight: 100,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 12,
    color: C.INK_40,
    letterSpacing: 0.4,
    marginTop: 6,
  },
});
```

- [ ] **Step 5.2: Create `components/home/PlusButton.tsx`**

```tsx
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, Easing } from 'react-native';
import { C } from '../../constants/colors';

type Props = {
  onPress: () => void;
};

export default function PlusButton({ onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.timing(scale, {
      toValue: 0.92,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };
  const pressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.btn, { transform: [{ scale }] }]}>
        <Text style={styles.plus} allowFontScaling={false}>
          +
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.INK,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  plus: {
    color: C.BG,
    fontSize: 38,
    fontWeight: '200',
    lineHeight: 42,
  },
});
```

- [ ] **Step 5.3: Create `components/home/HourlyMini.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';
import { t } from '../../i18n';

type Props = {
  data: number[]; // length 24
};

export default function HourlyMini({ data }: Props) {
  const max = Math.max(1, ...data);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.caption} allowFontScaling={false}>
          {t('home.hourly')}
        </Text>
        <Text style={styles.range} allowFontScaling={false}>
          {t('home.hourlyRange')}
        </Text>
      </View>
      <View style={styles.barsRow}>
        {data.map((v, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: v === 0 ? 1 : `${(v / max) * 100}%`,
              backgroundColor: v === 0 ? C.INK_15 : C.INK,
              minHeight: 1,
              marginRight: i === 23 ? 0 : 2,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.CARD,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.HAIR,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    marginHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  caption: {
    fontSize: 11,
    color: C.INK_40,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  range: {
    fontSize: 11,
    color: C.INK_40,
    fontVariant: ['tabular-nums'],
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 28,
  },
});
```

- [ ] **Step 5.4: Create `components/home/UndoToast.tsx`**

```tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { C } from '../../constants/colors';
import { t } from '../../i18n';

type Props = {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  // changes whenever a new tap happens; resets the 4s timer
  resetKey: number;
};

const DURATION_MS = 4000;

export default function UndoToast({ visible, onUndo, onDismiss, resetKey }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => onDismiss(), DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, resetKey, opacity, translateY, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        <Text style={styles.text} allowFontScaling={false}>
          {t('toast.added')}
        </Text>
        <Pressable onPress={onUndo} style={styles.undoBtn}>
          <Text style={styles.undoText} allowFontScaling={false}>
            {t('toast.undo')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 88,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.INK,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 14,
    gap: 14,
  },
  text: {
    color: C.BG,
    fontSize: 13,
  },
  undoBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,242,236,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  undoText: {
    color: C.BG,
    fontSize: 12,
  },
});
```

- [ ] **Step 5.5: Type check the new components**

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors only.

- [ ] **Step 5.6: Replace `app/(tabs)/index.tsx`**

```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTapStore } from '../../store/useTapStore';
import { t } from '../../i18n';
import { C } from '../../constants/colors';
import PaperBackground from '../../components/common/PaperBackground';
import CountDisplay from '../../components/home/CountDisplay';
import PlusButton from '../../components/home/PlusButton';
import HourlyMini from '../../components/home/HourlyMini';
import UndoToast from '../../components/home/UndoToast';

function toLocalDateString(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ts));
}

function formatDate(): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());
}

export default function HomeScreen() {
  const records = useTapStore((s) => s.records);
  const addTap = useTapStore((s) => s.addTap);
  const removeLastTap = useTapStore((s) => s.removeLastTap);
  const getHourlyToday = useTapStore((s) => s.getHourlyToday);

  const today = toLocalDateString(Date.now());
  const todayCount = records.filter(
    (r) => toLocalDateString(r.timestamp) === today
  ).length;
  const lastTapTime = records.length
    ? records[records.length - 1].timestamp
    : null;
  const hourly = getHourlyToday();

  const [tick, setTick] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  const handleTap = () => {
    addTap();
    setTick((n) => n + 1);
    setToastVisible(true);
  };

  const handleUndo = () => {
    removeLastTap();
    setToastVisible(false);
  };

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateText} allowFontScaling={false}>
            {formatDate()}
          </Text>
          <Text style={styles.todayHeading} allowFontScaling={false}>
            {t('main.today')}
          </Text>
        </View>

        <View style={styles.center}>
          <CountDisplay count={todayCount} tick={tick} />
          <PlusButton onPress={handleTap} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText} allowFontScaling={false}>
            {lastTapTime
              ? t('main.lastTap', { time: formatTime(lastTapTime) })
              : t('main.noTapYet')}
          </Text>
        </View>

        <View style={styles.hourlyWrap}>
          <HourlyMini data={hourly} />
        </View>

        <UndoToast
          visible={toastVisible}
          onUndo={handleUndo}
          onDismiss={() => setToastVisible(false)}
          resetKey={tick}
        />
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  dateBlock: {
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  dateText: {
    fontSize: 13,
    color: C.INK_40,
    letterSpacing: 0.3,
  },
  todayHeading: {
    fontSize: 22,
    fontWeight: '500',
    color: C.INK,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  metaRow: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    minHeight: 18,
  },
  metaText: {
    fontSize: 13,
    color: C.INK_70,
    letterSpacing: 0.2,
  },
  hourlyWrap: {
    paddingBottom: 12,
  },
});
```

- [ ] **Step 5.7: Type check**

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors only.

- [ ] **Step 5.8: Commit**

```bash
git add smoke-tap/components/home smoke-tap/app/\(tabs\)/index.tsx
git commit -m "feat(home): paper redesign — separated display/button + undo toast

CountDisplay: 220px circular read-only disc with concentric pulse rings
on tick change. PlusButton: 72px ink button with press scale. HourlyMini:
24-bar today-by-hour card. UndoToast: 4-second auto-dismiss with undo
that calls removeLastTap. Home screen recomposes these into the spec
layout (date head, centered display+button, meta row, hourly card).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Stats — `BarChart` retoned to ink-only

Goal: Strip the `getBarColor()` amber/dim branching and replace with two ink levels. Update props to take a generic `{count,label}[]` instead of `DailyStat[]`+`todayDate`.

**Files:**

- Modify: `components/stats/BarChart.tsx`

- [ ] **Step 6.1: Replace `components/stats/BarChart.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';

export type BarItem = {
  count: number;
  label: string;
};

type Props = {
  data: BarItem[];
  highlightLast?: boolean;
};

const BAR_AREA_HEIGHT = 180;

export default function BarChart({ data, highlightLast = true }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <View style={styles.row}>
      {data.map((item, i) => {
        const isHighlight = highlightLast && i === data.length - 1;
        const heightPct = (item.count / max) * 100;
        const color = isHighlight ? C.INK : C.INK_40;
        return (
          <View key={i} style={styles.col}>
            <View style={styles.barArea}>
              <View
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  backgroundColor: color,
                }}
              />
            </View>
            <Text style={styles.count} allowFontScaling={false}>
              {item.count}
            </Text>
            <Text style={styles.label} allowFontScaling={false}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    height: BAR_AREA_HEIGHT + 36, // bars + 2 caption lines
    gap: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  barArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  count: {
    fontSize: 11,
    color: C.INK_40,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 11,
    color: C.INK_70,
    marginTop: 2,
  },
});
```

- [ ] **Step 6.2: Type check** — note `stats.tsx` still imports the old shape, so this WILL fail until Task 7. Defer commit.

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors PLUS errors in `app/(tabs)/stats.tsx` referencing missing `todayDate` prop / wrong data shape. **Do not commit yet** — proceed to Task 7 and combine the commits.

---

## Task 7: Stats — rebuild `app/(tabs)/stats.tsx`

Goal: Recompose the stats screen per spec §4.2: header, day/week/month segmented control, total header, bar chart, recent records list. Day range = last 24 hourly buckets formatted into 8 three-hour groups (so labels stay readable). Week = last 7 days. Month = `getMonthlyStats()`.

**Files:**

- Modify: `app/(tabs)/stats.tsx`

- [ ] **Step 7.1: Replace `app/(tabs)/stats.tsx`**

```tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTapStore } from '../../store/useTapStore';
import { t } from '../../i18n';
import { C } from '../../constants/colors';
import PaperBackground from '../../components/common/PaperBackground';
import BarChart, { type BarItem } from '../../components/stats/BarChart';

type Range = 'day' | 'week' | 'month';

const RANGE_LABEL: Record<Range, string> = {
  day: '일',
  week: '주',
  month: '달',
};

function dayBuckets(hourly: number[]): BarItem[] {
  // 8 three-hour buckets: 00, 03, 06, 09, 12, 15, 18, 21
  const out: BarItem[] = [];
  for (let i = 0; i < 8; i++) {
    const start = i * 3;
    const count = hourly[start] + hourly[start + 1] + hourly[start + 2];
    out.push({ count, label: String(start).padStart(2, '0') });
  }
  return out;
}

function weekBuckets(daily: { date: string; count: number }[]): BarItem[] {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return daily.map((d) => {
    const [, , dayStr] = d.date.split('-');
    const dayNum = new Date(`${d.date}T00:00:00`).getDay();
    return { count: d.count, label: days[dayNum] ?? dayStr };
  });
}

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ts));
}

function timeAgo(ts: number, now: number): string {
  const diffMin = Math.max(0, Math.floor((now - ts) / 60000));
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}일 전`;
}

export default function StatsScreen() {
  const records = useTapStore((s) => s.records);
  const getDailyStats = useTapStore((s) => s.getDailyStats);
  const getHourlyToday = useTapStore((s) => s.getHourlyToday);
  const getMonthlyStats = useTapStore((s) => s.getMonthlyStats);

  const [range, setRange] = useState<Range>('week');

  const data: BarItem[] =
    range === 'day'
      ? dayBuckets(getHourlyToday())
      : range === 'week'
      ? weekBuckets(getDailyStats(7))
      : getMonthlyStats();

  const total = data.reduce((a, b) => a + b.count, 0);

  const now = Date.now();
  const recent = [...records]
    .slice(-4)
    .reverse()
    .map((r) => ({
      time: formatTime(r.timestamp),
      ago: timeAgo(r.timestamp, now),
    }));

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.observe} allowFontScaling={false}>
            {t('stats.observe')}
          </Text>
          <Text style={styles.title} allowFontScaling={false}>
            {t('stats.title')}
          </Text>
        </View>

        <View style={styles.segmentRow}>
          {(['day', 'week', 'month'] as Range[]).map((r) => {
            const active = r === range;
            return (
              <Pressable key={r} onPress={() => setRange(r)} style={styles.segBtn}>
                <Text
                  style={[styles.segLabel, active && styles.segLabelActive]}
                  allowFontScaling={false}
                >
                  {t(`stats.${r}`)}
                </Text>
                {active && <View style={styles.segUnderline} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.totalBlock}>
          <Text style={styles.totalCaption} allowFontScaling={false}>
            {t('stats.totalThis', { range: RANGE_LABEL[range] })}
          </Text>
          <Text style={styles.totalNumber} allowFontScaling={false}>
            {total}
          </Text>
        </View>

        <BarChart data={data} highlightLast={range !== 'day'} />

        <View style={styles.recentBlock}>
          <Text style={styles.recentCaption} allowFontScaling={false}>
            {t('stats.recent')}
          </Text>
          {recent.length === 0 ? (
            <Text style={styles.empty} allowFontScaling={false}>
              {t('main.noTapYet')}
            </Text>
          ) : (
            recent.map((r, i) => (
              <View
                key={i}
                style={[
                  styles.recentRow,
                  i < recent.length - 1 && styles.recentRowBorder,
                ]}
              >
                <Text style={styles.recentTime} allowFontScaling={false}>
                  {r.time}
                </Text>
                <Text style={styles.recentAgo} allowFontScaling={false}>
                  {r.ago}
                </Text>
              </View>
            ))
          )}
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  observe: {
    fontSize: 13,
    color: C.INK_40,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: C.INK,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.HAIR,
  },
  segBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.INK_40,
  },
  segLabelActive: {
    color: C.INK,
  },
  segUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 1,
    backgroundColor: C.INK,
  },
  totalBlock: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  totalCaption: {
    fontSize: 11,
    color: C.INK_40,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  totalNumber: {
    fontSize: 48,
    fontWeight: '200',
    color: C.INK,
    letterSpacing: -1.5,
    lineHeight: 48,
    fontVariant: ['tabular-nums'],
  },
  recentBlock: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  recentCaption: {
    fontSize: 11,
    color: C.INK_40,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  empty: {
    fontSize: 13,
    color: C.INK_40,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  recentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.HAIR,
  },
  recentTime: {
    fontSize: 14,
    color: C.INK,
    fontVariant: ['tabular-nums'],
  },
  recentAgo: {
    fontSize: 14,
    color: C.INK_40,
  },
});
```

- [ ] **Step 7.2: Type check (combined with Task 6)**

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors only.

- [ ] **Step 7.3: Commit Task 6 + 7 together**

```bash
git add smoke-tap/components/stats/BarChart.tsx smoke-tap/app/\(tabs\)/stats.tsx
git commit -m "feat(stats): paper redesign — segmented day/week/month + ink bars

BarChart loses amber/dim branching; uses C.INK + C.INK_40 with optional
last-bar highlight. Stats screen rebuilds layout with day/week/month
segmented control, large total header (light weight 200), bar chart,
and recent records list. Day range shows 8 three-hour buckets, week
shows weekday labels, month shows 4 rolling 7-day buckets.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Settings — paper card retone (no fictional features)

Goal: Per spec §4.3, only retone the existing version row; do NOT add the spec-illustrated toggles/iCloud/CSV (CLAUDE.md "장식 금지"). Add `<Section>`/`<Row>` components for shared use, then rewire the screen.

**Files:**

- Create: `components/settings/Section.tsx`
- Create: `components/settings/Row.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 8.1: Create `components/settings/Section.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function Section({ title, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption} allowFontScaling={false}>
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 28,
  },
  caption: {
    fontSize: 11,
    color: C.INK_40,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: C.CARD,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.HAIR,
  },
});
```

- [ ] **Step 8.2: Create `components/settings/Row.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';

type Props = {
  label: string;
  value?: string;
  last?: boolean;
};

export default function Row({ label, value, last }: Props) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.label} allowFontScaling={false}>
        {label}
      </Text>
      {value !== undefined && (
        <Text style={styles.value} allowFontScaling={false}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.HAIR,
  },
  label: {
    fontSize: 15,
    color: C.INK,
  },
  value: {
    fontSize: 14,
    color: C.INK_40,
  },
});
```

- [ ] **Step 8.3: Replace `app/(tabs)/settings.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { t } from '../../i18n';
import { C } from '../../constants/colors';
import PaperBackground from '../../components/common/PaperBackground';
import Section from '../../components/settings/Section';
import Row from '../../components/settings/Row';

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title} allowFontScaling={false}>
            {t('settings.title')}
          </Text>
        </View>

        <Section title={t('settings.appSection')}>
          <Row label={t('settings.appVersion')} value={version} last />
        </Section>

        <View style={styles.footer}>
          <Text style={styles.tagline} allowFontScaling={false}>
            {t('settings.tagline')}
          </Text>
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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

- [ ] **Step 8.4: Type check**

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors only.

- [ ] **Step 8.5: Commit**

```bash
git add smoke-tap/components/settings smoke-tap/app/\(tabs\)/settings.tsx
git commit -m "feat(settings): paper redesign — section card + tagline footer

Adds Section + Row primitives. Settings screen retones to paper card
style with the existing version row only — non-functional spec items
(toggles, iCloud, CSV, app icon) are excluded per CLAUDE.md \"장식 금지\".
Tagline updated to spec copy.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Tab bar + AppHeader + StatusBar

Goal: Strip tab icons (spec: text only), retone tab bar to paper, retone `AppHeader`, ensure status bar uses dark content on the light background.

**Files:**

- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/_layout.tsx`
- Modify: `components/common/AppHeader.tsx`

- [ ] **Step 9.1: Replace `app/(tabs)/_layout.tsx`**

```tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { t } from '../../i18n';
import { C } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.INK,
        tabBarInactiveTintColor: C.INK_40,
        tabBarStyle: {
          backgroundColor: C.BG,
          borderTopWidth: 1,
          borderTopColor: C.HAIR,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          letterSpacing: 0.4,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: t('tabs.main'),
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: t('tabs.stats'),
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 9.2: Update `app/_layout.tsx` — add light StatusBar**

Edit the existing file. Replace the import line `import { Stack } from 'expo-router';` and the `RootLayout` return with:

Find:
```tsx
import { Stack } from 'expo-router';
```

Replace with:
```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
```

Find:
```tsx
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
```

Replace with:
```tsx
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
```

- [ ] **Step 9.3: Update `components/common/AppHeader.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';

export default function AppHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title} allowFontScaling={false}>
        SMOKE TAP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    color: C.INK_40,
  },
});
```

- [ ] **Step 9.4: Type check**

Run: `npx tsc --noEmit`
Expected: 2 baseline widget errors only.

- [ ] **Step 9.5: Commit**

```bash
git add smoke-tap/app/\(tabs\)/_layout.tsx smoke-tap/app/_layout.tsx smoke-tap/components/common/AppHeader.tsx
git commit -m "feat(chrome): paper-tone tab bar (text-only) + dark StatusBar + AppHeader

Removes tab icons per spec — labels only. Tab bar uses paper bg with
hairline top border. AppHeader retones to ink_40 small caps. StatusBar
explicitly set to dark content for the light background.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Widget — paper retone in Swift

Goal: Replace the Swift widget body in `scripts/patch-widget.js` with the paper layout, and update the JSX reference file. Do NOT auto-run prebuild — that decision is left to the user.

**Files:**

- Modify: `scripts/patch-widget.js`
- Modify: `widgets/SmokeTapWidget.tsx`

- [ ] **Step 10.1: Replace the `SMOKE_TAP_WIDGET` constant in `scripts/patch-widget.js`**

In `scripts/patch-widget.js`, find the block:

```js
const SMOKE_TAP_WIDGET = `import WidgetKit
... (entire current Swift block ending with the closing backtick)
`;
```

Replace the entire string contents with:

```js
const SMOKE_TAP_WIDGET = `import WidgetKit
import SwiftUI
import AppIntents

struct SmokeTapEntry: TimelineEntry {
    let date: Date
    let count: Int
}

struct SmokeTapProvider: TimelineProvider {
    func placeholder(in context: Context) -> SmokeTapEntry {
        SmokeTapEntry(date: Date(), count: 0)
    }
    func getSnapshot(in context: Context, completion: @escaping (SmokeTapEntry) -> Void) {
        completion(SmokeTapEntry(date: Date(), count: SharedTapStore.getBaseCount() + SharedTapStore.getPendingCount()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<SmokeTapEntry>) -> Void) {
        let entry = SmokeTapEntry(date: Date(), count: SharedTapStore.getBaseCount() + SharedTapStore.getPendingCount())
        completion(Timeline(entries: [entry], policy: .never))
    }
}

private extension Color {
    init(hex: String) {
        var int: UInt64 = 0
        Scanner(string: hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)).scanHexInt64(&int)
        self.init(red: Double((int >> 16) & 0xFF) / 255, green: Double((int >> 8) & 0xFF) / 255, blue: Double(int & 0xFF) / 255)
    }
}

private extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(color, for: .widget)
        } else {
            self.background(color)
        }
    }
}

struct SmokeTapWidgetView: View {
    let entry: SmokeTapEntry
    var body: some View {
        ZStack(alignment: .topLeading) {
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
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
            }
        }
        .padding(12)
        .widgetBackground(Color(hex: "FBF9F4"))
    }
}

struct SmokeTapWidget: Widget {
    let name = "SmokeTapWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: name, provider: SmokeTapProvider()) { entry in
            SmokeTapWidgetView(entry: entry)
        }
        .configurationDisplayName("Smoke Tap")
        .description("오늘 흡연 횟수를 기록하세요")
        .supportedFamilies([.systemSmall])
    }
}
`;
```

(The change: removed "오늘"/"회" labels and the dark-tone palette; switched to top-leading large number + bottom-trailing + button on a paper card. Logic — Provider, Color extension, View extension, Widget config — kept as-is.)

- [ ] **Step 10.2: Update `widgets/SmokeTapWidget.tsx` (JSX reference)**

Read the file first to know its current shape, then update tones to match the Swift:

```tsx
// widgets/SmokeTapWidget.tsx — reference JSX. Real build is the Swift in scripts/patch-widget.js.
// NOTE: pre-existing tsc errors here (WidgetBase, EdgeInsets) are unrelated to this redesign and remain.
import React from 'react';
import { Text, View } from 'react-native';
// @ts-expect-error — expo-widgets types vary; this file is reference-only
import { WidgetBase } from 'expo-widgets';

export default function SmokeTapWidget({ count = 0 }: { count?: number }) {
  return (
    // @ts-expect-error reference only
    <WidgetBase padding={12} background="#FBF9F4">
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 72, fontWeight: '200', color: '#1A1815', letterSpacing: -2.5 }}>
          {count}
        </Text>
        <View style={{ position: 'absolute', right: 0, bottom: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1815', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26, fontWeight: '200', color: '#FBF9F4' }}>+</Text>
        </View>
      </View>
    </WidgetBase>
  );
}
```

(The `@ts-expect-error` comments suppress the 2 baseline errors so future tsc runs cleanly show only this redesign's effects. If they end up suppressing a real error from this redesign, remove them — but they should not, because we don't touch `expo-widgets` props.)

- [ ] **Step 10.3: Type check**

Run: `npx tsc --noEmit`
Expected: clean (0 errors). The previously-known 2 baseline errors are now suppressed. **If any other error appears, it's from this task and must be fixed before commit.**

- [ ] **Step 10.4: Commit**

```bash
git add smoke-tap/scripts/patch-widget.js smoke-tap/widgets/SmokeTapWidget.tsx
git commit -m "feat(widget): paper retone — top-left number + bottom-right plus

Replaces dark-tone widget body with the paper card layout: large 72pt
thin number top-leading, 44px ink + button bottom-trailing on a
#FBF9F4 card. Sync logic (Provider, RecordTapIntent, SharedTapStore)
unchanged. JSX reference file aligned to the same tones; pre-existing
type errors in that reference are now @ts-expect-error annotated since
they are unrelated to this redesign and the file is reference-only.
Run \`npm run prebuild:ios\` (or \`npm run patch-widget\` after a prior
prebuild) and rebuild in Xcode to apply.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Cleanup — remove legacy aliases, prune i18n, update CLAUDE.md

Goal: Now that every callsite uses the new `INK*`/`HAIR` tokens, drop the aliases. Prune i18n keys that are no longer referenced. Refresh CLAUDE.md design system section.

**Files:**

- Modify: `constants/colors.ts`
- Modify: `i18n/locales/ko.json`
- Modify: `CLAUDE.md`

- [ ] **Step 11.1: Verify there are no remaining references to legacy keys**

Run from worktree root:

```bash
grep -rn 'C\.\(TEXT_PRIMARY\|TEXT_SECONDARY\|TEXT_MUTED\|BORDER\|ACCENT\|ACCENT_DIM\|ACCENT_SOFT\|TAB_BAR\|CARD_SUBTLE\)' --include='*.ts' --include='*.tsx' .
```

Expected: no matches (exit 1).

If any match appears, that file was missed — replace with the appropriate new token (`INK`/`INK_70`/`INK_40`/`INK_15`/`HAIR`/`CARD`/`BG`) before continuing.

- [ ] **Step 11.2: Replace `constants/colors.ts` (drop aliases)**

```ts
export const C = {
  BG: '#F5F2EC',
  CARD: '#FBF9F4',
  INK: '#1A1815',
  INK_70: 'rgba(26,24,21,0.62)',
  INK_40: 'rgba(26,24,21,0.32)',
  INK_15: 'rgba(26,24,21,0.12)',
  HAIR: 'rgba(26,24,21,0.10)',
} as const;
```

- [ ] **Step 11.3: Verify there are no remaining references to legacy i18n keys**

```bash
grep -rn "stats\.\(weeklyTotal\|dailyAvg\|peakDay\|last7days\)\|main\.unit" --include='*.ts' --include='*.tsx' .
```

Expected: no matches.

- [ ] **Step 11.4: Prune `i18n/locales/ko.json`**

Replace contents with:

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
    "appSection": "앱",
    "appVersion": "버전",
    "tagline": "Smoke Tap은 목표를 설정하지 않습니다\n숫자는 그저 숫자입니다"
  }
}
```

- [ ] **Step 11.5: Update CLAUDE.md design system section**

Edit `CLAUDE.md`. Find the section:

```md
## 디자인 시스템

디자인 원칙·무드는 `.impeccable.md` 단일 소스를 따름. 핵심만 요약:

- **테마**: 웜 톤 다크 (`C.BG = #121110`)
- **액센트**: 앰버 (`C.ACCENT = #e8991a`) — 한 화면에 한 곳만
- **위계**: 숫자가 주인공. 오늘 카운트가 가장 큰 시각 요소.
- **장식 금지**: 기능하지 않는 UI 요소 추가하지 말 것.

색상은 항상 `constants/colors.ts`의 `C` 토큰 사용. 하드코딩 금지 (단, Swift 위젯 코드는 hex 문자열 그대로 — 토큰 동기화는 수동).
```

Replace with:

```md
## 디자인 시스템

페이퍼 라이트 톤 + 잉크. 단일 테마(다크 모드 미지원). 핵심 토큰:

- **테마**: 페이퍼 라이트 (`C.BG = #F5F2EC`, `C.CARD = #FBF9F4`)
- **액센트 = 잉크**: `C.INK = #1A1815` 단색. 별도 컬러 액센트 없음.
- **위계**: 숫자가 주인공. 홈 화면의 원형 디스플레이가 시각적 중심.
- **분리 원칙**: 디스플레이(읽기)와 + 버튼(누르기)을 시각적으로 분리.
- **장식 금지**: 기능하지 않는 UI 요소 추가하지 말 것.
- **그레인**: `assets/textures/paper-grain.png`(8×8 타일) — 모든 탭 화면을 `<PaperBackground>`로 감쌈.

색상은 항상 `C` 토큰 사용. 하드코딩 금지 (단, Swift 위젯 코드는 hex 문자열 그대로 — 토큰 동기화는 수동: `colors.ts` ↔ `scripts/patch-widget.js` ↔ `widgets/SmokeTapWidget.tsx`).
```

- [ ] **Step 11.6: Type check**

Run: `npx tsc --noEmit`
Expected: clean (0 errors).

- [ ] **Step 11.7: Commit**

```bash
git add smoke-tap/constants/colors.ts smoke-tap/i18n/locales/ko.json smoke-tap/CLAUDE.md
git commit -m "chore: drop legacy color aliases + prune unused i18n keys

All screens migrated to paper tokens (INK*/HAIR/CARD/BG); legacy keys
(TEXT_PRIMARY, ACCENT, TAB_BAR, etc.) removed from C. Unused stats keys
(weeklyTotal/dailyAvg/peakDay/last7days) and main.unit removed from
ko.json. CLAUDE.md design system section updated to reflect paper light
theme (no dark mode).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Final type check + simulator smoke check (handoff to user)

Goal: One last green type check; then hand off to the user for `npm run ios` smoke check (animations, undo flow, ranges, widget) since the harness can't run iOS simulator.

**Files:** none (verification only)

- [ ] **Step 12.1: Final clean type check**

Run: `npx tsc --noEmit`
Expected: clean (0 errors, including no widget JSX baseline since Task 10 suppressed those).

- [ ] **Step 12.2: Inventory of changes**

Run from worktree root:

```bash
git log --oneline worktree-paper-redesign ^master
```

Expected: ~12 commits (one per task) ending with the cleanup commit.

- [ ] **Step 12.3: Hand off to user with smoke-test checklist**

Output the following message (exactly this text — it doubles as the handoff summary):

```
Paper UI redesign implementation complete on branch worktree-paper-redesign.
Commits:
$(git log --oneline worktree-paper-redesign ^master)

To verify:
  cd /Users/WonjinSin/Documents/project/claude-code-toy/.claude/worktrees/paper-redesign/smoke-tap
  npm run ios

Manual smoke checks:
  Home: paper bg w/ grain visible; circular display (220px); separated + button (72px ink);
        tap → ring pulse + toast appears + 4s auto-dismiss; undo button decrements; meta
        row shows last-tap; hourly mini chart card visible at bottom.
  Stats: 일/주/월 segmented control with underline on active; total header big light-200
         number; bar chart ink-only (last bar darker for week/month); recent records list.
  Settings: paper card with version row; tagline footer "Smoke Tap은 목표를 설정하지 않습니다 / 숫자는 그저 숫자입니다".
  Tab bar: text-only labels (오늘/통계/설정), hairline top border, active label in INK.
  Status bar: dark text on light background.

To apply the widget redesign:
  npm run prebuild:ios
  Then open ios/SmokeTap.xcworkspace and rebuild to the simulator/device.
```

---

## Self-Review Notes

**Spec coverage:**
- §3 tokens → Task 1 (swap w/ aliases) + Task 11 (drop aliases) ✓
- §3.2 grain asset → Task 4 ✓
- §4.1 home (display, button, mini chart, undo, layout) → Task 5 ✓
- §4.2 stats (segments, total, bar chart, recent list) → Tasks 6+7 ✓
- §4.3 settings (paper card + tagline; non-functional items excluded) → Task 8 ✓
- §4.4 tab bar text-only + chrome → Task 9 ✓
- §4.5 widget Swift retone + JSX sync → Task 10 ✓
- §5 store extensions → Task 2 ✓
- §6 i18n → Task 3 (additive) + Task 11 (prune) ✓
- §7 file inventory → all listed files appear in tasks ✓
- §8 verification (tsc + simulator handoff) → Task 12 ✓
- §10 risks (sync of color across 3 places, widget timeline regression) → Task 10 commit message + handoff message reminds user to prebuild ✓

**Placeholder check:** No TBD/TODO/"add error handling"/"similar to" patterns. Every code step has full source.

**Type consistency:** `BarItem` type defined in Task 6 reused in Task 7 with the same shape (`{ count: number; label: string }`). `MonthlyBucket` returns `{ label, count }` matching `BarItem` so `getMonthlyStats()` flows directly into `BarChart`. `removeLastTap` defined in Task 2 used in Task 5. `getHourlyToday` defined in Task 2 used in Task 5 (home) and Task 7 (stats). `Range` union (`'day'|'week'|'month'`) consistent within Task 7.

**Aliases-first migration:** Task 1 introduces aliases mapping every legacy key (TEXT_PRIMARY, ACCENT, TAB_BAR, etc.) onto the paper palette so screens compile during the migration; Task 11 verifies no aliases remain referenced before dropping them.
