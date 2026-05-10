# docs/

프로젝트 외부 문서. 빌드 산출물 아님 — production 코드에서 참조하지 않는다.

## Layout

| Path | Tracked? | Role |
|------|----------|------|
| `docs/ui-design/` | ✓ git | 디자인 스펙 JSX (참조용 mock, 실제 화면은 `app/` · `components/`에서 구현) |
<!-- skip-validate-next -->
| `docs/harness-flow/` | gitignored | 작업 절차/플랜 로컬 보관 (`plans/`, `specs/` 하위) |
<!-- skip-validate-next -->
| `docs/analyze/` | gitignored | 분석 작업용 임시 워크스페이스 (필요 시 생성) |

<!-- skip-validate-next -->
`.gitignore`에 `docs/harness-flow`, `docs/analyze`가 등록되어 있다 — 로컬 작업 노트 / 분석물은 push되지 않는다.

## Editing rules

<!-- skip-validate-next -->
- `docs/ui-design/*.jsx`는 **reference spec**이다. 토큰/레이아웃 의도를 바꾸려면 여기를 먼저 수정하고, 실제 코드(`app/`, `components/`)는 별도 PR/커밋으로 반영한다.
<!-- skip-validate-next -->
- 큰 파일 (`docs/ui-design/design-canvas.jsx` 622줄, `docs/ui-design/screens/clinical.jsx` 540줄, `docs/ui-design/screens/paper.jsx` 532줄)이 있다 — 부분 편집 시 `Edit` 도구로 정밀하게 다룰 것. 풀 read는 토큰 부담 큼.

## Cross-module deps

- **Depends on:** 없음 (production 코드에서 import 하지 않음).
- **Depended by:** `app/`, `components/` 변경 시 `docs/ui-design/`의 의도와 어긋나지 않는지 참조.
