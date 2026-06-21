# Technical Decisions

This document explains the key engineering decisions made while building this service, the alternatives considered, and the trade-offs accepted.

## 1. Language: TypeScript over plain JavaScript

**Why:** Strong typing catches a large class of bugs at compile time rather than runtime — especially valuable here given the amount of data flowing between the database (JSONB columns), the AI provider's response, and the API layer. Shared types (`TranscriptEntry`, `AnalysisResult`) keep the AI service, meeting service, and controllers in sync.

**Alternatives considered:** Plain Node.js/JavaScript — faster to write initially, but riskier for a project with this many moving parts (AI integration, scheduled jobs, JSONB parsing) where a typo in a field name would only surface at runtime.

**Trade-off:** Slightly more setup overhead (tsconfig, type definitions for third-party packages) in exchange for safety and better editor tooling.

## 2. Database: PostgreSQL (Render managed)

**Why:** Relational structure fits this domain well — meetings, analyses, and action items have clear foreign-key relationships, and PostgreSQL's native JSONB type lets us store flexible, AI-generated structures (citations, transcript entries) without needing a separate NoSQL store. Render's managed Postgres requires zero infrastructure setup (no manual server provisioning, automatic backups).

**Alternatives considered:**
- **MongoDB** — would suit the flexible transcript/analysis shape, but loses the relational integrity (foreign keys, cascading deletes) that's valuable for `meetings → action_items → reminder_logs`.
- **SQLite** — simplest to set up locally, but not viable for a deployed, publicly-accessible service with concurrent writes.
- **AWS RDS** — considered initially, but added unnecessary operational overhead (VPC/security group configuration, IAM) for a project of this scope; Render's managed Postgres provides equivalent reliability with far less setup.

**Trade-off:** JSONB fields (`transcript`, `participants`, `citations`) sacrifice some queryability (no native indexing inside JSON without extra work) in exchange for schema flexibility, which is appropriate since transcript/citation shapes are AI-generated and may evolve.

## 3. Authentication: JWT (stateless)

**Why:** JWTs require no server-side session storage, which keeps the service stateless and simple to scale horizontally if needed. The token carries `userId`, `email`, and `name`, so authenticated requests don't need a DB lookup just to identify the user.

**Alternatives considered:** Session-based auth with a session store (e.g. Redis) — more secure in some respects (instant revocation), but adds an extra infrastructure dependency for a project where token expiry (`7d`) is an acceptable trade-off given the scope.

**Trade-off:** Tokens can't be revoked before expiry without an additional denylist mechanism, which wasn't implemented here given the assignment's scope. Documented as a known limitation.

## 4. AI Provider: Google Gemini (gemini-2.5-flash)

**Why:** Free tier with generous limits, explicitly listed as an acceptable provider in the assignment, and supports `responseMimeType: 'application/json'` which forces structurally valid JSON output — reducing parsing failures compared to providers that only support free-text completions.

**Alternatives considered:** Anthropic Claude — no free tier, ruled out for this project's budget. OpenAI/Groq — also viable, but Gemini's native JSON-mode output and free quota made it the most practical choice for reliable structured extraction.

**Trade-off:** Tied to Gemini's specific API shape and rate limits; the AI service is isolated in `services/ai.service.ts` specifically so swapping providers later only requires changing one file.

## 5. External Integration: Resend (email) over Telegram/Slack/Discord

**Why:** The assignment's reminder example (`Reminder: Prepare release notes / Assigned To: Alice / Due Date: ...`) maps naturally to a transactional email. Resend's API is simple (single SDK call), has a generous free tier, and doesn't require setting up a bot/webhook infrastructure (as Telegram or Slack would).

**Alternatives considered:** Telegram Bot API — was the original choice, but requires bot setup and chat ID discovery, which is unnecessary friction for the same underlying goal (notify someone of an overdue item). Slack/Discord webhooks — would need a workspace/server to test against; email is the most universally testable channel.

**Trade-off:** Resend's sandbox mode (no custom domain verified) limits sending only to the account owner's verified email — acceptable for this assignment's scope, documented as a known limitation.

## 6. Hosting: Render over AWS

**Why:** The assignment lists Render as a suggested platform. Render's dashboard-driven setup (Web Service + managed Postgres in the same account, zero CLI/IAM/VPC configuration) significantly reduces setup time compared to AWS Elastic Beanstalk + RDS, while still meeting all deployment requirements (public URL, CORS enabled, publicly accessible APIs).

**Alternatives considered:** AWS (Elastic Beanstalk + RDS + SES) — fully viable and was the initial plan, but the operational overhead (IAM users, security groups, EB CLI, SES sandbox verification) was disproportionate to this project's scope and timeline.

**Trade-off:** Render's free tier services spin down after inactivity, causing a cold-start delay on the first request after idling — acceptable for an evaluation/demo context.

## 7. Project Structure: Modular, feature-based organization

**Why:** Each domain (`auth`, `meetings`, `actionItems`) has its own folder containing `schema.ts` (Zod validation), `service.ts` (business logic + DB access), `controller.ts` (HTTP layer), and `routes.ts` (Express router) — keeping related code together and making it easy to locate or extend any single feature without touching unrelated files.

**Alternatives considered:** Layer-based structure (`/controllers`, `/services`, `/routes` as top-level folders, each containing all domains) — common in smaller projects, but becomes harder to navigate as the number of domains grows; feature-based structure scales better and was chosen for that reason.

## 8. Validation: Zod over manual validation or Joi

**Why:** Zod schemas double as both runtime validators and TypeScript type sources (via `z.infer<typeof schema>`), eliminating the need to maintain separate validation rules and type definitions.

**Alternatives considered:** Joi — mature and widely used, but doesn't generate TypeScript types from schemas. Manual `if` validation — error-prone and verbose for nested objects like the transcript array.

## 9. Hallucination Prevention: Citation timestamp validation

**Why:** Rather than trusting the AI's citations at face value, every citation timestamp returned by Gemini is cross-checked against the actual timestamps present in the submitted transcript. Any citation referencing a non-existent timestamp is stripped before saving — see [AI_APPROACH.md](./AI_APPROACH.md) for full detail.

**Trade-off:** This catches fabricated *citations* reliably, but cannot fully guarantee the AI's *prose* perfectly reflects the transcript — the system prompt's strict grounding rules are the first line of defense, and citation validation is the second, automated check.
