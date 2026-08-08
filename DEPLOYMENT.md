# Deploying to Vercel

The whole stack runs on Vercel: the React SPA as static files, and the Express
API as a single serverless function at `api/index.js`.

Two things could not follow it there, and were changed rather than dropped:

| Was | Now | Why |
|---|---|---|
| SQLite auth DB (`backend/db/*.db`) | Postgres | Vercel's filesystem is ephemeral. Every deploy and cold start would wipe all users, password hashes and MFA secrets. |
| Socket.IO live chat | REST polling every 5s | Serverless functions cannot hold long-lived WebSocket connections. |

The Python ML service (`ml-service/`) is **not** deployed. scikit-learn, pandas
and numpy together exceed Vercel's serverless bundle limit. It is optional —
`backend/utils/cityProfiles.js` carries the same per-city figures, so price and
ROI estimates work without it. Deploy it separately later if you want the
trained Random Forest instead of the formula (see the last section).

---

## 1. Provision a Postgres database

Any provider works. [Neon](https://neon.tech) has a free tier and pairs well
with Vercel.

1. Create a project, then copy the **pooled** connection string — the one whose
   host contains `-pooler`. Serverless opens many short-lived connections and
   the direct endpoint will exhaust its slots.
2. It should look like:
   ```
   postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

## 2. Create the tables

From your machine, with `DATABASE_URL` set in `backend/.env`:

```bash
cd backend
npm install
npm run db:migrate     # creates users, refresh_tokens, auth_events, verification_tokens
npm run seed:users     # optional: three demo accounts
```

Re-running `db:migrate` is safe — every statement is `IF NOT EXISTS`.

## 3. Generate production auth secrets

```bash
cd backend
npm run keys           # prints four values, does not write anything
```

Keep the output. These go into Vercel in the next step.

> Set these **once**. Rotating `JWT_*` logs everyone out. Rotating
> `ENCRYPTION_KEY` or `EMAIL_HMAC_KEY` permanently orphans already-stored rows —
> encrypted emails become undecryptable and email lookup stops matching.

## 4. Push to GitHub

Vercel deploys from a repo.

```bash
git add -A
git commit -m "Migrate to Postgres + serverless for Vercel"
git push -u origin main
```

Confirm `backend/.env` is **not** in the commit — `.gitignore` already covers
it, but check `git status` before pushing.

## 5. Import the project on Vercel

1. vercel.com → **Add New** → **Project** → import the repo.
2. **Root Directory: leave as the repository root.** Do not set it to
   `frontend/` — the root `vercel.json` is what wires the API function, and
   pointing at `frontend/` would deploy the SPA with no backend.
3. Framework preset: **Other**. The root `vercel.json` supplies the build
   commands.

## 6. Environment variables

Project Settings → Environment Variables. Apply to Production, Preview and
Development.

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | Pooled Postgres string from step 1 | **yes** |
| `JWT_ACCESS_SECRET` | from `npm run keys` | **yes** |
| `JWT_REFRESH_SECRET` | from `npm run keys` | **yes** |
| `ENCRYPTION_KEY` | from `npm run keys` | **yes** |
| `EMAIL_HMAC_KEY` | from `npm run keys` | **yes** |
| `NODE_ENV` | `production` | **yes** |
| `GROQ_API_KEY` | your Groq key | for AI chat |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | no |
| `GEMINI_API_KEY` | fallback provider | no |
| `CLIENT_ORIGIN` | `https://<your-project>.vercel.app` | recommended |
| `APP_URL` | same as above — used in email links | recommended |
| `MONGO_URI` | Atlas connection string | for chat persistence |
| `ML_SERVICE_URL` | leave empty | no |

`COOKIE_SAMESITE` should stay unset. The SPA and API share one domain here, so
cookies are same-site and `lax` is correct.

If any of the four secrets is missing, the function throws at startup with an
explicit message rather than failing confusingly at first login.

## 7. Deploy and verify

```
https://<your-project>.vercel.app/api/health
```

Expect:

```json
{
  "status": "online",
  "auth": "Postgres + Argon2id + JWT (HttpOnly cookies)",
  "database": "configured",
  "ai_provider": "groq"
}
```

Then check, in order:

- `"database": "configured"` — if it says `DATABASE_URL missing`, the env var
  did not apply; redeploy after saving it.
- Register an account, then log in. This exercises Postgres writes, Argon2
  hashing, and cookie round-tripping in one go.
- Ask the AI widget *"3BHK in Pune under 90 lakhs near a metro"*. The response
  carries a `tools_used` array — if it is present and non-empty, the model
  queried the catalogue rather than guessing.

---

## Known limitations of this setup

**Rate limiting is weaker than it looks.** `express-rate-limit` uses an
in-process store, and each warm container keeps its own counter. The effective
login limit is `5 x number of containers`, not 5. For a real limit, back it with
`@upstash/ratelimit` — see the note at the top of `backend/middleware/rateLimit.js`.

**Chat needs MongoDB.** Without `MONGO_URI`, messages live in a per-container
array: a message written by one container is invisible to the next request.
Fine for a demo, not for real use.

**Verification emails are console-only.** Registration and password reset print
their links to the function logs rather than sending mail. On Vercel that means
the Runtime Logs tab. Wire in Resend or Postmark for real delivery.

**Cold starts.** The first request after idle pays Postgres connect plus module
load. Expect roughly a second.

---

## Optional: deploy the ML service

Only needed if you want the trained Random Forest rather than the formula
fallback. It runs anywhere that allows a normal Python process — Render,
Railway, Fly.

```bash
cd ml-service
python train.py --regenerate    # 10k rows across 20 cities, writes model.pkl
```

`model.pkl` and `dataset.csv` are gitignored, so the host must run `train.py`
as part of its build. Once deployed, set `ML_SERVICE_URL` in Vercel to its URL;
`aiController` will prefer it and fall back to the JS formulas if it is down.
