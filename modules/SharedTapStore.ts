import { requireNativeModule } from 'expo-modules-core';

const native = requireNativeModule('SharedTapStore');

/** 위젯에서 탭했지만 아직 앱에 반영되지 않은 횟수 */
export function getPendingCount(): Promise<number> {
  return native.getPendingCount();
}

/** 앱에 반영 완료 후 pending 초기화 */
export function clearPending(): Promise<void> {
  return native.clearPending();
}

/** 앱의 오늘 카운트를 위젯이 읽는 기준값으로 저장 */
export function setBaseCount(count: number): Promise<void> {
  return native.setBaseCount(count);
}
