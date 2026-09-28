# url_shortener — status

Branch: `cookie`. This tracks the whole project (backend `url_shortener/backend`, frontend `url_shortener/frontend`), not just the auth learning track.

## Done

### Backend — core
- URL shortening: generate (`POST /url`), redirect (`GET /url/:shortId`, public — must stay unauthenticated since it's the actual link people click), per-URL analytics (`GET /url/analytics/:shortId`), list mine (`GET /url/my_urls`) / all (`GET /url/all_urls`), delete (`DELETE /url/delete/:shortId`).
- EJS SSR view for the URL table exists but is superseded by the React frontend for real use (kept for reference/history).

### Backend — auth
- JWT-based auth: `sign_up`, `sign_in`, `sign_out`, `/me`.
- Switched from Bearer-header tokens to **httpOnly cookies** (`cookie-parser`, `res.cookie`/`req.cookies`, CORS with explicit origin + `credentials: true`).
- Roles: `roles: [String]` on `User`, baked into the JWT payload at sign-in (a deliberate tradeoff — cheap to check, but stale until re-login; documented in `backend/ROLES.md`).
- Role-based route gating via a `requireRole(...allowedRoles)` middleware factory, applied to every relevant route.
- **Admin/super_admin feature set — done**: `GET /all_users` (excludes self, excludes `password`), `PATCH /update/:id` (change roles), `DELETE /delete/:id` (delete a user), URL delete. One narrower nuance still open within this — see Pending.

### Frontend
- Vite + React, `react-router-dom`.
- Pages: `Login`, `Signup` (role-checkbox picker, password show/hide toggle), `Shortener` (My/All URLs toggle, generate, per-row Details modal via `createPortal`, per-row Delete), `UsersAndAccess` (user picker `<select>`, role checkboxes pre-filled from the selected user's current roles — only shown once a user is picked, update/delete), `Unauthorized` (with its own logout button).
- Auth state via Context (`AuthContext`/`useAuth`) — tri-state `isAuthenticated` (`null`/`true`/`false`) resolved once via `/me` on app load, since an httpOnly cookie can't be read from JS to check synchronously.
- Toast system (`ToastContext`/`useToast`) for action-level rejections; full-screen `/unauthorized` redirect reserved for the page's own first-load check failing — never hide a screen, but don't full-screen-block for a single failed button either.
- `api.js` centralizes all fetches, attaches `credentials: "include"`, tags thrown errors with `.status` for 401/403 branching.

### Docs written
- `backend/docs/AUTH_TODO.md`, `backend/docs/JWT_NOTES.md` — auth learning material.
- `backend/ROLES.md` — the 5 roles, the 7 permission rules, FE display convention.
- `DEPLOYMENT_ROADMAP.md` — Docker → manual AWS deploy → CI/CD → logging/metrics, in that order, with reasoning.
- A separate project, `../email-template-ssr/PLAN.md` — fully planned (SSR/EJS + httpOnly cookies + a relational DB, deliberately different from this project's MongoDB), not scaffolded yet.

## Pending — recommended order

### 1. In progress now (your task)
- **Refresh tokens + a mutex** to dedupe concurrent refresh calls — guidance on the mutex/refresh half as needed.

### 2. Next — security gaps, before deployment
- **Password hashing** — still plaintext, stored and compared directly. Should land before this ever runs on a public EC2 IP.
- **Token revocation isn't actually enforced** — `RevokedToken` rows get written on sign-out, but `requireAuthMiddleware` never checks the collection; a signed-out token stays valid until it naturally expires.
- **`admin` can't manage access despite the rules saying it should.** `PATCH /update/:id` and `DELETE /delete/:id` are gated to `super_admin` only; `ROLES.md` rule 6 says `admin` should be able to manage access too. Needs a deliberate decision (does "manage access" mean role changes only, or also user deletion?), then a small route change.

### 3. Then — deployment track
- **Docker** — containerize backend, frontend, and Mongo; `docker-compose` for local dev.
- **AWS deploy** — manual first (EC2 free tier + either a containerized Mongo or Atlas), then automated.
- **CI/CD** — GitHub Actions: build → push to ECR → deploy.
- **Logging & metrics** — CloudWatch (simple path) or structured app logging + custom metrics (deeper path).

### 4. Lower priority — can interleave anytime
- **The 7-URLs/day cap for plain `user`** (rule 1) — no counting/enforcement exists yet.
- **No duplicate-signup check at the API level** — relies entirely on Mongo's unique index throwing `E11000`, surfaces as an unhandled 500 today, not a clean error response.
- `roles: { required: true }` accepts an empty array — doesn't enforce "at least one role."
- FE never fetches its own user's `roles` (only reads *other* users' roles, via `/all_users`) — `/me` doesn't return them. Not needed for anything built so far.
- `/all_urls` returns raw `createdBy` ObjectIds — the FE table doesn't cross-reference them to a name/email.

### Separate project
- `email-template-ssr` — plan only, no code yet.
