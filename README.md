# iOS Boilerplate

금융/교육/세탁 앱 레퍼런스에서 추출한 공통 UI 패턴 기반의 React Native iOS 보일러플레이트.

**Tech Stack:** Expo · Expo Router · NativeWind v4 · Zustand · TanStack Query v5 · TypeScript strict

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. iOS 시뮬레이터 실행

```bash
npm run ios
# 또는
npx expo start --ios
```

### 3. 개발 서버만 실행 (QR코드 / Expo Go)

```bash
npm start
# 또는
npx expo start
```

---

## 주요 커맨드

| 커맨드 | 설명 |
|--------|------|
| `npm run ios` | iOS 시뮬레이터 실행 |
| `npm run android` | Android 에뮬레이터 실행 |
| `npm start` | Expo 개발 서버 실행 |
| `npx tsc --noEmit` | TypeScript 타입 검사 |
| `npx expo start --clear` | Metro 캐시 초기화 후 실행 |

---

## 프로젝트 구조

```
ios-boilerplate/
├── app/
│   ├── _layout.tsx              # QueryClientProvider + Stack root
│   └── (tabs)/
│       ├── _layout.tsx          # 5탭 정의
│       ├── index.tsx            # 홈 탭
│       ├── list.tsx             # 목록 탭
│       ├── community.tsx        # 커뮤니티 탭 (FAB)
│       ├── history.tsx          # 이용내역 탭
│       └── profile.tsx          # 내 정보 탭
├── components/
│   ├── common/                  # 공통 컴포넌트 (SkeletonBox, FAB 등)
│   └── home/                    # 홈 전용 컴포넌트
├── store/                       # Zustand 스토어
├── hooks/                       # TanStack Query 훅
├── services/mockApi.ts          # Mock API (실서버 교체 포인트)
├── constants/                   # 색상, 타이포, 스페이싱, Mock 데이터
└── types/                       # TypeScript 타입 정의
```

---

## 실서버 연동

`services/mockApi.ts`의 fetch 함수만 실제 API 호출로 교체하면 됩니다. queryKey와 반환 타입 인터페이스는 그대로 유지됩니다.

```ts
// 변경 전
export async function fetchUserProfile(): Promise<UserProfile> {
  await delay(rand(300, 600));
  return MOCK_USER;
}

// 변경 후
export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch('https://api.example.com/user');
  return res.json();
}
```

---

## 주의사항

- **NativeWind v4**: `metro.config.js`의 `withNativeWind` 래핑 및 `app/_layout.tsx`의 `import '../global.css'` 필수
- **TanStack Query v5**: `onSuccess` 없음 → `useEffect`로 스토어 동기화
- **Zustand persist**: 배너 dismiss 상태는 AsyncStorage에 영구 저장됨
- **공유 세그먼트 탭**: `list.tsx`와 `community.tsx`는 `useAppStore`의 `activeSegmentTab`을 공유함. 독립적인 탭 상태가 필요하면 `history.tsx`처럼 로컬 `useState` 사용
