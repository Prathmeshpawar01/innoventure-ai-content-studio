# Innoventure AI Content Studio

Admin tool that turns a campaign brief into four platform-native drafts (LinkedIn, Instagram, YouTube Shorts, Newsletter) with Gemini, then moves each draft through **human approval -> scheduling -> distribution -> analytics**.

**Nothing is published automatically.** Drafts need human approval, and by default a person posts them and records it (see "Distribution").

## Stack

| Technology | Purpose | Where |
|---|---|---|
| React.js | Frontend | `client/` |
| Tailwind CSS | UI design | `client/tailwind.config.js` |
| Node.js + Express.js | Backend REST API | `server/` |
| MongoDB (Mongoose) | Database | `server/src/models` |
| Gemini API | AI content generation | `server/src/services/gemini.js` |
| JWT | Admin authentication | `server/src/routes/auth.js` |
| Chart.js | Analytics dashboard | `client/src/pages/Analytics.jsx` |
| Axios | API communication | `client/src/api.js` |
| Git & GitHub | Version control | `.gitignore` included |

## Flow

```
Admin login (JWT)
  -> Content input form (React)
  -> Express API: validate brief
  -> Gemini (falls back to built-in templates if unavailable)
  -> Safety review (placeholders, invented numbers, risky claims, personal data, repeated text)
  -> LinkedIn | Instagram | YouTube Shorts | Newsletter drafts saved to MongoDB as "draft"
  -> HUMAN APPROVAL (edit, then approve; blocked while [VERIFY] / [PLACEHOLDER] text remains)
  -> Scheduling (approved drafts only)
  -> Distribution (manual by default; "due" -> person posts -> "mark as published")
  -> Analytics dashboard (Chart.js)
```

Draft status: `draft -> approved -> scheduled -> due | published` (`rejected` and `failed` are side states). Editing a draft resets its approval.

## Setup

Requirements: Node.js 18+, MongoDB running locally or a MongoDB Atlas URI.

```bash
# 1. API
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
#    edit .env: MONGODB_URI, JWT_SECRET (32+ chars), ADMIN_EMAIL, ADMIN_PASSWORD (12+ chars),
#    and optionally GEMINI_API_KEY + GEMINI_MODEL
npm run seed:admin          # creates the admin account, then delete ADMIN_PASSWORD from .env
npm run dev                 # API on http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # app on http://localhost:5173
```

Sign in with the admin email/password you seeded.

Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### Gemini

Set `GEMINI_API_KEY` (from Google AI Studio) and `GEMINI_MODEL` (a current model name from Google's Gemini API docs; deliberately not hard-coded because names change). If either is missing, or a call fails, the app uses the built-in template generator and tells you so on the review page.

## Rules enforced by the server (not just the UI)

- Missing facts must appear as `[VERIFY: ...]` markers; the Gemini prompt forbids inventing statistics, testimonials, awards, partnerships, programme details or results.
- The safety layer flags guarantees, absolute claims, percentages, award/testimonial wording, personal emails/phones, references to specific children, numbers that are not in the brief, and repeated sentences across platforms.
- A draft cannot be approved while any `[VERIFY: ...]` or `[SENDER NAME]`-style placeholder remains.
- Only approved drafts can be scheduled or marked published. The scheduler re-checks approval before acting.
- Editing resets approval. Published drafts are locked and cannot be deleted (they feed analytics).
- Login is rate limited, passwords are bcrypt hashed, JWTs expire (default 8h), requests are validated, helmet and CORS are on.

## Distribution

`DISTRIBUTION_MODE=manual` (default): when a scheduled time arrives the draft becomes **due**. A person posts it on the platform and clicks **Mark as published** (optionally pasting the post URL).

`DISTRIBUTION_MODE=live` calls the adapters in `server/src/services/distribution.js`. **They are not implemented**; each throws a clear error and the draft is marked `failed`. Real posting needs platform approvals and credentials (LinkedIn Posts API, Instagram Graph API, YouTube Data API, an email service provider). Also note the Reel and Shorts drafts are scripts, not video files, so those cannot be posted by text alone.

## Analytics

Counts, approval rate, time to approval, drafts by platform/status, and creation trend come from this app's database. Impressions, engagements and clicks are **typed in by your team** from each platform's own analytics after posting. The app never estimates them.

## Tests

```bash
cd server && npm test      # 14 tests: validation, prompt, response parsing, safety, approval/scheduling rules
```

## Honest status

- The unit tests above pass, and every server and client file passes a syntax check.
- The full stack (Express + MongoDB + Gemini + React build) has **not** been run end to end, because it was written in a sandbox without package installs, a database, or a Gemini key. Expect to fix small integration issues on first run.
- No live social posting, no scheduled email sending, no password reset or multi-user roles (single admin).
- For production: serve over HTTPS, set a strict `CLIENT_ORIGIN`, keep `.env` out of Git, and consider an httpOnly-cookie session instead of a token in `sessionStorage`.

## Git

```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url> && git push -u origin main
```
