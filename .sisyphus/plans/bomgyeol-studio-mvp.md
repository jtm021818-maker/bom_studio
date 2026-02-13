# 봄결 스튜디오 (Bomgyeol Studio) MVP - Complete Build Plan

## TL;DR

> **Quick Summary**: AI 영상 외주 특화 한국형 중개 플랫폼 "봄결 스튜디오"의 완성형 MVP 코드베이스를 Next.js 15 App Router + Supabase(Postgres + pgvector) + Better Auth + Toss Payments(에스크로) + Modusign(전자계약) 기반으로 처음부터 빌드한다.
>
> **Deliverables**:
> - 완성형 Next.js 15 App Router 프로젝트 (TypeScript strict)
> - Supabase SQL 스크립트 (17+ 테이블, RLS 정책, pgvector 인덱스)
> - Better Auth 인증 (Google OAuth + Email, 역할 기반)
> - AI 임베딩 파이프라인 + 하이브리드 검색 (하드필터 + 벡터)
> - AI 문서 생성 (SOW/Storyboard/Shotlist/Milestones)
> - 에스크로 결제 + 전자계약 어댑터 (더미 모드 포함)
> - Pastel Aura 디자인 시스템 (shadcn/ui + Tailwind v4)
> - TDD 테스트 (Vitest core/adapter + Playwright E2E)
> - .env.example + 실행/검증 절차
>
> **Estimated Effort**: XL (24 tasks across 7 waves)
> **Parallel Execution**: YES - 7 waves, Waves 3/4 have 3 parallel sub-streams each
> **Critical Path**: Wave 1 (Foundation) -> Wave 2 (Auth) -> Wave 3a (Projects) -> Wave 5 (Milestones) -> Wave 6 (Payment/Contract)

---

## Context

### Original Request
AI 영상 외주에 특화된 한국형 외주 중개 플랫폼을 Next.js 15(App Router) + Supabase(Postgres + pgvector) + Better Auth + Toss Payments(에스크로) + Modusign(전자계약) 기반으로, 복붙 후 바로 실행 가능한 "완성 상태 MVP"로 생성한다. 참고사이트: kmong.com

### Interview Summary
**Key Discussions**:
- 서비스명: "봄결 스튜디오 (Bomgyeol Studio)" 확정
- 톤앤매너: Pastel Aura (크림화이트 + 복숭아/세레니티 블루 그라데이션, 유리/젤리 질감)
- 테스트 전략: TDD (RED-GREEN-REFACTOR) - core/adapter 레이어에 Vitest, UI에 Playwright
- AI 모델: 환경변수로 모델 선택 가능 (기본값 gpt-4o-mini)
- Tailwind: v4 확정 (CSS-first @theme 방식, tw-animate-css 사용)
- 배포: Vercel 확정
- 언어: 한국어 UI만 (i18n 인프라 불필요)

**Research Findings**:
- Better Auth: Drizzle adapter로 Supabase Postgres 연결. `generateId: () => crypto.randomUUID()` 필수 (UUID 포맷 호환)
- Tailwind v4: tailwind.config.ts 불필요, CSS `@theme inline {}` 블록으로 설정. `tw-animate-css` 사용
- pgvector: HNSW 인덱스 추천 (<100K records), cosine distance, Supabase RPC 함수로 하이브리드 검색
- Toss Payments: 에스크로 API 존재. 어댑터 패턴 + 더미 fallback 확정
- Modusign: 한국 전자계약 REST API. 어댑터 패턴 + 더미 fallback 확정
- Ports/Adapters: `nikolovlazar/nextjs-clean-architecture` 참고. DI 컨테이너 불필요 (module-level singletons)

### Metis Review
**Identified Gaps** (addressed):

1. **Better Auth UUID 포맷 불일치** (CRITICAL) -> Wave 1에서 `generateId: () => crypto.randomUUID()` 설정. 모든 FK 호환 보장
2. **user -> profiles 관계 전략 미정** -> `afterCreate` 훅으로 signup 시 자동 profiles 레코드 생성
3. **ORM 전략 불명확** -> Drizzle for CRUD, Supabase client for Storage + RPC only
4. **Chat 구현 방식 미정** -> Polling 기반 (Supabase Realtime은 Better Auth 토큰 비호환)
11. **RLS + Drizzle 직접 연결 컨텍스트 전달** (CRITICAL - Momus 지적) -> **Option B 채택**: Drizzle 직결을 유지하되, 모든 user-scoped 쿼리 전에 트랜잭션 내에서 `SET LOCAL app.current_user_id = '<uuid>'`로 사용자 ID를 DB 세션에 주입. RLS 정책은 `current_setting('app.current_user_id', true)` 기반으로 작성. DB role은 `bypassrls` 아닌 일반 role 사용. 이를 위한 Drizzle wrapper 함수 `withUserContext(userId, callback)` 생성.
12. **pgTAP RLS 테스트 사용자 컨텍스트** (Momus 지적) -> pgTAP 테스트에서 `SELECT set_config('app.current_user_id', '<test-uuid>', true)` 후 쿼리 실행하여 RLS 검증. 구체적 패턴 Task 2에 명시.
13. **Admin RLS 정책 메커니즘** (Momus 지적) -> Admin 정책은 `current_setting('app.current_user_role', true) = 'admin'`으로 체크. Drizzle wrapper에서 Better Auth 세션의 role 정보도 함께 `SET LOCAL app.current_user_role = '<role>'`로 주입.
5. **소셜 로그인 범위** -> Google OAuth만 MVP. 카카오/네이버는 post-MVP
6. **AI 문서 생성 범위 팽창** -> P0에서 SOW 1종만. Storyboard/Shotlist/Milestones는 동일 추상화로 P1
7. **검수 게이트 복잡도** -> P0에서 2-state (submitted/approved). Full 4-step은 P1
8. **파일 업로드 Vercel 제한** -> Supabase Storage 직접 업로드 (4.5MB Vercel 제한 우회)
9. **모바일 반응형** -> 기본 반응형 레이아웃 포함 (Tailwind responsive utilities)
10. **통화 형식** -> KRW integer 저장, ₩ 콤마 포맷 표시

---

## Work Objectives

### Core Objective
AI 영상 외주에 특화된 한국형 중개 플랫폼 "봄결 스튜디오"의 완성형 MVP 코드베이스를 생성한다. 복붙 후 환경변수 설정만으로 로컬에서 바로 실행 가능해야 한다.

### Concrete Deliverables
- Next.js 15 프로젝트 전체 파일 트리 + 코드
- Supabase SQL 스크립트 3종 (스키마/RLS/시드)
- .env.example (22+ 환경변수)
- Vitest 테스트 (core/adapter)
- Playwright E2E 테스트
- 실행/검증 절차서

### Definition of Done
- [ ] `npm run build` 에러 없이 성공
- [ ] `npm run dev` 후 localhost:3000에서 랜딩 페이지 표시
- [ ] Drizzle 스키마가 Supabase에 문제없이 push
- [ ] 회원가입/로그인 플로우 동작
- [ ] 프로젝트 생성 + Video Brief 저장
- [ ] 전문가 검색(하이브리드) 결과 반환
- [ ] 채팅 메시지 송수신
- [ ] 파일 업로드/다운로드 동작
- [ ] `npm run test` 전체 PASS
- [ ] Playwright E2E 핵심 시나리오 PASS

### Must Have
- TypeScript strict mode (any 금지)
- Server/Client Component 분리 정확히
- Supabase RLS 정책 모든 user-scoped 테이블
- private Storage bucket + signed URL
- Ports/Adapters 아키텍처 (/src/core, /src/adapters, /src/app)
- 환경변수 없으면 더미 모드로 동작 (결제/계약/임베딩)
- 모든 금액 integer (KRW, 소수점 없음)
- Better Auth UUID 표준 호환 (`crypto.randomUUID()`)
- **RLS 사용자 컨텍스트 전달**: 모든 user-scoped Drizzle 쿼리는 `withUserContext(userId, role, callback)` wrapper 사용. 이 함수는 트랜잭션 내에서 `SET LOCAL app.current_user_id = $1; SET LOCAL app.current_user_role = $2;`를 실행한 후 callback을 실행. RLS 정책은 `current_setting('app.current_user_id', true)` 기반. DB 접속 role은 `bypassrls` 권한 없는 일반 role 사용.
- **Admin 접근 제어**: Admin RLS = `current_setting('app.current_user_role', true) = 'admin'`. 미들웨어에서 Better Auth 세션 -> ADMIN_EMAILS 체크 -> role='admin' 세팅.

### Must NOT Have (Guardrails)
- ioctopus 또는 DI 컨테이너 사용 금지 -> module-level singletons + direct imports
- Supabase Realtime 사용 금지 (Better Auth 토큰 비호환) -> polling/SSE
- Better Auth 테이블 직접 INSERT/UPDATE/DELETE 금지 -> Better Auth API만 사용
- RRF(Reciprocal Rank Fusion) 하이브리드 검색 금지 -> WHERE + vector ORDER BY만
- Server Component/Page 레벨 TDD 금지 -> core/adapter 레이어만 TDD
- 이메일 알림 시스템 금지
- Rate limiting 미들웨어 금지
- Analytics/tracking 금지
- SEO (sitemap, OG image, structured data) 금지
- 유저 아바타 업로드 금지 -> Google OAuth 아바타 또는 기본 아이콘
- 인앱 알림 센터 금지
- 검색 자동완성/typeahead 금지
- i18n 인프라 (next-intl 등) 금지
- admin 역할을 DB 레벨로 관리 금지 -> 하드코딩 이메일 체크
- `tailwindcss-animate` 금지 -> `tw-animate-css` 사용
- `tailwind.config.ts` 금지 -> CSS `@theme inline {}` 사용

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional - it applies to EVERY task, regardless of test strategy.
>
> **FORBIDDEN**:
> - "사용자가 직접 테스트..."
> - "사용자가 눈으로 확인..."
> - ANY step where a human must perform an action

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: TDD
- **Framework**: Vitest (unit/integration for core/adapter) + Playwright (E2E) + pgTAP (RLS)

### TDD Layers

| Layer | Test Type | Tool | TDD? |
|-------|-----------|------|------|
| `/src/core` use cases | Unit (in-memory adapters) | Vitest | YES |
| `/src/adapters` repos | Unit (mocked Supabase) | Vitest | YES |
| RLS Policies | DB unit tests | pgTAP via `supabase test db` | YES |
| Server Actions | Integration | Vitest | After impl |
| UI Pages | E2E | Playwright | After impl |

### Agent-Executed QA Scenarios

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Frontend/UI | Playwright (playwright skill) | Navigate, interact, assert DOM, screenshot |
| API/Backend | Bash (curl/httpie) | Send requests, parse responses, assert fields |
| DB/RLS | Bash (supabase test db) | Run pgTAP tests, validate RLS |
| Library/Module | Bash (vitest) | Import, call functions, compare output |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - SERIAL, blocks everything):
├── Task 1: Project scaffold + toolchain
├── Task 2: Supabase SQL schema + RLS + pgvector
└── Task 3: Design system (Pastel Aura theme + shadcn/ui + shared components)

Wave 2 (Auth - SERIAL, blocks features):
├── Task 4: Better Auth setup + Drizzle + middleware
├── Task 5: Auth pages + profile CRUD + role selection
└── Task 6: Auth tests (Vitest + Playwright E2E)

Wave 3 (Core Features - 3 PARALLEL sub-streams):
├── 3a: Task 7: Projects + Video Brief (form, CRUD, pages)
│   └── Task 8: AI SOW generation (streaming, single doc type)
├── 3b: Task 9: Creator profiles + portfolio + storage upload
│   └── Task 10: Search + embeddings (OpenAI adapter, RPC, explore page)
└── 3c: Task 11: Chat (polling-based, text-only, project-scoped)

Wave 4 (Interactions - 2 PARALLEL sub-streams):
├── 4a: Task 12: Proposals (CRUD, listing, project detail integration)
└── 4b: Task 13: AI Storyboard + Shotlist generation (expand doc types)

Wave 5 (P1 - Milestones & Delivery - SERIAL):
├── Task 14: Milestones CRUD + 2-state approval gate
├── Task 15: Deliveries (file upload, watermark toggle, preview)
└── Task 16: Full review gate timeline (4-step flow upgrade)

Wave 6 (P2 - Payment + Contract Adapters - SERIAL):
├── Task 17: Toss Payments adapter (dummy + real interface)
└── Task 18: Modusign adapter (dummy + real interface)

Wave 7 (P3 - Polish - 3 PARALLEL):
├── Task 19: Reviews (mutual rating/comment)
├── Task 20: Disputes (basic issue registration + evidence)
├── Task 21: Admin page (user/project listing, dispute view)
├── Task 22: Dashboard pages (client + creator)
├── Task 23: Landing page + explore page polish
└── Task 24: Final integration tests + deployment verification
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|-----------|--------|---------------------|
| 1 | None | 2,3,4 | None |
| 2 | 1 | 7,9,11,12,14 | 3 |
| 3 | 1 | 5,7,9,23 | 2 |
| 4 | 1,2 | 5,6,7,9,11 | None |
| 5 | 3,4 | 6,7 | None |
| 6 | 5 | Wave 3 | None |
| 7 | 2,5 | 8,12 | 9,11 |
| 8 | 7 | 13 | 10,11 |
| 9 | 2,3,5 | 10,12 | 7,11 |
| 10 | 9 | None | 8,11 |
| 11 | 2,5 | None | 7,9,10 |
| 12 | 7,9 | 14 | 13 |
| 13 | 8 | None | 12 |
| 14 | 2,7,12 | 15,17 | None |
| 15 | 14 | 16 | None |
| 16 | 15 | None | None |
| 17 | 14 | None | 18 |
| 18 | 14 | None | 17 |
| 19 | 7,14 | None | 20,21 |
| 20 | 7,14 | None | 19,21 |
| 21 | 4 | None | 19,20 |
| 22 | 7,14 | None | 23 |
| 23 | 3 | None | 22 |
| 24 | 19-23 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1,2,3 | task(category="unspecified-high", load_skills=["frontend-ui-ux"]) |
| 2 | 4,5,6 | task(category="deep", load_skills=["playwright"]) |
| 3 | 7-11 | 3 parallel: task(category="unspecified-high", load_skills=[...]) |
| 4 | 12,13 | 2 parallel: task(category="unspecified-high", load_skills=[]) |
| 5 | 14-16 | task(category="unspecified-high", load_skills=[]) |
| 6 | 17,18 | 2 parallel: task(category="unspecified-high", load_skills=[]) |
| 7 | 19-24 | 3 parallel then final: task(category="deep", load_skills=["playwright"]) |

---

## TODOs

### Wave 1: Foundation

- [x] 1. Project Scaffold + Toolchain Setup

  **What to do**:
  - `npx create-next-app@latest bomgyeol-studio --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (Next.js 15)
  - Configure TypeScript strict mode (`"strict": true, "noUncheckedIndexedAccess": true`)
  - Install dependencies:
    - `drizzle-orm pg @supabase/supabase-js` (DB)
    - `better-auth` (Auth)
    - `openai` (AI)
    - `zod react-hook-form @hookform/resolvers` (Forms)
    - `@tanstack/react-query` (Client state)
    - Dev: `vitest @testing-library/react playwright drizzle-kit tw-animate-css`
  - Create directory structure:
    ```
    /src/core/          - domain types, interfaces, use cases
    /src/core/types/    - shared TypeScript types
    /src/core/ports/    - adapter interfaces
    /src/core/usecases/ - business logic
    /src/adapters/      - external service implementations
    /src/adapters/db/   - Drizzle schema + repositories
    /src/adapters/ai/   - OpenAI adapter
    /src/adapters/payment/ - Toss adapter
    /src/adapters/contract/ - Modusign adapter
    /src/adapters/storage/ - Supabase Storage adapter
    /src/lib/           - shared utilities
    /src/components/    - shared UI components
    /src/app/           - Next.js App Router pages
    /supabase/          - SQL scripts
    /tests/             - Vitest tests
    /e2e/               - Playwright tests
    ```
  - Create `.env.example` with ALL variables:
    ```
    # === Supabase ===
    NEXT_PUBLIC_SUPABASE_URL=         # Supabase 프로젝트 URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key (public)
    SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server only)
    DATABASE_URL=                     # Postgres 런타임 연결 URL (RLS 적용 app role, bypassrls 없음)
    DATABASE_URL_ADMIN=               # Postgres 관리자 연결 URL (DDL/migrations/drizzle-kit push 전용)

    # === Better Auth ===
    BETTER_AUTH_SECRET=               # 세션 암호화 시크릿 (32자 이상 랜덤)
    BETTER_AUTH_URL=http://localhost:3000  # 인증 콜백 기본 URL
    GOOGLE_CLIENT_ID=                 # Google OAuth 클라이언트 ID
    GOOGLE_CLIENT_SECRET=             # Google OAuth 시크릿

    # === OpenAI ===
    OPENAI_API_KEY=                   # OpenAI API 키
    OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # 임베딩 모델
    OPENAI_CHAT_MODEL=gpt-4o-mini    # 문서 생성 모델 (gpt-4o-mini/gpt-4o)

    # === Toss Payments ===
    TOSS_PAYMENTS_SECRET_KEY=         # 토스페이먼츠 시크릿 키
    TOSS_PAYMENTS_CLIENT_KEY=         # 토스페이먼츠 클라이언트 키
    TOSS_PAYMENTS_WEBHOOK_SECRET=     # 웹훅 서명 검증 시크릿

    # === Modusign ===
    MODUSIGN_API_KEY=                 # 모두싸인 API 키
    MODUSIGN_WEBHOOK_SECRET=          # 웹훅 서명 검증 시크릿

    # === App ===
    ADMIN_EMAILS=admin@bomgyeol.studio  # 관리자 이메일 (콤마 구분)
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```
  - Create `vitest.config.ts` and `playwright.config.ts`
  - Create `drizzle.config.ts` pointing to `DATABASE_URL_ADMIN` (DDL/migrations 전용, 높은 권한)
  - 런타임 Drizzle client (`/src/adapters/db/client.ts`)는 `DATABASE_URL` (RLS 적용 app role) 사용
  - **DB 접속 URL 분리 전략**:
    - `DATABASE_URL_ADMIN`: superuser/postgres role. `drizzle-kit push`, `supabase migrations`, DDL 전용
    - `DATABASE_URL`: app role (bypassrls 없음). 런타임 쿼리 전용. RLS가 적용됨
  - **RED**: `tests/setup.test.ts` - assert project builds, env vars load
  - **GREEN**: Configure all above
  - **REFACTOR**: Clean up any boilerplate

  **Must NOT do**:
  - tailwind.config.ts 생성 금지 (v4는 CSS-first)
  - tailwindcss-animate 설치 금지 (tw-animate-css 사용)
  - ioctopus 또는 DI 컨테이너 설치 금지
  - next-intl 또는 i18n 라이브러리 설치 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Foundation setup is complex configuration spanning many files but not visual
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Needed for correct Tailwind v4 + shadcn/ui + Next.js 15 project setup

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 - Sequential first
  - **Blocks**: Tasks 2, 3, 4 (everything)
  - **Blocked By**: None (start immediately)

  **References**:

  **Pattern References**:
  - `nikolovlazar/nextjs-clean-architecture` (GitHub) - Ports/Adapters directory structure for Next.js

  **External References**:
  - Better Auth docs: `https://www.better-auth.com/docs/installation` - Setup with Next.js
  - Tailwind v4 docs: `https://tailwindcss.com/docs/installation/framework-guides/nextjs` - CSS-first setup
  - shadcn/ui: `https://ui.shadcn.com/docs/installation/next` - Next.js 15 installation
  - Drizzle: `https://orm.drizzle.team/docs/get-started/supabase-new` - Supabase Postgres setup

  **Acceptance Criteria**:

  - [ ] `npm run build` exits with code 0
  - [ ] `npm run dev` starts server, `curl localhost:3000` returns HTML
  - [ ] `vitest --run tests/setup.test.ts` PASS
  - [ ] Directory structure matches spec above
  - [ ] `.env.example` contains all 19+ variables (DATABASE_URL + DATABASE_URL_ADMIN 포함)
  - [ ] TypeScript strict mode enforced (`any` usage = compile error)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Project builds successfully
    Tool: Bash
    Preconditions: All dependencies installed
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0
      3. Assert: .next/ directory exists
    Expected Result: Build succeeds without errors
    Evidence: Build output captured

  Scenario: Dev server starts and serves landing page
    Tool: Bash
    Preconditions: Build passed
    Steps:
      1. Run: npm run dev &
      2. Wait 5s
      3. curl -s http://localhost:3000 > /tmp/landing.html
      4. Assert: file contains "봄결"
      5. Kill dev server
    Expected Result: Dev server responds with HTML
    Evidence: /tmp/landing.html content

  Scenario: Vitest runs setup test
    Tool: Bash
    Steps:
      1. Run: npx vitest --run tests/setup.test.ts
      2. Assert: exit code 0
      3. Assert: output contains "PASS"
    Expected Result: All setup tests pass
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(scaffold): initialize Next.js 15 project with Ports/Adapters structure`
  - Files: All scaffold files
  - Pre-commit: `npm run build`

---

- [x] 2. Supabase SQL Schema + RLS + pgvector

  **What to do**:
  - **RED**: Write pgTAP tests first for RLS policies:
    - `supabase/tests/rls_profiles.test.sql` - profiles 테이블 RLS 검증
    - `supabase/tests/rls_projects.test.sql` - projects 테이블 RLS 검증
    - `supabase/tests/rls_messages.test.sql` - messages 테이블 RLS 검증
    - **pgTAP 사용자 컨텍스트 패턴** (모든 테스트에서 사용):
      ```sql
      -- 사용자 A 컨텍스트 설정
      SELECT set_config('app.current_user_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
      SELECT set_config('app.current_user_role', 'client', true);
      -- 사용자 A의 프로필만 조회 가능 확인
      SELECT is(
        (SELECT count(*) FROM profiles WHERE id = 'aaaaaaaa-...')::int,
        1, 'User A can see own profile'
      );
      -- 사용자 B의 프로필은 조회 불가 확인
      SELECT is(
        (SELECT count(*) FROM profiles WHERE id = 'bbbbbbbb-...')::int,
        0, 'User A cannot see User B profile'
      );
      -- Admin 컨텍스트 설정
      SELECT set_config('app.current_user_role', 'admin', true);
      -- Admin은 전체 조회 가능
      SELECT is(
        (SELECT count(*) FROM profiles)::int > 1,
        true, 'Admin can see all profiles'
      );
      ```
  - Create Drizzle schema files in `/src/adapters/db/schema/`:
    - `profiles.ts` - profiles, creator_profiles (with embedding vector(1536))
    - `projects.ts` - projects, video_briefs, storyboard_items, shotlist_items (with embedding)
    - `interactions.ts` - proposals, contracts, milestones, deliveries, payments
    - `communication.ts` - messages, attachments
    - `feedback.ts` - reviews, disputes
    - `audit.ts` - embeddings_audit
  - Create `/supabase/migrations/001_schema.sql`:
    - `CREATE EXTENSION IF NOT EXISTS vector;`
    - All 17 tables with uuid PK, created_at, updated_at, deleted_at(nullable)
    - All vector(1536) columns
    - HNSW indexes for vector columns: `CREATE INDEX ON creator_profiles USING hnsw (embedding vector_cosine_ops);`
    - B-tree indexes: status, budget, category, availability
    - Composite indexes for common queries
  - Create `/supabase/migrations/002_rls.sql`:
    - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` for ALL tables
    - **RLS 사용자 컨텍스트 기반**: 모든 정책은 `current_setting('app.current_user_id', true)::uuid`로 사용자 식별
    - **Admin 정책**: `current_setting('app.current_user_role', true) = 'admin'`으로 전체 접근
    - profiles: `USING (id = current_setting('app.current_user_id', true)::uuid)` 본인만 읽기/쓰기
    - projects: 생성자만 수정 (`client_id = current_setting('app.current_user_id', true)::uuid`), open 상태는 누구나 SELECT
    - proposals: 프로젝트 클라이언트 + 제안 크리에이터만
    - milestones/payments/deliveries/contracts: 프로젝트 관계자만 (client_id 또는 creator_id가 current_user)
    - messages/attachments: 프로젝트 관계자만
    - **DB role 설정**: 앱용 role은 `bypassrls` 권한 없음. `supabase/migrations/000_roles.sql`에서 앱 전용 role 생성
  - Create `/supabase/migrations/003_functions.sql`:
    - `hybrid_search_creators(query_embedding, filters, limit)` - 하이브리드 검색 RPC
    - `hybrid_search_projects(query_embedding, filters, limit)` - 프로젝트 검색 RPC
  - Create `/supabase/seed.sql` with test data (선택사항)
  - **GREEN**: `drizzle-kit push` succeeds, pgTAP tests pass
  - **REFACTOR**: Index optimization

  **Must NOT do**:
  - Supabase Auth 관련 테이블/정책 생성 금지 (Better Auth 사용)
  - RLS에서 `auth.uid()` 사용 금지 (Better Auth는 다른 세션 메커니즘) -> `current_setting('app.current_user_id', true)::uuid` 사용
  - `SECURITY DEFINER` 함수를 무분별하게 사용 금지
  - `postgres` superuser role로 앱 연결 금지 -> `bypassrls` 없는 앱 전용 role 사용

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex SQL schema design with RLS policies, pgvector indexes, and hybrid search functions requires deep logical reasoning
  - **Skills**: []
    - No browser/git skills needed for SQL work

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: Tasks 7, 9, 11, 12, 14
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - Drizzle + pgvector: `https://orm.drizzle.team/docs/extensions/pg#pg_vector`
  - Supabase pgvector: `https://supabase.com/docs/guides/ai/vector-columns`

  **External References**:
  - Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security`
  - pgvector HNSW: `https://github.com/pgvector/pgvector#hnsw`
  - Supabase hybrid search: `https://supabase.com/docs/guides/ai/hybrid-search`
  - pgTAP: `https://supabase.com/docs/guides/database/extensions/pgtap`

  **WHY Each Reference Matters**:
  - RLS 정책은 Better Auth의 user.id를 기반으로 작성. Supabase Auth의 `auth.uid()` 대신 커스텀 함수 또는 앱 레벨 체크 필요
  - HNSW 인덱스는 100K 레코드 이하에서 IVFFlat보다 빠르고 정확
  - 하이브리드 검색 함수는 SECURITY INVOKER로 작성하되, Better Auth 세션과 연동 방식 고려

  **Acceptance Criteria**:

  - [ ] pgTAP tests: `supabase test db` 전체 PASS
  - [ ] `drizzle-kit push --force` 에러 없이 완료
  - [ ] 17개 테이블 모두 생성 확인: `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'` >= 17
  - [ ] vector 컬럼 존재 확인: `SELECT column_name FROM information_schema.columns WHERE data_type = 'USER-DEFINED' AND udt_name = 'vector'` >= 3
  - [ ] RLS 활성화 확인: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity` = 0 rows
  - [ ] HNSW 인덱스 존재 확인: `SELECT indexname FROM pg_indexes WHERE indexdef LIKE '%hnsw%'` >= 3

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Schema deploys to Supabase without errors
    Tool: Bash
    Preconditions: Supabase local running (supabase start), DATABASE_URL configured
    Steps:
      1. npx drizzle-kit push --force
      2. Assert: exit code 0
      3. Run: psql $DATABASE_URL -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
      4. Assert: count >= 17
    Expected Result: All tables created
    Evidence: psql output captured

  Scenario: RLS policies block unauthorized access
    Tool: Bash
    Preconditions: Schema deployed, pgTAP tests created
    Steps:
      1. supabase test db
      2. Assert: exit code 0
      3. Assert: output contains "All tests passed"
    Expected Result: RLS correctly restricts access
    Evidence: Test output captured

  Scenario: Hybrid search function works
    Tool: Bash
    Preconditions: Schema deployed, test data seeded
    Steps:
      1. psql $DATABASE_URL -c "SELECT * FROM hybrid_search_creators('{0.1,0.2,...}'::vector(1536), '{}', 10)"
      2. Assert: returns rows (or empty if no data, no error)
    Expected Result: Function executes without error
    Evidence: Query output captured
  ```

  **Commit**: YES
  - Message: `feat(db): add complete Supabase schema with RLS, pgvector, and hybrid search functions`
  - Files: `/src/adapters/db/schema/*`, `/supabase/*`
  - Pre-commit: `npx drizzle-kit push --force`

---

- [x] 3. Design System (Pastel Aura Theme + shadcn/ui + Shared Components)

  **What to do**:
  - Configure Tailwind v4 Pastel Aura theme in `src/app/globals.css`:
    ```css
    @import "tailwindcss";
    @import "tw-animate-css";

    @theme inline {
      --color-cream: #FFF8F0;
      --color-peach-50: #FFF5EE;
      --color-peach-100: #FFE8D6;
      --color-peach-200: #FFD4B8;
      --color-peach-300: #FFC09A;
      --color-peach-400: #FFAC7C;
      --color-peach-500: #FF9B6A;
      --color-serenity-50: #F0F4FF;
      --color-serenity-100: #D6E4FF;
      --color-serenity-200: #B8CFFF;
      --color-serenity-300: #9AB8FF;
      --color-serenity-400: #7CA1FF;
      --color-serenity-500: #6B8FE6;
      --color-glass: rgba(255, 255, 255, 0.72);
      --color-glass-border: rgba(255, 255, 255, 0.18);
      /* ... 상태 뱃지 색상 */
      --color-status-open: #4ADE80;
      --color-status-progress: #60A5FA;
      --color-status-review: #FBBF24;
      --color-status-completed: #34D399;
      --color-status-disputed: #F87171;
      --radius-jelly: 1rem;
      --shadow-soft: 0 2px 16px rgba(0,0,0,0.06);
    }
    ```
  - Initialize shadcn/ui: `npx shadcn@latest init`
  - Add core shadcn components: Button, Input, Card, Dialog, Badge, Tabs, Select, Textarea, Table, Skeleton, Toast, Avatar, Separator, Form
  - Create shared components:
    - `StatusBadge` - 프로젝트/마일스톤 상태 뱃지
    - `GlassCard` - 유리 질감 카드 (backdrop-blur)
    - `JellyButton` - 젤리 느낌 CTA 버튼
    - `FileUploader` - Supabase Storage 직접 업로드 컴포넌트
    - `RoleBadge` - 클라이언트/크리에이터 역할 뱃지
    - `MoneyDisplay` - ₩ KRW 포맷 표시 컴포넌트
    - `TimelineGate` - 검수 게이트 타임라인 시각화
    - `AppShell` - 전체 레이아웃 (헤더/사이드바/콘텐츠)
  - **RED**: Vitest 테스트 - StatusBadge 렌더링, MoneyDisplay 포맷팅
  - **GREEN**: 구현
  - **REFACTOR**: Storybook-like preview page (optional)

  **Must NOT do**:
  - tailwind.config.ts 파일 생성 금지
  - CSS Modules 사용 금지 (Tailwind utility 사용)
  - 복잡한 애니메이션 라이브러리 (framer-motion 등) 설치 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Design system, theming, UI components - visual domain
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Essential for Pastel Aura design implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 5, 7, 9, 23
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - Tailwind v4 theming: `https://tailwindcss.com/docs/theme` - @theme inline directive
  - shadcn/ui: `https://ui.shadcn.com/docs/theming` - CSS variable theming
  - tw-animate-css: `https://github.com/Wombosvideo/tw-animate-css` - Replacement for tailwindcss-animate

  **Acceptance Criteria**:

  - [ ] Vitest: `vitest --run tests/components/` PASS
  - [ ] globals.css contains `@theme inline` block with Pastel Aura colors
  - [ ] shadcn/ui components installed: `ls src/components/ui/` shows 14+ files
  - [ ] StatusBadge renders all 6 status types with correct colors
  - [ ] MoneyDisplay formats 1500000 as "₩1,500,000"

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Design system components render correctly
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:3000 (or a test page)
      2. Assert: CSS custom properties loaded (--color-cream exists)
      3. Assert: Glass card has backdrop-blur style
      4. Screenshot: .sisyphus/evidence/task-3-design-system.png
    Expected Result: Pastel Aura theme applied
    Evidence: .sisyphus/evidence/task-3-design-system.png

  Scenario: MoneyDisplay formats KRW correctly
    Tool: Bash (vitest)
    Steps:
      1. npx vitest --run tests/components/money-display.test.ts
      2. Assert: exit code 0
      3. Assert: 1500000 formatted as "₩1,500,000"
      4. Assert: 0 formatted as "₩0"
    Expected Result: All format tests pass
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat(ui): add Pastel Aura design system with shadcn/ui and shared components`
  - Files: `src/app/globals.css`, `src/components/*`
  - Pre-commit: `npm run build`

---

### Wave 2: Auth + Profiles

- [x] 4. Better Auth Setup + Drizzle Integration + Middleware

  **What to do**:
  - Configure Better Auth in `/src/lib/auth.ts`:
    - `drizzleAdapter(db, { provider: "pg" })` for Postgres
    - `generateId: () => crypto.randomUUID()` (CRITICAL - UUID 호환)
    - Google OAuth plugin: `socialProviders: { google: { clientId, clientSecret } }`
    - Email/password plugin
    - `nextCookies()` plugin for Next.js
    - Custom `afterCreate` hook: signup 시 profiles 레코드 자동 생성
  - Create `/src/lib/auth-client.ts` for client-side auth utilities
  - Create API route: `/src/app/api/auth/[...all]/route.ts` -> `toNextJsHandler(auth)`
  - Create middleware: `/src/middleware.ts`
    - Protected routes: `/dashboard/*`, `/project/*`, `/admin/*`
    - Public routes: `/`, `/auth`, `/explore/*`, `/creator/*`
    - Admin check: `ADMIN_EMAILS` 환경변수 기반
  - Create Drizzle client: `/src/adapters/db/client.ts`
  - Create **RLS context wrapper**: `/src/adapters/db/with-user-context.ts`
    - `withUserContext<T>(userId: string, role: string, callback: (tx: Transaction) => Promise<T>): Promise<T>`
    - 내부: `db.transaction(async (tx) => { await tx.execute(sql\`SET LOCAL app.current_user_id = ${userId}\`); await tx.execute(sql\`SET LOCAL app.current_user_role = ${role}\`); return callback(tx); })`
    - 모든 user-scoped repository 메서드에서 이 wrapper를 사용
    - 이를 통해 Drizzle 직접 연결에서도 RLS가 동작
  - Create Supabase client: `/src/adapters/storage/client.ts` (Storage + RPC only)
  - **중요: DB 접속 URL 분리**:
    - `DATABASE_URL`: 앱 전용 role (예: `bomgyeol_app`, `bypassrls` 없음). 런타임 Drizzle client가 사용. RLS가 적용됨.
    - `DATABASE_URL_ADMIN`: postgres/superuser role. `drizzle-kit push`, migrations, seed 전용. 런타임에서는 절대 사용 금지.
    - `/supabase/migrations/000_roles.sql`에서 앱 전용 role 생성: `CREATE ROLE bomgyeol_app LOGIN PASSWORD '...' NOSUPERUSER NOCREATEDB NOCREATEROLE;`
    - 앱 전용 role에 필요한 테이블 GRANT: `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bomgyeol_app;`
  - **RED**: `tests/auth/auth-setup.test.ts` - auth config validates, middleware redirects
  - **GREEN**: Implement
  - **REFACTOR**: Extract auth utilities

  **Must NOT do**:
  - Supabase Auth 사용 금지 (Better Auth만)
  - Better Auth 테이블 직접 접근 금지
  - InversifyJS 또는 reflect-metadata 사용 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Auth integration is security-critical and requires deep understanding of Better Auth + Drizzle + middleware
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 - Sequential
  - **Blocks**: Tasks 5, 6, 7, 9, 11
  - **Blocked By**: Tasks 1, 2

  **References**:

  **External References**:
  - Better Auth Next.js: `https://www.better-auth.com/docs/integrations/next-js`
  - Better Auth Drizzle: `https://www.better-auth.com/docs/adapters/drizzle`
  - Better Auth Google OAuth: `https://www.better-auth.com/docs/authentication/social-sign-in`
  - Better Auth Middleware: `https://www.better-auth.com/docs/integrations/next-js#middleware`
  - t3-oss/create-t3-app: Better Auth + Drizzle 패턴 참고

  **Acceptance Criteria**:

  - [ ] Vitest: auth-setup.test.ts PASS
  - [ ] `crypto.randomUUID()` 형식의 user ID 생성 확인
  - [ ] Middleware: unauthenticated GET /dashboard/client -> 302 redirect /auth
  - [ ] Middleware: authenticated GET /dashboard/client -> 200

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Auth API endpoints respond
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/ok
      2. Assert: HTTP status is 200
    Expected Result: Better Auth API is alive
    Evidence: HTTP status captured

  Scenario: Protected route redirects unauthenticated
    Tool: Bash (curl)
    Preconditions: Dev server running, no auth cookie
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3000/dashboard/client
      2. Assert: HTTP status is 200 (after redirect to /auth)
    Expected Result: Redirect to auth page
    Evidence: HTTP status + redirect chain captured
  ```

  **Commit**: YES
  - Message: `feat(auth): setup Better Auth with Drizzle, Google OAuth, middleware`
  - Files: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/*`, `src/middleware.ts`
  - Pre-commit: `npm run build`

---

- [x] 5. Auth Pages + Profile CRUD + Role Selection

  **What to do**:
  - `/src/app/auth/page.tsx` - 로그인/회원가입 (Client Component)
    - Email/Password 탭 + Google OAuth 버튼
    - 회원가입 시 역할 선택 (의뢰인/크리에이터)
    - Pastel Aura 디자인 적용
  - `/src/app/auth/layout.tsx` - 인증 페이지 레이아웃 (센터 카드)
  - Profile CRUD:
    - `/src/core/usecases/profile.ts` - getProfile, updateProfile
    - `/src/adapters/db/repositories/profile.ts` - DB 구현
    - `/src/app/api/profiles/route.ts` - API route
  - Creator Profile CRUD:
    - `/src/core/usecases/creator-profile.ts`
    - `/src/adapters/db/repositories/creator-profile.ts`
  - Role-based redirect: 로그인 후 역할에 따라 /dashboard/client 또는 /dashboard/creator로
  - **RED**: Vitest - profile CRUD use case tests
  - **GREEN**: Implement
  - **REFACTOR**: Form validation cleanup

  **Must NOT do**:
  - 아바타 업로드 금지 (Google OAuth 아바타 또는 기본 아이콘)
  - 복잡한 온보딩 위자드 금지 (단일 페이지)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Auth pages have significant UI work with Pastel Aura theme
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 - Sequential (after Task 4)
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: Tasks 3, 4

  **References**:

  **External References**:
  - Better Auth sign-in: `https://www.better-auth.com/docs/concepts/client`
  - React Hook Form + Zod: `https://react-hook-form.com/get-started#SchemaValidation`

  **Acceptance Criteria**:

  - [ ] Vitest: profile use case tests PASS
  - [ ] Auth page renders with email/password form + Google button
  - [ ] Signup creates user + profile in DB
  - [ ] Role selection persists (client or creator)
  - [ ] Post-login redirect to correct dashboard

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Email signup creates user and profile
    Tool: Bash (curl)
    Steps:
      1. curl -s -X POST http://localhost:3000/api/auth/sign-up/email -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"Test1234!","name":"테스트"}'
      2. Assert: response contains user.id (UUID format)
      3. Assert: profiles table has matching record
    Expected Result: User and profile created
    Evidence: Response body captured

  Scenario: Auth page renders correctly
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to: http://localhost:3000/auth
      2. Wait for: input[name="email"] visible (timeout: 5s)
      3. Assert: Google OAuth button visible
      4. Assert: Role selection visible (의뢰인/크리에이터)
      5. Screenshot: .sisyphus/evidence/task-5-auth-page.png
    Expected Result: Auth page loads with all elements
    Evidence: .sisyphus/evidence/task-5-auth-page.png
  ```

  **Commit**: YES
  - Message: `feat(auth): add auth pages, profile CRUD, role selection`
  - Files: `src/app/auth/*`, `src/core/usecases/profile.ts`, `src/adapters/db/repositories/profile.ts`
  - Pre-commit: `npm run build && npx vitest --run`

---

- [x] 6. Auth Integration Tests + E2E

  **What to do**:
  - Playwright E2E: `e2e/auth-flow.spec.ts`
    - Signup -> role select -> dashboard redirect
    - Login -> dashboard
    - Logout -> redirect to landing
    - Protected route access without auth -> redirect to /auth
  - Vitest integration: middleware redirect tests
  - Verify RLS works with Better Auth user context

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Wave 3
  - **Blocked By**: Task 5

  **Acceptance Criteria**:
  - [ ] Playwright: `npx playwright test e2e/auth-flow.spec.ts` PASS
  - [ ] All auth scenarios covered (signup, login, logout, protected routes)

  **Commit**: YES
  - Message: `test(auth): add E2E auth flow tests`

---

### Wave 3: Core Features (PARALLEL)

- [ ] 7. Projects + Video Brief (Form, CRUD, Pages) [Stream 3a]

  **What to do**:
  - Core domain:
    - `/src/core/types/project.ts` - Project, VideoBrief, ProjectStatus types
    - `/src/core/ports/project-repository.ts` - interface
    - `/src/core/usecases/project.ts` - createProject, getProject, listProjects, updateProject
  - Adapter:
    - `/src/adapters/db/repositories/project.ts` - Drizzle implementation
  - Pages:
    - `/src/app/project/new/page.tsx` - 프로젝트 생성 폼 (multi-step)
      - Step 1: 기본 정보 (제목/목표/채널/타겟/예산/마감)
      - Step 2: Video Brief (길이/해상도/비율/fps/스타일/금지요소/레퍼런스)
      - Step 3: 브랜드 자산 업로드 (로고/가이드/레퍼런스 파일)
      - Step 4: 검토 + AI SOW 생성 버튼
    - `/src/app/project/[id]/page.tsx` - 프로젝트 상세
    - `/src/app/explore/projects/page.tsx` - 공개 프로젝트 목록
  - Zod validation schemas for all forms
  - **RED**: TDD for project use cases (create, get, list, update)
  - **GREEN**: Implement
  - **REFACTOR**: Form UX polish

  **Must NOT do**:
  - 검색 자동완성 금지
  - 복잡한 필터 UI 금지 (기본 드롭다운 필터만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 11)
  - **Blocks**: Tasks 8, 12
  - **Blocked By**: Tasks 2, 5

  **References**:
  - Zod: `https://zod.dev/?id=basic-usage` - Schema validation
  - React Hook Form: Multi-step form pattern
  - 크몽 프로젝트 등록 플로우 참고

  **Acceptance Criteria**:
  - [ ] Vitest: project use case tests PASS
  - [ ] 프로젝트 생성 폼 4단계 모두 동작
  - [ ] Video Brief 모든 필드 저장
  - [ ] /explore/projects에서 open 프로젝트 목록 표시
  - [ ] /project/[id]에서 프로젝트 상세 표시

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Multi-step project creation
    Tool: Playwright (playwright skill)
    Preconditions: User logged in as client
    Steps:
      1. Navigate to: http://localhost:3000/project/new
      2. Fill Step 1: title="테스트 프로젝트", channel="youtube_short", budget_min=500000
      3. Click: "다음" button
      4. Fill Step 2: duration="30s", resolution="1080", aspect_ratio="9:16", fps="30"
      5. Click: "다음"
      6. Skip Step 3 (파일 업로드 optional)
      7. Click: "프로젝트 생성"
      8. Wait for: /project/[id] redirect
      9. Assert: h1 contains "테스트 프로젝트"
      10. Screenshot: .sisyphus/evidence/task-7-project-created.png
    Expected Result: Project created and redirected to detail
    Evidence: .sisyphus/evidence/task-7-project-created.png
  ```

  **Commit**: YES
  - Message: `feat(projects): add project CRUD, video brief form, explore page`

---

- [ ] 8. AI SOW Generation (Streaming, Single Doc Type) [Stream 3a]

  **What to do**:
  - Core:
    - `/src/core/ports/ai-document-generator.ts` - interface `generateDocument(type, brief): AsyncGenerator<string>`
    - `/src/core/types/document.ts` - DocumentType enum (SOW, STORYBOARD, SHOTLIST, MILESTONES)
    - `/src/core/usecases/generate-document.ts` - orchestrates generation + DB save
  - Adapter:
    - `/src/adapters/ai/openai-document-generator.ts` - OpenAI 구현
    - `/src/adapters/ai/mock-document-generator.ts` - 더미 (OPENAI_API_KEY 없을 때)
    - 환경변수 `OPENAI_CHAT_MODEL`로 모델 선택
    - Streaming response (Server-Sent Events)
  - API:
    - `/src/app/api/projects/[id]/generate-sow/route.ts` - SSE streaming endpoint
  - UI:
    - 프로젝트 상세에서 "AI SOW 생성" 버튼 + 스트리밍 미리보기
    - 생성 후 편집 가능 (textarea)
  - **RED**: TDD for document generation use case (mock adapter)
  - **GREEN**: Implement with real OpenAI + mock fallback
  - **REFACTOR**: Prompt engineering optimization

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 7)
  - **Blocks**: Task 13
  - **Blocked By**: Task 7

  **Acceptance Criteria**:
  - [ ] Vitest: document generation use case PASS (with mock)
  - [ ] Without OPENAI_API_KEY: mock generator returns placeholder SOW
  - [ ] With OPENAI_API_KEY: streaming SSE response from OpenAI
  - [ ] Generated SOW saved to DB, editable in UI

  **Commit**: YES
  - Message: `feat(ai): add SOW generation with streaming and mock fallback`

---

- [ ] 9. Creator Profiles + Portfolio + Storage Upload [Stream 3b]

  **What to do**:
  - Creator profile detail page: `/src/app/creator/[id]/page.tsx`
  - Portfolio CRUD:
    - `/src/core/usecases/portfolio.ts`
    - `/src/adapters/db/repositories/portfolio.ts`
  - Storage adapter:
    - `/src/adapters/storage/supabase-storage.ts` - upload, getSignedUrl, delete
    - `/src/core/ports/storage.ts` - interface
  - FileUploader component integration (from Task 3)
  - Supabase Storage bucket setup (private, signed URLs)
  - **RED**: TDD for portfolio CRUD, storage adapter
  - **GREEN**: Implement
  - **REFACTOR**: Image/video preview optimization

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 11)
  - **Blocks**: Tasks 10, 12
  - **Blocked By**: Tasks 2, 3, 5

  **Acceptance Criteria**:
  - [ ] Vitest: portfolio use case + storage adapter PASS
  - [ ] File upload to Supabase Storage (signed URL)
  - [ ] Creator profile page displays portfolio items
  - [ ] Private files accessible only via signed URL

  **Commit**: YES
  - Message: `feat(creator): add creator profiles, portfolio CRUD, storage upload`

---

- [ ] 10. Search + Embeddings (OpenAI Adapter, RPC, Explore Page) [Stream 3b]

  **What to do**:
  - Embedding pipeline:
    - `/src/adapters/ai/openai-embedding.ts` - generateEmbedding(text): vector
    - `/src/adapters/ai/mock-embedding.ts` - deterministic hash-based 1536-dim vector (offline dev)
    - `/src/core/ports/embedding-generator.ts` - interface
  - Embedding triggers:
    - Project create/update -> embed (description + brief summary)
    - Creator profile create/update -> embed (intro + skills + tools)
    - Portfolio create/update -> embed (description + tags)
  - Hybrid search:
    - `/src/core/usecases/search-creators.ts` - hard filter + vector search + re-rank
    - `/src/adapters/db/repositories/search.ts` - calls Supabase RPC `hybrid_search_creators`
  - Re-ranking:
    - `final_score = (similarity * 0.5) + (rating_norm * 0.2) + (completion_rate * 0.15) + (response_speed_norm * 0.1) + (recency_norm * 0.05)`
  - Search UI: `/src/app/explore/projects/page.tsx` 에 필터 + 결과 통합
  - 추천 이유 표시: "포트폴리오 스타일 매칭", "높은 평점" 등 태그
  - **RED**: TDD for embedding + search use cases
  - **GREEN**: Implement
  - **REFACTOR**: Search performance tuning

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 9)
  - **Blocks**: None
  - **Blocked By**: Task 9

  **Acceptance Criteria**:
  - [ ] Vitest: embedding + search use case PASS
  - [ ] Mock embedding: deterministic vector from text hash
  - [ ] Hybrid search returns ranked results with similarity scores
  - [ ] Re-ranking weights applied correctly

  **Commit**: YES
  - Message: `feat(search): add hybrid vector search with embeddings and re-ranking`

---

- [ ] 11. Chat (Polling-based, Text-only, Project-scoped) [Stream 3c]

  **What to do**:
  - Core:
    - `/src/core/usecases/chat.ts` - sendMessage, getMessages (with pagination)
    - `/src/core/ports/message-repository.ts`
  - Adapter:
    - `/src/adapters/db/repositories/message.ts`
  - API:
    - `/src/app/api/projects/[id]/messages/route.ts` - GET (poll), POST (send)
  - UI:
    - `/src/app/project/[id]/_components/ChatPanel.tsx` - Client Component
    - Polling interval: 5 seconds
    - Text-only, chronological order
    - 상대방 연락처 직접 노출 방지
  - **RED**: TDD for chat use case
  - **GREEN**: Implement
  - **REFACTOR**: Optimize polling

  **Must NOT do**:
  - Supabase Realtime 금지
  - 타이핑 인디케이터, 읽음 표시, 파일 첨부 금지
  - 리치 텍스트 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9)
  - **Blocks**: None
  - **Blocked By**: Tasks 2, 5

  **Acceptance Criteria**:
  - [ ] Vitest: chat use case PASS
  - [ ] Messages persist and load correctly
  - [ ] Polling updates every 5 seconds
  - [ ] Only project participants can access chat

  **Commit**: YES
  - Message: `feat(chat): add polling-based project chat`

---

### Wave 4: Interactions (PARALLEL)

- [ ] 12. Proposals (CRUD, Listing, Project Detail Integration)

  **What to do**:
  - Core: `/src/core/usecases/proposal.ts` - createProposal, listByProject, acceptProposal
  - Adapter: `/src/adapters/db/repositories/proposal.ts`
  - UI: 프로젝트 상세 내 제안서 탭
  - Creator: 제안서 작성 폼 (납기/마일스톤/수정범위/가격)
  - Client: 제안서 목록 + 수락/거절
  - **RED**: TDD for proposal use case
  - **GREEN**: Implement
  - **REFACTOR**: UI polish

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 13)
  - **Blocks**: Task 14
  - **Blocked By**: Tasks 7, 9

  **Acceptance Criteria**:
  - [ ] Creator can submit proposal
  - [ ] Client sees proposal list
  - [ ] Proposal acceptance changes project status

  **Commit**: YES
  - Message: `feat(proposals): add proposal CRUD and project integration`

---

- [ ] 13. AI Storyboard + Shotlist Generation (Expand Doc Types)

  **What to do**:
  - Extend Task 8's `generateDocument` to support STORYBOARD and SHOTLIST types
  - Storyboard: 6-12 scenes (씬번호/설명/목표/참고/검수상태)
  - Shotlist: 12-30 shots (카메라/모션/효과/길이/참고)
  - AI Milestones 추천 (4단계)
  - 생성 결과 DB 저장 + UI 편집
  - **RED**: TDD for storyboard/shotlist generation
  - **GREEN**: Implement
  - **REFACTOR**: Prompt optimization

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 12)
  - **Blocks**: None
  - **Blocked By**: Task 8

  **Acceptance Criteria**:
  - [ ] Storyboard generates 6-12 scenes
  - [ ] Shotlist generates 12-30 shots
  - [ ] All saved to DB (storyboard_items, shotlist_items)
  - [ ] Editable in UI

  **Commit**: YES
  - Message: `feat(ai): add storyboard and shotlist generation`

---

### Wave 5: Milestones & Delivery (P1 - SERIAL)

- [ ] 14. Milestones CRUD + 2-State Approval Gate

  **What to do**:
  - Core: `/src/core/usecases/milestone.ts` - create, update, approve, requestRevision
  - Adapter: `/src/adapters/db/repositories/milestone.ts`
  - UI: 프로젝트 상세 내 마일스톤 탭 + TimelineGate 컴포넌트
  - 기본 마일스톤: 콘셉트승인 -> 스토리보드 -> 1차시안 -> 최종납품
  - 2-state: submitted -> approved OR revision_requested
  - 금액 배분: 마일스톤별 금액 설정
  - **RED**: TDD for milestone state machine
  - **GREEN**: Implement
  - **REFACTOR**: Timeline UX

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 15, 17
  - **Blocked By**: Tasks 2, 7, 12

  **Acceptance Criteria**:
  - [ ] Milestone state transitions work correctly
  - [ ] TimelineGate visualizes current status
  - [ ] Approval/revision buttons functional

  **Commit**: YES
  - Message: `feat(milestones): add milestone CRUD with 2-state approval gate`

---

- [ ] 15. Deliveries (File Upload, Watermark Toggle, Preview)

  **What to do**:
  - Core: `/src/core/usecases/delivery.ts` - submitDelivery, getDeliveries
  - Adapter: `/src/adapters/db/repositories/delivery.ts`
  - UI: 마일스톤별 납품물 업로드 + 미리보기
  - Supabase Storage 직접 업로드 (Vercel 4.5MB 제한 우회)
  - 워터마크 옵션 토글 (최종 승인 전 프리뷰용)
  - 납품물 유형: 원본(프로젝트파일), 최종 mp4, 썸네일, 자막(srt)
  - **RED**: TDD for delivery use case
  - **GREEN**: Implement
  - **REFACTOR**: Preview optimization

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 16
  - **Blocked By**: Task 14

  **Acceptance Criteria**:
  - [ ] File upload to Supabase Storage works
  - [ ] Watermark toggle persists
  - [ ] Preview renders for images/videos
  - [ ] Only project participants can access deliverables

  **Commit**: YES
  - Message: `feat(deliveries): add delivery submission with file upload and preview`

---

- [ ] 16. Full Review Gate Timeline (4-Step Flow Upgrade)

  **What to do**:
  - Upgrade 2-state to full 4-step: 콘셉트승인 -> 스토리보드승인 -> 1차시안 -> 최종납품
  - Each gate: 승인/수정요청/분쟁 버튼
  - 수정요청: 코멘트 + 파일 첨부
  - TimelineGate 컴포넌트 업데이트 (4 nodes)
  - State machine validation (can't skip steps)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Task 15

  **Acceptance Criteria**:
  - [ ] 4-step flow enforced (no skipping)
  - [ ] Each step has approve/revision/dispute buttons
  - [ ] TimelineGate shows 4 nodes with current status

  **Commit**: YES
  - Message: `feat(review-gate): upgrade to full 4-step review flow`

---

### Wave 6: Payment + Contract Adapters (P2 - PARALLEL)

- [ ] 17. Toss Payments Adapter (Dummy + Real Interface)

  **What to do**:
  - Core port: `/src/core/ports/payment-gateway.ts` - createEscrowPayment, releasePayment, refundPayment
  - Adapters:
    - `/src/adapters/payment/toss-payments.ts` - 실 API 연동 (환경변수 있을 때)
    - `/src/adapters/payment/mock-payment.ts` - 더미 (DB에 상태 저장)
  - API routes:
    - `/src/app/api/payments/create/route.ts`
    - `/src/app/api/payments/webhook/route.ts` - Toss 웹훅 수신
  - 마일스톤 연결: 마일스톤 승인 -> 에스크로 릴리즈
  - UI: 프로젝트 상세 내 결제 상태 표시
  - **RED**: TDD for payment use case (mock adapter)
  - **GREEN**: Implement
  - **REFACTOR**: Error handling

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 18)
  - **Blocks**: None
  - **Blocked By**: Task 14

  **Acceptance Criteria**:
  - [ ] Mock adapter: payment state transitions in DB
  - [ ] Webhook endpoint validates signature
  - [ ] Milestone approval triggers payment release (mock)

  **Commit**: YES
  - Message: `feat(payment): add Toss Payments adapter with escrow and mock fallback`

---

- [ ] 18. Modusign Adapter (Dummy + Real Interface)

  **What to do**:
  - Core port: `/src/core/ports/contract-service.ts` - createContract, getSignatureStatus, getDocument
  - Adapters:
    - `/src/adapters/contract/modusign.ts` - 실 API
    - `/src/adapters/contract/mock-contract.ts` - 더미
  - 전자계약 필수 조항 템플릿 (JSON):
    - 저작권/소유권 귀속
    - 수정 라운드/추가비용
    - 분쟁/환불/지연 패널티
  - API routes + 웹훅
  - UI: 프로젝트 상세 내 계약 상태
  - **RED**: TDD for contract use case
  - **GREEN**: Implement

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 17)
  - **Blocks**: None
  - **Blocked By**: Task 14

  **Acceptance Criteria**:
  - [ ] Mock adapter: contract state transitions
  - [ ] Template generates correct clauses
  - [ ] Webhook endpoint functional

  **Commit**: YES
  - Message: `feat(contract): add Modusign adapter with template and mock fallback`

---

### Wave 7: Polish (P3 - PARALLEL)

- [ ] 19. Reviews (Mutual Rating/Comment)

  **What to do**:
  - 완료된 프로젝트에서 상호 리뷰
  - 별점(1-5) + 코멘트
  - Creator 프로필에 평균 평점 표시
  - **RED**: TDD
  - **GREEN**: Implement

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**: YES (with 20, 21)
  **Blocked By**: Tasks 7, 14

  **Commit**: YES - `feat(reviews): add mutual review system`

---

- [ ] 20. Disputes (Basic Issue Registration + Evidence)

  **What to do**:
  - 이슈 등록 (사유 선택 + 설명)
  - 증거 자동 첨부 (채팅 히스토리, 파일, 타임라인)
  - 운영자 검토 상태 (pending/reviewing/resolved)
  - Admin 페이지에서 분쟁 목록 표시

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**: YES (with 19, 21)
  **Blocked By**: Tasks 7, 14

  **Commit**: YES - `feat(disputes): add basic dispute registration`

---

- [ ] 21. Admin Page (User/Project Listing, Dispute View)

  **What to do**:
  - `/src/app/admin/page.tsx`
  - 사용자 목록 (역할별 필터)
  - 프로젝트 목록 (상태별 필터)
  - 분쟁 목록 + 상세
  - 신고 목록 (콘텐츠 안전)
  - Admin 접근: ADMIN_EMAILS 환경변수 체크

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**: YES (with 19, 20)
  **Blocked By**: Task 4

  **Commit**: YES - `feat(admin): add admin dashboard`

---

- [ ] 22. Dashboard Pages (Client + Creator)

  **What to do**:
  - `/src/app/dashboard/client/page.tsx`:
    - 내 프로젝트 목록 (상태별)
    - 진행 중 마일스톤 현황
    - 미결 결제/검수 알림
  - `/src/app/dashboard/creator/page.tsx`:
    - 내 제안서 목록
    - 진행 중 작업
    - 수익 요약
  - 공통 레이아웃: `/src/app/dashboard/layout.tsx`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**: YES (with 23)
  **Blocked By**: Tasks 7, 14

  **Commit**: YES - `feat(dashboard): add client and creator dashboards`

---

- [ ] 23. Landing Page + Explore Page Polish

  **What to do**:
  - 랜딩 페이지: 봄결 스튜디오 컨셉/가치/카테고리(숏폼/광고/뮤비/제품)
  - Hero section: 슬로건 "봄처럼 피어나는 영상, 단단하게 완성."
  - CTA: 프로젝트 등록 / 전문가 찾기
  - Explore page 필터 UI 최종 정리
  - Pastel Aura 디자인 최종 적용

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**: YES (with 22)
  **Blocked By**: Task 3

  **Commit**: YES - `feat(landing): add landing page and explore page polish`

---

- [ ] 24. Final Integration Tests + Deployment Verification

  **What to do**:
  - Playwright E2E: 전체 워크플로우 (signup -> project create -> proposal -> milestone -> delivery)
  - Build verification: `npm run build` clean
  - Vitest: 전체 `npm run test` PASS
  - 배포 준비: `vercel.json` 설정 (if needed)
  - 최종 검증 절차 문서화
  - Seed data 확인 (optional)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (final task)
  - **Blocks**: None
  - **Blocked By**: Tasks 19-23

  **Acceptance Criteria**:
  - [ ] `npm run build` exit code 0
  - [ ] `npm run test` exit code 0
  - [ ] Playwright full workflow PASS
  - [ ] .env.example complete
  - [ ] 실행/검증 절차 문서 완성

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Full workflow E2E
    Tool: Playwright (playwright skill)
    Steps:
      1. Signup as client -> create project -> publish
      2. Signup as creator -> find project -> submit proposal
      3. Client accepts proposal
      4. Creator submits milestone delivery
      5. Client approves milestone
      6. Both leave reviews
    Expected Result: Complete workflow without errors
    Evidence: .sisyphus/evidence/task-24-full-workflow.png
  ```

  **Commit**: YES
  - Message: `test(e2e): add full workflow integration tests`

---

## Commit Strategy

| After Task | Message | Verification |
|------------|---------|--------------|
| 1 | `feat(scaffold): initialize Next.js 15 project with Ports/Adapters structure` | `npm run build` |
| 2 | `feat(db): add complete Supabase schema with RLS, pgvector, and hybrid search functions` | `drizzle-kit push` |
| 3 | `feat(ui): add Pastel Aura design system with shadcn/ui and shared components` | `npm run build` |
| 4 | `feat(auth): setup Better Auth with Drizzle, Google OAuth, middleware` | `npm run build` |
| 5 | `feat(auth): add auth pages, profile CRUD, role selection` | `vitest --run` |
| 6 | `test(auth): add E2E auth flow tests` | `playwright test` |
| 7 | `feat(projects): add project CRUD, video brief form, explore page` | `vitest --run` |
| 8 | `feat(ai): add SOW generation with streaming and mock fallback` | `vitest --run` |
| 9 | `feat(creator): add creator profiles, portfolio CRUD, storage upload` | `vitest --run` |
| 10 | `feat(search): add hybrid vector search with embeddings and re-ranking` | `vitest --run` |
| 11 | `feat(chat): add polling-based project chat` | `vitest --run` |
| 12 | `feat(proposals): add proposal CRUD and project integration` | `vitest --run` |
| 13 | `feat(ai): add storyboard and shotlist generation` | `vitest --run` |
| 14 | `feat(milestones): add milestone CRUD with 2-state approval gate` | `vitest --run` |
| 15 | `feat(deliveries): add delivery submission with file upload and preview` | `vitest --run` |
| 16 | `feat(review-gate): upgrade to full 4-step review flow` | `vitest --run` |
| 17 | `feat(payment): add Toss Payments adapter with escrow and mock fallback` | `vitest --run` |
| 18 | `feat(contract): add Modusign adapter with template and mock fallback` | `vitest --run` |
| 19 | `feat(reviews): add mutual review system` | `vitest --run` |
| 20 | `feat(disputes): add basic dispute registration` | `vitest --run` |
| 21 | `feat(admin): add admin dashboard` | `npm run build` |
| 22 | `feat(dashboard): add client and creator dashboards` | `npm run build` |
| 23 | `feat(landing): add landing page and explore page polish` | `npm run build` |
| 24 | `test(e2e): add full workflow integration tests` | `playwright test` |

---

## Success Criteria

### Verification Commands
```bash
# Build
npm run build          # Expected: exit code 0

# Unit tests
npm run test           # Expected: all PASS

# E2E tests
npx playwright test    # Expected: all PASS

# Schema
npx drizzle-kit push   # Expected: no errors

# Dev server
npm run dev            # Expected: localhost:3000 serves app
```

### Final Checklist
- [ ] All 24 tasks completed
- [ ] `npm run build` succeeds
- [ ] `npm run test` all PASS (Vitest core/adapter)
- [ ] `npx playwright test` all PASS (E2E flows)
- [ ] 17+ DB tables with RLS policies
- [ ] pgvector HNSW indexes created
- [ ] Hybrid search RPC function working
- [ ] Better Auth with Google OAuth + email
- [ ] AI document generation (SOW + Storyboard + Shotlist)
- [ ] Polling-based chat
- [ ] File upload to Supabase Storage
- [ ] Payment adapter (dummy mode)
- [ ] Contract adapter (dummy mode)
- [ ] Pastel Aura design applied to all pages
- [ ] .env.example complete with all variables
- [ ] TypeScript strict, no `any`
