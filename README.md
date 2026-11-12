# Auth Task — sign up / sign in

A small, production-minded authentication module.

- **Web:** React 18 + TypeScript + Vite, with react-hook-form + zod, TanStack Query and Tailwind.
- **API:** NestJS 10 + MongoDB (Mongoose).

Users can sign up, sign in, see a protected page that says **"Welcome to the application."**, and log out.

```
apps/
  api/   NestJS API: auth, users (protected /users/me), health
  web/   React app: /signup, /signin, / (protected)
docker-compose.yml   MongoDB + API + web (nginx), one command
.github/workflows/ci.yml   lint, build and tests for both apps
```

## Quick start (Docker)

```bash
cp .env.example .env          # then set JWT_SECRET to a long random string
docker compose up --build
```

- **App:** http://localhost:8080
- **API docs (Swagger):** http://localhost:8080/api/docs
- **Health:** http://localhost:8080/api/health

## Local development

Requirements: Node 20+, and a MongoDB on `localhost:27017`. For MongoDB, `docker run -d -p 27017:27017 mongo:7` works.

```bash
# API  -> http://localhost:3000/api   (Swagger: /api/docs)
cd apps/api
cp .env.example .env          # set JWT_SECRET (32+ chars)
npm install
npm run start:dev

# Web  -> http://localhost:5173   (proxies /api to :3000)
cd apps/web
npm install
npm run dev
```

## Scripts

| | API (`apps/api`) | Web (`apps/web`) |
|---|---|---|
| Dev server | `npm run start:dev` | `npm run dev` |
| Build | `npm run build` | `npm run build` |
| Lint | `npm run lint` | `npm run lint` |
| Unit tests | `npm test` | `npm test` |
| End-to-end | `npm run test:e2e` (in-memory MongoDB, nothing to install) | — |

## API

All routes are under `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | `{ email, name, password }` → `201` user. Sets the session cookie. `409` if the email exists. |
| POST | `/auth/signin` | — | `{ email, password }` → `200` user. Sets the session cookie. `401` "Invalid email or password". |
| POST | `/auth/logout` | — | `204`. Clears the session cookie. |
| GET | `/users/me` | **cookie** | The signed-in user's profile (the protected endpoint). `401` without a valid session. |
| GET | `/health` | — | `{ status: "ok", db: "up" }`. |

### Validation rules

The same rules are enforced in the browser (zod) and on the API (class-validator).

- **Email:** a valid address. It is trimmed and lowercased, so `Jane@X.com` and `jane@x.com` are the same account.
- **Name:** 3–50 characters, after trimming.
- **Password:** 8–128 characters, with at least one letter, one number and one special character.

Every error comes back in one shape:

```json
{ "statusCode": 400, "error": "Bad Request", "message": ["Password must contain at least one number"], "path": "/api/auth/signup", "timestamp": "..." }
```

## Configuration (`apps/api/.env`)

| Variable | Default | |
|---|---|---|
| `MONGO_URI` | — (required) | `mongodb://` or `mongodb+srv://` |
| `JWT_SECRET` | — (required) | At least 32 characters. The API refuses to start without it. |
| `JWT_EXPIRES_IN` | `1h` | The session and cookie lifetime (`15m`, `1h`, `7d`...). |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins. Only needed if the web app is on another origin. |
| `COOKIE_SECURE` | `true` in production | Send the cookie over HTTPS only. |
| `TRUST_PROXY` | `false` | Set to `true` behind nginx or a load balancer, so rate limits apply per client. |
| `LOG_LEVEL` | `info` | pino level (`silent` in tests). |
| `PORT` | `3000` | |

Configuration is validated with Joi at startup. A missing or weak value stops the app instead of failing on the first request.

## Security and production decisions

- **Session in an httpOnly cookie, not localStorage:**
  - JavaScript cannot read the JWT, so an XSS bug cannot steal the session.
  - `SameSite=Strict` stops other sites from sending it, which handles CSRF for this same-origin setup.
  - `Secure` is on in production.
- **Same origin everywhere:** the browser always calls `/api`. Vite proxies it in development and nginx in Docker, so cookies behave identically in both.
- **argon2id** for password hashing. The hash is `select: false` on the schema and never leaves the API: responses go through a single `UserResponseDto`.
- **No account enumeration:**
  - A wrong password and an unknown email return the same 401 message.
  - The unknown-email path still verifies against a dummy hash, so the timing matches too.
- **Rate limiting:** sign-in and sign-up allow 5 attempts per minute per client, and every other route allows 100 per minute.
- **Strict input handling:** a global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`, so unexpected fields such as `role: "admin"` are rejected.
- **Duplicate emails:** a unique index on `email` is the source of truth, and its duplicate-key error becomes a 409. A pre-check alone would race.
- **helmet** security headers. CORS is restricted to configured origins.
- **Errors:** one global exception filter. Unexpected errors are logged in full but answered with a generic 500, so stack traces and driver messages never reach clients.
- **Logging:** structured pino logs through `nestjs-pino`, with cookies, auth headers and passwords redacted.
- **Containers:** multi-stage Dockerfiles. The API runs as a non-root user.

## Tests

- **API unit tests:**
  - `AuthService`: argon2id hashing, token issue, generic sign-in errors.
  - Duration parsing.
- **API end-to-end tests:** the real app against an in-memory MongoDB. They cover:
  - sign-up, with the cookie flags checked;
  - duplicate email, case-insensitive;
  - weak password and bad fields;
  - identical errors for a wrong password and an unknown email;
  - the protected route with and without the cookie;
  - logout;
  - a forged token;
  - the rate limit.
- **Web tests:**
  - The zod schemas.
  - The sign-up form: field errors block submission, the password checklist updates live, and server errors are shown.

CI (`.github/workflows/ci.yml`) runs lint, build and all tests for both apps on every push and pull request.

## What I would add next

- Refresh-token rotation for long sessions, and server-side revocation through a token version on the user.
- Email verification and password reset.
- A CSRF token, if the web app and API ever have to live on different sites.
- Account lockout or CAPTCHA after repeated failures, on top of the rate limit.
