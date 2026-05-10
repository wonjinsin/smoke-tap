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
