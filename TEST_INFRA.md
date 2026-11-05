# E2E Test Infrastructure & Mock Gateway Architecture

## 1. Overview

The `flashwise-fe` E2E testing framework provides a comprehensive, opaque-box integration and system verification suite simulating all interactions between the Next.js frontend application and the **PlayGrid API Gateway (`/api/v1`)**.

The test infrastructure is located under:
```text
/home/annt/Workspace/Quizlet/flashwise-fe/tests/e2e/
├── mockServer.ts                        # In-memory PlayGrid API Gateway server & fetch interceptor
├── testHelpers.ts                       # Typed client SDK, bulk delimiter parser & assertion utilities
├── tier1_feature_auth.test.ts           # Tier 1: Authentication flow (7 tests)
├── tier1_feature_study_sets.test.ts     # Tier 1: Study sets list & detail (7 tests)
├── tier1_feature_flashcards.test.tsx    # Tier 1: 3D Flashcard viewer & keyboard navigation (6 tests)
├── tier1_feature_creator.test.ts        # Tier 1: Study set creator & bulk import (7 tests)
├── tier1_feature_learn_session.test.ts  # Tier 1: Adaptive learn mode & SRS ratings (6 tests)
├── tier2_boundary_corner.test.ts        # Tier 2: Boundary conditions & error recovery (9 tests)
├── tier3_cross_feature.test.ts          # Tier 3: Cross-subsystem workflows (3 tests)
└── tier4_real_world_workloads.test.ts   # Tier 4: Real-world academic workloads (3 tests)
```

---

## 2. Mock API Gateway Server (`tests/e2e/mockServer.ts`)

The `MockApiGatewayServer` reproduces the behavior, response codes, data schemas, and error responses of the PlayGrid Go API Gateway.

### 2.1 State & Persistence Engine
The server maintains stateful in-memory stores for isolated, deterministic testing:
- **`users` (`Map<string, MockUser>`)**: Pre-seeded with a default student (`demo@quizlet.local`, `Password123!`).
- **`studySets` (`Map<string, MockStudySet>`)**: Pre-seeded with "Web Development Fundamentals" and "Spanish 101 Vocabulary".
- **`sessions` (`Map<string, MockStudySession>`)**: Tracks active and completed study sessions, question sequences, and score deltas.
- **`activeQuestions` (`Map<string, MockAdaptiveQuestion>`)**: Holds generated adaptive questions awaiting submission.
- **`refreshTokens` (`Map<string, string>`)**: Secure token-to-user resolution table for refresh token rotations.
- **`revokedTokens` (`Set<string>`)**: Blacklist of revoked JWT tokens after `/api/v1/auth/signout`.

### 2.2 Endpoints Implemented

| Endpoint | Method | Status | Description |
|---|---|---|---|
| `/api/v1/auth/signup` | POST | 201 / 400 / 409 | Register new user, password validation (min 6 chars), duplicate email check. |
| `/api/v1/auth/token` | POST | 200 / 401 | Authenticate with email/username + password, issues JWT access and refresh tokens. |
| `/api/v1/auth/refresh` | POST | 200 / 401 | Refresh expired access token using valid refresh token. |
| `/api/v1/auth/signout` | POST | 200 | Revokes bearer token and terminates session. |
| `/api/v1/user/profile` | GET | 200 / 401 | Restores user profile, avatar, study set count, current streak, and cards mastered. |
| `/api/v1/quizlet/study-sets` | GET | 200 | List study sets with search (`?search=`), filtering (`?filter=mine\|starred\|recent`), and card counts. |
| `/api/v1/quizlet/study-sets` | POST | 201 / 400 / 401 | Create study set with metadata and card rows. Enforces title requirement and min 1 card. |
| `/api/v1/quizlet/study-sets/:id` | GET / PUT / DELETE | 200 / 400 / 404 | Retrieve full set with cards, update metadata, or delete set. |
| `/api/v1/quizlet/study-sets/:id/duplicate` | POST | 201 / 404 | Clone set and cards with `(Copy)` suffix. |
| `/api/v1/quizlet/study-sets/:id/cards` | POST | 201 / 400 / 404 | Append flashcard to study set and increment card count. |
| `/api/v1/quizlet/cards/:id` | DELETE | 200 / 404 | Delete individual card from deck. |
| `/api/v1/quizlet/cards/reorder` | PUT | 200 / 400 / 404 | Update card ordering array. |
| `/api/v1/quizlet/study-sets/:id/import` | POST | 200 / 404 | Ingest raw bulk text (Tab, Comma, Semicolon) or card array into study set. |
| `/api/v1/quizlet/study-sets/:id/sessions` | POST | 201 / 400 / 404 | Start study session (modes: `learn`, `flashcards`). |
| `/api/v1/quizlet/sessions/:id/next` | GET | 200 / 404 | Fetch next adaptive question (MCQ, True/False, Written, Recall) or session summary. |
| `/api/v1/quizlet/sessions/:id/submit` | POST | 200 / 400 / 404 | Evaluate answer, update mastery score, calculate next question index. |
| `/api/v1/quizlet/sessions/:id/ratings` | POST | 200 / 400 / 404 | Spaced Repetition (SRS) ratings: `repeat` (3m), `hard` (10m), `okay` (1d), `easy` (4d). |
| `/api/v1/quizlet/sessions/:id/complete` | POST | 200 / 404 | Finalize study session and calculate accuracy percentage. |
| `/api/v1/progress` | GET | 200 | Knowledge states summary (`not_studied`, `learning`, `reviewing`, `mastered`). |
| `/api/v1/progress/reset` | POST | 200 | Reset progress back to unstudied state. |

### 2.3 JWT Token Engine
- Standard base64url header and payload serialization (`alg: HS256`, `typ: JWT`).
- Supports simulated expired tokens (`mockServer.createExpiredToken()`) to verify automatic 401 interceptor recovery.
- Rejection of signature tampering or missing bearer tokens.

### 2.4 Interception Layer (`installFetchMock()`)
- Intercepts requests directed at `/api/v1/*` or `http://localhost:8080/api/v1/*`.
- Bypasses network latency and port allocation issues, returning standard native `Response` streams.
- Preserves clean lifecycle with `afterEach(() => mockServer.uninstallFetchMock())`.

---

## 3. Delimiter Parsing Engine (`tests/e2e/testHelpers.ts`)

Conforms strictly to the `PROJECT.md` bulk parsing interface contract:
```typescript
interface BulkParserResult {
  cards: Array<{ front_content: string; back_content: string }>;
  errors: Array<{ line: number; message: string; content?: string }>;
}
```
- Supports Delimiters:
  - Tab (`\t`)
  - Comma (`,`)
  - Semicolon (`;`)
  - Custom user delimiters
- Edge Case Protection:
  - Automatically skips leading and trailing blank lines.
  - Skips interstitial empty lines without creating blank cards.
  - Accurately reports missing delimiters with exact line numbers.

---

## 4. Execution & Environment

### Running All E2E Tests
```bash
pnpm test tests/e2e
```

### Running Individual Test Tiers
```bash
pnpm test tests/e2e/tier1_feature_auth.test.ts
pnpm test tests/e2e/tier1_feature_study_sets.test.ts
pnpm test tests/e2e/tier1_feature_flashcards.test.tsx
pnpm test tests/e2e/tier1_feature_creator.test.ts
pnpm test tests/e2e/tier1_feature_learn_session.test.ts
pnpm test tests/e2e/tier2_boundary_corner.test.ts
pnpm test tests/e2e/tier3_cross_feature.test.ts
pnpm test tests/e2e/tier4_real_world_workloads.test.ts
```

### Running Full Suite (Component, Unit, Challenger & E2E)
```bash
pnpm test
```
