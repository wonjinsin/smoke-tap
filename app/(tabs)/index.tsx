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
