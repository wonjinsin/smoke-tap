export type TapRecord = {
  id: string;        // timestamp-based unique ID
  timestamp: number; // Unix ms (device local time)
};

export type DailyStat = {
  date: string;  // 'YYYY-MM-DD' (device local date)
  count: number;
};

export type WeeklySummary = {
  total: number;
  dailyAvg: number;
  peakDay: number;
};
