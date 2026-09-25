# Auth learning TODO

Ordered checklist for adding JWT auth to the backend, then a React frontend. Do these yourself, in order — ask if something's unclear before moving to the next one.

## Backend: JWT auth

1. **Install `jsonwebtoken`, `dotenv`, `cors`.**
   Why: `jsonwebtoken` signs/verifies tokens, `dotenv` loads `.env` into `process.env`, `cors` lets a React dev server (different port) call this API.

2. **Load dotenv and add a `JWT_SECRET` to `.env`.**
   Why: the secret is what makes a token unforgeable — it must never be hardcoded or committed. Generate something random, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

3. **Wire the missing `POST /sign_in` route** in `routes/user.js` — `handleSignIn` exists in the controller but nothing routes to it yet.
   Why: without this, sign-in is unreachable regardless of what else you build.

4. **In `handleUserSignup` and `handleSignIn`, sign a JWT and return it.**
   `jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" })`
   Why: this token is the "proof of login" you asked about — the client will send it back on future requests instead of a password.

5. **Write an auth middleware** (e.g. `middlewares/auth.js`) that reads `Authorization: Bearer <token>`, calls `jwt.verify`, and either attaches `req.user = decoded` + `next()`, or responds 401.
   Why: every protected route needs this same check — write it once, reuse it as middleware instead of repeating verify logic per route.

6. **Add `createdBy` to the `URL` schema** (`mongoose.Schema.Types.ObjectId`, ref `"user"`).
   Why: right now URLs belong to no one — every logged-in user would see every URL. This scopes data per user, which is the actual point of gating the shortener behind login.

7. **Protect `POST /url`** with the middleware, and set `createdBy: req.user.id` when creating.
   Why: only logged-in users should be able to create URLs, and each one should be tagged to its owner.

8. **Add a `GET /url` (or similar) JSON endpoint** that returns `URL.find({ createdBy: req.user.id })`, also protected.
   Why: the React app needs a way to fetch "my URLs" as JSON — right now the only listing is the EJS-rendered `/` page, which won't work for a React frontend.

9. **Enable CORS** (`app.use(cors())`) in `index.js`.
   Why: the React dev server runs on its own port (e.g. `5173`), a different origin than the API (`8000`) — without CORS the browser blocks the requests.

## Frontend: React app

10. **Scaffold with Vite** (`npm create vite@latest client -- --template react`).

11. **Login / Signup pages** — forms that POST to `/sign_in` / `/sign_up`, store the returned token (e.g. `localStorage` for now).

12. **Shortener screen** — a protected view: fetch `GET /url` and `POST /url` with `Authorization: Bearer <token>` header, render the table (S. No., shortId, redirect, clicks) like the EJS version did.

13. **Logout button** — clears the stored token and redirects to login.
    Why (recap from our discussion): this is *client-side only* — the token stays technically valid until it expires, since the server keeps no session state. That's an intentional simplification for now.

## Later (you're doing this part)

14. **Refresh tokens + mutex** — so a single expired-token event triggers exactly one refresh call (not one per in-flight request), and a missing/invalid refresh token forces logout.
