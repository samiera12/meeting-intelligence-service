# Changelog

All notable implementation milestones for this project, in chronological order.

## [0.1.0] — Project Scaffold
- Initialized Node.js + TypeScript project
- Configured `tsconfig.json`, `package.json` scripts (`dev`, `build`, `start`, `migrate`, `test`)
- Set up environment config loader with fail-fast validation of required env vars
- Set up structured Winston logger
- Basic Express app with `/health` endpoint

## [0.2.0] — Database Layer
- Provisioned PostgreSQL on Render
- Wrote initial schema migration: `users`, `meetings`, `meeting_analyses`, `action_items`, `reminder_logs` tables with appropriate foreign keys, check constraints, and indexes
- Built a migration runner script (`npm run migrate`)
- Connection pool configured with SSL for Render's managed Postgres

## [0.3.0] — Cross-Cutting Middleware
- Trace ID middleware (UUID per request, echoed in response headers and logs)
- Request logger middleware (method, path, status, duration)
- Centralized error handler (Zod validation errors, custom `AppError`, unexpected errors — all normalized to a unified response shape)
- Unified API response helpers (`success`, `created`, `notFound`, `unauthorized`, `badRequest`)

## [0.4.0] — Authentication
- User registration with bcrypt password hashing
- Login with JWT issuance
- Auth middleware protecting downstream routes via Bearer token verification
- Zod validation for registration/login payloads

## [0.5.0] — Meeting Management
- Create meeting (title, participants, meeting date, transcript)
- Get meeting by ID (joined with analysis, if present)
- List meetings with pagination

## [0.6.0] — AI Meeting Analysis
- Integrated Google Gemini (`gemini-2.5-flash`) for meeting analysis
- Designed grounding-focused system prompt enforcing citation requirements and forbidding hallucination
- Implemented automated citation-timestamp validation against the source transcript
- Analysis results persisted to `meeting_analyses`; extracted action items auto-created in `action_items`

## [0.7.0] — Action Item Management
- Manual action item creation
- Status updates (`PENDING` → `IN_PROGRESS` → `COMPLETED`)
- Filtering by status, assignee, and meeting ID with pagination
- Overdue detection endpoint (`status != COMPLETED AND due_date < NOW()`)

## [0.8.0] — Reminders & Scheduling
- Integrated Resend for transactional email reminders
- Built hourly cron job (`node-cron`) to detect overdue items and trigger reminders
- Reminder attempts (success/failure) logged to `reminder_logs` for auditability
- Manual test-trigger route added for local verification (removed before production deploy)

## [0.9.0] — Documentation & Testing
- Swagger/OpenAPI documentation generated from JSDoc annotations, served at `/api-docs`
- `/api/evaluation` and `/health` endpoints added
- Jest + Supertest test suites for auth flow and action items/overdue logic (11 passing tests)
- README, DECISIONS, AI_APPROACH, TESTING, CHANGELOG, CHECKLIST documentation written

## [1.0.0] — Deployment
- Deployed to Render (Web Service + managed PostgreSQL)
- Production environment variables configured
- Production database migrated
- `/api/evaluation` updated with live repository and deployment URLs
