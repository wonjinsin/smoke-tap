// 공유 더미 데이터 - 모든 미학에서 동일하게 사용
// 판단 없는 톤: 목표/평균/축하 메시지 없이 그냥 숫자만

const todayCount = 7;
const lastTimeAgo = '32분 전';

// 시간대별 카운트 (0-23시) - 오늘
const hourly = [
  0,0,0,0,0,0, 0,1,2,1,0,0,
  1,0,1,0,0,1, 0,0,0,0,0,0
];

// 7일치 (오늘 포함, 가장 오래된 것이 [0])
const last7Days = [
  { label: '월', count: 11 },
  { label: '화', count: 8 },
  { label: '수', count: 14 },
  { label: '목', count: 9 },
  { label: '금', count: 12 },
  { label: '토', count: 6 },
  { label: '오늘', count: 7 },
];

// 4주치
const last4Weeks = [
  { label: '4주전', count: 78 },
  { label: '3주전', count: 71 },
  { label: '2주전', count: 64 },
  { label: '이번주', count: 67 },
];

// 최근 기록 (역순, 가장 최근이 [0])
const recentTaps = [
  { time: '14:32', ago: '32분 전' },
  { time: '12:08', ago: '2시간 56분 전' },
  { time: '10:45', ago: '4시간 19분 전' },
  { time: '09:12', ago: '5시간 52분 전' },
  { time: '08:05', ago: '6시간 59분 전' },
  { time: '07:22', ago: '7시간 42분 전' },
  { time: '06:48', ago: '8시간 16분 전' },
];

Object.assign(window, {
  SMOKE_DATA: { todayCount, lastTimeAgo, hourly, last7Days, last4Weeks, recentTaps },
});
