# Repository Guidelines

## Project Structure & Module Organization
- Root `README.md` explains the multi-game roadmap. Active work happens under `games/project-da-vinci/`.
- `frontend/` holds the React + Vite client (`src/` for features, `public/` for static assets, Tailwind config at repo root). Keep UI specs in `docs/FRONTEND.md` and gameplay flows in `docs/AI.md`.
- `functions/` contains Firebase Cloud Functions (TypeScript src compiled to `lib/` on build). Align protocol changes with `docs/ARCHITECTURE.md` before coding.
- Shared auth or UI packages will eventually live in `shared/`; prefer extracting cross-game logic there instead of duplicating it per project.

## Build, Test, and Development Commands
- Frontend dev server: `cd games/project-da-vinci/frontend && npm run dev` (Vite + hot reload).
- Frontend build: `npm run build` (type-check then bundle) and `npm run preview` for serving the dist output.
- Lint/format: `npm run lint`, `npm run lint:fix`, and `npm run format` (Prettier on TS/CSS/MD).
- Tests: `npm run test` (Vitest watch), `npm run test:coverage` for CI numbers.
- Functions: `cd games/project-da-vinci/functions && npm run build` before `firebase deploy --only functions`; use `npm run serve` to run the emulator suite locally.

## Coding Style & Naming Conventions
- TypeScript everywhere; keep 2-space indentation and avoid default exports unless a module exposes a single entity.
- React components use PascalCase files (e.g., `CanvasBoard.tsx`), hooks and stores use camelCase (`useRoomStore.ts`).
- Zustand stores live under `src/stores`, UI atoms under `src/components`, and route views under `src/pages` for predictable imports.
- ESLint (flat config) + Prettier run via Husky/lint-staged; don’t bypass them—fix or annotate with `// eslint-disable-next-line` plus a justification.

## Testing Guidelines
- Unit/UI tests use Vitest + Testing Library; colocate `*.test.tsx` beside the component for faster discovery.
- Mock Firebase and Gemini calls via `vi.mock` to keep tests deterministic; record representative payloads in `docs/TODO.md`.
- Minimum expectation: every new store and route has at least one rendering test plus state-transition coverage. Add coverage comments to PRs if thresholds dip below current CI baseline.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as in recent history (`feat: AI 통합 - Gemini Vision API 연동`). Scope optional but helpful (`feat(frontend): lobby timer`).
- Each PR should reference the relevant cycle/issue, describe gameplay impact, list test commands run, and attach UI screenshots or emulator logs when behavior changes.
- Keep PRs under ~400 lines of diff; split frontend vs. functions work when both stacks change.

## Security & Configuration Tips
- Do not commit Firebase secrets or Gemini keys; store them in `.env.local` (frontend) or `.runtimeconfig.json` (functions). Add sample placeholders to `docs/CONFIG.md` when introducing new values.
- When using Canvas or DOMPurify, sanitize all AI-provided text before rendering. Validate drawable payloads in both the client and the callable function to prevent room takeovers.

## Agent Interaction Notes
- 팀 내에서 AI 에이전트를 호출할 때는 반드시 한국어로 응답하도록 설정해 일관된 커뮤니케이션 흐름을 유지하세요. 필요한 경우 프롬프트에 “한국어로만 답변할 것”을 명시해 두 번 확인합니다.
