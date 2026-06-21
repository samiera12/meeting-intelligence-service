# Meeting Intelligence Service

AI-powered meeting intelligence backend. Manages meetings and transcripts, generates grounded AI insights (summary, decisions, action items, follow-ups) with citations back to the transcript, tracks action items through to completion, detects overdue items, and sends email reminders on a schedule.

## Tech Stack

- **Runtime:** Node.js + TypeScript + Express
- **Database:** PostgreSQL (hosted on Render)
- **AI Provider:** Google Gemini (`gemini-2.5-flash`)
- **Email:** Resend
- **Scheduling:** node-cron
- **Auth:** JWT
- **Docs:** Swagger / OpenAPI
- **Testing:** Jest + Supertest
- **Hosting:** Render

## Setup Instructions

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Render free tier used here)
- A Google Gemini API key (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- A Resend API key (free at [resend.com](https://resend.com))

### Local Installation

```bash
git clone <your-repo-url>
cd backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in real values:

```
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@host:5432/dbname

JWT_SECRET=a_long_random_string
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=AIzaSy...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
REMINDER_TO_EMAIL=your_verified_resend_email@example.com
```

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `GEMINI_API_KEY` | Google Gemini API key for meeting analysis |
| `RESEND_API_KEY` | Resend API key for sending reminder emails |
| `RESEND_FROM_EMAIL` | Sender address (default Resend testing address works without a custom domain) |
| `REMINDER_TO_EMAIL` | Recipient for overdue reminder emails |

### Run Database Migrations

```bash
npm run migrate
```

This creates all required tables (`users`, `meetings`, `meeting_analyses`, `action_items`, `reminder_logs`) and indexes. Safe to re-run.

### Run Locally (development)

```bash
npm run dev
```

Server starts at `http://localhost:3000`. Visit `http://localhost:3000/api-docs` for interactive API docs.

### Build & Run (production)

```bash
npm run build
npm start
```

### Run Tests

```bash
npm test
```

## Deployment (Render)

1. Push this repo to GitHub.
2. Render Dashboard → New → Web Service → connect the repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add all environment variables from `.env` in the Render dashboard's Environment tab.
6. Deploy. Render assigns a public URL automatically.
7. Run migrations once against the production DB (locally, pointing `DATABASE_URL` at the Render external connection string): `npm run migrate`

## API Usage Examples

### Register & Login

```bash
curl -X POST https://meeting-intelligence-service-dn5p.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"password123"}'
```

### Create a Meeting

```bash
curl -X POST https://meeting-intelligence-service-dn5p.onrender.com/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Sprint Planning",
    "participants": ["alice@example.com", "bob@example.com"],
    "meetingDate": "2026-05-20T10:00:00Z",
    "transcript": [
      { "timestamp": "00:10", "speaker": "John", "text": "We should launch next Friday." },
      { "timestamp": "00:20", "speaker": "Alice", "text": "I will prepare release notes." }
    ]
  }'
```

### Analyze a Meeting

```bash
curl -X POST https://meeting-intelligence-service-dn5p.onrender.com/api/meetings/<id>/analyze \
  -H "Authorization: Bearer <token>"
```

### List Action Items (filtered)

```bash
curl "https://meeting-intelligence-service-dn5p.onrender.com/api/action-items?status=PENDING&assignee=Alice" \
  -H "Authorization: Bearer <token>"
```

### Get Overdue Action Items

```bash
curl https://meeting-intelligence-service-dn5p.onrender.com/api/action-items/overdue \
  -H "Authorization: Bearer <token>"
```

## Project Structure

```
src/
├── config/         # env config, logger, swagger setup
├── middleware/      # traceId, request logging, auth, error handling
├── modules/
│   ├── auth/        # register, login
│   ├── meetings/     # CRUD + AI analysis
│   └── actionItems/  # CRUD, status, overdue
├── services/         # ai.service, email.service, scheduler.service
├── db/                # connection pool, migrations
├── types/              # shared TypeScript types
└── __tests__/           # Jest test suites
```

## Mobile App (React Native / Expo)

A full-coverage Expo client consuming every backend endpoint: authentication, meeting management, AI analysis with citation display, action item management with filtering, and overdue tracking.

**Install on Android:** open this link on an Android phone's browser and tap "Install":
https://expo.dev/accounts/samiera/projects/meeting-intelligence/builds/09346d72-320f-4fa3-b4fd-ed4dbd8a4e02

**Run locally:**
```bash
cd frontend
npm install
npx expo start
```
Scan the QR code with the Expo Go app (phone must be on the same WiFi network as the dev machine), or press `w` to run in a browser.

## Further Documentation

- [DECISIONS.md](./DECISIONS.md) — technical decisions and trade-offs
- [AI_APPROACH.md](./AI_APPROACH.md) — prompt design, citation strategy, hallucination prevention
- [TESTING.md](./TESTING.md) — test scenarios and known limitations
- [CHANGELOG.md](./CHANGELOG.md) — build history
- [CHECKLIST.md](./CHECKLIST.md) — submission checklist
