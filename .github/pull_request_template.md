# Summary

<!-- 1–3 줄로: 무엇을 / 왜 바꾸는지. "어떻게"는 코드를 보면 된다. -->

## Type of change

- [ ] feat — 새로운 기능
- [ ] fix — 버그 수정
- [ ] refactor — 동작 변화 없음
- [ ] docs — CLAUDE.md / README / ARCHITECTURE 등 컨텍스트 문서
- [ ] build — prebuild · plugins · scripts · ios 빌드 surface
- [ ] chore — 그 외

## Verification

- [ ] `npx tsc --noEmit` 통과
- [ ] `npm run validate:context` 통과 (husky pre-commit에서도 자동 실행)
- [ ] iOS 시뮬레이터 실행 — 영향 받는 화면 직접 확인
- [ ] 위젯 변경 시: `npm run prebuild:ios` 후 widget tap 1회 → 앱 재진입 시 카운트 동기화 확인

## Native / build surface (해당 시)

- [ ] `expo prebuild` 직접 호출하지 않고 `npm run prebuild:ios` 사용
- [ ] `app.json` / `plugins/` / `scripts/patch-*.js` 변경 시 영향 범위(특히 `ios/Pods/` 재설치 여부)를 PR 본문에 적었다
- [ ] App Group ID 변경 시 `plugins/withSharedTapStore.js`와 `scripts/patch-widget.js` 동시 수정

## Context docs (해당 시)

- [ ] 변경된 모듈의 `<module>/CLAUDE.md` Cross-module deps 섹션 갱신
- [ ] 비명시적 결정·트레이드오프 → `MEMORY.md`에 Rule / Why / How to apply 형식으로 기록
- [ ] 신규 의존 / 흐름 → `ARCHITECTURE.md` mermaid 갱신

## Notes for reviewer

<!-- 리뷰어가 먼저 봐야 할 파일·시나리오, 의도적으로 남긴 TODO, 후속 PR 예고 등 -->
