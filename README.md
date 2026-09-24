# URL Shortener

A small Express + MongoDB URL shortener, built as a Node.js learning project. Covers Express routing (`Router`), an MVC-ish layout (routes → controllers → models), Mongoose, and server-side rendering with EJS.

## Stack
- Node.js, Express 5
- MongoDB via Mongoose
- EJS (server-rendered view)
- nodemon for dev reload

## Project structure
```
url_shortener/
├── index.js                 # app entry: middleware, view engine, route mounting, listen
├── constants.js              # PORT
├── connection.js              # mongoose.connect() wrapper
├── models/url.js               # URL schema (shortId, redirectUrl, visitHistory)
├── controllers/url.js           # route handler logic (create / redirect / analytics)
├── routes/url.js                 # API routes, mounted at /url
├── routes/staticRouter.js         # SSR page route, mounted at /
└── view/home.ejs                   # lists generated short URLs
```

## Setup
1. `npm install`
2. Have MongoDB running locally (`mongodb://localhost:27017`) — `connection.js` connects to the `short-url` database on startup
3. `npm start` — runs `nodemon index`, server listens on `http://localhost:8000`

## Routes

| Method | Path | Description |
|---|---|---|
| POST | `/url` | Create a short URL. Body: `{ "url": "<original url>" }` → `{ status, id }` |
| GET | `/url/:shortId` | Redirects to the original URL; records a visit timestamp |
| GET | `/url/analytics/:shortId` | Returns total clicks + visit history for a short URL |
| GET | `/` | SSR page (EJS) listing all generated short URLs |

## Example flow

```
POST http://localhost:8000/url
Body: { "url": "https://example.com" }
→ { "status": "SUCCESS", "id": "abc123" }

GET http://localhost:8000/url/abc123
→ 302 redirect to https://example.com
```
# url-shortener
