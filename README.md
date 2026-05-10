# iOS Boilerplate

A React Native iOS boilerplate based on common UI patterns extracted from finance, education, and laundry app references.

**Tech Stack:** Expo · Expo Router · NativeWind v4 · Zustand · TanStack Query v5 · TypeScript strict

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run on iOS Simulator

```bash
npm run ios
# or
npx expo start --ios
```

### 3. Start Dev Server Only (QR code / Expo Go)

```bash
npm start
# or
npx expo start
```

---

## Common Commands

| Command | Description |
|--------|------|
| `npm run ios` | Run iOS simulator |
| `npm run android` | Run Android emulator |
| `npm start` | Start Expo dev server |
| `npx tsc --noEmit` | TypeScript type check |
| `npx expo start --clear` | Run with Metro cache cleared |

---

## Project Structure

```
ios-boilerplate/
├── app/
│   ├── _layout.tsx              # QueryClientProvider + Stack root
│   └── (tabs)/
│       ├── _layout.tsx          # 5-tab definition
│       ├── index.tsx            # Home tab
│       ├── list.tsx             # List tab
│       ├── community.tsx        # Community tab (FAB)
│       ├── history.tsx          # History tab
│       └── profile.tsx          # Profile tab
├── components/
│   ├── common/                  # Shared components (SkeletonBox, FAB, etc.)
│   └── home/                    # Home-specific components
├── store/                       # Zustand stores
├── hooks/                       # TanStack Query hooks
├── services/mockApi.ts          # Mock API (swap point for real server)
├── constants/                   # Colors, typography, spacing, mock data
└── types/                       # TypeScript type definitions
```

---

## Connecting to a Real Server

Simply replace the fetch functions in `services/mockApi.ts` with real API calls. The queryKey and return type interfaces remain unchanged.

```ts
// Before
export async function fetchUserProfile(): Promise<UserProfile> {
  await delay(rand(300, 600));
  return MOCK_USER;
}

// After
export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch('https://api.example.com/user');
  return res.json();
}
```

---

## Notes

- **NativeWind v4**: `withNativeWind` wrapping in `metro.config.js` and `import '../global.css'` in `app/_layout.tsx` are required
- **TanStack Query v5**: No `onSuccess` callback — use `useEffect` to sync with store
- **Zustand persist**: Banner dismiss state is persisted to AsyncStorage
- **Shared segment tabs**: `list.tsx` and `community.tsx` share `activeSegmentTab` from `useAppStore`. For independent tab state, use local `useState` as in `history.tsx`
