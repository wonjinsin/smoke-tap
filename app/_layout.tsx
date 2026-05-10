import '../global.css';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTapStore } from '../store/useTapStore';
import { getPendingCount, clearPending, setBaseCount } from '../modules/SharedTapStore';
import { C } from '../constants/colors';

function toLocalDateString(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayCount(records: { timestamp: number }[]): number {
  const today = toLocalDateString(Date.now());
  return records.filter((r) => toLocalDateString(r.timestamp) === today).length;
}

function useWidgetSync() {
  const addTap = useTapStore((s) => s.addTap);

  // 위젯 → 앱: pending 탭을 앱 store에 반영
  async function syncPending() {
    const pending = await getPendingCount();
    if (pending > 0) {
      for (let i = 0; i < pending; i++) addTap();
      await clearPending();
    }
  }

  // 앱 → 위젯: 오늘 카운트를 App Groups에 기록
  async function syncBaseCount() {
    const count = getTodayCount(useTapStore.getState().records);
    await setBaseCount(count);
  }

  useEffect(() => {
    // 앱 시작 시 동기화
    syncPending().then(syncBaseCount);

    // 앱이 포그라운드로 돌아올 때마다 동기화
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncPending().then(syncBaseCount);
    });
    return () => sub.remove();
  }, []);

  // store records가 바뀔 때마다 위젯 기준값 갱신
  useEffect(() => {
    return useTapStore.subscribe((state) => {
      setBaseCount(getTodayCount(state.records));
    });
  }, []);
}

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
