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
