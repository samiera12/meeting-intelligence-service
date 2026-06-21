# Testing

## Test Stack

- **Test runner:** Jest (`ts-jest` preset)
- **HTTP testing:** Supertest (spins up the Express app in-process, no real network calls)
- **Scope:** Auth flow and Action Items/overdue logic, the two areas most directly tied to the evaluation rubric (validation, error handling, business logic correctness)

Run with:
```bash
npm test
```

## Test Scenarios Executed

### Auth (`src/__tests__/auth.test.ts`)
1. **Successful registration** — valid name/email/password returns `201`, a JWT, and the created user object.
2. **Invalid registration input** — short name, malformed email, and short password together return a single `400 VALIDATION_ERROR` with one detail entry per invalid field.
3. **Duplicate email registration** — registering the same email twice returns `409 EMAIL_TAKEN` on the second attempt.
4. **Successful login** — correct email/password returns `200` and a fresh JWT.
5. **Login with wrong password** — returns `401 INVALID_CREDENTIALS` (the same generic message is used whether the email doesn't exist or the password is wrong, to avoid leaking which emails are registered).

### Action Items (`src/__tests__/actionItems.test.ts`)
1. **Create with a past due date** — returns `201` with `status: PENDING`.
2. **Create without a required `task` field** — returns `400 VALIDATION_ERROR`.
3. **Overdue detection** — the item created with a past due date appears in `GET /api/action-items/overdue`.
4. **Status transition removes item from overdue list** — `PATCH .../status` to `COMPLETED` succeeds, and the item subsequently no longer appears in the overdue list, confirming the `status != 'COMPLETED' AND due_date < NOW()` query behaves correctly across a real state change.
5. **Invalid status value rejected** — sending a status outside the `PENDING / IN_PROGRESS / COMPLETED` enum returns `400`.
6. **Unauthenticated request rejected** — `GET /api/action-items` without a Bearer token returns `401`.

## Edge Cases Considered

- **Email uniqueness race** — handled at the application layer (existence check before insert) and backed by a `UNIQUE` constraint at the database level as a second line of defense.
- **Citation timestamps that don't exist in the transcript** — handled in `ai.service.ts` (not directly unit-tested here, but manually verified during development by inspecting logged warnings when Gemini's response was deliberately inspected for fabricated timestamps).
- **Action items with no due date** — correctly excluded from the overdue query (`due_date < NOW()` is false for `NULL` in PostgreSQL), verified manually via curl during development (the AI-generated action item with no due date never appeared in `/overdue` results alongside the manually created one that did).
- **Meeting not found / action item not found** — both `getMeetingById` and `updateStatus` throw a typed `AppError` with `404 NOT_FOUND` rather than returning empty/null silently, verified manually via curl with non-existent UUIDs.
- **Malformed JWT / expired JWT** — `authMiddleware` distinguishes between `TokenExpiredError` and a generally invalid token, both returning `401` with a specific message.

## Manual Testing Performed (via curl / Swagger UI)

In addition to the automated suite, the full request lifecycle was manually exercised end-to-end during development:
- Full meeting creation → analysis → citation inspection flow
- Full reminder pipeline: created an overdue item, manually triggered the scheduler job, confirmed email delivery via Resend and a corresponding `reminder_logs` row
- Pagination on `GET /api/meetings` and `GET /api/action-items`
- Filtering action items by `status`, `assignee`, and `meetingId` independently and in combination

## Known Limitations

- **No isolated test database.** Tests run against the same Postgres database used in development. Each test run creates real rows (with unique, timestamp-suffixed emails to avoid collisions between runs). A production setup would provision a separate test database and reset it between runs.
- **No tests for the AI service itself.** `ai.service.ts` makes a real network call to Gemini; it isn't mocked in the current test suite, so it's exercised manually rather than in CI. A future iteration would mock the Gemini HTTP call to test citation-validation logic deterministically without consuming API quota.
- **No tests for the email/scheduler services.** Similarly exercised manually (see above) rather than with automated mocks of the Resend SDK.
- **No load/concurrency testing.** Out of scope for this assignment's timeline.
