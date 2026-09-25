# `jsonwebtoken` reference notes

```
npm i jsonwebtoken
```
```js
const jwt = require('jsonwebtoken');
```

---

## 1. `jwt.sign()` — create a token

```js
jwt.sign(payload, secretOrPrivateKey, [options], [callback])
```

| Param | What it is |
|---|---|
| `payload` | Plain object of claims, e.g. `{ id: user._id }`. Becomes the middle part of the token. Don't put passwords/secrets here — it's readable by anyone, just not editable. |
| `secretOrPrivateKey` | A string (HMAC, e.g. `HS256`) or a private key (RSA/EC, e.g. `RS256`). Almost always a plain secret string for a learning project — `process.env.JWT_SECRET`. |
| `options` | Object — see table below. |
| `callback` | Optional. Omit it and `sign` returns the token synchronously (string). Pass it and it becomes async (`(err, token) => {}`). Most people use it sync. |

**Returns:** the token string (sync form) — `"header.payload.signature"`.

### Common `options`

| Option | Example | Meaning |
|---|---|---|
| `expiresIn` | `"1h"`, `"1d"`, `"7d"`, `60` (seconds if a bare number) | How long the token is valid. See time-format table below. |
| `notBefore` | `"5m"` | Token isn't valid *until* this much time has passed — useful for scheduled activation, rare in basic apps. |
| `algorithm` | `"HS256"` (default) | Signing algorithm. `HS256` = one shared secret (sign & verify use the same string). `RS256` = key pair (sign with private key, verify with public key) — used when the verifier shouldn't be able to *create* tokens, e.g. third parties checking your tokens. |
| `issuer` | `"url-shortener-api"` | Adds an `iss` claim — who issued it. Optional bookkeeping. |
| `subject` | `user._id.toString()` | Adds a `sub` claim — who the token is about. Alternative/addition to putting `id` in the payload. |
| `audience` | `"url-shortener-client"` | Adds an `aud` claim — who the token is intended for. |

**Example:**
```js
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
```

### `expiresIn` time format cheatsheet (uses the [`ms`](https://github.com/vercel/ms) library under the hood)

| Value | Means |
|---|---|
| `60` | 60 **seconds** (bare number = seconds, not ms) |
| `"60s"` | 60 seconds |
| `"10m"` | 10 minutes |
| `"1h"` | 1 hour |
| `"1d"` | 1 day |
| `"1w"` | 1 week |
| `"365d"` | ~1 year |

For real apps: access tokens are usually short (`15m`–`1h`), refresh tokens are long (`7d`–`30d`) — short-lived access tokens limit the damage if one leaks, since it expires fast; the long-lived refresh token is what lets the user avoid re-logging-in constantly (this is the piece you'll build with the mutex later).

---

## 2. `jwt.verify()` — check a token is valid

```js
jwt.verify(token, secretOrPublicKey, [options], [callback])
```

| Param | What it is |
|---|---|
| `token` | The token string from the `Authorization` header (strip the `"Bearer "` prefix first). |
| `secretOrPublicKey` | Same secret you signed with (HMAC), or the public key (RSA/EC). |
| `options` | e.g. `{ algorithms: ["HS256"] }` — restrict which algorithms are accepted (security hardening, see drawbacks below). |
| `callback` | Optional, same sync/async split as `sign`. |

**Returns (sync form):** the decoded payload object (e.g. `{ id: "...", iat: ..., exp: ... }`) if valid.
**Throws** if invalid — you must wrap it in `try/catch`.

### Errors it throws

| Error name | When |
|---|---|
| `TokenExpiredError` | `exp` has passed. Has an `.expiredAt` property. |
| `JsonWebTokenError` | Bad signature, malformed token, wrong secret, etc. |
| `NotBeforeError` | Token used before its `nbf` (`notBefore`) time. |

**Example (middleware pattern):**
```js
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}
```

---

## 3. `jwt.decode()` — read a token WITHOUT verifying

```js
jwt.decode(token, [options])
```

Just base64-decodes and parses the payload — **does not check the signature or expiry**. Never use this to authenticate/authorize anything; it's only for reading claims off a token you already trust (e.g. a frontend peeking at its own token's `exp` to decide whether to proactively refresh, without needing the secret — the frontend never has the secret anyway).

---

## 4. Standard claim names (all optional, auto-added by the options above)

| Claim | Meaning |
|---|---|
| `iat` | Issued-at timestamp — added automatically by `sign()`. |
| `exp` | Expiry timestamp — added when you pass `expiresIn`. |
| `nbf` | Not-before timestamp — added when you pass `notBefore`. |
| `iss` | Issuer. |
| `sub` | Subject (usually the user id). |
| `aud` | Audience. |
| `jti` | JWT ID — a unique id for the token itself, useful if you ever build a blocklist (store revoked `jti`s instead of whole tokens). |

---

## 5. Uses

- Stateless API auth (what you're building) — no session store needed.
- Passing verified identity between microservices without a shared session DB.
- One-time action links (email verification, password reset) — short `expiresIn`, payload carries e.g. `{ purpose: "reset", userId }`.

## 6. Drawbacks (worth knowing, not all need fixing today)

- **No revocation** — can't invalidate a single token early without extra state (blocklist), which undercuts the "stateless" benefit if you need it. Covered earlier in the stateful/stateless discussion.
- **Payload is readable, not secret** — base64 isn't encryption. Never put passwords, raw emails-you-care-about-hiding, etc. in the payload.
- **Size** — a JWT is much bigger than a session ID cookie (it carries the whole payload + signature every request).
- **Algorithm confusion attacks** — historically, some libraries let an attacker send `alg: "none"` or swap `RS256`→`HS256` and trick the server into skipping/misusing verification. Mitigated by always passing an explicit `algorithms: [...]` allowlist to `verify()` rather than trusting whatever the token claims.
- **Storage on the client is a real decision** — `localStorage` is readable by any JS on the page (XSS risk); an httpOnly cookie isn't readable by JS but needs CSRF protection instead. For Postman testing this doesn't matter; it'll matter once the React app is real.
- **Clock skew** — `exp`/`nbf` checks rely on server clocks being roughly in sync if you ever verify tokens across multiple machines; rarely an issue on one server.
