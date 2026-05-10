# AI-Readiness Improvement — Foundation 6 (설계)

| 항목 | 값 |
|------|------|
| 작성일 | 2026-05-10 |
| 브랜치 | master |
| 현재 점수 | 13 / 100 (AI-Hostile) |
| 목표 점수 | ≥ 70 / 100 (AI-Assisted 이상) |
| 예산 | ~15h |
| 추정 실작업 | ~13.5h |
| 입력 자료 | `docs/ai-readiness-map.html`, `docs/ai-readiness-score.json` |

## 0. 배경

`ai-readiness-cartography` 감사 결과 7개 카테고리 중 4개(A, C, F, G)가 0점, 컨텍스트의 31개 path 참조 중 26개가 깨진 경로(hallucinated path) 라는 결과. 핵심 원인 2가지:

1. **README.md 가 stale boilerplate 상태** — `services/mockApi.ts` · `community.tsx` · `profile.tsx` 등 실제로 존재하지 않는 다른 프로젝트 구조를 기술. 깨진 path 26건의 다수가 여기서 발생.
2. **하위 모듈 12개에 컨텍스트 문서 전무** — root `CLAUDE.md` 외에는 navigation entry 없음.

본 spec 은 이 두 원인을 포함한 6개 액션을 한 PR 분량으로 묶어 처리한다. 나머지 2개 액션(evals, god file split)은 후속 사이클로 분리.

## 1. 목표 / 비목표

### 목표

- AI-readiness 카테고리 A·B·C·D·E·F 의 점수를 의미 있게 회복 (총점 ≥ 70 목표)
- 모든 컨텍스트 문서(`CLAUDE.md` · `README.md` · `MEMORY.md` · `ARCHITECTURE.md` · per-module `CLAUDE.md`) 의 path 참조가 실제 존재하도록 보장
- `validate-context-paths.js` + husky pre-commit 으로 hallucinated path 재발 영구 차단

### 비목표

- **G 카테고리 (evals/benchmarks)** — 별도 사이클에서 처리. 이번 spec 에서는 0/5 유지.
- **B-god-file split (`docs/ui-design/*.jsx`)** — 디자인 reference 파일이라 agent action surface 가 아님. 후속.
- **소스 코드 변경** — 본 spec 은 **문서/도구 작업 only**. `app/`, `components/`, `widgets/`, `store/` 등의 .ts/.tsx 파일은 건드리지 않는다.
- **TypeScript baseline 에러 수정** — `widgets/SmokeTapWidget.tsx` 의 pre-existing 2건은 reference-only 파일이라 본 작업과 무관.

## 2. 산출물 구조

```
smoke-tap/
├── CLAUDE.md                    # ① 컴파스 (25–30 ln, 압축)
├── README.md                    # ② 한국어 공개 README (전면 재작성)
├── MEMORY.md                    # ③ Tribal knowledge (신설)
├── ARCHITECTURE.md              # ④ 모듈 의존도 + mermaid 2종 (신설)
│
├── app/CLAUDE.md                # ⑤ Tier 1 — 8개 (~30 ln 각, 신설)
├── components/CLAUDE.md
├── widgets/CLAUDE.md
├── store/CLAUDE.md
├── modules/CLAUDE.md
├── ios/CLAUDE.md
├── plugins/CLAUDE.md
├── scripts/CLAUDE.md
│
├── constants/CLAUDE.md          # ⑥ Tier 2 — 3개 pointer (~10 ln 각, 신설)
├── i18n/CLAUDE.md
├── types/CLAUDE.md
│
├── scripts/
│   └── validate-context-paths.js    # ⑦ Path 검증 게이트 (신설)
│
├── .husky/
│   └── pre-commit               # ⑧ husky 활성화 (신설)
│
└── package.json                 # husky devDep + prepare script + validate npm script 추가
```

## 3. 역할 분리 (Single Responsibility)

| 문서 | 역할 | 길이 | 톤 |
|------|------|------|----|
| **`CLAUDE.md` (root)** | 컴파스. 명령어 + 모듈 맵 + 다른 4개 문서 포인터 | 25–30 ln | 영문, agent 지향 |
| **`README.md`** | 인간 독자 진입점. 프로젝트 정의 + 실행 방법 | 60–80 ln | 한국어 (user 글로벌 규칙) |
| **`MEMORY.md`** | 비명시 규칙. "Why" 가 있는 결정. 항목당 Rule + Why + How to apply 구조 | 40–60 ln | 영문 |
| **`ARCHITECTURE.md`** | 시각적 의존도. mermaid 2종 (① 모듈 의존도 ② Widget↔App 동기화 시퀀스) | 40–60 ln + diagrams | 영문 |
| **per-module `CLAUDE.md` (Tier 1)** | 모듈 진입점. 어떤 파일이 있고 어떤 패턴으로 변경하는지 | ~30 ln 각 | 영문 |
| **per-module `CLAUDE.md` (Tier 2)** | 단순 pointer. 무엇이 들어있는지만 | ~10 ln 각 | 영문 |

### root `CLAUDE.md` 압축 후 골격

현재 123 ln 의 내용은 다음과 같이 분산된다:

| 현재 위치 | 이동 후 |
|-----------|--------|
| Project Overview, Tech Stack | `README.md` |
| Common Commands | `CLAUDE.md` (유지, 핵심) |
| Directory Structure (상세) | `ARCHITECTURE.md` 의 mermaid + `README.md` 요약 |
| Core Architecture · Single Source of Truth | `ARCHITECTURE.md` |
| Widget ↔ App Sync (상세 단계) | `ARCHITECTURE.md` 시퀀스 mermaid |
| Swift Code Generation Path | `MEMORY.md` (Why prebuild 가 3단계인가) |
| Design System | `components/CLAUDE.md` 또는 `MEMORY.md` |
| Code Conventions | `CLAUDE.md` (유지, 짧게) |
| Important Notes (App Group · NativeWind · Push · iOS 17+) | `MEMORY.md` |

### Tier 1 module CLAUDE.md 템플릿

```markdown
# <module>/CLAUDE.md

<1줄 모듈 책임>

## Files
- `<file>.tsx` — <한 줄 설명>
...

## Patterns
- <변경 시 따를 패턴 1>
- <변경 시 따를 패턴 2>

## Touch points
- 변경 시 함께 봐야 할 외부 파일/모듈 (cross-ref)

## Gotchas
- 비명시 제약 (있을 때만)
```

### Tier 2 module CLAUDE.md 템플릿

```markdown
# <module>/CLAUDE.md

<1줄 모듈 책임>. <어떤 파일이 있는지>.

→ See `../<관련 module>/CLAUDE.md` for usage patterns.
```

## 4. 실행 순서 (의존성 기반)

```
Phase 0 — 검증 도구 빌드 (inert)
  S1. scripts/validate-context-paths.js 작성              ~0.5h
      → 즉시 1회 실행 → 26건 broken path 리스트 산출

Phase 1 — Root content 정정 (referential trust 회복)
  S2. README.md 한국어 전면 재작성                          ~1.0h
  S3. CLAUDE.md 압축 + path 정정 (123 → ~30 ln)            ~1.5h
      → S1 스크립트 재실행 → 0 broken 확인

Phase 2 — 보조 문서 신설
  S4. ARCHITECTURE.md + mermaid 2종                       ~2.5h
      ① 모듈 의존도 그래프
      ② Widget ↔ App 동기화 시퀀스
  S5. MEMORY.md (5–7개 항목)                              ~2.0h
      → S1 재실행 → 0 broken 확인

Phase 3 — Per-module 커버리지
  S6. Tier 1 — 8개 module CLAUDE.md (~30 ln each)         ~4.0h
       app, components, widgets, store, modules,
       ios, plugins, scripts
  S7. Tier 2 — 3개 module pointer (~10 ln each)           ~1.0h
       constants, i18n, types
      → S1 재실행 → 0 broken 확인

Phase 4 — 게이트 활성화 + 재측정
  S8. husky 설치 + pre-commit hook 활성화                 ~0.5h
      package.json 에 devDep + prepare + validate scripts
  S9. ai-readiness-cartography 재측정                     ~0.5h

총 ~13.5h
```

### 왜 이 순서인가

- **검증 도구는 먼저 만들되 enforce 는 마지막** — 도구 자체는 정정의 가이드. enforce 를 일찍 켜면 정정 commit 자체가 막힘.
- **Top-down (README → CLAUDE → 보조 → 모듈)** — 사실의 source of truth 부터 확정. 모듈이 root 를 거꾸로 강제하는 ripple 방지.
- **Phase 마다 S1 재실행** — 새로 추가한 문서가 다시 broken path 를 도입하지 않는지 검증.

## 5. `validate-context-paths.js` 설계

### 입력 / 검증 대상 파일

```js
const TARGETS = [
  'CLAUDE.md',
  'README.md',
  'MEMORY.md',
  'ARCHITECTURE.md',
  '*/CLAUDE.md',          // 1-depth subdirectory CLAUDE.md
];

const EXCLUDE_DIRS = [
  'node_modules',
  'ios/Pods',
  'ios/build',
  '.expo',
  '.git',
  '.worktrees',
  '.claude/worktrees',
];
```

### Path 후보 추출 규칙

| 형식 | 정규식 / 추출 방법 |
|------|---------------------|
| 백틱 인라인 코드 | `` `[^`]+` `` 중 `/` 또는 `.` 포함 |
| 마크다운 링크 | `\[.*?\]\((.+?)\)` — `http(s)://` 제외 |
| HTML `<code>` | `<code>(.+?)</code>` — `/` 또는 `.` 포함 |
| 코드블록 안 path-shaped 라인 | 한 토큰 단독 + 슬래시 또는 확장자 |

### 검증 로직

```js
for (const candidate of extracted) {
  if (/^https?:\/\//.test(candidate)) continue;       // 외부 URL skip
  if (/^@\//.test(candidate)) continue;                // alias '@/...' skip (resolveable)
  if (/^npm /.test(candidate) || /^npx /.test(candidate)) continue;  // 명령어
  if (candidate.includes('<') || candidate.includes('>')) continue;  // placeholder
  if (candidate.startsWith('group.com.')) continue;    // App Group ID
  if (candidate.endsWith('/')) {
    if (!fs.existsSync(candidate)) report(file, line, candidate);
  } else {
    if (!fs.existsSync(candidate)) report(file, line, candidate);
  }
}
```

### 출력

- 콘솔: `<source-file>:<line>: <broken-path>`
- exit 0 if 모두 OK, exit 1 if 1건이라도 broken

### Skip 마커

문서 작성자가 의도적으로 가상의 path 를 보여줘야 할 때 (예: README 의 "이렇게 폴더 구조가 될 수 있다" 류 가상 예시) :

```markdown
<!-- skip-validate-next -->
`some/hypothetical/path.ts`
```

다음 한 줄만 검증 제외.

### 의존성

- Node 내장 모듈만 (`fs`, `path`, `url`) 사용
- 외부 npm 패키지 추가 없음 (husky 제외)

## 6. husky 통합

### 신규 devDependency

```json
"devDependencies": {
  "husky": "^9.1.0"
}
```

### `package.json` scripts 추가

```json
"scripts": {
  "validate:context": "node scripts/validate-context-paths.js",
  "prepare": "husky"
}
```

### `.husky/pre-commit`

```sh
npm run validate:context
```

### 활성화 시점

S8 단계에서, 모든 컨텐츠가 통과하는 것을 확인한 후 `.husky/pre-commit` 파일 생성. 이 시점부터 모든 commit (인간 + Claude) 에 게이트가 적용된다.

## 7. 에러 처리 / 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 코드블록 내 가상의 예시 path | `<!-- skip-validate-next -->` 마커로 명시적 제외 |
| iOS Pods/3rd-party README | `EXCLUDE_DIRS` glob 으로 제외 |
| TS path alias `@/...` | skip (런타임에 resolve 되는 alias) |
| App Group ID `group.com.example.smoketap` | skip (식별자, path 아님) |
| 명령어 토큰 (`npm run ios`) | skip (백틱 안의 공백 포함 명령어) |
| 워크트리 환경 | git root 기준 상대경로 → cwd 무관 |
| 신규 placeholder `<file>.tsx` | `<` `>` 포함 토큰 skip |
| husky 미설치 환경 (CI 등) | `npm install` 후 `prepare` script 가 자동 실행 |

## 8. 테스트 / 검증

| 시점 | 검증 |
|------|------|
| S1 직후 | `node scripts/validate-context-paths.js` → audit 의 26건과 일치 확인 |
| S3 직후 | 동일 명령 → 0 broken |
| S5 직후 | 동일 명령 → 0 broken |
| S7 직후 | 동일 명령 → 0 broken |
| S8 직후 | 작은 sentinel 변경 (예: 임시 파일 생성 후 stage) → `git commit` 실행 → hook 이 validate:context 를 호출하고 0 broken 으로 통과 → 검증 후 sentinel 변경 revert |
| S9 (최종) | `python3 ~/.claude/skills/ai-readiness-cartography/scripts/score.py .` |

### 성공 기준

- ✓ `validate-context-paths.js` exit 0 (0 broken)
- ✓ husky pre-commit 활성, 정상 commit 통과
- ✓ AI-readiness 재측정 총점 ≥ 70 / 100
- ✓ 카테고리 별 목표 (현실적 추정):
  - A ≥ 13 / 15 — 11개 모듈에 CLAUDE.md (docs/ 제외, 11/12 coverage)
  - B ≥ 14 / 20 — 압축(B1) + bash 블록(B2) + 모듈 cross-refs(B5) 회복
  - C ≥ 14 / 20 — MEMORY.md + 모듈마다 dependency · patterns 섹션
  - D ≥ 11 / 15 — ARCHITECTURE.md + mermaid + 모듈 dep 섹션 11/11
  - E ≥ 7 / 15 — E1=5/5 만점 + E3=2/3 유지 (E2/E4 비목표)
  - F ≥ 5 / 10 — husky path validation (CI 비목표)
  - G = 0 / 5 — 비목표

→ 합계: 64 / 100 floor + 카테고리 sub-score 발산 시 ~70+ 도달 예상.
  (heuristic 채점이라 실제 측정은 재실행으로 확인.)

## 9. 위험 / 미해결

| 리스크 | 완화 |
|--------|------|
| validate-context-paths.js false positive (백틱 안의 placeholder 등) | skip 마커 + 합리적 정규식 + S1 직후 dry-run 으로 튜닝 |
| husky activation 이 user 의 다른 hook 과 충돌 | `.husky/_` directory 가 이미 있으면 보존, pre-commit 만 추가 |
| MEMORY.md 의 항목 선정 주관성 | CLAUDE.md `Important Notes` + Swift Code Generation Path 섹션을 1차 source 로 하여 mechanical 변환 |
| 모듈 CLAUDE.md 작성 중 새 path 도입 → broken | 매 phase 끝마다 S1 재실행으로 catch |
| audit 점수 ≥ 70 미달 | 점수 산정은 heuristic — 통과 항목 구체 기준은 재측정 시점에 확인. 미달 시 spec 의 비목표였던 G 카테고리 일부 추가로 보완 가능. |

## 10. 향후 사이클 (out of scope)

- **다음 PR**: G 카테고리 — `evals/` 디렉터리 + 대표 task pass-rate 측정 (~6h)
- **그 다음**: B 카테고리 god file 분할 — `docs/ui-design/*.jsx` (~7.5h, 디자인 ref 라 우선순위 낮음)

## 11. 변경 영향 (소스 코드)

본 spec 은 소스 코드를 수정하지 않는다. 변경 대상은:

- 신규: 14개 마크다운 + 1개 JS + 1개 husky hook
- 수정: `CLAUDE.md`, `README.md`, `package.json`
- 미변경: `app/**`, `components/**`, `widgets/**`, `store/**`, `modules/**`, `ios/**`, `plugins/**`, `scripts/*.js` (기존), `constants/**`, `i18n/**`, `types/**`

## 12. 결정 이력

| 결정 | 채택 | 대안 | 이유 |
|------|------|------|------|
| 스코프 | Foundation 6 (~15h) | Critical 3 / Full 8 | 단일 PR 적정 규모 + 의미 있는 점수 회복 |
| 모듈 커버리지 | Tier-based (8 + 3) | Full 12 / Core 5 | docs/ 제외 + 작업량 대비 ROI 최대 |
| 암묵지 형식 | MEMORY.md 단일 | docs/adr/ / hybrid | 소규모 솔로 프로젝트, ADR 정석은 과임 |
| 검증 게이트 | husky pre-commit only | + GitHub Actions | 로컬 차단으로 충분, 원격 CI 미설정 |
| 검증 도구 위치 | `scripts/validate-context-paths.js` | 별도 패키지 | 의존성 추가 회피 |
