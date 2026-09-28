# Roles & permissions

## Roles

| Role | Selectable at signup? | Notes |
|---|---|---|
| `user` | Yes | Default/basic tier |
| `analyst` | Yes | View-only, no generation |
| `admin` | Yes | Manages access |
| `premium_user` | No | Granted separately (future subscription-like flow) |
| `super_admin` | No | DB-only — assigned directly, never via signup |

A user can hold multiple roles at once (`roles: [String]` on the `User` model) — permissions are the **union** of whatever roles they hold, not a single tier.

## Permission rules

1. **`user`** — can generate short URLs, capped at **7 per day**. Can see the **click count** for their own URLs only — not the full visit-by-visit analytics. Can only see their own URLs.
2. **`premium_user`** — can generate **unlimited** short URLs. Can see **full analytics** (every visit, with timestamps) — but only for their own URLs.
3. **`analyst`** — can see **all URLs**, from every user. **Cannot generate** any URL at all.
4. **`user` + `analyst`** — union: capped generation (7/day) for their own URLs, plus the ability to view all URLs (as `analyst` grants).
5. **`analyst` + `premium_user`** — union: unlimited generation, full analytics on their own URLs, plus visibility into all URLs.
6. **`admin`** — everything `analyst` + `premium_user` grants, **plus** can manage access (change other users' roles). **Cannot** delete URLs or users.
7. **`super_admin`** — everything `admin` grants, **plus** can delete URLs and users.

Admin/super_admin-specific features (access management UI, delete flows) are **on hold for now** per current scope.

## FE display rule

Screens are **never hidden** based on role. Every route is reachable by any authenticated user. If an action isn't permitted for the current user's roles, the attempt is met with an **"Unauthorized"** screen/response (see `frontend/src/pages/Unauthorized.jsx`), not a hidden button or missing nav item. (A real subscription-gate-style UX may replace this later — noted as a future step, not current behavior.)

## Implementation notes

- **Coarse gating** (can this role hit this endpoint at all) belongs in middleware — see the `requireRole(role)` factory pattern in `middlewares/user.js`, chained after `requireAuthMiddleware`.
- **Fine-grained business rules** (the 7/day cap, clicks-only vs. full analytics, which URLs are visible) are *not* pure allow/deny decisions — they shape the response data itself, so they live inside the controllers, reading `req.user.roles`.
- Current implementation bakes `roles` into the JWT payload at sign-in (see `getJWTtoken` in `controllers/user.js`) — cheap to check, but stale: a role change made by an admin won't take effect for an already-logged-in user until their token expires/they log in again. Worth revisiting later if that staleness becomes a real problem, per the tradeoff discussed earlier (re-fetching fresh from the DB on each check is the alternative — always current, one more DB read per request).
