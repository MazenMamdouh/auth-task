# AI usage

> **Before submitting, edit this file so it describes what you actually did.** The task asks for an honest account and grades your judgement on top of the AI. The parts below are a factual record of how the code was produced. The sections marked ✍️ are for you to fill in from your own review.

## How the code was produced

The project was generated with **Claude Code** (an AI coding agent) from the task PDF in a single session. It was given the full task text and asked to build the whole project: API, web app, Docker, CI, README and tests. The agent then installed the dependencies and ran the linters, the builds and all the tests until they passed.

**AI-generated:** effectively all of the first draft.

- **API:** the NestJS modules, DTOs and validation messages, the JWT cookie strategy and guard, the exception filter, the env schema, Swagger, logging, the unit tests and the e2e tests.
- **Web:** the React pages, the zod schemas, the password checklist, the routing guards, the API client and the component tests.
- **Delivery:** Dockerfiles, nginx config, docker-compose, the CI workflow and the README.

## Decisions made deliberately

These are worth defending in an interview. Check each one and keep it, change it, or remove it.

- **httpOnly SameSite=Strict cookie instead of a token in localStorage.** The common tutorial approach is localStorage plus an Authorization header, which exposes the token to any XSS. The cookie keeps JavaScript away from it. Same-origin `/api` (the Vite proxy in development, nginx in Docker) keeps `SameSite=Strict` workable without a CSRF token.
- **One error for a wrong password and an unknown email,** plus a dummy argon2 verify so the timing matches. This prevents account enumeration.
- **argon2id instead of bcrypt.**
- **The unique index decides duplicates (409), not a "find then insert" pre-check,** which would race under concurrent sign-ups.
- **The sign-in DTO only checks that a password is present.** Re-applying the sign-up strength rules would leak the policy and reject legitimate users if the policy ever tightened.
- **`forbidNonWhitelisted` validation,** so extra fields like `role` are rejected rather than silently ignored.
- **`TRUST_PROXY`.** Behind nginx, every client shares the proxy's address. Without this setting the rate limiter would throttle all users together. This issue was caught while writing the nginx config.
- **e2e tests against an in-memory MongoDB, through the same `configureApp()` as production,** so they test the real validation, cookie flags and error shape rather than mocks.

## Problems caught during generation

- **A real validation bug, found by the e2e suite.** The first DTO stacked three `@Matches` decorators on `password`. class-validator files them all under the same constraint key (`matches`), so only one message survived. A password missing both a letter and a special character was told about just one of them. Each rule is now a separately named validator (`ValidateBy`), and the e2e test asserts every message.
- **Tooling mismatch:** vitest 2 bundles Vite 5 while the app used Vite 6, so `tsc -b` failed on the shared config. The fix was moving to vitest 3 and importing `defineConfig` from `vitest/config`.
- **Library behaviour change:** TanStack Query v5 now passes a second context argument to `mutationFn`, which broke a `toHaveBeenCalledWith` assertion. The test now checks only the first argument.
- The first exception-filter draft mixed two ways of deriving the `error` field and could print enum keys like `BAD_REQUEST`. It was simplified to use the exception's own name.
- The cookie-security default first used a Joi context reference that the schema never received. It was replaced with a value computed from `NODE_ENV`.
- The rate limit counts per route. The e2e suite is ordered to stay within each route's 5-per-minute budget, so it can then assert the 429 on purpose.

## ✍️ Your review (fill in)

- What did you read line by line and change?
- Which prompts or instructions worked well, and which output did you reject?
- Anything you would do differently from the AI's choices, and why?
- How long did the review and testing take you?
